import { globalStateMachine, type AppState } from '../../core/state';
import type { TierLevel } from '../../data/types';

export function createHeader(state: AppState): HTMLElement {
  const header = document.createElement('header');
  header.className = 'w-full px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md z-30 shrink-0';

  // Left Section
  const leftGroup = document.createElement('div');
  leftGroup.className = 'flex items-center gap-2 min-w-0';

  if (state.view !== 'DECK_SELECT') {
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors';
    backBtn.setAttribute('aria-label', 'Return to decks');
    backBtn.textContent = '←';
    backBtn.onclick = () => {
      if (state.view === 'IN_SESSION' || state.view === 'PROGRESSION_MODAL') {
        if (confirm('Leave current session and return to deck selection?')) {
          globalStateMachine.quitToDeckSelect();
        }
      } else {
        globalStateMachine.quitToDeckSelect();
      }
    };
    leftGroup.appendChild(backBtn);
  }

  const titleEl = document.createElement('span');
  titleEl.className = 'font-display font-semibold text-sm sm:text-base text-slate-100 truncate max-w-[140px] sm:max-w-[200px]';
  titleEl.textContent = state.currentDeck?.title || 'Skipstone';
  leftGroup.appendChild(titleEl);

  header.appendChild(leftGroup);

  // Center Section: Tier Badge / Selector (when in session or progression modal)
  if (state.view === 'IN_SESSION' || state.view === 'PROGRESSION_MODAL') {
    const tierPill = document.createElement('div');
    tierPill.className = 'flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-full text-xs font-medium text-slate-300';

    const tiers: { level: TierLevel; label: string }[] = [
      { level: 1, label: 'L1' },
      { level: 2, label: 'L2' },
      { level: 3, label: 'L3' }
    ];

    tiers.forEach((t) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = state.currentTier === t.level;
      btn.className = `px-1.5 py-0.5 rounded-full transition-colors text-[11px] ${
        isActive
          ? t.level === 1
            ? 'bg-blue-600 text-white font-bold'
            : t.level === 2
            ? 'bg-amber-600 text-white font-bold'
            : 'bg-rose-600 text-white font-bold'
          : 'text-slate-400 hover:text-slate-200'
      }`;
      btn.textContent = t.label;
      btn.title = `Switch to Level ${t.level}`;
      btn.onclick = () => {
        if (state.currentTier !== t.level) {
          globalStateMachine.setTier(t.level);
        }
      };
      tierPill.appendChild(btn);
    });

    header.appendChild(tierPill);
  }

  // Right Section: Audio Toggle & Finish Button
  const rightGroup = document.createElement('div');
  rightGroup.className = 'flex items-center gap-2';

  const soundBtn = document.createElement('button');
  soundBtn.type = 'button';
  soundBtn.className = 'p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors text-sm';
  soundBtn.setAttribute('aria-label', state.soundEnabled ? 'Mute audio' : 'Unmute audio');
  soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
  soundBtn.onclick = () => globalStateMachine.toggleSound();
  rightGroup.appendChild(soundBtn);

  if (state.view === 'IN_SESSION' || state.view === 'PROGRESSION_MODAL') {
    const finishBtn = document.createElement('button');
    finishBtn.type = 'button';
    finishBtn.className = 'px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition-colors';
    finishBtn.textContent = 'Finish';
    finishBtn.onclick = () => globalStateMachine.startGroundingCheckout();
    rightGroup.appendChild(finishBtn);
  }

  header.appendChild(rightGroup);

  return header;
}
