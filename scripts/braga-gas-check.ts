/**
 * Check Braga GLM balance vs Arkiv write cost.
 * Usage: OWNER_PRIVATE_KEY=0x... npx tsx scripts/braga-gas-check.ts
 */
import "dotenv/config";
import { formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { PROJECT_ATTRIBUTE, ENTITY_TYPES } from "../lib/arkiv.js";
import {
  assertBragaFundedForWrite,
  getBragaPublicClient,
} from "../lib/braga-preflight.js";
import { estimateBragaWriteCost } from "../lib/braga-preflight.js";

async function main() {
  const pk = process.env.OWNER_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x")) throw new Error("Set OWNER_PRIVATE_KEY");

  const account = privateKeyToAccount(pk as `0x${string}`);
  const pub = getBragaPublicClient();

  const balance = await pub.getBalance({ address: account.address });
  const latest = await pub.getTransactionCount({
    address: account.address,
    blockTag: "latest",
  });
  const pending = await pub.getTransactionCount({
    address: account.address,
    blockTag: "pending",
  });

  const createParams = {
    payload: jsonToPayload({
      v: 3,
      amountHandle: `0x${"ab".repeat(32)}`,
      wrap: "dek",
      ciphertext: "x".repeat(200),
      iv: "iv",
      alg: "AES-256-GCM",
    }),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: ENTITY_TYPES.transaction },
    ],
    expiresIn: ExpirationTime.fromDays(90),
  };

  const estimate = await estimateBragaWriteCost(createParams);

  console.log("Wallet:", account.address);
  console.log("GLM balance:", formatEther(balance));
  console.log("Nonce latest / pending:", latest, pending, pending > latest ? "(STUCK)" : "");
  console.log("Estimated gas (buffered):", estimate.gas.toString());
  console.log("Estimated max tx cost:", formatEther(estimate.maxCostWei), "GLM");
  console.log("Recommended min balance:", formatEther(estimate.recommendedMinWei), "GLM");
  console.log("Sufficient for one write?", balance >= estimate.maxCostWei ? "yes" : "NO");

  try {
    await assertBragaFundedForWrite(account.address, createParams);
    console.log("assertBragaFundedForWrite: OK");
  } catch (e) {
    console.log("assertBragaFundedForWrite:", (e as Error).message);
  }

  console.log("\nArkiv SDK sends tx.value = 0 — storage is paid in GLM via gas, not as tx.value.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
