function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function generateDek(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function dekToBytes32Hex(dek: Uint8Array): `0x${string}` {
  if (dek.length !== 32) throw new Error("DEK must be 32 bytes");
  return `0x${Array.from(dek)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

export function bytes32HexToDek(hex: `0x${string}`): Uint8Array {
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (raw.length !== 64) throw new Error("Invalid bytes32 hex");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Nox encryptInput only supports uint256 — pack 32-byte DEK for confidential wrap */
export function dekToUint256(dek: Uint8Array): bigint {
  if (dek.length !== 32) throw new Error("DEK must be 32 bytes");
  let v = 0n;
  for (const b of dek) v = (v << 8n) | BigInt(b);
  return v;
}

export function uint256ToDek(value: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

export async function encryptPayload(
  plaintext: string,
  dek: Uint8Array,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw",
    dek.buffer.slice(dek.byteOffset, dek.byteOffset + dek.byteLength) as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    ciphertext: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
  };
}

export async function decryptPayload(
  ciphertext: string,
  iv: string,
  dek: Uint8Array,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    dek.buffer.slice(dek.byteOffset, dek.byteOffset + dek.byteLength) as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const ivBytes = new Uint8Array(fromBase64(iv));
  const cipherBytes = new Uint8Array(fromBase64(ciphertext));
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    cipherBytes,
  );
  return new TextDecoder().decode(plain);
}

export async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
