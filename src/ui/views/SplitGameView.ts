import type { AppState, StateMachine } from '../../core/state';
import { globalStateMachine } from '../../core/state';
import { GestureHandler } from '../../core/gestures';

export const TIER_PROGRESSION_COLORS = {
  1: {
    hex: '#5eead4', // teal-300
    classes: 'bg-teal-950/80 hover:bg-teal-900/90 text-teal-300 border-teal-700/80 shadow-teal-950/40',
  },
  2: {
    hex: '#fcd34d', // amber-300
    classes: 'bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border-amber-700/80 shadow-amber-950/40',
  },
  3: {
    hex: '#6ee7b7', // emerald-300
    classes: 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-700/80 shadow-emerald-950/40',
  },
} as const;

export function createSplitGameView(
  state: AppState,
  stateMachine: StateMachine = globalStateMachine
): { element: HTMLElement; cleanup: () => void } {
  const card = state.activeCard;
  if (!card) {
    const fallback = document.createElement('div');
    fallback.textContent = 'No card active.';
    return { element: fallback, cleanup: () => {} };
  }

  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col justify-between p-3 sm:p-5 max-w-lg mx-auto overflow-hidden select-none';

  // Dynamic Tier Accent Theme
  const tierColor =
    state.currentTier === 1
      ? {
          speakerBg: 'bg-slate-900/90 border-blue-900/60 shadow-blue-950/20',
          badge: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
          accent: 'text-blue-400',
          tierName: 'Level 1: Warm Up',
        }
      : state.currentTier === 2
      ? {
          speakerBg: 'bg-stone-900/90 border-amber-900/60 shadow-amber-950/20',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
          accent: 'text-amber-400',
          tierName: 'Level 2: Vulnerability',
        }
      : {
          speakerBg: 'bg-zinc-900/90 border-rose-900/60 shadow-rose-950/20',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
          accent: 'text-rose-400',
          tierName: 'Level 3: Core Truths',
        };

  // Card Outer Container (with chromatic pulse class support)
  const cardFrame = document.createElement('div');
  cardFrame.id = 'game-card-container';
  cardFrame.className = 'flex-1 flex flex-col gap-3 min-h-0 w-full chromatic-pulse';

  // ==========================================
  // TOP ZONE: SPEAKER ZONE (Reading Aloud)
  // ==========================================
  const speakerZone = document.createElement('div');
  speakerZone.className = `flex-1 flex flex-col justify-between p-5 sm:p-6 rounded-2xl border backdrop-blur-md shadow-xl transition-all duration-300 overflow-hidden ${tierColor.speakerBg}`;

  // Speaker Header
  const speakerHeader = document.createElement('div');
  speakerHeader.className = 'flex items-center justify-between gap-2 shrink-0 mb-2';

  const tierBadge = document.createElement('span');
  tierBadge.className = `px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${tierColor.badge}`;
  tierBadge.textContent = tierColor.tierName;
  speakerHeader.appendChild(tierBadge);

  if (card.type === 'wildcard') {
    const wildcardBadge = document.createElement('span');
    wildcardBadge.className = 'px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 animate-pulse';
    wildcardBadge.textContent = '★ Wildcard';
    speakerHeader.appendChild(wildcardBadge);
  }

  speakerZone.appendChild(speakerHeader);

  // Speaker Prompt Content
  const speakerBody = document.createElement('div');
  speakerBody.className = 'flex-1 flex items-center justify-center py-2 text-center overflow-hidden';

  const speakerText = document.createElement('p');
  // Responsive font clamp to prevent internal scrolling down to 320px
  speakerText.className = 'font-display font-medium text-slate-100 text-base sm:text-xl md:text-2xl leading-snug tracking-normal';
  speakerText.textContent = card.speakerPrompt; // strict textContent
  speakerBody.appendChild(speakerText);

  speakerZone.appendChild(speakerBody);

  // Speaker Pass Instruction
  const passFooter = document.createElement('div');
  passFooter.className = 'shrink-0 flex items-center justify-center pt-2 text-center';

  const passPill = document.createElement('span');
  passPill.className = 'text-[11px] font-semibold text-slate-400 bg-slate-950/40 px-3 py-1 rounded-full border border-slate-800/80';
  passPill.textContent = card.passAction === 'pass_partner' ? 'Speak aloud, then pass to partner' : 'Speak aloud, then pass to your left';
  passFooter.appendChild(passPill);

  speakerZone.appendChild(passFooter);
  cardFrame.appendChild(speakerZone);

  // ==========================================
  // BOTTOM ZONE: ACTIVE LISTENER ZONE
  // ==========================================
  const listenerZone = document.createElement('div');
  listenerZone.className = 'h-36 sm:h-40 flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-800/90 bg-slate-950/80 backdrop-blur-md shadow-lg shrink-0 transition-all duration-300 overflow-hidden';

  // Listener Header
  const listenerHeader = document.createElement('div');
  listenerHeader.className = 'flex items-center justify-between shrink-0 mb-1';

  const listenerLabel = document.createElement('span');
  listenerLabel.className = 'text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5';
  listenerLabel.textContent = '👂 Active Listener Coaching';
  listenerHeader.appendChild(listenerLabel);

  const cardCounter = document.createElement('span');
  cardCounter.className = 'text-[11px] text-slate-500 font-mono';
  cardCounter.textContent = `Card #${state.cardsAnsweredInTier}`;
  listenerHeader.appendChild(cardCounter);

  listenerZone.appendChild(listenerHeader);

  // Listener Guidance Text
  const listenerBody = document.createElement('div');
  listenerBody.className = 'flex-1 flex items-center overflow-hidden';

  const listenerText = document.createElement('p');
  listenerText.className = 'text-xs sm:text-sm text-slate-300 italic leading-relaxed';
  listenerText.textContent = card.listenerPrompt; // strict textContent
  listenerBody.appendChild(listenerText);

  listenerZone.appendChild(listenerBody);
  cardFrame.appendChild(listenerZone);

  container.appendChild(cardFrame);

  // Bottom Navigation & Gesture Instruction Bar
  const isProgressionUnlocked =
    (state.currentTier < 3 && stateMachine.getHasShownProgressionForTier()) ||
    (state.currentTier === 3 && state.cardsAnsweredInTier >= 4);

  const navBar = document.createElement('div');

  // 1-Step Undo Button
  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.disabled = !state.previousCard;
  undoBtn.textContent = '↩ Previous Card';
  undoBtn.onclick = (e) => {
    e.stopPropagation();
    stateMachine.previousCard();
  };

  // Advance Hint / Button
  const advanceBtn = document.createElement('button');
  advanceBtn.type = 'button';
  advanceBtn.textContent = 'Next Card →';
  advanceBtn.onclick = () => {
    stateMachine.nextCard();
  };

  if (!isProgressionUnlocked) {
    navBar.className = 'flex items-center justify-between pt-3 pb-1 shrink-0 text-xs text-slate-400';

    undoBtn.className = `inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
      state.previousCard
        ? 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800'
        : 'border-slate-800/40 bg-slate-950/20 text-slate-600 cursor-not-allowed'
    }`;
    advanceBtn.className = 'inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium transition-colors';

    navBar.appendChild(undoBtn);
    navBar.appendChild(advanceBtn);
  } else {
    navBar.className = 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 pb-1 shrink-0 text-xs text-slate-400 items-center';

    undoBtn.className = `order-2 sm:order-1 inline-flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border text-xs font-medium transition-colors ${
      state.previousCard
        ? 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800'
        : 'border-slate-800/40 bg-slate-950/20 text-slate-600 cursor-not-allowed'
    }`;

    advanceBtn.className = 'order-3 sm:order-3 inline-flex items-center justify-center gap-1 px-4 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-medium transition-colors';

    const progressionTheme = TIER_PROGRESSION_COLORS[state.currentTier];
    const progressionLabel =
      state.currentTier === 1
        ? 'Advance to Level 2 →'
        : state.currentTier === 2
        ? 'Advance to Level 3 →'
        : 'Complete Session →';

    const progressionBtn = document.createElement('button');
    progressionBtn.type = 'button';
    progressionBtn.id = 'progression-action-btn';
    progressionBtn.setAttribute('role', 'button');
    progressionBtn.setAttribute('aria-label', progressionLabel);
    progressionBtn.setAttribute('aria-live', 'polite');
    progressionBtn.className = `col-span-2 sm:col-span-1 order-1 sm:order-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border font-semibold text-xs transition-all active:scale-95 shadow-md ${progressionTheme.classes}`;
    progressionBtn.textContent = progressionLabel;

    let isTransitioning = false;
    progressionBtn.onclick = (e) => {
      e.stopPropagation();
      if (isTransitioning || progressionBtn.disabled) return;
      isTransitioning = true;
      progressionBtn.disabled = true;

      if (state.currentTier === 3) {
        stateMachine.startGroundingCheckout();
      } else {
        stateMachine.advanceTier();
      }

      setTimeout(() => {
        isTransitioning = false;
        progressionBtn.disabled = false;
      }, 400);
    };

    navBar.appendChild(undoBtn);
    navBar.appendChild(progressionBtn);
    navBar.appendChild(advanceBtn);
  }

  container.appendChild(navBar);

  // Initialize Gesture Listener on cardFrame
  const gestures = new GestureHandler(cardFrame, {
    onNext: () => stateMachine.nextCard(),
    onPrevious: () => stateMachine.previousCard(),
    onToggleSound: () => stateMachine.toggleSound(),
  });

  return {
    element: container,
    cleanup: () => gestures.detach(),
  };
}
