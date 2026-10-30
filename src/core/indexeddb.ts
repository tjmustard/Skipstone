import type { DeckCatalog } from '../data/types';
import { validateCustomDeck } from '../data/validator';

const DB_NAME = 'skipstone_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_decks';
export const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB ceiling

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCustomDecks(): Promise<DeckCatalog[]> {
  try {
    const db = await openDatabase();
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] getCustomDecks error:', err);
    return [];
  }
}

export async function saveCustomDeck(deck: DeckCatalog): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(deck);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomDeck(deckId: string): Promise<void> {
  const db = await openDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(deckId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Reads and validates a custom deck file under 1MB.
 */
export async function readCustomDeckFile(file: File): Promise<DeckCatalog> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(file.size / 1024).toFixed(1)} KB) exceeds the 1MB payload ceiling.`);
  }

  const text = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('File content is not valid JSON.');
  }

  const result = validateCustomDeck(json);
  if (!result.valid || !result.deck) {
    throw new Error(`Invalid custom deck schema: ${result.errors.join(' ')}`);
  }

  return result.deck;
}

/**
 * Exports a deck to a downloadable JSON file.
 */
export function exportDeckToJson(deck: DeckCatalog): void {
  const data = JSON.stringify(deck, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
