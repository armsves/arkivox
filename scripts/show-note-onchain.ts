/**
 * Print raw on-chain Arkiv payload for encrypted notes.
 * Usage: npx tsx scripts/show-note-onchain.ts [entityKey]
 *        npx tsx scripts/show-note-onchain.ts  — lists recent notes
 */
import "dotenv/config";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arkivPublicClient } from "../lib/arkiv-client";
import { BRAGA_EXPLORER } from "../lib/arkiv";
import { fetchMySecretNotes } from "../lib/secret-note-queries";

async function printEntity(entityKey: string) {
  const entity = await arkivPublicClient.getEntity(entityKey as Hex);
  const payload = entity.toJson() as Record<string, unknown>;
  const attrs = entity.attributes.map((a) => ({ key: a.key, value: a.value }));

  console.log(`\n${"=".repeat(72)}`);
  console.log("ENCRYPTED NOTE (encrypted_note)");
  console.log("=".repeat(72));
  console.log("entityKey:", entity.key);
  console.log("owner:", entity.owner);
  console.log("\n── Attributes (public index fields) ──");
  console.log(JSON.stringify(attrs, null, 2));
  console.log("\n── Payload on Braga (ciphertext + Nox handle — NOT plaintext) ──");
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\nExplorer (entity): ${BRAGA_EXPLORER}/entity/${entity.key}`);
  console.log(`Explorer (payload tab): ${BRAGA_EXPLORER}/entity/${entity.key}?tab=payload`);
}

async function main() {
  const arg = process.argv[2]?.trim();

  if (arg) {
    await printEntity(arg.startsWith("0x") ? arg : `0x${arg}`);
    return;
  }

  const pk = process.env.OWNER_PRIVATE_KEY?.trim();
  if (!pk) throw new Error("Set OWNER_PRIVATE_KEY or pass entityKey");

  const owner = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as Hex,
  ).address;
  const notes = await fetchMySecretNotes(owner);
  if (notes.length === 0) {
    console.log("No notes found for", owner);
    return;
  }

  console.log("Your notes (newest first):");
  for (const n of notes) {
    console.log(`  ${n.entityKey}  title="${n.title}"`);
  }
  await printEntity(notes[0]!.entityKey);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
