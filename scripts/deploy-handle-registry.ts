/**
 * Deploy ArkivoxHandleRegistry to Arbitrum Sepolia.
 *
 * Usage:
 *   OWNER_PRIVATE_KEY=0x... npm run deploy:registry
 *
 * Prints NEXT_PUBLIC_HANDLE_REGISTRY=0x... for .env / Vercel.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const ARTIFACT = join(
  process.cwd(),
  "artifacts/foundry/ArkivoxHandleRegistry.sol/ArkivoxHandleRegistry.json",
);

async function main() {
  const pk = process.env.OWNER_PRIVATE_KEY?.trim();
  if (!pk?.startsWith("0x")) {
    throw new Error("Set OWNER_PRIVATE_KEY in .env");
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });
  const wallet = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8")) as {
    abi: readonly unknown[];
    bytecode: { object: string };
  };

  const hash = await wallet.deployContract({
    abi: artifact.abi as never,
    bytecode: artifact.bytecode.object as `0x${string}`,
    args: [],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const address = receipt.contractAddress;
  if (!address) throw new Error("Deploy failed — no contract address");

  console.log("\nArkivoxHandleRegistry deployed on Arbitrum Sepolia:");
  console.log(`  ${address}`);
  console.log("\nAdd to .env and Vercel:");
  console.log(`NEXT_PUBLIC_HANDLE_REGISTRY=${address}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
