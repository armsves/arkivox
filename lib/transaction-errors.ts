/** Format viem/wagmi errors for terminal UI. */
export function formatTransactionError(error: unknown): string {
  const parts: string[] = [];
  let cur: unknown = error;
  const seen = new Set<unknown>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    if (cur instanceof Error) {
      if (cur.message && !parts.includes(cur.message)) parts.push(cur.message);
      const x = cur as Error & { details?: string; shortMessage?: string };
      if (x.details && !parts.includes(x.details)) parts.push(x.details);
      if (x.shortMessage && !parts.includes(x.shortMessage)) parts.push(x.shortMessage);
      cur = x.cause;
    } else break;
  }
  const combined = parts.join(" — ");
  if (/replacement transaction underpriced/i.test(combined)) {
    return "Stuck pending tx — cancel or speed up the old Arbitrum Sepolia transaction in your wallet, then retry.";
  }
  return combined || "Transaction failed";
}
