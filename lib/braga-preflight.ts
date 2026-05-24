import type { CreateEntityParameters } from "@arkiv-network/sdk";
import type { TxParams } from "@arkiv-network/sdk";
import {
  createPublicClient,
  formatEther,
  http,
  type Address,
  type PublicClient,
} from "viem";
import { bragaChain } from "@/lib/chains";
import { CONFIG } from "@/lib/config";
import {
  ARKIV_SYSTEM_ADDRESS,
  encodeCreateEntityCalldata,
} from "@/lib/arkiv-encode";

const bragaPublic = createPublicClient({
  chain: bragaChain,
  transport: http(CONFIG.rpc.braga),
});

/** Fallback when estimateGas fails (wallet RPC quirks). */
const FALLBACK_GAS = 800_000n;
const GAS_BUFFER_PCT = 150n;
const FEE_BUFFER_PCT = 150n;
const BALANCE_HEADROOM_PCT = 200n;

export type BragaWriteEstimate = {
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  maxCostWei: bigint;
  recommendedMinWei: bigint;
};

export async function estimateBragaWriteCost(
  createParams: CreateEntityParameters,
): Promise<BragaWriteEstimate> {
  const calldata = await encodeCreateEntityCalldata(createParams);
  const fees = await bragaPublic.estimateFeesPerGas();

  let gas = FALLBACK_GAS;
  try {
    gas = await bragaPublic.estimateGas({
      to: ARKIV_SYSTEM_ADDRESS,
      value: 0n,
      data: calldata,
    });
    if (gas < 100_000n) {
      gas = FALLBACK_GAS;
    }
  } catch {
    /* use fallback */
  }

  const bufferedGas = (gas * GAS_BUFFER_PCT) / 100n;
  const maxFeePerGas = ((fees.maxFeePerGas ?? 1_000_000_000n) * FEE_BUFFER_PCT) / 100n;
  const maxPriorityFeePerGas =
    ((fees.maxPriorityFeePerGas ?? 1_000_000n) * FEE_BUFFER_PCT) / 100n;
  const maxCostWei = bufferedGas * maxFeePerGas;
  const recommendedMinWei = (maxCostWei * BALANCE_HEADROOM_PCT) / 100n;

  return {
    gas: bufferedGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    maxCostWei,
    recommendedMinWei,
  };
}

export function txParamsFromEstimate(estimate: BragaWriteEstimate): TxParams {
  return {
    gas: estimate.gas,
    maxFeePerGas: estimate.maxFeePerGas,
    maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
  };
}

export async function assertBragaNonceReady(owner: Address): Promise<void> {
  const [latest, pending] = await Promise.all([
    bragaPublic.getTransactionCount({ address: owner, blockTag: "latest" }),
    bragaPublic.getTransactionCount({ address: owner, blockTag: "pending" }),
  ]);
  if (pending > latest) {
    throw new Error(
      `You have a pending Arkiv Braga transaction (nonce ${latest} stuck; wallet shows ${pending}). ` +
        `Cancel or speed it up in your wallet, wait ~1 minute, then retry. ` +
        `This often appears as "replacement transaction underpriced".`,
    );
  }
}

export async function assertBragaFundedForWrite(
  owner: Address,
  createParams: CreateEntityParameters,
): Promise<BragaWriteEstimate> {
  await assertBragaNonceReady(owner);
  const balance = await bragaPublic.getBalance({ address: owner });
  const estimate = await estimateBragaWriteCost(createParams);

  if (balance < estimate.maxCostWei) {
    throw new Error(
      `Insufficient GLM on Arkiv Braga for storage (balance ${formatEther(balance)} GLM, ` +
        `need ~${formatEther(estimate.maxCostWei)} GLM for gas). ` +
        `Arkiv charges GLM as transaction gas to store data (tx value is 0). ` +
        `Fund via https://braga.hoodi.arkiv.network/faucet/ — aim for at least ` +
        `${formatEther(estimate.recommendedMinWei)} GLM.`,
    );
  }

  return estimate;
}

/** @deprecated Use assertBragaFundedForWrite with payload for accurate GLM check. */
export async function assertBragaFunded(owner: Address): Promise<void> {
  const balance = await bragaPublic.getBalance({ address: owner });
  const min = 500_000_000_000_000n; // 0.0005 GLM floor when payload unknown
  if (balance < min) {
    throw new Error(
      `Insufficient GLM on Arkiv Braga (${formatEther(balance)} GLM). ` +
        `Get testnet GLM at https://braga.hoodi.arkiv.network/faucet/ then retry.`,
    );
  }
  await assertBragaNonceReady(owner);
}

export function getBragaPublicClient(): PublicClient {
  return bragaPublic;
}
