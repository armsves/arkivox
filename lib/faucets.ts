/**
 * Testnet funding links — aligned with [iExec-Nox/demo-ctoken](https://github.com/iExec-Nox/demo-ctoken).
 */
export const CTOKEN_DEMO_FAUCETS = {
  /** Pay gas on Ethereum Sepolia, then bridge to Arbitrum Sepolia */
  eth: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
  /** Move Sepolia ETH → Arbitrum Sepolia (~10 min) */
  bridge:
    "https://portal.arbitrum.io/bridge?amount=0&sourceChain=sepolia&destinationChain=arbitrum-sepolia&tab=bridge&sanitized=true",
  /** Circle testnet USDC — select Arbitrum Sepolia in the network dropdown */
  usdc: "https://faucet.circle.com/",
  /** iExec explorer faucet tab for demo RLC on Arbitrum Sepolia */
  rlc: "https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet",
} as const;

export type FaucetLink = {
  id: string;
  name: string;
  description: string;
  href: string;
  note?: string;
};

/** Step 1 — gas on Sepolia + bridge to Arbitrum Sepolia (Nox chain). */
export const GAS_FAUCETS: FaucetLink[] = [
  {
    id: "eth",
    name: "Ethereum Sepolia ETH",
    description: "Required to pay transaction fees",
    href: CTOKEN_DEMO_FAUCETS.eth,
  },
  {
    id: "bridge",
    name: "Bridge to Arbitrum Sepolia",
    description: "Move your ETH to Arbitrum to use Nox and cTokens",
    href: CTOKEN_DEMO_FAUCETS.bridge,
    note: "Takes ~10 minutes",
  },
];

/** Step 2 — public tokens for wrap flows (demo-ctoken contracts). */
export const TOKEN_FAUCETS: FaucetLink[] = [
  {
    id: "usdc",
    name: "USDC (Arbitrum Sepolia)",
    description: "Public USDC for wrap → cUSDC",
    href: CTOKEN_DEMO_FAUCETS.usdc,
    note: "Select Arbitrum Sepolia in the Circle faucet network dropdown",
  },
  {
    id: "rlc",
    name: "RLC (Arbitrum Sepolia)",
    description: "Public RLC for wrap → cRLC",
    href: CTOKEN_DEMO_FAUCETS.rlc,
  },
];
