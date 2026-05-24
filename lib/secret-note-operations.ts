/**
 * Encrypted arbitrary text on Arkiv + Nox DEK handles (same model as confidential txs).
 */
import { jsonToPayload } from "@arkiv-network/sdk/utils";
import type { HandleClient } from "@iexec-nox/handle";
import type { WalletClient } from "viem";
import {
  ENTITY_EXPIRES_IN,
  ENTITY_TYPES,
  PARENT_KINDS,
  PROJECT_ATTRIBUTE,
} from "@/lib/arkiv";
import { dekToUint256, generateDek, sha256Hex, uint256ToDek } from "@/lib/crypto";
import {
  decryptJson,
  encryptJson,
  granteeHash,
  parentKeyHash,
  type DisclosurePlaintext,
  type SecretNotePlaintext,
} from "@/lib/ledger-secrets";
import { grantNoxViewer } from "@/lib/nox-acl";
import { NOX_COMPUTE_ADDRESS } from "@/lib/nox";
import type { ArkivWalletClient } from "@/lib/ledger-operations";
import type { DecryptedSecretNote, SecretNoteView } from "@/lib/types";
import { fetchSecretNoteByKey } from "@/lib/secret-note-queries";

export type ShareSecretNoteResult = {
  amountHandle: `0x${string}`;
  noxAclGranted: boolean;
  disclosureEntityKey: string;
  revokeContext: {
    grantee: `0x${string}`;
    shareHandle: `0x${string}`;
    parentKey: string;
    disclosureDek: Uint8Array;
  };
};

export interface RecordSecretNoteInput {
  title: string;
  body: string;
  label?: string;
}

/** Nox encrypt — must run while the wallet is on Arbitrum Sepolia. */
export type PreparedSecretNote = {
  title: string;
  label: string;
  created: number;
  sessionDek: Uint8Array;
  outerPayload: {
    v: 3;
    title: string;
    label: string;
    created: number;
    amountHandle: `0x${string}`;
    wrap: "dek";
    ciphertext: string;
    iv: string;
    alg: "AES-256-GCM";
  };
};

export async function prepareSecretNoteEncryption(
  ownerHandle: HandleClient,
  input: RecordSecretNoteInput,
): Promise<PreparedSecretNote> {
  const title = input.title.trim() || "Untitled note";
  const body = input.body.trim();
  if (!body) throw new Error("Note body cannot be empty");

  const created = Date.now();
  const plaintext: SecretNotePlaintext = {
    title,
    body,
    label: input.label?.trim() ?? "",
    created,
  };

  const sessionDek = generateDek();
  const { ciphertext, iv } = await encryptJson(plaintext, sessionDek);

  const { handle: dekHandle } = await ownerHandle.encryptInput(
    dekToUint256(sessionDek),
    "uint256",
    NOX_COMPUTE_ADDRESS,
  );
  const amountHandle = dekHandle as `0x${string}`;

  return {
    title,
    label: plaintext.label,
    created,
    sessionDek,
    outerPayload: {
      v: 3,
      title,
      label: plaintext.label,
      created,
      amountHandle,
      wrap: "dek",
      ciphertext,
      iv,
      alg: "AES-256-GCM",
    },
  };
}

export async function publishSecretNote(
  ownerArkiv: ArkivWalletClient,
  prepared: PreparedSecretNote,
): Promise<{
  entityKey: string;
  note: SecretNoteView;
  sessionDek: Uint8Array;
}> {
  const ownerAddress = ownerArkiv.account?.address;
  if (!ownerAddress) throw new Error("Arkiv wallet has no account");

  void sha256Hex(JSON.stringify(prepared.outerPayload));

  const { entityKey } = await ownerArkiv.createEntity({
    payload: jsonToPayload(prepared.outerPayload),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: ENTITY_TYPES.encryptedNote },
    ],
    expiresIn: ENTITY_EXPIRES_IN,
  });

  const { amountHandle, ciphertext, iv } = prepared.outerPayload;
  const note: SecretNoteView = {
    entityKey,
    title: prepared.title,
    label: prepared.label,
    owner: ownerAddress,
    createdAt: prepared.created,
    payload: {
      v: 3,
      amountHandle,
      wrap: "dek",
      ciphertext,
      iv,
      alg: "AES-256-GCM",
    },
    isPrivate: true,
  };

  return { entityKey, note, sessionDek: prepared.sessionDek };
}

export async function recordSecretNote(
  ownerArkiv: ArkivWalletClient,
  ownerHandle: HandleClient,
  input: RecordSecretNoteInput,
  nox?: { viem: WalletClient },
): Promise<{
  entityKey: string;
  note: SecretNoteView;
  sessionDek: Uint8Array;
}> {
  if (!nox) {
    throw new Error("Arbitrum Sepolia wallet required to encrypt with Nox");
  }
  void nox.viem;
  const prepared = await prepareSecretNoteEncryption(ownerHandle, input);
  return publishSecretNote(ownerArkiv, prepared);
}

export async function decryptSecretNoteWithSessionDek(
  note: SecretNoteView,
  sessionDek: Uint8Array,
): Promise<DecryptedSecretNote> {
  const parsed = await decryptJson<SecretNotePlaintext>(
    note.payload.ciphertext,
    note.payload.iv,
    sessionDek,
  );
  return {
    title: parsed.title,
    body: parsed.body,
    label: parsed.label,
    created: parsed.created,
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

export async function decryptSecretNoteSecret(
  handleClient: HandleClient | null,
  note: SecretNoteView,
  sessionDek?: Uint8Array,
): Promise<DecryptedSecretNote> {
  if (sessionDek) {
    return decryptSecretNoteWithSessionDek(note, sessionDek);
  }
  if (!handleClient) {
    throw new Error("Nox handle client required to decrypt this note");
  }
  const dek = await unwrapDekFromHandle(handleClient, note.payload.amountHandle);
  return decryptSecretNoteWithSessionDek(note, dek);
}

export type PreparedSecretNoteShare = {
  shareHandle: `0x${string}`;
  noxAclGranted: boolean;
  parentKey: string;
  auditor: `0x${string}`;
  disclosureDek: Uint8Array;
  disclosureHandle: `0x${string}`;
  entityPayload: {
    v: 3;
    amountHandle: `0x${string}`;
    wrap: "dek";
    ciphertext: string;
    iv: string;
    alg: "AES-256-GCM";
  };
  entityAttributes: { key: string; value: string }[];
};

export async function prepareShareSecretNote(
  ownerViem: WalletClient,
  ownerHandle: HandleClient,
  note: SecretNoteView,
  auditor: `0x${string}`,
  options?: {
    auditorLabel?: string;
    sessionDek?: Uint8Array;
  },
): Promise<PreparedSecretNoteShare> {
  const shareHandle = note.payload.amountHandle;
  let notePlain: SecretNotePlaintext | undefined;

  if (options?.sessionDek) {
    notePlain = await decryptJson<SecretNotePlaintext>(
      note.payload.ciphertext,
      note.payload.iv,
      options.sessionDek,
    );
  }

  let noxAclGranted = false;
  try {
    await grantNoxViewer(ownerViem, shareHandle, auditor);
    noxAclGranted = true;
  } catch {
    /* encrypt-only handles may not allow addViewer */
  }

  const disclosureDek = generateDek();
  const plaintext: DisclosurePlaintext = {
    kind: "secret_note",
    parentKey: note.entityKey,
    grantee: auditor.toLowerCase(),
    auditorLabel: options?.auditorLabel ?? "Recipient",
    amountHandle: shareHandle,
    noteTitle: notePlain?.title ?? note.title,
    txType: "transfer",
    token: "—",
    counterparty: "",
  };
  const { ciphertext, iv } = await encryptJson(plaintext, disclosureDek);
  const { handle: dekHandle } = await ownerHandle.encryptInput(
    dekToUint256(disclosureDek),
    "uint256",
    NOX_COMPUTE_ADDRESS,
  );
  const disclosureHandle = dekHandle as `0x${string}`;

  return {
    shareHandle,
    noxAclGranted,
    parentKey: note.entityKey,
    auditor,
    disclosureDek,
    disclosureHandle,
    entityPayload: {
      v: 3,
      amountHandle: disclosureHandle,
      wrap: "dek",
      ciphertext,
      iv,
      alg: "AES-256-GCM",
    },
    entityAttributes: [
      { key: "entityType", value: ENTITY_TYPES.disclosure },
      { key: "parentKind", value: PARENT_KINDS.note },
      { key: "granteeHash", value: granteeHash(auditor) },
      { key: "parentKeyHash", value: parentKeyHash(note.entityKey) },
    ],
  };
}

export async function publishShareSecretNote(
  ownerViem: WalletClient,
  ownerArkiv: ArkivWalletClient,
  prepared: PreparedSecretNoteShare,
): Promise<ShareSecretNoteResult> {
  const { entityKey } = await ownerArkiv.createEntity({
    payload: jsonToPayload(prepared.entityPayload),
    contentType: "application/json",
    attributes: [PROJECT_ATTRIBUTE, ...prepared.entityAttributes],
    expiresIn: ENTITY_EXPIRES_IN,
  });

  try {
    await grantNoxViewer(ownerViem, prepared.disclosureHandle, prepared.auditor);
  } catch {
    /* optional */
  }

  return {
    amountHandle: prepared.shareHandle,
    noxAclGranted: prepared.noxAclGranted,
    disclosureEntityKey: entityKey,
    revokeContext: {
      grantee: prepared.auditor,
      shareHandle: prepared.shareHandle,
      parentKey: prepared.parentKey,
      disclosureDek: prepared.disclosureDek,
    },
  };
}

export async function shareSecretNoteWithAuditor(
  ownerViem: WalletClient,
  ownerArkiv: ArkivWalletClient,
  ownerHandle: HandleClient,
  note: SecretNoteView,
  auditor: `0x${string}`,
  options?: {
    auditorLabel?: string;
    sessionDek?: Uint8Array;
  },
): Promise<ShareSecretNoteResult> {
  const prepared = await prepareShareSecretNote(
    ownerViem,
    ownerHandle,
    note,
    auditor,
    options,
  );
  return publishShareSecretNote(ownerViem, ownerArkiv, prepared);
}

export async function decryptSharedSecretNote(
  handleClient: HandleClient,
  disclosureMeta: DisclosurePlaintext,
): Promise<DecryptedSecretNote> {
  const note = await fetchSecretNoteByKey(disclosureMeta.parentKey);
  if (!note) throw new Error("Parent note not found on Arkiv");

  const dek = await unwrapDekFromHandle(handleClient, disclosureMeta.amountHandle);
  return decryptSecretNoteWithSessionDek(note, dek);
}
