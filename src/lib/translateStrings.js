import { base44 } from '@/api/base44Client';

// Shared AI translation of the app's fixed English strings (never learner
// text, never official civics answers).
// - Asks once: screens that want the same strings in the same language at the
//   same time share one request instead of each sending their own.
// - Splits big sets into chunks sent together, so a long list comes back
//   about as fast as a short one, and shows each chunk as it arrives.
// - Remembers results in memory for this visit and in browser storage
//   (device only) under the caller's storage key.

export const CHUNK_SIZE = 15;

const memory = new Map(); // storageKey -> complete translation
const inflight = new Map(); // storageKey -> { promise, partial, listeners }

function readStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;
  }
}

function writeStorage(storageKey, value) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
    // ignore: storage full or blocked
  }
}

// A finished translation for this key, from memory or browser storage, or null.
export function getCachedTranslation(storageKey) {
  if (memory.has(storageKey)) return memory.get(storageKey);
  const stored = readStorage(storageKey);
  if (stored) memory.set(storageKey, stored);
  return stored;
}

export function chunkKeys(keys, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < keys.length; i += size) chunks.push(keys.slice(i, i + size));
  return chunks;
}

const defaultInvoke = (args) => base44.integrations.Core.InvokeLLM(args);

// Translates `strings` ({ key: English }) with prompts from `buildPrompt(chunk)`.
// Resolves with { key: translated } for every key that came back; rejects
// only when nothing came back. `onPartial(sofar)` is called as chunks arrive.
// Saved to browser storage only when complete, so missing pieces are retried
// next time.
export function translateStrings({ storageKey, strings, buildPrompt, onPartial, invoke = defaultInvoke }) {
  const cached = getCachedTranslation(storageKey);
  if (cached) return Promise.resolve(cached);

  let entry = inflight.get(storageKey);
  if (!entry) {
    const keys = Object.keys(strings);
    entry = { partial: {}, listeners: new Set() };
    const runChunk = async (chunk) => {
      const part = Object.fromEntries(chunk.map((k) => [k, strings[k]]));
      const result = await invoke({
        prompt: buildPrompt(part),
        response_json_schema: {
          type: 'object',
          properties: Object.fromEntries(chunk.map((k) => [k, { type: 'string' }])),
          required: chunk,
        },
      });
      let got = 0;
      chunk.forEach((k) => {
        if (result && typeof result[k] === 'string' && result[k].trim()) {
          entry.partial[k] = result[k];
          got += 1;
        }
      });
      if (got) {
        const sofar = { ...entry.partial };
        entry.listeners.forEach((fn) => fn(sofar));
      }
    };
    entry.promise = Promise.allSettled(chunkKeys(keys).map(runChunk)).then(() => {
      inflight.delete(storageKey);
      const done = { ...entry.partial };
      if (!Object.keys(done).length) throw new Error('Translation failed');
      if (keys.every((k) => k in done)) {
        memory.set(storageKey, done);
        writeStorage(storageKey, done);
      }
      return done;
    });
    inflight.set(storageKey, entry);
  }

  if (onPartial) {
    entry.listeners.add(onPartial);
    if (Object.keys(entry.partial).length) onPartial({ ...entry.partial });
    const remove = () => entry.listeners.delete(onPartial);
    entry.promise.then(remove, remove);
  }
  return entry.promise;
}

// For tests.
export function resetTranslationCache() {
  memory.clear();
  inflight.clear();
}
