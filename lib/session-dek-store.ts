/** Session DEKs for owner reveal (memory + localStorage for same-browser reload). */
const store = new Map<string, Uint8Array>();
const LS_PREFIX = "arkivox-dek-v1:";

function storageKey(entityKey: string): string {
  return LS_PREFIX + entityKey.toLowerCase();
}

function persistDek(entityKey: string, dek: Uint8Array) {
  if (typeof localStorage === "undefined") return;
  try {
    const b64 = btoa(String.fromCharCode(...dek));
    localStorage.setItem(storageKey(entityKey), b64);
  } catch {
    /* quota / private mode */
  }
}

function loadPersistedDek(entityKey: string): Uint8Array | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const b64 = localStorage.getItem(storageKey(entityKey));
    if (!b64) return undefined;
    const bin = atob(b64);
    const dek = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) dek[i] = bin.charCodeAt(i);
    return dek;
  } catch {
    return undefined;
  }
}

export function setSessionDek(entityKey: string, dek: Uint8Array) {
  store.set(entityKey, dek);
  persistDek(entityKey, dek);
}

export function getSessionDek(entityKey: string): Uint8Array | undefined {
  const mem = store.get(entityKey);
  if (mem) return mem;
  const persisted = loadPersistedDek(entityKey);
  if (persisted) store.set(entityKey, persisted);
  return persisted;
}

export function clearSessionDek(entityKey: string) {
  store.delete(entityKey);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(storageKey(entityKey));
    } catch {
      /* ignore */
    }
  }
}
