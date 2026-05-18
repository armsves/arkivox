import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { arbitrumSepolia } from "@reown/appkit/networks";
import { bragaChain } from "@/lib/chains";
import { CONFIG } from "@/lib/config";

export const projectId = CONFIG.walletConnect.projectId;

export const networks = [arbitrumSepolia, bragaChain];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [arbitrumSepolia.id]: http(CONFIG.rpc.arbitrumSepolia),
    [bragaChain.id]: http(),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
