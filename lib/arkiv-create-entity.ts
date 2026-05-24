import type { CreateEntityParameters, CreateEntityReturnType } from "@arkiv-network/sdk";
import type { TxParams } from "@arkiv-network/sdk";
import { createPublicClient, http, type Address } from "viem";
import { bragaChain } from "@/lib/chains";
import { CONFIG } from "@/lib/config";
import type { ArkivWalletClient } from "@/lib/ledger-operations";

const bragaPublic = createPublicClient({
  chain: bragaChain,
  transport: http(CONFIG.rpc.braga),
});

function errorText(error: unknown): string {
  const parts: string[] = [];
  let cur: unknown = error;
  const seen = new Set<unknown>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    if (cur instanceof Error) {
      parts.push(cur.message);
      const x = cur as Error & { details?: string; shortMessage?: string };
      if (x.details) parts.push(x.details);
      if (x.shortMessage) parts.push(x.shortMessage);
      cur = x.cause;
    } else {
      parts.push(String(cur));
      break;
    }
  }
  return parts.join(" ");
}

export function isReplacementUnderpriced(error: unknown): boolean {
  return /replacement transaction underpriced|underpriced/i.test(errorText(error));
}

/** Bump gas (and pin nonce) to replace a stuck pending Braga transaction. */
export async function replacementTxParams(owner: Address): Promise<TxParams> {
  const [fees, latestNonce, pendingNonce] = await Promise.all([
    bragaPublic.estimateFeesPerGas(),
    bragaPublic.getTransactionCount({ address: owner, blockTag: "latest" }),
    bragaPublic.getTransactionCount({ address: owner, blockTag: "pending" }),
  ]);

  const hasStuck = pendingNonce > latestNonce;
  const bumpPct = hasStuck ? 250n : 130n;

  const params: TxParams = {};
  if (fees.maxFeePerGas) {
    params.maxFeePerGas = (fees.maxFeePerGas * bumpPct) / 100n;
  }
  if (fees.maxPriorityFeePerGas) {
    params.maxPriorityFeePerGas = (fees.maxPriorityFeePerGas * bumpPct) / 100n;
  }
  if (hasStuck) {
    params.nonce = latestNonce;
  }
  return params;
}

export async function createEntityResilient(
  ownerArkiv: ArkivWalletClient,
  data: CreateEntityParameters,
): Promise<CreateEntityReturnType> {
  try {
    return await ownerArkiv.createEntity(data);
  } catch (error) {
    if (!isReplacementUnderpriced(error)) throw error;
    const owner = ownerArkiv.account?.address;
    if (!owner) throw error;
    const txParams = await replacementTxParams(owner);
    return await ownerArkiv.createEntity(data, txParams);
  }
}
