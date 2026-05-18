import { getToken } from "@/lib/tokens";

/** Parse human amount (e.g. "1.25") to smallest units for Nox uint256 */
export function parseHumanAmount(amount: string, decimals: number): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Invalid amount format");
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > decimals) {
    throw new Error(`Too many decimal places (max ${decimals})`);
  }
  const padded = frac.padEnd(decimals, "0");
  const combined = `${whole}${padded}`.replace(/^0+/, "") || "0";
  return BigInt(combined);
}

export function formatHumanAmount(raw: bigint, decimals: number): string {
  const s = raw.toString().padStart(decimals + 1, "0");
  if (decimals === 0) return s;
  const whole = s.slice(0, -decimals) || "0";
  const frac = s.slice(-decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export function parseAmountForToken(amount: string, tokenSymbol: string): bigint {
  const token = getToken(tokenSymbol);
  if (!token) throw new Error(`Unknown token: ${tokenSymbol}`);
  return parseHumanAmount(amount, token.decimals);
}

export function formatAmountForToken(raw: bigint, tokenSymbol: string): string {
  const token = getToken(tokenSymbol);
  if (!token) return raw.toString();
  return formatHumanAmount(raw, token.decimals);
}
