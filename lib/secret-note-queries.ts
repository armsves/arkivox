import { eq } from "@arkiv-network/sdk/query";
import { arkivPublicClient } from "@/lib/arkiv-client";
import {
  ENTITY_TYPES,
  isProjectScopedEntity,
  projectScopePredicate,
} from "@/lib/arkiv";
import type { SecretNotePayload, SecretNoteView } from "@/lib/types";

type ArkivEntity = {
  key: string;
  owner?: string;
  createdAtBlock?: bigint;
  attributes: { key: string; value: string | number | boolean }[];
  toJson: () => unknown;
};

function blockTime(entity: ArkivEntity): number {
  return entity.createdAtBlock ? Number(entity.createdAtBlock) : 0;
}

function parseSecretNote(entity: ArkivEntity): SecretNoteView | null {
  try {
    if (!isProjectScopedEntity(entity.attributes)) return null;

    const json = entity.toJson() as {
      v?: number;
      title?: string;
      label?: string;
      created?: number;
      amountHandle?: `0x${string}`;
      dekHandle?: `0x${string}`;
      ciphertext?: string;
      iv?: string;
      alg?: "AES-256-GCM";
      wrap?: "dek";
    };

    const amountHandle = json.amountHandle ?? json.dekHandle;
    if (!amountHandle || json.v !== 3 || !json.ciphertext || !json.iv) {
      return null;
    }

    return {
      entityKey: entity.key,
      title: json.title ?? "Encrypted note",
      label: json.label ?? "",
      owner: entity.owner ?? "",
      createdAt: json.created ?? blockTime(entity),
      payload: {
        v: 3,
        amountHandle,
        wrap: "dek",
        ciphertext: json.ciphertext,
        iv: json.iv,
        alg: json.alg ?? "AES-256-GCM",
      },
      isPrivate: true,
    };
  } catch {
    return null;
  }
}

export async function fetchMySecretNotes(
  owner: `0x${string}`,
): Promise<SecretNoteView[]> {
  const result = await arkivPublicClient
    .buildQuery()
    .where([
      projectScopePredicate(),
      eq("entityType", ENTITY_TYPES.encryptedNote),
    ])
    .ownedBy(owner)
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)
    .limit(100)
    .fetch();

  return result.entities
    .map((e) => parseSecretNote(e as ArkivEntity))
    .filter((n): n is SecretNoteView => n !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchSecretNoteByKey(
  entityKey: string,
): Promise<SecretNoteView | null> {
  const entity = await arkivPublicClient.getEntity(entityKey as `0x${string}`);
  return parseSecretNote(entity as ArkivEntity);
}
