import { getWalletClient } from "@wagmi/core";
import {
  createWalletClient as createArkivWalletClient,
  custom,
} from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { createViemHandleClient } from "@iexec-nox/handle";
import { arbitrumSepolia } from "viem/chains";
import { bragaChain } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi";

export async function getHandleClientForNox() {
  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: arbitrumSepolia.id,
  });
  if (!walletClient) {
    throw new Error("Wallet not connected on Arbitrum Sepolia.");
  }
  return createViemHandleClient(walletClient);
}

export async function getArkivWalletClientForBraga() {
  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: bragaChain.id,
  });
  if (!walletClient?.account) {
    throw new Error(
      "Wallet not connected on Arkiv Braga. Switch to Arkiv Braga testnet in your wallet, then retry.",
    );
  }
  return createArkivWalletClient({
    chain: braga,
    transport: custom(walletClient.transport),
    account: walletClient.account,
  });
}
