export const CONFIG = {
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "demo",
  },
  rpc: {
    arbitrumSepolia: "https://arbitrum-sepolia.gateway.tenderly.co",
  },
} as const;

export function isWalletConnectConfigured() {
  const id = CONFIG.walletConnect.projectId;
  return id.length > 0 && id !== "demo";
}

if (!isWalletConnectConfigured()) {
  console.warn(
    "[Arkivox] Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env (free at https://cloud.reown.com).",
  );
}
