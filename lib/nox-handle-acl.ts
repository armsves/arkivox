/**
 * Register off-chain Nox DEK handles so the owner can decrypt via the gateway.
 *
 * encryptInput must use MULTICALL3 as applicationContract; the wallet then
 * calls Multicall3.aggregate3 to run validateInputProof + addViewer in one tx.
 */
import {
  encodeFunctionData,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { multicall3Abi } from "viem";
import { estimateGasOverrides } from "@/lib/gas";
import { isNoxViewer } from "@/lib/nox-acl";
import { MULTICALL3_ADDRESS, NOX_COMPUTE_ADDRESS } from "@/lib/nox";

/** TEEType.Uint256 in nox-protocol-contracts (do not reorder). */
export const NOX_TEE_UINT256 = 35;

const noxValidateAbi = [
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "owner", type: "address" },
      { name: "proof", type: "bytes" },
      { name: "teeType", type: "uint8" },
    ],
    name: "validateInputProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "handle", type: "bytes32" },
      { name: "viewer", type: "address" },
    ],
    name: "addViewer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/** Pass to encryptInput for DEK handles that will be registered via Multicall3. */
export function noxApplicationContractForDek(): `0x${string}` {
  return MULTICALL3_ADDRESS;
}

export async function registerNoxDekHandleForOwner(
  wallet: WalletClient,
  publicClient: PublicClient,
  owner: `0x${string}`,
  handle: `0x${string}`,
  handleProof: Hex,
): Promise<{ txHash: `0x${string}` | null }> {
  const account = wallet.account;
  if (!account) throw new Error("Wallet not connected");
  if (account.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error("Wallet account must match note owner");
  }

  if (await isNoxViewer(handle, owner)) {
    return { txHash: null };
  }

  const validateData = encodeFunctionData({
    abi: noxValidateAbi,
    functionName: "validateInputProof",
    args: [handle, owner, handleProof, NOX_TEE_UINT256],
  });
  const addViewerData = encodeFunctionData({
    abi: noxValidateAbi,
    functionName: "addViewer",
    args: [handle, owner],
  });

  const gas = await estimateGasOverrides(publicClient);
  const txHash = await wallet.writeContract({
    chain: wallet.chain,
    account,
    address: MULTICALL3_ADDRESS,
    abi: multicall3Abi,
    functionName: "aggregate3",
    args: [
      [
        {
          target: NOX_COMPUTE_ADDRESS,
          allowFailure: false,
          callData: validateData,
        },
        {
          target: NOX_COMPUTE_ADDRESS,
          allowFailure: false,
          callData: addViewerData,
        },
      ],
    ],
    ...gas,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return { txHash };
}
