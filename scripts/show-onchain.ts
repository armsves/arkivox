/**
 * Record one tx (or use LATEST=1) and print raw Arkiv on-chain payload + attributes.
 * Usage: npx tsx scripts/show-onchain.ts
 *        LATEST=1 npx tsx scripts/show-onchain.ts  — latest owned tx only
 */
import "dotenv/config";
import type { Hex } from "viem";
import { arkivPublicClient } from "../lib/arkiv-client";
import { BRAGA_EXPLORER } from "../lib/arkiv";
import {
  createArkivWalletFromPrivateKey,
  createHandleClient,
  createViemWalletFromPrivateKey,
  fetchDisclosuresForOwner,
  fetchMyTransactions,
  recordTokenTransaction,
} from "../lib/ledger-operations";

function loadKey(): Hex {
  const raw = process.env.OWNER_PRIVATE_KEY?.trim();
  if (!raw) throw new Error("Missing OWNER_PRIVATE_KEY in .env");
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
}

function printEntity(label: string, entityKey: string) {
  return arkivPublicClient.getEntity(entityKey as Hex).then((entity) => {
    const payload = entity.toJson() as Record<string, unknown>;
    const attrs = entity.attributes.map((a) => ({
      key: a.key,
      value: a.value,
    }));

    console.log(`\n${"=".repeat(72)}`);
    console.log(label);
    console.log("=".repeat(72));
    console.log("entityKey:", entity.key);
    console.log("owner:", entity.owner);
    console.log("createdAtBlock:", entity.createdAtBlock?.toString());
    console.log("expiresAtBlock:", entity.expiresAtBlock?.toString());
    console.log("\n── Public attributes (indexable on Arkiv) ──");
    console.log(JSON.stringify(attrs, null, 2));
    console.log("\n── Payload JSON (stored on-chain; v3 secrets are ciphertext) ──");
    console.log(JSON.stringify(payload, null, 2));
    console.log(
      `\nExplorer: ${BRAGA_EXPLORER}/entity/${entity.key}?tab=attributes`,
    );
  });
}

async function main() {
  const key = loadKey();
  const ownerArkiv = createArkivWalletFromPrivateKey(key);
  const ownerAddr = ownerArkiv.account!.address as `0x${string}`;

  let txKey: string;
  let disclosureKey: string | undefined;

  if (process.env.LATEST === "1") {
    const list = await fetchMyTransactions(ownerAddr);
    if (list.length === 0) throw new Error("No transactions found");
    txKey = list[0]!.entityKey;
    const disclosures = await fetchDisclosuresForOwner(ownerAddr);
    disclosureKey = disclosures.find(
      (d) => d.parentKeyHash || d.parentKey === txKey,
    )?.entityKey;
    console.log("Using latest transaction:", txKey);
  } else {
    console.log("Recording new token_transaction…");
    const ownerViem = createViemWalletFromPrivateKey(key);
    const ownerHandle = await createHandleClient(ownerViem);
    const { entityKey } = await recordTokenTransaction(
      ownerArkiv,
      {
        txType: "transfer",
        token: "cUSDC",
        counterparty:
          "0x0000000000000000000000000000000000000001" as `0x${string}`,
        amount: "42.5",
        memo: "onchain demo",
      },
      { viem: ownerViem, handle: ownerHandle },
    );
    txKey = entityKey;
    await new Promise((r) => setTimeout(r, 4_000));
  }

  await printEntity("TOKEN TRANSACTION (token_transaction)", txKey);

  if (disclosureKey) {
    await printEntity("AUDITOR DISCLOSURE (auditor_disclosure)", disclosureKey);
  } else if (process.env.LATEST !== "1") {
    console.log("\n(No disclosure — run full e2e or share from UI for disclosure entity)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
