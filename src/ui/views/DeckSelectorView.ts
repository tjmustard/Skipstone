import type { DeckCatalog } from '../../data/types';
import { BUILT_IN_DECKS } from '../../data/registry';
import { globalStateMachine } from '../../core/state';

export interface DeckSelectorProps {
  customDecks: DeckCatalog[];
  onImportDeckClick?: () => void;
  onExportDeck?: (deck: DeckCatalog) => void;
  onDeleteDeck?: (deckId: string) => void;
}

export function createDeckSelectorView(props: DeckSelectorProps): HTMLElement {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-y-auto px-4 py-6 max-w-4xl mx-auto';

  // Hero Section
  const hero = document.createElement('div');
  hero.className = 'text-center mb-6 sm:mb-8';

  const title = document.createElement('h1');
  title.className = 'font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2';
  title.textContent = 'Skipstone';
  hero.appendChild(title);

  const tagline = document.createElement('p');
  tagline.className = 'text-sm sm:text-base text-slate-400 max-w-md mx-auto';
  tagline.textContent = 'A mindful pass-and-play conversational intimacy experience. 100% offline, zero data retention.';
  hero.appendChild(tagline);

  container.appendChild(hero);

  // Actions Bar (Import Custom Deck)
  const actionsBar = document.createElement('div');
  actionsBar.className = 'flex items-center justify-between gap-3 mb-6 flex-wrap';

  const sectionLabel = document.createElement('h2');
  sectionLabel.className = 'text-xs font-bold uppercase tracking-wider text-slate-400';
  sectionLabel.textContent = 'Select a Conversational Deck';
  actionsBar.appendChild(sectionLabel);

  if (props.onImportDeckClick) {
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-750/70 rounded-xl transition-all shadow-sm';
    importBtn.textContent = '＋ Import Custom Deck (.json)';
    importBtn.onclick = props.onImportDeckClick;
    actionsBar.appendChild(importBtn);
  }

  container.appendChild(actionsBar);

  // Deck Grid
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 pb-12';

  const allDecks = [...props.customDecks, ...BUILT_IN_DECKS];

  allDecks.forEach((deck) => {
    const card = document.createElement('div');
    card.className = 'group relative flex flex-col justify-between p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-850/90 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-950/20';

    // Click handler for card
    card.onclick = (e) => {
      // Don't select deck if clicking delete or export buttons
      if ((e.target as HTMLElement).closest('.deck-action-btn')) return;
      globalStateMachine.selectDeck(deck);
    };

    // Card Header
    const cardTop = document.createElement('div');
    cardTop.className = 'flex items-start justify-between gap-2 mb-3';

    const titleGroup = document.createElement('div');
    const deckTitle = document.createElement('h3');
    deckTitle.className = 'font-display font-bold text-lg text-white group-hover:text-indigo-300 transition-colors';
    deckTitle.textContent = deck.title; // strict textContent
    titleGroup.appendChild(deckTitle);

    if (deck.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'text-xs text-slate-400 font-medium mt-0.5';
      subtitle.textContent = deck.subtitle;
      titleGroup.appendChild(subtitle);
    }
    cardTop.appendChild(titleGroup);

    const badge = document.createElement('span');
    badge.className = `px-2 py-0.5 text-[11px] font-semibold rounded-full border shrink-0 ${
      deck.isCustom
        ? 'bg-purple-950/60 text-purple-300 border-purple-800/80'
        : 'bg-slate-800 text-slate-300 border-slate-700'
    }`;
    badge.textContent = deck.badge || `${deck.prompts.length} Cards`;
    cardTop.appendChild(badge);

    card.appendChild(cardTop);

    // Card Description
    const desc = document.createElement('p');
    desc.className = 'text-xs text-slate-300/90 leading-relaxed mb-4 line-clamp-2';
    desc.textContent = deck.description;
    card.appendChild(desc);

    // Card Footer
    const cardBottom = document.createElement('div');
    cardBottom.className = 'flex items-center justify-between pt-3 border-t border-slate-800/60 text-[11px] text-slate-400';

    const modeSpan = document.createElement('span');
    modeSpan.textContent = deck.defaultPassAction === 'pass_partner' ? '👥 Dyadic (Pair)' : '🔄 Group Circle (Left)';
    cardBottom.appendChild(modeSpan);

    if (deck.isCustom) {
      const customActions = document.createElement('div');
      customActions.className = 'flex items-center gap-2';

      if (props.onExportDeck) {
        const expBtn = document.createElement('button');
        expBtn.type = 'button';
        expBtn.className = 'deck-action-btn text-indigo-400 hover:text-indigo-200 underline';
        expBtn.textContent = 'Export';
        expBtn.onclick = (e) => {
          e.stopPropagation();
          props.onExportDeck!(deck);
        };
        customActions.appendChild(expBtn);
      }

      if (props.onDeleteDeck) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'deck-action-btn text-rose-400 hover:text-rose-200 underline';
        delBtn.textContent = 'Delete';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete custom deck "${deck.title}"?`)) {
            props.onDeleteDeck!(deck.id);
          }
        };
        customActions.appendChild(delBtn);
      }

      cardBottom.appendChild(customActions);
    }

    card.appendChild(cardBottom);
    grid.appendChild(card);
  });

  container.appendChild(grid);

  return container;
}
