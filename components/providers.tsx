"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { arbitrumSepolia } from "@reown/appkit/networks";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { wagmiAdapter, projectId } from "@/lib/wagmi";
import { bragaChain } from "@/lib/chains";
import { BRAND } from "@/lib/brand";

let appKitInitialized = false;

function initAppKit() {
  if (appKitInitialized) return;
  appKitInitialized = true;

  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [arbitrumSepolia, bragaChain],
    defaultNetwork: arbitrumSepolia,
    metadata: {
      name: BRAND.appKitName,
      description: BRAND.appKitDescription,
      url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      icons: [],
    },
    features: {
      analytics: false,
    },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "#00ff94",
      "--w3m-color-mix": "#0c150f",
      "--w3m-color-mix-strength": 40,
    },
  });
}

export function Providers({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  initAppKit();
  const [queryClient] = useState(() => new QueryClient());
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies,
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
