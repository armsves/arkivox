"use client";

import { useWalletClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import { arbitrumSepolia } from "viem/chains";

export function useHandleClient() {
  const { data: walletClient } = useWalletClient();

  const { data: handleClient = null, error, isLoading } = useQuery({
    queryKey: [
      "handle-client",
      walletClient?.account?.address,
      walletClient?.chain?.id,
    ],
    queryFn: async () => {
      if (!walletClient) return null;
      if (walletClient.chain?.id !== arbitrumSepolia.id) return null;
      return createViemHandleClient(walletClient);
    },
    enabled: !!walletClient && walletClient.chain?.id === arbitrumSepolia.id,
    staleTime: Infinity,
    retry: false,
  });

  return {
    handleClient,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
