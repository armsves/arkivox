/**
 * Encode Arkiv createEntity calldata (RLP + brotli) for gas estimation.
 * Mirrors @arkiv-network/sdk utils/arkivTransactions + compression.
 */
import type { CreateEntityParameters } from "@arkiv-network/sdk";
import { toBytes, toHex, toRlp, type Hex } from "viem";

const BLOCK_TIME = 2;
export const ARKIV_SYSTEM_ADDRESS =
  "0x00000000000000000000000000000061726b6976" as const;

function formatAttribute<T extends string | number | bigint | boolean>(attribute: {
  key: string;
  value: T;
}): [Hex, Hex] {
  return [
    toHex(attribute.key),
    toHex(
      typeof attribute.value === "number" && attribute.value === 0
        ? ""
        : attribute.value,
    ),
  ];
}

export function encodeCreateEntityRlp(data: CreateEntityParameters): Hex {
  const payload = [
    [
      [
        toHex(Math.ceil(data.expiresIn / BLOCK_TIME)),
        toHex(data.contentType),
        toHex(data.payload),
        data.attributes
          .filter((a) => typeof a.value === "string")
          .map(formatAttribute),
        data.attributes
          .filter((a) => typeof a.value === "number")
          .map(formatAttribute),
      ],
    ],
    [],
    [],
    [],
    [],
  ];
  return toRlp(payload);
}

export async function compressArkivCalldata(rlpHex: Hex): Promise<Hex> {
  const raw = toBytes(rlpHex);
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      const zlib = await import("zlib");
      const compressed = zlib.brotliCompressSync(Buffer.from(raw));
      return toHex(new Uint8Array(compressed));
    } catch {
      /* fall through */
    }
  }
  const brotliModule = await import("brotli-wasm");
  const brotli = (brotliModule.default
    ? await brotliModule.default
    : brotliModule) as { compress: (d: Uint8Array) => Uint8Array };
  return toHex(brotli.compress(raw));
}

export async function encodeCreateEntityCalldata(
  data: CreateEntityParameters,
): Promise<Hex> {
  return compressArkivCalldata(encodeCreateEntityRlp(data));
}
