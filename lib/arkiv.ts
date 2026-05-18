import { or, eq, type Predicate } from "@arkiv-network/sdk/query";
import { ExpirationTime } from "@arkiv-network/sdk/utils";

const DEFAULT_PROJECT_VALUE = "arkivox-7k2m";

const projectValue =
  (typeof process.env.NEXT_PUBLIC_ARKIV_PROJECT === "string" &&
    process.env.NEXT_PUBLIC_ARKIV_PROJECT.trim()) ||
  DEFAULT_PROJECT_VALUE;

/** Globally unique project scope — required on every entity and query (Arkiv skill §1). */
export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: projectValue,
} as const;

if (!PROJECT_ATTRIBUTE.value) {
  throw new Error(
    "Set NEXT_PUBLIC_ARKIV_PROJECT (or PROJECT_ATTRIBUTE.value) to a unique string that identifies this app on Arkiv.",
  );
}

/** Previous demo scope — queries include both so older Braga rows still appear. */
export const LEGACY_PROJECT_SCOPES = ["arkiv-vault-nox-demo-7k2m"] as const;

/** Demo ledger TTL — 90 days; extend per-entity if users need longer retention. */
export const ENTITY_EXPIRES_IN = ExpirationTime.fromDays(90);

/** Match current + legacy `project` attribute values on Arkiv. */
export function projectScopePredicate(): Predicate {
  const values = [PROJECT_ATTRIBUTE.value, ...LEGACY_PROJECT_SCOPES];
  if (values.length === 1) {
    return eq(PROJECT_ATTRIBUTE.key, values[0]!);
  }
  return or(values.map((value) => eq(PROJECT_ATTRIBUTE.key, value)));
}

/** True when an entity's `project` attribute belongs to this app (incl. legacy). */
export function isProjectScopedEntity(
  attributes: { key: string; value: string | number | boolean }[] | undefined,
): boolean {
  const hit = attributes?.find((a) => a.key === PROJECT_ATTRIBUTE.key);
  if (hit?.value == null) return false;
  const value = String(hit.value);
  return (
    value === PROJECT_ATTRIBUTE.value ||
    (LEGACY_PROJECT_SCOPES as readonly string[]).includes(value)
  );
}

/**
 * Arkiv skill §11–§12: use `.createdBy()` when a trusted backend publishes read-only
 * data. Arkivox is wallet-owned — users create their own entities, so queries use
 * `.ownedBy()` instead. Do not switch to `createdBy` without a dedicated publisher key.
 */

export const ENTITY_TYPES = {
  /** Encrypted token movement logged on Arkiv */
  transaction: "token_transaction",
  /** Third party (auditor) may decrypt amount via Nox ACL */
  disclosure: "auditor_disclosure",
  /** On-chain Nox revoke + tombstone when disclosure deleted */
  revocation: "auditor_revocation",
} as const;

export const TX_TYPES = ["transfer", "wrap", "unwrap"] as const;
export type TxType = (typeof TX_TYPES)[number];

/** Only confidential cToken transfers use Nox + AES on Arkiv. Wrap/unwrap are public on-chain. */
export const CONFIDENTIAL_TX_TYPES = ["transfer"] as const satisfies readonly TxType[];

export function isConfidentialTxType(txType: TxType): boolean {
  return txType === "transfer";
}

export const BRAGA_RPC = "https://braga.hoodi.arkiv.network/rpc";
export const BRAGA_EXPLORER = "https://explorer.braga.hoodi.arkiv.network";
export const BRAGA_FAUCET = "https://braga.hoodi.arkiv.network/faucet/";
