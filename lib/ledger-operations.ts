/**
 * Confidential token transaction ledger on Arkiv + Nox amount handles.
 */
import {
  createWalletClient,
  http,
  type WalletArkivClient,
} from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { braga } from "@arkiv-network/sdk/chains";
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import {
  createPublicClient as createViemPublicClient,
  createWalletClient as createViemWalletClient,
  http as viemHttp,
  type Account,
  type Chain,
  type Hex,
  type WalletClient,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import {
  ENTITY_TYPES,
  ENTITY_EXPIRES_IN,
  PARENT_KINDS,
  PROJECT_ATTRIBUTE,
  isConfidentialTxType,
  type TxType,
} from "@/lib/arkiv";
import { createEntityResilient } from "@/lib/arkiv-create-entity";
import { formatAmountForToken, parseAmountForToken } from "@/lib/amount";
import { PUBLIC_TX_AMOUNT_HANDLE } from "@/lib/ctoken-contracts";
import {
  dekToUint256,
  generateDek,
  sha256Hex,
  uint256ToDek,
} from "@/lib/crypto";
import { arkivEncryptionKeyHandle } from "@/lib/handle-registry";
import { NOX_COMPUTE_ADDRESS, TEE_COOLDOWN_MS } from "@/lib/nox";
import {
  grantNoxViewer,
  isNoxViewer,
  revokeNoxViewers,
} from "@/lib/nox-acl";
import {
  decryptJson,
  encryptJson,
  granteeHash,
  parentKeyHash,
  shareHandleHash,
  type DisclosurePlaintext,
  type TransactionPlaintext,
} from "@/lib/ledger-secrets";
import type {
  AuditorDisclosureView,
  DecryptedDisclosure,
  DecryptedTransaction,
  TokenTransactionView,
} from "@/lib/types";
import {
  fetchDisclosuresForAuditor,
  fetchDisclosuresForOwner,
  fetchMyTransactions,
  fetchTransactionByKey,
} from "@/lib/ledger-queries";

export interface RecordTransactionInput {
  txType: TxType;
  token: string;
  counterparty: `0x${string}`;
  /** Human-readable amount, e.g. "10.5" */
  amount: string;
  memo?: string;
  /** Optional on-chain Nox / cToken tx on Arbitrum Sepolia */
  noxTxHash?: `0x${string}`;
  /**
   * If you already have a Nox amount handle from a cToken transfer,
   * pass it here to skip re-encryption.
   */
  existingAmountHandle?: `0x${string}`;
}

export function createArkivWalletFromPrivateKey(privateKey: Hex) {
  return createWalletClient({
    chain: braga,
    transport: http(),
    account: privateKeyToAccount(privateKey),
  });
}

export type ArkivWalletClient = WalletArkivClient;

export function createViemWalletFromPrivateKey(
  privateKey: Hex,
  chain: Chain = arbitrumSepolia,
) {
  return createViemWalletClient({
    chain,
    transport: viemHttp(),
    account: privateKeyToAccount(privateKey),
  });
}

export async function createHandleClient(
  viemWallet: WalletClient,
): Promise<HandleClient> {
  return createViemHandleClient(viemWallet);
}

function plaintextToDecrypted(p: TransactionPlaintext): DecryptedTransaction {
  return {
    amount: p.amount,
    amountRaw: p.amountRaw,
    memo: p.memo,
    token: p.token,
    txType: p.txType,
    counterparty: p.counterparty,
    noxTxHash: p.noxTxHash,
  };
}

function publicTransactionToDecrypted(tx: TokenTransactionView): DecryptedTransaction {
  if (!tx.amount || !tx.amountRaw) {
    throw new Error("Public transaction missing amount");
  }
  return {
    amount: tx.amount,
    amountRaw: tx.amountRaw,
    memo: tx.memo,
    token: tx.token,
    txType: tx.txType,
    counterparty: tx.counterparty,
    noxTxHash: tx.noxTxHash,
  };
}

async function unwrapDekFromHandle(
  handleClient: HandleClient,
  handle: `0x${string}`,
): Promise<Uint8Array> {
  const { value } = await handleClient.decrypt(handle);
  return uint256ToDek(
    typeof value === "bigint" ? value : BigInt(value as string | number),
  );
}

/** Nox encrypt — must run while the wallet is on Arbitrum Sepolia. */
export type PreparedConfidentialTransaction = {
  sessionDek: Uint8Array;
  plaintext: TransactionPlaintext;
  outerPayload: {
    v: 3;
    amountHandle: `0x${string}`;
    wrap: "dek" | "amount";
    dekHandle?: `0x${string}`;
    ciphertext: string;
    iv: string;
    alg: "AES-256-GCM";
  };
};

export async function prepareConfidentialTransaction(
  ownerHandle: HandleClient,
  input: RecordTransactionInput,
): Promise<PreparedConfidentialTransaction> {
  const amountRaw = parseAmountForToken(input.amount, input.token);
  const memo = input.memo?.trim() ?? "";
  const created = Date.now();

  const plaintext: TransactionPlaintext = {
    txType: input.txType,
    token: input.token,
    counterparty: input.counterparty.toLowerCase(),
    amount: input.amount.trim(),
    amountRaw: amountRaw.toString(),
    memo,
    created,
    noxTxHash: input.noxTxHash ?? null,
  };

  const sessionDek = generateDek();
  const { ciphertext, iv } = await encryptJson(plaintext, sessionDek);

  let amountHandle: `0x${string}`;
  let wrap: "dek" | "amount";
  let dekHandle: `0x${string}` | undefined;

  const { handle: noxDekHandle } = await ownerHandle.encryptInput(
    dekToUint256(sessionDek),
    "uint256",
    NOX_COMPUTE_ADDRESS,
  );
  const encryptionKeyHandle = noxDekHandle as `0x${string}`;

  if (input.existingAmountHandle) {
    amountHandle = input.existingAmountHandle;
    dekHandle = encryptionKeyHandle;
    wrap = "amount";
  } else {
    amountHandle = encryptionKeyHandle;
    wrap = "dek";
  }

  return {
    sessionDek,
    plaintext,
    outerPayload: {
      v: 3,
      amountHandle,
      ...(dekHandle ? { dekHandle } : {}),
      wrap,
      ciphertext,
      iv,
      alg: "AES-256-GCM",
    },
  };
}

export async function publishConfidentialTransaction(
  ownerArkiv: ArkivWalletClient,
  prepared: PreparedConfidentialTransaction,
): Promise<{
  entityKey: string;
  transaction: TokenTransactionView;
  sessionDek: Uint8Array;
}> {
  const ownerAddress = ownerArkiv.account?.address;
  if (!ownerAddress) throw new Error("Arkiv wallet has no account");

  const { plaintext, outerPayload, sessionDek } = prepared;
  const contentHash = await sha256Hex(JSON.stringify(outerPayload));

  const { entityKey } = await createEntityResilient(ownerArkiv, {
    payload: jsonToPayload(outerPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: ENTITY_TYPES.transaction },
    ],
    expiresIn: ENTITY_EXPIRES_IN,
  });

  const transaction: TokenTransactionView = {
    entityKey,
    txType: plaintext.txType,
    token: plaintext.token,
    counterparty: plaintext.counterparty,
    owner: ownerAddress,
    createdAt: plaintext.created,
    noxTxHash: plaintext.noxTxHash,
    contentHash,
    memo: plaintext.memo,
    payload: {
      v: 3,
      amountHandle: outerPayload.amountHandle,
      wrap: outerPayload.wrap,
      dekHandle: outerPayload.dekHandle,
      ciphertext: outerPayload.ciphertext,
      iv: outerPayload.iv,
      alg: "AES-256-GCM",
    },
    isPrivate: true,
  };

  return { entityKey, transaction, sessionDek };
}

export async function recordTokenTransaction(
  ownerArkiv: ArkivWalletClient,
  input: RecordTransactionInput,
  nox?: { viem: WalletClient; handle: HandleClient },
): Promise<{
  entityKey: string;
  transaction: TokenTransactionView;
  /** Present when AES+DEK path used — keep in memory for owner reveal (Nox ACL not set for encrypt-only handles). */
  sessionDek?: Uint8Array;
}> {
  const ownerAddress = ownerArkiv.account?.address;
  if (!ownerAddress) throw new Error("Arkiv wallet has no account");

  const amountRaw = parseAmountForToken(input.amount, input.token);
  const memo = input.memo?.trim() ?? "";
  const created = Date.now();

  if (!isConfidentialTxType(input.txType)) {
    const outerPayload = {
      v: 2 as const,
      public: true as const,
      txType: input.txType,
      token: input.token,
      counterparty: input.counterparty.toLowerCase(),
      amount: input.amount.trim(),
      amountRaw: amountRaw.toString(),
      memo,
      created,
      noxTxHash: input.noxTxHash ?? null,
      amountHandle: PUBLIC_TX_AMOUNT_HANDLE,
    };
    const contentHash = await sha256Hex(JSON.stringify(outerPayload));

    const { entityKey } = await createEntityResilient(ownerArkiv, {
      payload: jsonToPayload(outerPayload),
      contentType: "application/json",
      attributes: [
        PROJECT_ATTRIBUTE,
        { key: "entityType", value: ENTITY_TYPES.transaction },
      ],
      expiresIn: ENTITY_EXPIRES_IN,
    });

    const transaction: TokenTransactionView = {
      entityKey,
      txType: input.txType,
      token: input.token,
      counterparty: input.counterparty.toLowerCase(),
      owner: ownerAddress,
      createdAt: created,
      noxTxHash: input.noxTxHash ?? null,
      contentHash,
      memo,
      amount: input.amount.trim(),
      amountRaw: amountRaw.toString(),
      payload: {
        v: 2,
        public: true,
        amountHandle: PUBLIC_TX_AMOUNT_HANDLE,
      },
      isPrivate: false,
    };

    return { entityKey, transaction };
  }

  if (!nox) {
    throw new Error("Arbitrum Sepolia wallet required for confidential transfers");
  }

  void nox.viem;
  const prepared = await prepareConfidentialTransaction(nox.handle, input);
  return publishConfidentialTransaction(ownerArkiv, prepared);
}

export async function decryptWithSessionDek(
  tx: TokenTransactionView,
  sessionDek: Uint8Array,
): Promise<DecryptedTransaction> {
  if (!tx.payload.ciphertext || !tx.payload.iv) {
    throw new Error("No encrypted payload");
  }
  const parsed = await decryptJson<TransactionPlaintext>(
    tx.payload.ciphertext,
    tx.payload.iv,
    sessionDek,
  );
  return plaintextToDecrypted(parsed);
}

async function ensureViewer(
  ownerViem: WalletClient,
  handle: `0x${string}`,
  viewer: `0x${string}`,
) {
  if (await isNoxViewer(handle, viewer)) return;
  try {
    await grantNoxViewer(ownerViem, handle, viewer);
  } catch {
    /* gateway may already grant viewer for encrypt owner */
  }
}

export async function decryptTransactionSecret(
  handleClient: HandleClient | null,
  tx: TokenTransactionView,
  sessionDek?: Uint8Array,
): Promise<DecryptedTransaction> {
  if (
    !isConfidentialTxType(tx.txType) ||
    tx.payload.public ||
    (!tx.payload.ciphertext && tx.amount && tx.amountRaw)
  ) {
    return publicTransactionToDecrypted(tx);
  }

  if (!handleClient) {
    throw new Error("Nox handle client required for confidential transactions");
  }

  if (tx.payload.v === 3 && tx.payload.ciphertext && tx.payload.iv) {
    const keyHandle = arkivEncryptionKeyHandle(tx.payload);
    const dek =
      sessionDek ?? (await unwrapDekFromHandle(handleClient, keyHandle));
    const parsed = await decryptJson<TransactionPlaintext>(
      tx.payload.ciphertext,
      tx.payload.iv,
      dek,
    );
    return plaintextToDecrypted(parsed);
  }

  if (tx.payload.ciphertext && tx.payload.iv) {
    const dek =
      sessionDek ?? (await unwrapDekFromHandle(handleClient, tx.payload.amountHandle));
    const parsed = await decryptJson<TransactionPlaintext>(
      tx.payload.ciphertext,
      tx.payload.iv,
      dek,
    );
    return plaintextToDecrypted(parsed);
  }

  const { value } = await handleClient.decrypt(tx.payload.amountHandle);
  const raw =
    typeof value === "bigint" ? value : BigInt(value as string | number);
  return {
    amount: formatAmountForToken(raw, tx.token),
    amountRaw: raw.toString(),
    memo: tx.memo,
    token: tx.token,
    txType: tx.txType,
    counterparty: tx.counterparty,
    noxTxHash: tx.noxTxHash,
  };
}

export async function decryptDisclosureSecret(
  handleClient: HandleClient,
  disclosure: AuditorDisclosureView,
  sessionDek?: Uint8Array,
): Promise<DecryptedDisclosure> {
  if (!disclosure.isPrivate) {
    return {
      kind: "transaction",
      parentKey: disclosure.parentKey,
      grantee: disclosure.grantee,
      auditorLabel: disclosure.auditorLabel,
      amountHandle: disclosure.payload.amountHandle,
      txType: disclosure.txType,
      token: disclosure.token,
      counterparty: disclosure.counterparty,
    };
  }

  if (!disclosure.payload.ciphertext || !disclosure.payload.iv) {
    throw new Error("No encrypted disclosure payload");
  }

  const dek =
    sessionDek ??
    (await unwrapDekFromHandle(handleClient, disclosure.payload.amountHandle));

  const parsed = await decryptJson<DisclosurePlaintext>(
    disclosure.payload.ciphertext,
    disclosure.payload.iv,
    dek,
  );
  return {
    kind: parsed.kind ?? "transaction",
    parentKey: parsed.parentKey,
    grantee: parsed.grantee,
    auditorLabel: parsed.auditorLabel,
    amountHandle: parsed.amountHandle,
    txType: parsed.txType ?? "transfer",
    token: parsed.token ?? "—",
    counterparty: parsed.counterparty ?? "",
    noteTitle: parsed.noteTitle,
  };
}


export { grantNoxViewer } from "@/lib/nox-acl";

export async function createAuditorDisclosure(
  ownerViem: WalletClient,
  ownerArkiv: ArkivWalletClient,
  ownerHandle: HandleClient,
  tx: TokenTransactionView,
  auditor: `0x${string}`,
  auditorLabel = "Auditor",
  amountHandle: `0x${string}` = tx.payload.amountHandle,
  txPlain?: TransactionPlaintext,
): Promise<{ entityKey: `0x${string}`; disclosureDek: Uint8Array }> {
  const meta =
    txPlain ??
    (tx.isPrivate
      ? undefined
      : ({
          txType: tx.txType,
          token: tx.token,
          counterparty: tx.counterparty,
        } as Pick<TransactionPlaintext, "txType" | "token" | "counterparty">));

  const txType = meta?.txType ?? tx.txType;
  const token = meta?.token ?? tx.token;
  const counterparty = meta?.counterparty ?? tx.counterparty;

  const disclosureDek = generateDek();
  const plaintext: DisclosurePlaintext = {
    kind: "transaction",
    parentKey: tx.entityKey,
    grantee: auditor.toLowerCase(),
    auditorLabel,
    amountHandle,
    txType,
    token,
    counterparty,
  };
  const { ciphertext, iv } = await encryptJson(plaintext, disclosureDek);
  const { handle: dekHandle } = await ownerHandle.encryptInput(
    dekToUint256(disclosureDek),
    "uint256",
    NOX_COMPUTE_ADDRESS,
  );

  const disclosureHandle = dekHandle as `0x${string}`;

  const { entityKey } = await createEntityResilient(ownerArkiv, {
    payload: jsonToPayload({
      v: 3,
      amountHandle: disclosureHandle,
      wrap: "dek" as const,
      ciphertext,
      iv,
      alg: "AES-256-GCM" as const,
    }),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: ENTITY_TYPES.disclosure },
      { key: "parentKind", value: PARENT_KINDS.transaction },
      { key: "granteeHash", value: granteeHash(auditor) },
      { key: "parentKeyHash", value: parentKeyHash(tx.entityKey) },
    ],
    expiresIn: ENTITY_EXPIRES_IN,
  });

  try {
    await grantNoxViewer(ownerViem, disclosureHandle, auditor);
  } catch {
    /* auditor may still rely on amount share handle ACL */
  }

  return { entityKey: entityKey as `0x${string}`, disclosureDek };
}

export async function shareTransactionWithAuditor(
  ownerViem: WalletClient,
  ownerArkiv: ArkivWalletClient,
  ownerHandle: HandleClient,
  tx: TokenTransactionView,
  auditor: `0x${string}`,
  options?: {
    auditorLabel?: string;
    /** Required for DEK-wrapped txs — re-encrypts amount for Nox sharing */
    sessionDek?: Uint8Array;
    amount?: string;
  },
): Promise<ShareWithAuditorResult> {
  if (!isConfidentialTxType(tx.txType) || tx.payload.public) {
    throw new Error(
      "Wrap and unwrap are public on-chain — selective disclosure applies to confidential transfers only",
    );
  }

  let shareHandle = tx.payload.amountHandle;
  let txPlain: TransactionPlaintext | undefined;

  if (options?.sessionDek && tx.payload.ciphertext && tx.payload.iv) {
    txPlain = await decryptJson<TransactionPlaintext>(
      tx.payload.ciphertext,
      tx.payload.iv,
      options.sessionDek,
    );
    const amount = options.amount ?? txPlain.amount;
    const amountRaw = parseAmountForToken(amount, txPlain.token);
    const { handle } = await ownerHandle.encryptInput(
      amountRaw,
      "uint256",
      NOX_COMPUTE_ADDRESS,
    );
    shareHandle = handle as `0x${string}`;
  } else if (!tx.isPrivate) {
    txPlain = {
      txType: tx.txType,
      token: tx.token,
      counterparty: tx.counterparty,
      amount: "",
      amountRaw: "",
      memo: "",
      created: tx.createdAt,
      noxTxHash: tx.noxTxHash,
    };
  }

  let noxAclGranted = false;
  try {
    await grantNoxViewer(ownerViem, shareHandle, auditor);
    noxAclGranted = true;
  } catch {
    /* encrypt-only handles may not allow addViewer — Arkiv disclosure still indexes grant */
  }

  const { entityKey: disclosureEntityKey, disclosureDek } =
    await createAuditorDisclosure(
      ownerViem,
      ownerArkiv,
      ownerHandle,
      tx,
      auditor,
      options?.auditorLabel ?? "Auditor",
      shareHandle,
      txPlain,
    );

  return {
    amountHandle: shareHandle,
    noxAclGranted,
    disclosureEntityKey,
    revokeContext: {
      grantee: auditor,
      shareHandle,
      parentKey: tx.entityKey,
      disclosureDek,
    },
  };
}

export async function createAuditorRevocation(
  ownerArkiv: WalletArkivClient,
  grantee: `0x${string}`,
  shareHandle: `0x${string}`,
  parentKey: string,
): Promise<void> {
  await createEntityResilient(ownerArkiv, {
    payload: jsonToPayload({
      v: 1,
      shareHandle: shareHandle.toLowerCase(),
      parentKey: parentKey.toLowerCase(),
      revokedAt: Date.now(),
    }),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: ENTITY_TYPES.revocation },
      { key: "granteeHash", value: granteeHash(grantee) },
      { key: "shareHandleHash", value: shareHandleHash(shareHandle) },
      { key: "parentKeyHash", value: parentKeyHash(parentKey) },
    ],
    expiresIn: ENTITY_EXPIRES_IN,
  });
}

export type RevokeAuditorResult = {
  arkivTxHash: `0x${string}`;
  noxRevoked: boolean;
  noxTxHashes: `0x${string}`[];
  noxSkipped: boolean;
};

/** Known grant fields when v3 disclosure ciphertext cannot be decrypted via Nox yet. */
export type RevokeAuditorContext = {
  grantee: `0x${string}`;
  shareHandle: `0x${string}`;
  parentKey: string;
  disclosureDek?: Uint8Array;
};

export type ShareWithAuditorResult = {
  amountHandle: `0x${string}`;
  noxAclGranted: boolean;
  disclosureEntityKey: `0x${string}`;
  revokeContext: RevokeAuditorContext;
};

/** Revoke Nox viewer ACL (when supported) + Arkiv revocation tombstone + delete disclosure. */
export async function revokeAuditorAccess(
  ownerViem: WalletClient,
  ownerArkiv: WalletArkivClient,
  ownerHandle: HandleClient,
  disclosure: AuditorDisclosureView,
  context?: RevokeAuditorContext,
): Promise<RevokeAuditorResult> {
  let grantee: `0x${string}`;
  let shareHandle: `0x${string}`;
  let parentKey: string;

  if (context?.grantee) {
    grantee = context.grantee.toLowerCase() as `0x${string}`;
    shareHandle = context.shareHandle;
    parentKey = context.parentKey;
  } else if (disclosure.isPrivate) {
    const plain = await decryptDisclosureSecret(
      ownerHandle,
      disclosure,
      context?.disclosureDek,
    );
    grantee = plain.grantee.toLowerCase() as `0x${string}`;
    shareHandle = plain.amountHandle;
    parentKey = plain.parentKey;
  } else {
    grantee = disclosure.grantee.toLowerCase() as `0x${string}`;
    shareHandle = disclosure.payload.amountHandle;
    parentKey = disclosure.parentKey;
  }

  const handles: `0x${string}`[] = [
    shareHandle,
    disclosure.payload.amountHandle,
  ];

  const { revoked: noxTxHashes, skipped: noxSkipped } = await revokeNoxViewers(
    ownerViem,
    handles,
    grantee,
  );

  await createAuditorRevocation(ownerArkiv, grantee, shareHandle, parentKey);

  const { txHash: arkivTxHash } = await ownerArkiv.deleteEntity({
    entityKey: disclosure.entityKey as Hex,
  });

  return {
    arkivTxHash,
    noxRevoked: noxTxHashes.length > 0,
    noxTxHashes,
    noxSkipped,
  };
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function waitForDisclosure(
  auditor: `0x${string}`,
  parentKey: string,
  ownerHandle?: HandleClient,
  owner?: `0x${string}`,
  attempts = 12,
  delayMs = 5_000,
): Promise<AuditorDisclosureView> {
  const pHash = parentKeyHash(parentKey);

  for (let i = 0; i < attempts; i++) {
    const auditorList = await fetchDisclosuresForAuditor(auditor);
    for (const d of auditorList) {
      if (d.parentKey === parentKey || d.parentKeyHash === pHash) return d;
    }

    if (owner) {
      const ownerList = await fetchDisclosuresForOwner(owner);
      const hit = ownerList.find((d) => d.parentKeyHash === pHash);
      if (hit) return hit;
    }

    if (ownerHandle) {
      const ownerList = owner
        ? await fetchDisclosuresForOwner(owner)
        : auditorList;
      for (const d of ownerList) {
        if (!d.isPrivate) continue;
        try {
          const plain = await decryptDisclosureSecret(ownerHandle, d);
          if (plain.parentKey === parentKey) return d;
        } catch {
          /* not ready */
        }
      }
    }

    await sleep(delayMs);
  }
  throw new Error(`Disclosure not indexed for ${auditor} / ${parentKey}`);
}

export {
  fetchDisclosuresForAuditor,
  fetchDisclosuresForOwner,
  fetchMyTransactions,
  fetchRevokedShareHandleHashes,
  fetchTransactionByKey,
  isShareHandleRevoked,
} from "@/lib/ledger-queries";
export { supportsRemoveViewer, isNoxViewer } from "@/lib/nox-acl";
