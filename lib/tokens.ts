import { CTOKEN_CONTRACTS } from "@/lib/ctoken-contracts";

export interface TokenConfig {
  symbol: string;
  decimals: number;
  confidential: boolean;
  description: string;
  /** Public ERC-20 (wrap source) */
  publicAddress?: `0x${string}`;
  /** ERC-7984 confidential token */
  confidentialAddress?: `0x${string}`;
}

/** Tokens aligned with iExec Nox demo-ctoken on Arbitrum Sepolia */
export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: "cUSDC",
    decimals: 6,
    confidential: true,
    description: "Confidential USDC (ERC-7984)",
    confidentialAddress: CTOKEN_CONTRACTS.cUSDC,
    publicAddress: CTOKEN_CONTRACTS.USDC,
  },
  {
    symbol: "cRLC",
    decimals: 9,
    confidential: true,
    description: "Confidential RLC (ERC-7984)",
    confidentialAddress: CTOKEN_CONTRACTS.cRLC,
    publicAddress: CTOKEN_CONTRACTS.RLC,
  },
  {
    symbol: "USDC",
    decimals: 6,
    confidential: false,
    description: "Public USDC (wrap source)",
    publicAddress: CTOKEN_CONTRACTS.USDC,
    confidentialAddress: CTOKEN_CONTRACTS.cUSDC,
  },
  {
    symbol: "RLC",
    decimals: 9,
    confidential: false,
    description: "Public RLC (wrap source)",
    publicAddress: CTOKEN_CONTRACTS.RLC,
    confidentialAddress: CTOKEN_CONTRACTS.cRLC,
  },
];

export function getToken(symbol: string): TokenConfig | undefined {
  return SUPPORTED_TOKENS.find((t) => t.symbol === symbol);
}
