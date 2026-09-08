import type { EciDataset } from "./types";

const STORAGE_KEY = "ac34-matiala-eci-dataset-v1";

// Simple pub/sub so useSyncExternalStore can react to same-tab writes
// (native "storage" events only fire in *other* tabs).
const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}

export function subscribeEciDataset(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveEciDataset(dataset: EciDataset) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    notify();
  } catch (e) {
    // localStorage can throw if quota exceeded; surface to caller via console,
    // the UI still works for the current session using in-memory state.
    console.error("Failed to save ECI dataset to localStorage", e);
  }
}

// Cache the parsed object and only re-parse when the raw string actually
// changes, so useSyncExternalStore doesn't see a "new" object every render.
let cachedRaw: string | null | undefined;
let cachedValue: EciDataset | null = null;

export function getEciDatasetSnapshot(): EciDataset | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to load ECI dataset from localStorage", e);
    return null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as EciDataset) : null;
  } catch (e) {
    console.error("Failed to parse ECI dataset from localStorage", e);
    cachedValue = null;
  }
  return cachedValue;
}

export function getEciDatasetServerSnapshot(): EciDataset | null {
  return null;
}

export function clearEciDataset() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notify();
}
