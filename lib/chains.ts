import { defineChain } from "viem";

/** Arkiv Braga testnet — chain id 60138453102 */
export const bragaChain = defineChain({
  id: 60138453102,
  name: "Arkiv Braga Testnet",
  nativeCurrency: { name: "GLM", symbol: "GLM", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://braga.hoodi.arkiv.network/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Arkiv Explorer",
      url: "https://explorer.braga.hoodi.arkiv.network",
    },
  },
});
