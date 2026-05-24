"use client";

import { useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { bragaChain } from "@/lib/chains";
import { createArkivWalletFromSigner } from "@/lib/arkiv-wallet";

export function useArkivWalletClient() {
  const { address } = useAccount();
  const { data: wagmiWalletClient } = useWalletClient();

  const client = useMemo(() => {
    if (!wagmiWalletClient || !address) return null;
    if (wagmiWalletClient.chain?.id !== bragaChain.id) return null;
    if (!wagmiWalletClient.account) return null;
    return createArkivWalletFromSigner(
      wagmiWalletClient.transport,
      wagmiWalletClient.account,
    );
  }, [wagmiWalletClient, address]);

  const onBraga = wagmiWalletClient?.chain?.id === bragaChain.id;

  return { arkivWalletClient: client, onBraga };
}
