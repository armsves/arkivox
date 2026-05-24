import type { CreateEntityParameters, CreateEntityReturnType } from "@arkiv-network/sdk";
import type { TxParams } from "@arkiv-network/sdk";
import { type Address } from "viem";
import type { ArkivWalletClient } from "@/lib/ledger-operations";
import {
  assertBragaFundedForWrite,
  assertBragaNonceReady,
  estimateBragaWriteCost,
  getBragaPublicClient,
  txParamsFromEstimate,
} from "@/lib/braga-preflight";

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

/** Retry only — official tutorials let the wallet estimate gas on the first send. */
export async function replacementTxParams(
  owner: Address,
  base: TxParams,
): Promise<TxParams> {
  const bumpPct = 250n;
  const params: TxParams = { ...base };
  if (params.maxFeePerGas) {
    params.maxFeePerGas = (params.maxFeePerGas * bumpPct) / 100n;
  }
  if (params.maxPriorityFeePerGas) {
    params.maxPriorityFeePerGas = (params.maxPriorityFeePerGas * bumpPct) / 100n;
  }
  if (params.gas) {
    params.gas = (params.gas * bumpPct) / 100n;
  }
  params.nonce = await getBragaPublicClient().getTransactionCount({
    address: owner,
    blockTag: "latest",
  });
  return params;
}

/**
 * Publish to Arkiv Braga — matches official `walletClient.createEntity({...})`
 * (no tx overrides on first attempt; MetaMask estimates gas).
 */
export async function createEntityResilient(
  ownerArkiv: ArkivWalletClient,
  data: CreateEntityParameters,
): Promise<CreateEntityReturnType> {
  const owner = ownerArkiv.account?.address;
  if (!owner) throw new Error("Arkiv wallet has no account");

  await assertBragaNonceReady(owner);
  await assertBragaFundedForWrite(owner, data);

  try {
    return await ownerArkiv.createEntity(data);
  } catch (error) {
    if (!isReplacementUnderpriced(error)) throw error;
    const estimate = await estimateBragaWriteCost(data);
    const txParams = await replacementTxParams(owner, txParamsFromEstimate(estimate));
    return await ownerArkiv.createEntity(data, txParams);
  }
}

export async function estimateCreateEntityCost(data: CreateEntityParameters) {
  return estimateBragaWriteCost(data);
}
