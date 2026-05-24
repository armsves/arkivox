import { getWalletClient } from "@wagmi/core";
import { createViemHandleClient } from "@iexec-nox/handle";
import { arbitrumSepolia } from "viem/chains";
import { bragaChain } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi";
import { createArkivWalletFromSigner } from "@/lib/arkiv-wallet";

export async function getHandleClientForNox() {
  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: arbitrumSepolia.id,
  });
  if (!walletClient) {
    throw new Error("Wallet not connected on Arbitrum Sepolia.");
  }
  return createViemHandleClient(walletClient);
}

/** Arkiv Braga wallet — `custom(metamask)` per MetaMask sketch tutorial. */
export async function getArkivWalletClientForBraga() {
  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: bragaChain.id,
  });
  if (!walletClient?.account) {
    throw new Error(
      "Wallet not connected on Arkiv Braga. Switch to Arkiv Braga testnet in your wallet, then retry.",
    );
  }
  return createArkivWalletFromSigner(walletClient.transport, walletClient.account);
}
