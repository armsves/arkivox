import { keccak256, toBytes, type Hex, type PublicClient, type WalletClient } from "viem";
import { estimateGasOverrides } from "@/lib/gas";

export const handleRegistryAbi = [
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "contentHash", type: "bytes32" },
      { name: "kind", type: "string" },
    ],
    name: "commitHandle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "handle", type: "bytes32" }],
    name: "getRecord",
    outputs: [
      { name: "owner", type: "address" },
      { name: "contentHash", type: "bytes32" },
      { name: "kind", type: "string" },
      { name: "committedAt", type: "uint64" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "handlesOf",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "handle", type: "bytes32" },
      { indexed: false, name: "contentHash", type: "bytes32" },
      { indexed: false, name: "kind", type: "string" },
    ],
    name: "HandleCommitted",
    type: "event",
  },
] as const;

export type ArkivHandleKind = "encrypted_note" | "token_transaction";

export type ArkivPayloadWithHandle = {
  amountHandle: `0x${string}`;
  wrap?: "dek" | "amount";
  dekHandle?: `0x${string}`;
};

/** Nox handle that wraps the AES key for Arkiv ciphertext (not the cToken amount handle). */
export function arkivEncryptionKeyHandle(payload: ArkivPayloadWithHandle): `0x${string}` {
  if (payload.wrap === "amount" && payload.dekHandle) {
    return payload.dekHandle;
  }
  return payload.amountHandle;
}

export function getHandleRegistryAddress(): `0x${string}` | null {
  const v = process.env.NEXT_PUBLIC_HANDLE_REGISTRY?.trim();
  if (!v || !v.startsWith("0x") || v.length !== 42) return null;
  return v as `0x${string}`;
}

export function requireHandleRegistryAddress(): `0x${string}` {
  const addr = getHandleRegistryAddress();
  if (!addr) {
    throw new Error(
      "NEXT_PUBLIC_HANDLE_REGISTRY is not set. Deploy contracts/ArkivoxHandleRegistry.sol on Arbitrum Sepolia (npm run deploy:registry) and add the address to .env / Vercel.",
    );
  }
  return addr;
}

export function contentHashHex(payload: string): `0x${string}` {
  return keccak256(toBytes(payload));
}

export async function commitHandleOnSepolia(
  wallet: WalletClient,
  publicClient: PublicClient,
  handle: `0x${string}`,
  contentHash: `0x${string}`,
  kind: ArkivHandleKind,
  options?: { required?: boolean },
): Promise<{ txHash: `0x${string}` }> {
  const registry = options?.required
    ? requireHandleRegistryAddress()
    : getHandleRegistryAddress();
  if (!registry) {
    throw new Error(
      "Handle registry not configured. Set NEXT_PUBLIC_HANDLE_REGISTRY after deploying ArkivoxHandleRegistry.",
    );
  }

  const account = wallet.account;
  if (!account) throw new Error("Wallet not connected");

  const gas = await estimateGasOverrides(publicClient);
  const txHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: registry,
    abi: handleRegistryAbi,
    functionName: "commitHandle",
    args: [handle, contentHash, kind],
    ...gas,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return { txHash };
}

/** Commits the Nox DEK handle for an Arkiv JSON payload (encryption key anchor on Sepolia). */
export async function commitArkivEncryptionKeyHandle(
  wallet: WalletClient,
  publicClient: PublicClient,
  outerPayload: ArkivPayloadWithHandle,
  kind: ArkivHandleKind,
): Promise<{ txHash: `0x${string}`; handle: `0x${string}` }> {
  const payloadJson = JSON.stringify(outerPayload);
  const handle = arkivEncryptionKeyHandle(outerPayload);
  const { txHash } = await commitHandleOnSepolia(
    wallet,
    publicClient,
    handle,
    contentHashHex(payloadJson),
    kind,
    { required: true },
  );
  return { txHash, handle };
}

export async function readHandleRecord(
  publicClient: PublicClient,
  handle: `0x${string}`,
): Promise<{
  owner: `0x${string}`;
  contentHash: `0x${string}`;
  kind: string;
  committedAt: bigint;
  exists: boolean;
} | null> {
  const registry = getHandleRegistryAddress();
  if (!registry) return null;

  const [owner, contentHash, kind, committedAt, exists] =
    await publicClient.readContract({
      address: registry,
      abi: handleRegistryAbi,
      functionName: "getRecord",
      args: [handle],
    });

  if (!exists) return null;
  return { owner, contentHash, kind, committedAt, exists };
}
