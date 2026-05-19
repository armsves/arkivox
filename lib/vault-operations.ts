/** @deprecated Use @/lib/ledger-operations — re-exports for scripts */
export {
  createArkivWalletFromPrivateKey,
  createHandleClient,
  createViemWalletFromPrivateKey,
  fetchDisclosuresForAuditor as fetchGrantsForGrantee,
  fetchMyTransactions as fetchMyRecords,
  fetchTransactionByKey as fetchRecordByKey,
  recordTokenTransaction,
  shareTransactionWithAuditor,
  revokeAuditorAccess,
  decryptTransactionSecret,
  grantNoxViewer,
  createAuditorDisclosure,
  sleep,
  waitForDisclosure,
  type RecordTransactionInput,
} from "@/lib/ledger-operations";
