import type { RevokeAuditorContext } from "@/lib/ledger-operations";

/** Revoke metadata saved in-browser after share (owner session only). */
const store = new Map<string, RevokeAuditorContext>();

export function setRevokeContext(disclosureEntityKey: string, ctx: RevokeAuditorContext) {
  store.set(disclosureEntityKey, ctx);
}

export function getRevokeContext(
  disclosureEntityKey: string,
): RevokeAuditorContext | undefined {
  return store.get(disclosureEntityKey);
}

export function clearRevokeContext(disclosureEntityKey: string) {
  store.delete(disclosureEntityKey);
}
