import type { PublicClient } from "viem";

/** MetaMask often under-estimates gas on Arbitrum Sepolia — add 20% buffer. */
export async function estimateGasOverrides(publicClient: PublicClient | undefined) {
  if (!publicClient) return {};
  const fees = await publicClient.estimateFeesPerGas();
  return {
    maxFeePerGas: (fees.maxFeePerGas! * 120n) / 100n,
    maxPriorityFeePerGas: (fees.maxPriorityFeePerGas! * 120n) / 100n,
  };
}
