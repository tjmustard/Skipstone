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

  // Speaker Role Badge (Task 2)
  if (state.currentDeck?.isBilateral || card.targetRole) {
    const speakerRoleBadge = document.createElement('span');
    speakerRoleBadge.id = 'speaker-role-badge';
    if (card.type === 'wildcard' || card.targetRole === 'mutual') {
      speakerRoleBadge.className = 'px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 animate-pulse';
      speakerRoleBadge.textContent = '[Mutual - Both Answer]';
    } else {
      const activeRoleKey = state.activeRole || card.targetRole || state.currentDeck?.roleA;
      let roleLabel = 'Speaker';
      if (state.currentDeck) {
        if (activeRoleKey === state.currentDeck.roleA) {
          roleLabel = state.currentDeck.roleLabels?.roleA ?? (activeRoleKey ? activeRoleKey.charAt(0).toUpperCase() + activeRoleKey.slice(1) : 'Speaker');
        } else if (activeRoleKey === state.currentDeck.roleB) {
          roleLabel = state.currentDeck.roleLabels?.roleB ?? (activeRoleKey ? activeRoleKey.charAt(0).toUpperCase() + activeRoleKey.slice(1) : 'Speaker');
        } else if (activeRoleKey) {
          roleLabel = activeRoleKey.charAt(0).toUpperCase() + activeRoleKey.slice(1);
        }
      }
      speakerRoleBadge.className = 'px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800';
      speakerRoleBadge.textContent = `[Speaker: ${roleLabel}]`;
    }
    speakerHeader.appendChild(speakerRoleBadge);
  } else if (card.type === 'wildcard') {
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

  // ==========================================
  // BOTTOM NAVIGATION & ACTIONS BAR (Tasks 3, 4, 5)
  // ==========================================
  const isProgressionUnlocked =
    (state.currentTier < 3 && stateMachine.getHasShownProgressionForTier()) ||
    (state.currentTier === 3 && state.cardsAnsweredInTier >= 4);

  const navBar = document.createElement('div');
  navBar.id = 'nav-actions-container';

  const baseButtonClass =
    'flex-1 inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] rounded-lg border text-xs sm:text-sm font-medium transition-colors text-center whitespace-nowrap';

  // 1-Step Undo Button (Task 4)
  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.id = 'prev-card-btn';
  undoBtn.setAttribute('aria-label', 'Previous Card');
  undoBtn.disabled = !state.hasUndoAvailable;
  undoBtn.className = `${baseButtonClass} ${
    state.hasUndoAvailable
      ? 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
      : 'border-slate-800/40 bg-slate-950/20 text-slate-600 cursor-not-allowed'
  }`;
  undoBtn.innerHTML = '<span class="hidden sm:inline">↩ Previous Card</span><span class="inline sm:hidden">↩ Prev</span>';
  undoBtn.onclick = (e) => {
    e.stopPropagation();
    if (undoBtn.disabled) return;
    undoBtn.disabled = true;
    stateMachine.previousCard();
  };

  // Skip Card Button (Task 3)
  const canSkip = stateMachine.canSkip();
  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.id = 'skip-card-btn';
  skipBtn.setAttribute('aria-label', 'Skip Card');
  skipBtn.disabled = !canSkip;
  skipBtn.className = `${baseButtonClass} ${
    canSkip
      ? 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
      : 'border-slate-800/40 bg-slate-950/20 text-slate-600 cursor-not-allowed'
  }`;
  skipBtn.innerHTML = '<span class="hidden sm:inline">Skip Card ↷</span><span class="inline sm:hidden">Skip ↷</span>';
  skipBtn.onclick = (e) => {
    e.stopPropagation();
    if (skipBtn.disabled) return;
    stateMachine.skipCard();
  };

  // Next Card Button
  const advanceBtn = document.createElement('button');
  advanceBtn.type = 'button';
  advanceBtn.id = 'next-card-btn';
  advanceBtn.setAttribute('aria-label', 'Next Card');
  advanceBtn.className = `${baseButtonClass} bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/40 text-indigo-300 cursor-pointer`;
  advanceBtn.innerHTML = '<span class="hidden sm:inline">Next Card →</span><span class="inline sm:hidden">Next →</span>';
  advanceBtn.onclick = () => {
    stateMachine.nextCard();
  };

  if (!isProgressionUnlocked) {
    navBar.className = 'flex items-center justify-between gap-1.5 sm:gap-2 pt-3 pb-1 shrink-0 text-xs sm:text-sm text-slate-400 flex-nowrap overflow-x-hidden w-full';
    navBar.appendChild(undoBtn);
    navBar.appendChild(skipBtn);
    navBar.appendChild(advanceBtn);
  } else {
    navBar.className = 'flex flex-col gap-2 pt-3 pb-1 shrink-0 text-xs sm:text-sm text-slate-400 w-full overflow-x-hidden';

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
    progressionBtn.className = `w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 min-h-[44px] rounded-lg border font-semibold text-xs sm:text-sm transition-all active:scale-95 shadow-md ${progressionTheme.classes}`;
    progressionBtn.textContent = progressionLabel;

    let isProgressionTransitioning = false;
    progressionBtn.onclick = (e) => {
      e.stopPropagation();
      if (isProgressionTransitioning || progressionBtn.disabled) return;
      isProgressionTransitioning = true;
      progressionBtn.disabled = true;

      if (state.currentTier === 3) {
        stateMachine.startGroundingCheckout();
      } else {
        stateMachine.advanceTier();
      }

      setTimeout(() => {
        isProgressionTransitioning = false;
        progressionBtn.disabled = false;
      }, 400);
    };

    const primaryRow = document.createElement('div');
    primaryRow.className = 'flex items-center justify-between gap-1.5 sm:gap-2 flex-nowrap overflow-x-hidden w-full';
    primaryRow.appendChild(undoBtn);
    primaryRow.appendChild(skipBtn);
    primaryRow.appendChild(advanceBtn);

    navBar.appendChild(progressionBtn);
    navBar.appendChild(primaryRow);
  }

  container.appendChild(navBar);

  // Task 7: Visibility Inactivity Refresh Listener
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
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
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Initialize Gesture Listener on cardFrame (Task 6: only onNext and onPrevious)
  const gestures = new GestureHandler(cardFrame, {
    onNext: () => stateMachine.nextCard(),
    onPrevious: () => stateMachine.previousCard(),
    onToggleSound: () => stateMachine.toggleSound(),
  });

  return {
    element: container,
    cleanup: () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      gestures.detach();
    },
  };
}
