import type { Hex } from "viem";

export const E2E = {
  amount: "42.5",
  token: "cUSDC",
  counterparty: "0x0000000000000000000000000000000000000001" as `0x${string}`,
  teeCooldownMs: 2_500,
  indexWaitMs: 5_000,
} as const;

export function log(step: string, detail?: string) {
  console.log(detail ? `[${step}] ${detail}` : `[${step}]`);
}

export function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

export function assert(condition: boolean, message: string) {
  if (!condition) fail(message);
}

export function loadKey(name: string): Hex {
  const raw = process.env[name]?.trim();
  if (!raw) fail(`Missing ${name} in .env`);
  const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
  if (key.length !== 66) fail(`${name} must be 32-byte hex (0x + 64 chars)`);
  return key;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
