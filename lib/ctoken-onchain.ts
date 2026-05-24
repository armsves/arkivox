/**
 * On-chain cToken ops on Arbitrum Sepolia (wrap, confidential transfer, unwrap).
 * Mirrors iExec-Nox/demo-ctoken hooks.
 */
import type { HandleClient } from "@iexec-nox/handle";
import {
  type Hex,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  erc20Abi,
  parseUnits,
} from "viem";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import { CTOKEN_CONTRACTS } from "@/lib/ctoken-contracts";
import { estimateGasOverrides } from "@/lib/gas";
import { NOX_COMPUTE_ADDRESS, TEE_COOLDOWN_MS } from "@/lib/nox";
import { getToken, type TokenConfig } from "@/lib/tokens";

export function getConfidentialToken(symbol: string): TokenConfig {
  const token = getToken(symbol.startsWith("c") ? symbol : `c${symbol}`);
  if (!token?.confidentialAddress) {
    throw new Error(`No confidential token for ${symbol}`);
  }
  return token;
}

export function getPublicTokenForWrap(symbol: string): TokenConfig {
  const pub = symbol.startsWith("c") ? symbol.slice(1) : symbol;
  const token = getToken(pub);
  if (!token?.publicAddress || !token.confidentialAddress) {
    throw new Error(`Wrap not configured for ${symbol}`);
  }
  return token;
}

export async function encryptAmountForCToken(
  handleClient: HandleClient,
  amount: bigint,
  cTokenAddress: `0x${string}`,
): Promise<{ handle: `0x${string}`; handleProof: Hex }> {
  const { handle, handleProof } = await handleClient.encryptInput(
    amount,
    "uint256",
    cTokenAddress,
  );
  return { handle: handle as `0x${string}`, handleProof: handleProof as Hex };
}

export async function wrapOnChain(
  wallet: WalletClient,
  publicClient: PublicClient,
  tokenSymbol: "USDC" | "RLC",
  amount: string,
  recipient?: `0x${string}`,
): Promise<{ txHash: `0x${string}` }> {
  const token = getPublicTokenForWrap(tokenSymbol);
  const account = wallet.account;
  if (!account) throw new Error("Wallet not connected");

  const parsed = parseUnits(amount, token.decimals);
  if (parsed === 0n) throw new Error("Amount must be greater than zero");

  const erc20 = token.publicAddress!;
  const cToken = token.confidentialAddress!;
  const to = recipient ?? account.address;

  const gas = await estimateGasOverrides(publicClient);

  const approveHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: erc20,
    abi: erc20Abi,
    functionName: "approve",
    args: [cToken, parsed],
    ...gas,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  await new Promise((r) => setTimeout(r, TEE_COOLDOWN_MS));

  const wrapHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: cToken,
    abi: confidentialTokenAbi,
    functionName: "wrap",
    args: [to, parsed],
    ...(await estimateGasOverrides(publicClient)),
  });
  await publicClient.waitForTransactionReceipt({ hash: wrapHash });

  return { txHash: wrapHash };
}

export async function confidentialTransferOnChain(
  wallet: WalletClient,
  publicClient: PublicClient,
  handleClient: HandleClient,
  tokenSymbol: "cUSDC" | "cRLC",
  amount: string,
  recipient: `0x${string}`,
): Promise<{ txHash: `0x${string}`; amountHandle: `0x${string}` }> {
  const token = getConfidentialToken(tokenSymbol);
  const account = wallet.account;
  if (!account) throw new Error("Wallet not connected");

  const parsed = parseUnits(amount, token.decimals);
  if (parsed === 0n) throw new Error("Amount must be greater than zero");

  const cToken = token.confidentialAddress!;

  const { handle, handleProof } = await encryptAmountForCToken(
    handleClient,
    parsed,
    cToken,
  );

  const gas = await estimateGasOverrides(publicClient);
  const txHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: cToken,
    abi: confidentialTokenAbi,
    functionName: "confidentialTransfer",
    args: [recipient, handle, handleProof],
    ...gas,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash, amountHandle: handle };
}

/** Step 1 of unwrap — returns unwrap handle from logs for finalizeUnwrap. */
export async function unwrapOnChainStep1(
  wallet: WalletClient,
  publicClient: PublicClient,
  handleClient: HandleClient,
  tokenSymbol: "cUSDC" | "cRLC",
  amount: string,
  recipient: `0x${string}`,
): Promise<{ txHash: `0x${string}`; unwrapHandle: `0x${string}` }> {
  const token = getConfidentialToken(tokenSymbol);
  const account = wallet.account;
  if (!account) throw new Error("Wallet not connected");

  const parsed = parseUnits(amount, token.decimals);
  if (parsed === 0n) throw new Error("Amount must be greater than zero");

  const cToken = token.confidentialAddress!;
  const { handle, handleProof } = await encryptAmountForCToken(
    handleClient,
    parsed,
    cToken,
  );

  const gas = await estimateGasOverrides(publicClient);
  const txHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: cToken,
    abi: confidentialTokenAbi,
    functionName: "unwrap",
    args: [account.address, recipient, handle, handleProof],
    ...gas,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  let unwrapHandle: `0x${string}` | null = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== cToken.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: confidentialTokenAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "UnwrapRequested") {
        unwrapHandle = decoded.args.amount as `0x${string}`;
        break;
      }
    } catch {
      /* other events */
    }
  }
  if (!unwrapHandle) {
    throw new Error("UnwrapRequested event not found — check Arbiscan");
  }

  return { txHash, unwrapHandle };
}

export async function finalizeUnwrapOnChain(
  wallet: WalletClient,
  publicClient: PublicClient,
  handleClient: HandleClient,
  tokenSymbol: "cUSDC" | "cRLC",
  unwrapHandle: `0x${string}`,
): Promise<{ txHash: `0x${string}` }> {
  const token = getConfidentialToken(tokenSymbol);
  const account = wallet.account;
  if (!account) throw new Error("Wallet not connected");

  const cToken = token.confidentialAddress!;
  const { value: decryptionProof } = await handleClient.publicDecrypt(unwrapHandle);

  const gas = await estimateGasOverrides(publicClient);
  const txHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: cToken,
    abi: confidentialTokenAbi,
    functionName: "finalizeUnwrap",
    args: [unwrapHandle, decryptionProof as Hex],
    ...gas,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return { txHash };
}

export { NOX_COMPUTE_ADDRESS, CTOKEN_CONTRACTS };
