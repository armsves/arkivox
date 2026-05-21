"use client";

import { useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  createWalletClient as createArkivWalletClient,
  custom,
} from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { bragaChain } from "@/lib/chains";

export function useArkivWalletClient() {
  const { address } = useAccount();
  const { data: wagmiWalletClient } = useWalletClient();

  const client = useMemo(() => {
    if (!wagmiWalletClient || !address) return null;
    if (wagmiWalletClient.chain?.id !== bragaChain.id) return null;
    return createArkivWalletClient({
      chain: braga,
      transport: custom(wagmiWalletClient.transport),
      account: address,
    });
  }, [wagmiWalletClient, address]);

  const onBraga = wagmiWalletClient?.chain?.id === bragaChain.id;

  return { arkivWalletClient: client, onBraga };
}
