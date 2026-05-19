import type { TxType } from "@/lib/arkiv";

/** Demo-ctoken contracts on Arbitrum Sepolia (from iExec-Nox/demo-ctoken). */
export const CTOKEN_CONTRACTS = {
  USDC: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`,
  cUSDC: "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e" as `0x${string}`,
  RLC: "0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963" as `0x${string}`,
  cRLC: "0x92b23f4a59175415ced5cb37e64a1fc6a9d79af4" as `0x${string}`,
} as const;

/** Sentinel — public wrap/unwrap rows are not Nox-wrapped. */
export const PUBLIC_TX_AMOUNT_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

export function tokensForTxType(txType: TxType): string[] {
  if (txType === "wrap") return ["USDC", "RLC"];
  if (txType === "unwrap") return ["cUSDC", "cRLC"];
  return ["cUSDC", "cRLC"];
}

export function defaultCounterpartyForTx(
  txType: TxType,
  token: string,
): `0x${string}` | undefined {
  if (txType === "wrap") {
    if (token === "USDC") return CTOKEN_CONTRACTS.cUSDC;
    if (token === "RLC") return CTOKEN_CONTRACTS.cRLC;
  }
  if (txType === "unwrap") {
    if (token === "cUSDC") return CTOKEN_CONTRACTS.USDC;
    if (token === "cRLC") return CTOKEN_CONTRACTS.RLC;
  }
  return undefined;
}
