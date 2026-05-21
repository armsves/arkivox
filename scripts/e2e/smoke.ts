import type { Hex } from "viem";
import {
  createArkivWalletFromPrivateKey,
  createHandleClient,
  createViemWalletFromPrivateKey,
  decryptWithSessionDek,
  fetchMyTransactions,
  fetchTransactionByKey,
  recordTokenTransaction,
} from "../../lib/ledger-operations";
import { E2E, assert, log, sleep } from "./utils";

/** One key: record → index → fetch → owner reveal (session DEK). */
export async function runSmoke(ownerKey: Hex) {
  log("setup", "smoke — 1 key (OWNER_PRIVATE_KEY)");
  const ownerViem = createViemWalletFromPrivateKey(ownerKey);
  const ownerArkiv = createArkivWalletFromPrivateKey(ownerKey);
  const ownerHandle = await createHandleClient(ownerViem);
  const ownerAddr = ownerArkiv.account!.address as `0x${string}`;

  log("1/4", "record token_transaction (Arkiv v3 + Nox DEK handle)");
  const { entityKey, transaction, sessionDek } = await recordTokenTransaction(
    ownerArkiv,
    {
      txType: "transfer",
      token: E2E.token,
      counterparty: E2E.counterparty,
      amount: E2E.amount,
      memo: "arkivox e2e smoke",
    },
    { viem: ownerViem, handle: ownerHandle },
  );
  assert(!!sessionDek, "Expected session DEK from record");

  log("2/4", "query ledger (wait for Arkiv index)");
  await sleep(E2E.indexWaitMs);
  const list = await fetchMyTransactions(ownerAddr);
  assert(list.some((t) => t.entityKey === entityKey), "Tx not in owner query");

  log("3/4", "fetch by entity key");
  const fetched = await fetchTransactionByKey(entityKey);
  assert(fetched !== null, "fetchTransactionByKey returned null");
  assert(
    (await decryptWithSessionDek(fetched!, sessionDek!)).token === E2E.token,
    "Private payload token mismatch after fetch",
  );

  log("4/4", "owner reveal amount (session DEK — same as UI after record)");
  const dec = await decryptWithSessionDek(transaction, sessionDek!);
  assert(dec.amount === E2E.amount, `Amount mismatch: got ${dec.amount}`);

  console.log("\n✓ Smoke passed (1 private key)");
}
