/**
 * Arkivox Node E2E
 *
 *   npm run test:e2e:smoke   → OWNER_PRIVATE_KEY
 *   npm run test:e2e         → OWNER + GRANTEE_PRIVATE_KEY
 *   npm run test:e2e:all     → smoke then full
 *
 * Fund both networks per wallet:
 *   Arbitrum Sepolia ETH — Nox
 *   Arkiv Braga GLM      — https://braga.hoodi.arkiv.network/faucet/
 */
import "dotenv/config";
import { runFull } from "./e2e/full";
import { runSmoke } from "./e2e/smoke";
import { loadKey } from "./e2e/utils";

async function main() {
  console.log("Arkivox — Node E2E\n");

  const args = process.argv.slice(2);
  const runAll = args.includes("--all");

  if (runAll) {
    await runSmoke(loadKey("OWNER_PRIVATE_KEY"));
    console.log("");
    await runFull(loadKey("OWNER_PRIVATE_KEY"), loadKey("GRANTEE_PRIVATE_KEY"));
    return;
  }

  if (args.includes("--smoke")) {
    await runSmoke(loadKey("OWNER_PRIVATE_KEY"));
    return;
  }

  await runFull(loadKey("OWNER_PRIVATE_KEY"), loadKey("GRANTEE_PRIVATE_KEY"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
