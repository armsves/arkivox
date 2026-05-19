import {
  createPublicClient,
  http,
  type Hex,
  type WalletClient,
  type Account,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import { NOX_COMPUTE_ADDRESS, noxComputeAbi, TEE_COOLDOWN_MS } from "@/lib/nox";

const arbPublic = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

let removeViewerSupported: boolean | null = null;

const REMOVE_VIEWER_SELECTOR = "74156e80";

/** Probe once whether deployed NoxCompute bytecode includes removeViewer(bytes32,address). */
export async function supportsRemoveViewer(): Promise<boolean> {
  if (removeViewerSupported !== null) return removeViewerSupported;
  const code = await arbPublic.getCode({ address: NOX_COMPUTE_ADDRESS });
  removeViewerSupported =
    code !== undefined &&
    code !== "0x" &&
    code.toLowerCase().includes(REMOVE_VIEWER_SELECTOR);
  return removeViewerSupported;
}

export async function grantNoxViewer(
  ownerViem: WalletClient,
  handle: `0x${string}`,
  viewer: `0x${string}`,
): Promise<`0x${string}`> {
  const account = ownerViem.account;
  if (!account) throw new Error("Wallet has no account");

  const txHash = await ownerViem.writeContract({
    chain: arbitrumSepolia,
    address: NOX_COMPUTE_ADDRESS,
    abi: noxComputeAbi,
    functionName: "addViewer",
    args: [handle, viewer],
    account: account as Account,
  });

  await arbPublic.waitForTransactionReceipt({ hash: txHash });
  await new Promise((r) => setTimeout(r, TEE_COOLDOWN_MS));
  return txHash;
}

export async function isNoxViewer(
  handle: `0x${string}`,
  viewer: `0x${string}`,
): Promise<boolean> {
  return arbPublic.readContract({
    address: NOX_COMPUTE_ADDRESS,
    abi: noxComputeAbi,
    functionName: "isViewer",
    args: [handle, viewer],
  });
}

export async function revokeNoxViewer(
  ownerViem: WalletClient,
  handle: `0x${string}`,
  viewer: `0x${string}`,
): Promise<`0x${string}` | null> {
  const account = ownerViem.account;
  if (!account) throw new Error("Wallet has no account");

  const allowed = await isNoxViewer(handle, viewer);
  if (!allowed) return null;

  const txHash = await ownerViem.writeContract({
    chain: arbitrumSepolia,
    address: NOX_COMPUTE_ADDRESS,
    abi: noxComputeAbi,
    functionName: "removeViewer",
    args: [handle, viewer],
    account: account as Account,
  });

  await arbPublic.waitForTransactionReceipt({ hash: txHash });
  await new Promise((r) => setTimeout(r, TEE_COOLDOWN_MS));

  const stillViewer = await isNoxViewer(handle, viewer);
  if (stillViewer) {
    throw new Error(
      "Nox removeViewer did not clear ACL — upgrade NoxCompute or contact iExec",
    );
  }

  return txHash;
}

export async function revokeNoxViewers(
  ownerViem: WalletClient,
  handles: `0x${string}`[],
  viewer: `0x${string}`,
): Promise<{ revoked: `0x${string}`[]; skipped: boolean }> {
  const canRemove = await supportsRemoveViewer();
  if (!canRemove) {
    return { revoked: [], skipped: true };
  }

  const revoked: `0x${string}`[] = [];
  for (const handle of handles) {
    const unique = handle.toLowerCase() as `0x${string}`;
    if (revoked.some((h) => h.toLowerCase() === unique)) continue;
    const tx = await revokeNoxViewer(ownerViem, unique, viewer);
    if (tx) revoked.push(unique);
  }
  return { revoked, skipped: false };
}
