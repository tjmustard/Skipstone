// Skipstone Main Application Entry Point
import './assets/styles.css';
import { globalStateMachine, type AppState } from './core/state';
import { globalSoundEngine } from './core/audio';
import { BUILT_IN_DECKS } from './data/registry';
import type { DeckCatalog } from './data/types';
import { createHeader } from './ui/components/Header';
import { createDeckSelectorView } from './ui/views/DeckSelectorView';
import { createBriefingView } from './ui/views/BriefingView';
import { createSplitGameView } from './ui/views/SplitGameView';
import { createProgressionModal } from './ui/components/ProgressionModal';
import { createGroundingCheckoutView } from './ui/views/GroundingCheckoutView';
import { showToast } from './ui/components/Toast';
import {
  getCustomDecks,
  saveCustomDeck,
  deleteCustomDeck,
  readCustomDeckFile,
  exportDeckToJson,
} from './core/indexeddb';

let activeViewCleanup: (() => void) | null = null;
let customDecks: DeckCatalog[] = [];

// Service Worker Registration
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Skipstone] New content available passively on next restart.');
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('[Skipstone] Service worker registration failed:', err);
      });
    });
  }
}

// Privacy Blur Shield for OS App Switcher (visibilitychange)
export function initPrivacyShield(): void {
  const shield = document.getElementById('privacy-shield');
  if (!shield) return;

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      shield.classList.remove('hidden');
    } else {
      shield.classList.add('hidden');
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const raw = window.sessionStorage.getItem('skipstone_ephemeral_session');
          if (raw) {
            const session = JSON.parse(raw);
            session.lastActiveTimestamp = Date.now();
            window.sessionStorage.setItem('skipstone_ephemeral_session', JSON.stringify(session));
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('blur', () => shield.classList.remove('hidden'));
  window.addEventListener('focus', () => shield.classList.add('hidden'));
}

// Chromatic Visual Pulse Callback for iOS Silent Switch
export function initVisualPulse(): void {
  globalSoundEngine.onVisualPulse = () => {
    const cardContainer = document.getElementById('game-card-container');
    if (cardContainer) {
      cardContainer.classList.remove('chromatic-pulse');
      void cardContainer.offsetWidth; // trigger reflow
      cardContainer.classList.add('chromatic-pulse');
    }
  };
}

export function setCustomDecks(decks: DeckCatalog[]): void {
  customDecks = decks;
}

// Hidden File Input Handler for Custom Deck Import
function setupCustomDeckImport(): void {
  let fileInput = document.getElementById('custom-deck-file-input') as HTMLInputElement;
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'custom-deck-file-input';
    fileInput.accept = '.json,application/json';
    fileInput.className = 'hidden';
    document.body.appendChild(fileInput);
  }

  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const customDeck = await readCustomDeckFile(file);
      await saveCustomDeck(customDeck);
      customDecks = await getCustomDecks();
      showToast(`Imported custom deck "${customDeck.title}" (${customDeck.prompts.length} cards)`, 4000);
      renderApp(globalStateMachine.getState());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import custom deck.';
      showToast(`Error: ${message}`, 5000);
    } finally {
      fileInput.value = ''; // reset input
    }
  };
}

export function renderApp(state: AppState): void {
  const appEl = document.getElementById('app');
  if (!appEl) return;

  // Cleanup existing view listeners
  if (activeViewCleanup) {
    activeViewCleanup();
    activeViewCleanup = null;
  }

  appEl.innerHTML = '';

  // Render Header
  const header = createHeader(state);
  appEl.appendChild(header);

  // Render View Body
  const mainContent = document.createElement('main');
  mainContent.className = 'flex-1 flex flex-col min-h-0 overflow-hidden relative';

  if (state.view === 'DECK_SELECT') {
    const selector = createDeckSelectorView({
      customDecks,
      onImportDeckClick: () => {
        const fileInput = document.getElementById('custom-deck-file-input') as HTMLInputElement;
        if (fileInput) fileInput.click();
      },
      onExportDeck: (deck) => exportDeckToJson(deck),
      onDeleteDeck: async (id) => {
        await deleteCustomDeck(id);
        customDecks = await getCustomDecks();
        showToast('Custom deck deleted.', 3000);
        renderApp(globalStateMachine.getState());
      },
    });
    mainContent.appendChild(selector);
  } else if (state.view === 'BRIEFING' && state.currentDeck) {
    const briefing = createBriefingView(state.currentDeck);
    mainContent.appendChild(briefing);
  } else if (state.view === 'IN_SESSION' && state.activeCard) {
    const { element, cleanup } = createSplitGameView(state);
    activeViewCleanup = cleanup;
    mainContent.appendChild(element);

    if (state.isRecycled) {
      showToast('Deck pool exhausted — reshuffled tier prompts.', 3500);
    }
  } else if (state.view === 'PROGRESSION_MODAL' && state.activeCard) {
    const { element, cleanup } = createSplitGameView(state);
    activeViewCleanup = cleanup;
    mainContent.appendChild(element);

    const modal = createProgressionModal(state);
    mainContent.appendChild(modal);
  } else if (state.view === 'GROUNDING_CHECKOUT') {
    const checkout = createGroundingCheckoutView(state);
    mainContent.appendChild(checkout);
  }

  appEl.appendChild(mainContent);
}

export async function initApp(): Promise<void> {
  registerServiceWorker();
  initPrivacyShield();
  initVisualPulse();
  setupCustomDeckImport();

  // Load custom decks from IndexedDB
  try {
    customDecks = await getCustomDecks();
  } catch (err) {
    console.warn('[Skipstone] Failed to initialize custom decks:', err);
  }

  // Restore session if active
  const allAvailableDecks = [...customDecks, ...BUILT_IN_DECKS];
  const restored = globalStateMachine.tryRestoreSession(allAvailableDecks);
  if (restored) {
    showToast('Restored active conversation session.', 2500);
  }

  globalStateMachine.subscribe((state) => {
    renderApp(state);
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initApp());
  } else {
    void initApp();
  }
}
