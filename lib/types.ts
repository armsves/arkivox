export type TxType = "transfer" | "wrap" | "unwrap";

export type PayloadVersion = 2 | 3;

/** On-chain Arkiv payload */
export interface TransactionSecretPayload {
  v: PayloadVersion;
  amountHandle: `0x${string}`;
  /** v3: "dek" = handle wraps DEK; "amount" = handle is Nox amount from cToken */
  wrap?: "dek" | "amount";
  /** When wrap=amount: Nox DEK handle for Arkiv ciphertext (committed on HandleRegistry) */
  dekHandle?: `0x${string}`;
  /** Public wrap/unwrap reference — no Nox encryption */
  public?: boolean;
  amount?: string;
  amountRaw?: string;
  ciphertext?: string;
  iv?: string;
  alg?: "AES-256-GCM";
}

export interface AuditorDisclosurePayload {
  v: PayloadVersion;
  amountHandle: `0x${string}`;
  wrap?: "dek";
  ciphertext?: string;
  iv?: string;
  alg?: "AES-256-GCM";
}

export interface TokenTransactionView {
  entityKey: string;
  /** Populated for v2 or after decrypt; placeholders for v3 */
  txType: TxType;
  token: string;
  counterparty: string;
  owner: string;
  createdAt: number;
  noxTxHash: string | null;
  contentHash: string;
  memo: string;
  payload: TransactionSecretPayload;
  /** v3 — ciphertext on Arkiv; v2 public wrap/unwrap may omit ciphertext */
  isPrivate: boolean;
  /** Set for public wrap/unwrap ledger rows (amount visible without Nox) */
  amount?: string;
  amountRaw?: string;
}

export interface AuditorDisclosureView {
  entityKey: string;
  parentKey: string;
  parentKeyHash?: string;
  parentKind: "token_transaction" | "encrypted_note";
  grantee: string;
  granteeHash?: string;
  auditorLabel: string;
  txType: TxType;
  token: string;
  counterparty: string;
  payload: AuditorDisclosurePayload;
  isPrivate: boolean;
}

export interface SecretNotePayload {
  v: 3;
  amountHandle: `0x${string}`;
  wrap: "dek";
  ciphertext: string;
  iv: string;
  alg: "AES-256-GCM";
}

export interface SecretNoteView {
  entityKey: string;
  title: string;
  label: string;
  owner: string;
  createdAt: number;
  payload: SecretNotePayload;
  isPrivate: true;
}

export interface DecryptedSecretNote {
  title: string;
  body: string;
  label: string;
  created: number;
}

export interface DecryptedTransaction {
  amount: string;
  amountRaw: string;
  memo: string;
  token: string;
  txType: TxType;
  counterparty: string;
  noxTxHash: string | null;
}

export interface DecryptedDisclosure {
  kind: "transaction" | "secret_note";
  parentKey: string;
  grantee: string;
  auditorLabel: string;
  amountHandle: `0x${string}`;
  txType: TxType;
  token: string;
  counterparty: string;
  noteTitle?: string;
}

/** @deprecated legacy vault types */
export type ConfidentialRecordPayload = TransactionSecretPayload & {
  dekHandle?: `0x${string}`;
};
export type VaultRecordView = TokenTransactionView & { label: string };
export type VaultGrantView = AuditorDisclosureView & { label: string };
export type AccessGrantPayload = AuditorDisclosurePayload;
