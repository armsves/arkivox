import { isAddress, type Hex } from "viem";
import {
  createArkivWalletFromPrivateKey,
  createHandleClient,
  createViemWalletFromPrivateKey,
  decryptTransactionSecret,
  fetchDisclosuresForAuditor,
  fetchDisclosuresForOwner,
  fetchRevokedShareHandleHashes,
  fetchTransactionByKey,
  isShareHandleRevoked,
  recordTokenTransaction,
  revokeAuditorAccess,
  shareTransactionWithAuditor,
  waitForDisclosure,
} from "../../lib/ledger-operations";
import { E2E, assert, fail, log, sleep } from "./utils";

async function revealWithRetry(
  handleClient: Awaited<ReturnType<typeof createHandleClient>>,
  tx: Parameters<typeof decryptTransactionSecret>[1],
  attempts = 6,
) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await decryptTransactionSecret(handleClient, tx);
    } catch (e) {
      lastErr = e;
      await sleep(E2E.teeCooldownMs);
    }
  }
  throw lastErr;
}

/** Two keys: record → share → auditor reveal → revoke → tombstone blocks grantee. */
export async function runFull(ownerKey: Hex, granteeKey: Hex) {
  log("setup", "full — 2 keys (OWNER_PRIVATE_KEY + GRANTEE_PRIVATE_KEY)");
  const ownerViem = createViemWalletFromPrivateKey(ownerKey);
  const granteeViem = createViemWalletFromPrivateKey(granteeKey);
  const ownerArkiv = createArkivWalletFromPrivateKey(ownerKey);
  const ownerHandle = await createHandleClient(ownerViem);
  const granteeHandle = await createHandleClient(granteeViem);
  const granteeAddr = granteeViem.account!.address as `0x${string}`;
  const ownerAddr = ownerArkiv.account!.address as `0x${string}`;

  assert(isAddress(granteeAddr), "bad GRANTEE address");
  assert(
    ownerAddr.toLowerCase() !== granteeAddr.toLowerCase(),
    "OWNER and GRANTEE must be different wallets",
  );

  log("1/8", "record confidential tx");
  const { entityKey, transaction } = await recordTokenTransaction(
    ownerArkiv,
    {
      txType: "transfer",
      token: E2E.token,
      counterparty: E2E.counterparty,
      amount: E2E.amount,
      memo: "arkivox e2e full",
    },
    { viem: ownerViem, handle: ownerHandle },
  );
  log("2/8", "owner reveal (Nox gateway)");
  assert(
    (await revealWithRetry(ownerHandle, transaction)).amount === E2E.amount,
    "owner reveal failed",
  );

  log("3/8", "grantee blocked before disclosure");
  await sleep(E2E.teeCooldownMs);
  let blocked = false;
  try {
    await decryptTransactionSecret(granteeHandle, transaction);
  } catch {
    blocked = true;
  }
  assert(blocked, "Grantee should not decrypt before share");

  log("4/8", "share with grantee (Nox ACL + Arkiv auditor_disclosure)");
  const shareResult = await shareTransactionWithAuditor(
    ownerViem,
    ownerArkiv,
    ownerHandle,
    transaction,
    granteeAddr,
    { auditorLabel: "E2E grantee", amount: E2E.amount },
  );
  const { amountHandle: shareHandle, noxAclGranted, revokeContext } = shareResult;
  log("nox-acl", noxAclGranted ? "granted" : "skipped (encrypt-only handle)");

  log("5/8", "grantee sees disclosure on Arkiv");
  const disclosure = await waitForDisclosure(
    granteeAddr,
    entityKey,
    ownerHandle,
    ownerAddr,
  );
  log("disclosure", disclosure.entityKey);

  log("6/8", "grantee reveals amount");
  await sleep(E2E.teeCooldownMs);
  const parent = await fetchTransactionByKey(entityKey);
  if (!parent) fail("parent tx missing after share");

  let dec: Awaited<ReturnType<typeof decryptTransactionSecret>> | null = null;
  if (noxAclGranted) {
    try {
      dec = await revealWithRetry(granteeHandle, {
        ...parent,
        payload: { ...parent.payload, amountHandle: shareHandle },
      });
    } catch {
      /* fall through */
    }
  }
  if (!dec) fail("grantee reveal failed — Nox ACL required");
  assert(dec.amount === E2E.amount, "grantee amount mismatch");

  let grants = await fetchDisclosuresForAuditor(granteeAddr);
  assert(grants.some((g) => g.entityKey === disclosure.entityKey), "disclosure not indexed");

  log("7/8", "owner revokes grantee access");
  const revokeResult = await revokeAuditorAccess(
    ownerViem,
    ownerArkiv,
    ownerHandle,
    disclosure,
    revokeContext,
  );
  log(
    "revoke",
    `arkiv=${revokeResult.arkivTxHash.slice(0, 10)}… nox=${revokeResult.noxRevoked ? "ok" : revokeResult.noxSkipped ? "skipped" : "none"}`,
  );

  log("8/8", "revocation tombstone + disclosure removed");
  await sleep(E2E.indexWaitMs);
  const revokedHashes = await fetchRevokedShareHandleHashes(granteeAddr);
  assert(
    isShareHandleRevoked(revokedHashes, shareHandle),
    "share handle not in revocation index",
  );

  grants = await fetchDisclosuresForAuditor(granteeAddr);
  assert(
    !grants.some((g) => g.entityKey === disclosure.entityKey),
    "disclosure still visible to grantee after revoke",
  );

  const ownerGrants = await fetchDisclosuresForOwner(ownerAddr);
  assert(
    !ownerGrants.some((g) => g.entityKey === disclosure.entityKey),
    "disclosure still in owner list after delete",
  );

  if (noxAclGranted) {
    let noxBlocked = false;
    try {
      await decryptTransactionSecret(granteeHandle, {
        ...parent,
        payload: { ...parent.payload, amountHandle: shareHandle },
      });
    } catch {
      noxBlocked = true;
    }
    assert(noxBlocked, "grantee should not Nox-decrypt after revoke");
  }

  console.log("\n✓ Full E2E passed (record → share → reveal → revoke)");
}
