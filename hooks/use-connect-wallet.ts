"use client";

import { useCallback } from "react";
import { useConnect, useConnectors } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { CONFIG, isWalletConnectConfigured } from "@/lib/config";

function pickInjectedConnector(connectors: ReturnType<typeof useConnectors>) {
  return (
    connectors.find((c) => c.id === "injected") ??
    connectors.find((c) => c.type === "injected") ??
    connectors[0]
  );
}

/** Open Reown modal or connect injected wallet when WalletConnect is not configured. */
export function useConnectWallet() {
  const { open } = useAppKit();
  const { connectAsync, connectors, isPending, error } = useConnect();

  const connectBrowserWallet = useCallback(async () => {
    const injected = pickInjectedConnector(connectors);
    if (!injected) {
      throw new Error(
        "No browser wallet found. Install MetaMask (or another EIP-1193 wallet) and refresh.",
      );
    }
    await connectAsync({ connector: injected });
  }, [connectors, connectAsync]);

  const connectWallet = useCallback(async () => {
    if (!isWalletConnectConfigured()) {
      await connectBrowserWallet();
      return;
    }
    open({ view: "Connect" });
  }, [connectBrowserWallet, open]);

  const openWalletModal = useCallback(() => {
    if (!isWalletConnectConfigured()) {
      return connectBrowserWallet();
    }
    open();
  }, [connectBrowserWallet, open]);

  return {
    connectWallet,
    connectBrowserWallet,
    openWalletModal,
    walletConnectConfigured: isWalletConnectConfigured(),
    projectId: CONFIG.walletConnect.projectId,
    isPending,
    error: error?.message ?? null,
  };
}
