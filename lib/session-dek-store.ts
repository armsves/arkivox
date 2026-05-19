/** In-memory DEKs for owner reveal after record (browser session only). */
const store = new Map<string, Uint8Array>();

export function setSessionDek(entityKey: string, dek: Uint8Array) {
  store.set(entityKey, dek);
}

export function getSessionDek(entityKey: string): Uint8Array | undefined {
  return store.get(entityKey);
}

export function clearSessionDek(entityKey: string) {
  store.delete(entityKey);
}
