import { eq } from "@arkiv-network/sdk/query";
import { arkivPublicClient } from "@/lib/arkiv-client";
import {
  ENTITY_TYPES,
  PARENT_KINDS,
  isConfidentialTxType,
  isProjectScopedEntity,
  projectScopePredicate,
  type ParentKind,
} from "@/lib/arkiv";
import {
  granteeHash,
  parentKeyHash,
  shareHandleHash,
} from "@/lib/ledger-secrets";
import type {
  AuditorDisclosurePayload,
  AuditorDisclosureView,
  TokenTransactionView,
  TransactionSecretPayload,
  TxType,
} from "@/lib/types";

type ArkivEntity = {
  key: string;
  owner?: string;
  createdAtBlock?: bigint;
  attributes: { key: string; value: string | number | boolean }[];
  toJson: () => unknown;
};

function attr(entity: ArkivEntity, key: string): string | undefined {
  const hit = entity.attributes?.find((a) => a.key === key);
  if (hit?.value === undefined || hit.value === null) return undefined;
  return String(hit.value);
}

function blockTime(entity: ArkivEntity): number {
  return entity.createdAtBlock ? Number(entity.createdAtBlock) : 0;
}

function normalizeHandle(
  json: TransactionSecretPayload & { dekHandle?: `0x${string}` },
): `0x${string}` | null {
  return json.amountHandle ?? json.dekHandle ?? null;
}

function parseTransaction(entity: ArkivEntity): TokenTransactionView | null {
  try {
    if (!isProjectScopedEntity(entity.attributes)) return null;

    const json = entity.toJson() as {
      v?: number;
      txType?: TxType;
      token?: string;
      counterparty?: string;
      created?: number;
      contentHash?: string;
      noxTxHash?: string | null;
      wrap?: "dek" | "amount";
      memo?: string;
      public?: boolean;
      amount?: string;
      amountRaw?: string;
    } & TransactionSecretPayload & { dekHandle?: `0x${string}` };

    const amountHandle = normalizeHandle(json);
    if (!amountHandle) return null;

    const txType = (json.txType ?? "transfer") as TxType;
    const hasCipher = !!(json.ciphertext && json.iv);
    const isPublicLedger =
      json.public === true || (!hasCipher && !isConfidentialTxType(txType));

    if (isPublicLedger) {
      return {
        entityKey: entity.key,
        txType,
        token: json.token ?? "cUSDC",
        counterparty: json.counterparty ?? "",
        owner: entity.owner ?? "",
        createdAt: json.created ?? blockTime(entity),
        noxTxHash: json.noxTxHash ?? null,
        contentHash: json.contentHash ?? "",
        memo: json.memo ?? "",
        amount: json.amount,
        amountRaw: json.amountRaw,
        payload: {
          v: 2,
          public: true,
          amountHandle,
          ciphertext: json.ciphertext,
          iv: json.iv,
          alg: json.alg,
          wrap: json.wrap,
        },
        isPrivate: false,
      };
    }

    if (json.v === 3) {
      return {
        entityKey: entity.key,
        txType: "transfer",
        token: "—",
        counterparty: "",
        owner: entity.owner ?? "",
        createdAt: blockTime(entity),
        noxTxHash: null,
        contentHash: "",
        memo: "",
        payload: {
          v: 3,
          amountHandle,
          wrap: json.wrap ?? "dek",
          ciphertext: json.ciphertext ?? "",
          iv: json.iv ?? "",
          alg: json.alg ?? "AES-256-GCM",
        },
        isPrivate: true,
      };
    }

    return {
      entityKey: entity.key,
      txType,
      token: json.token ?? "cUSDC",
      counterparty: json.counterparty ?? "",
      owner: entity.owner ?? "",
      createdAt: json.created ?? blockTime(entity),
      noxTxHash: json.noxTxHash ?? null,
      contentHash: json.contentHash ?? "",
      memo: json.memo ?? "",
      payload: {
        v: 2,
        amountHandle,
        ciphertext: json.ciphertext ?? "",
        iv: json.iv ?? "",
        alg: json.alg ?? "AES-256-GCM",
        wrap: json.wrap,
      },
      isPrivate: hasCipher,
    };
  } catch {
    return null;
  }
}

function parseDisclosure(entity: ArkivEntity): AuditorDisclosureView | null {
  try {
    if (!isProjectScopedEntity(entity.attributes)) return null;

    const json = entity.toJson() as {
      v?: number;
      parentKey?: string;
      grantee?: string;
      auditorLabel?: string;
      label?: string;
      txType?: TxType;
      token?: string;
      counterparty?: string;
      wrap?: "dek";
    } & AuditorDisclosurePayload & { dekHandle?: `0x${string}` };

    const amountHandle = json.amountHandle ?? json.dekHandle;
    if (!amountHandle) return null;

    const isPrivate = json.v === 3;
    const gHash =
      attr(entity, "granteeHash") ??
      (json.grantee ? granteeHash(json.grantee) : undefined);
    const pHash =
      attr(entity, "parentKeyHash") ??
      (json.parentKey ? parentKeyHash(json.parentKey) : undefined);

    const parentKind = (attr(entity, "parentKind") ??
      PARENT_KINDS.transaction) as ParentKind;

    if (!isPrivate) {
      if (!json.parentKey || !json.grantee) return null;
      return {
        entityKey: entity.key,
        parentKey: json.parentKey,
        parentKeyHash: pHash,
        parentKind,
        grantee: json.grantee.toLowerCase(),
        granteeHash: gHash,
        auditorLabel: json.auditorLabel ?? json.label ?? "Auditor access",
        txType: (json.txType ?? "transfer") as TxType,
        token: json.token ?? "cUSDC",
        counterparty: json.counterparty ?? "",
        payload: { v: 2, amountHandle },
        isPrivate: false,
      };
    }

    if (!gHash || !pHash) return null;

    return {
      entityKey: entity.key,
      parentKey: "",
      parentKeyHash: pHash,
      parentKind,
      grantee: "",
      granteeHash: gHash,
      auditorLabel: "Encrypted disclosure",
      txType: "transfer",
      token: "—",
      counterparty: "",
      payload: {
        v: 3,
        amountHandle,
        wrap: "dek",
        ciphertext: json.ciphertext ?? "",
        iv: json.iv ?? "",
        alg: json.alg ?? "AES-256-GCM",
      },
      isPrivate: true,
    };
  } catch {
    return null;
  }
}

export async function fetchMyTransactions(
  owner: `0x${string}`,
): Promise<TokenTransactionView[]> {
  const result = await arkivPublicClient
    .buildQuery()
    .where([
      projectScopePredicate(),
      eq("entityType", ENTITY_TYPES.transaction),
    ])
    .ownedBy(owner)
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  return result.entities
    .map((e) => parseTransaction(e as ArkivEntity))
    .filter((t): t is TokenTransactionView => t !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchDisclosuresForOwner(
  owner: `0x${string}`,
): Promise<AuditorDisclosureView[]> {
  const result = await arkivPublicClient
    .buildQuery()
    .where([
      projectScopePredicate(),
      eq("entityType", ENTITY_TYPES.disclosure),
    ])
    .ownedBy(owner)
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  return result.entities
    .map((e) => parseDisclosure(e as ArkivEntity))
    .filter((d): d is AuditorDisclosureView => d !== null);
}

export async function fetchDisclosuresForAuditor(
  auditor: `0x${string}`,
): Promise<AuditorDisclosureView[]> {
  const hash = granteeHash(auditor);
  const result = await arkivPublicClient
    .buildQuery()
    .where([
      projectScopePredicate(),
      eq("entityType", ENTITY_TYPES.disclosure),
      eq("granteeHash", hash),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  const entities = result.entities
    .map((e) => parseDisclosure(e as ArkivEntity))
    .filter((d): d is AuditorDisclosureView => d !== null);

  if (entities.length > 0) return entities;

  /** Legacy v2 disclosures indexed by plain grantee address */
  const legacy = await arkivPublicClient
    .buildQuery()
    .where([
      projectScopePredicate(),
      eq("entityType", ENTITY_TYPES.disclosure),
      eq("grantee", auditor.toLowerCase()),
    ])
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  return legacy.entities
    .map((e) => parseDisclosure(e as ArkivEntity))
    .filter((d): d is AuditorDisclosureView => d !== null);
}

export async function fetchTransactionByKey(
  entityKey: string,
): Promise<TokenTransactionView | null> {
  const entity = await arkivPublicClient.getEntity(entityKey as `0x${string}`);
  return parseTransaction(entity as ArkivEntity);
}

export const fetchMyRecords = fetchMyTransactions;
export const fetchGrantsForGrantee = fetchDisclosuresForAuditor;
export const fetchRecordByKey = fetchTransactionByKey;

/** Revoked Nox share handles (hashed) for an auditor — checked before decrypt. */
export async function fetchRevokedShareHandleHashes(
  auditor: `0x${string}`,
): Promise<Set<string>> {
  const result = await arkivPublicClient
    .buildQuery()
    .where([
      projectScopePredicate(),
      eq("entityType", ENTITY_TYPES.revocation),
      eq("granteeHash", granteeHash(auditor)),
    ])
    .withAttributes(true)
    .limit(100)
    .fetch();

  const out = new Set<string>();
  for (const entity of result.entities) {
    const h = (entity as ArkivEntity).attributes?.find(
      (a) => a.key === "shareHandleHash",
    );
    if (h?.value != null) out.add(String(h.value).toLowerCase());
  }
  return out;
}

export function isShareHandleRevoked(
  revokedHashes: Set<string>,
  shareHandle: `0x${string}`,
): boolean {
  return revokedHashes.has(shareHandleHash(shareHandle).toLowerCase());
}
