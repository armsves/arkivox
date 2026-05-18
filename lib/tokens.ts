export interface TokenConfig {
  symbol: string;
  decimals: number;
  confidential: boolean;
  description: string;
}

/** Tokens aligned with iExec Nox demo-ctoken on Arbitrum Sepolia */
export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: "cUSDC",
    decimals: 6,
    confidential: true,
    description: "Confidential USDC (ERC-7984)",
  },
  {
    symbol: "cRLC",
    decimals: 9,
    confidential: true,
    description: "Confidential RLC (ERC-7984)",
  },
  {
    symbol: "USDC",
    decimals: 6,
    confidential: false,
    description: "Public USDC (wrap source)",
  },
  {
    symbol: "RLC",
    decimals: 9,
    confidential: false,
    description: "Public RLC (wrap source)",
  },
];

export function getToken(symbol: string): TokenConfig | undefined {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}
