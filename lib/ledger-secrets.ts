import { keccak256, toBytes } from "viem";
import type { TxType } from "@/lib/arkiv";
import { decryptPayload, encryptPayload } from "@/lib/crypto";

/** Hashed grantee for Arkiv queries — address not stored in attributes. */
export function granteeHash(grantee: string): `0x${string}` {
  return keccak256(toBytes(grantee.toLowerCase()));
}

export function parentKeyHash(parentKey: string): `0x${string}` {
  return keccak256(toBytes(parentKey.toLowerCase()));
}

export function shareHandleHash(handle: string): `0x${string}` {
  return keccak256(toBytes(handle.toLowerCase()));
}

export interface TransactionPlaintext {
  txType: TxType;
  token: string;
  counterparty: string;
  amount: string;
  amountRaw: string;
  memo: string;
  created: number;
  noxTxHash: string | null;
}

export interface DisclosurePlaintext {
  kind: "transaction" | "secret_note";
  parentKey: string;
  grantee: string;
  auditorLabel: string;
  amountHandle: `0x${string}`;
  txType?: TxType;
  token?: string;
  counterparty?: string;
  noteTitle?: string;
}

export interface SecretNotePlaintext {
  title: string;
  body: string;
  label: string;
  created: number;
}

export async function encryptJson<T>(data: T, dek: Uint8Array) {
  return encryptPayload(JSON.stringify(data), dek);
}

export async function decryptJson<T>(
  ciphertext: string,
  iv: string,
  dek: Uint8Array,
): Promise<T> {
  const plain = await decryptPayload(ciphertext, iv, dek);
  return JSON.parse(plain) as T;
}
