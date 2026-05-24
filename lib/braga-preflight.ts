import { createPublicClient, formatEther, http, type Address } from "viem";
import { bragaChain } from "@/lib/chains";

/** Minimum GLM to attempt an Arkiv write (heuristic — storage fees vary). */
const MIN_GLM_WEI = 100_000_000_000_000n; // 0.0001 GLM — heuristic floor

const bragaPublic = createPublicClient({
  chain: bragaChain,
  transport: http(bragaChain.rpcUrls.default.http[0]),
});

export async function assertBragaFunded(owner: Address): Promise<void> {
  const balance = await bragaPublic.getBalance({ address: owner });
  if (balance < MIN_GLM_WEI) {
    throw new Error(
      `Insufficient GLM on Arkiv Braga (${formatEther(balance)} GLM). ` +
        `Get testnet GLM at https://braga.hoodi.arkiv.network/faucet/ then retry.`,
    );
  }
}
