/** Pull a useful message from Arkiv SDK / viem error chains. */
export function formatArkivError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      const msg = current.message?.trim();
      if (msg && msg !== "Transaction failed" && !parts.includes(msg)) {
        parts.push(msg);
      }
      const extra = current as Error & {
        details?: string;
        shortMessage?: string;
      };
      if (extra.details && !parts.includes(extra.details)) {
        parts.push(extra.details);
      }
      if (extra.shortMessage && !parts.includes(extra.shortMessage)) {
        parts.push(extra.shortMessage);
      }
      current = extra.cause;
    } else if (typeof current === "string") {
      parts.push(current);
      break;
    } else {
      break;
    }
  }

  const combined = parts.join(" — ");
  if (/non-golembase/i.test(combined)) {
    return "Wrong transaction type for Braga. Stay on Arkiv Braga when signing the publish step.";
  }
  if (/insufficient|funds|balance/i.test(combined)) {
    return `${combined} Fund GLM on Arkiv Braga: https://braga.hoodi.arkiv.network/faucet/`;
  }
  if (/rejected|denied|cancelled/i.test(combined)) {
    return "Transaction rejected in wallet.";
  }
  if (combined) return combined;
  return "Arkiv publish failed. Ensure your wallet is on Arkiv Braga, has GLM from the faucet, and you approve the transaction.";
}
