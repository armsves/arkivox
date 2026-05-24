/**
 * Arkiv wallet clients — same pattern as
 * https://docs.arkiv.network/learn/metamask-sketch-app/1-setup/
 * and https://docs.arkiv.network/learn/metamask-sketch-app/2-data/
 */
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type WalletClient,
} from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { CONFIG } from "@/lib/config";

export function createArkivPublicClient() {
  return createPublicClient({
    chain: braga,
    transport: http(CONFIG.rpc.braga),
  });
}

/** Browser / wagmi: `custom(ethereum)` — MetaMask signs one Arkiv publish tx. */
export function createArkivWalletFromSigner(
  transport: WalletClient["transport"],
  account: NonNullable<WalletClient["account"]>,
) {
  return createWalletClient({
    chain: braga,
    transport: custom(transport),
    account,
  });
}
