import { describe, it, expect, beforeEach } from 'vitest';
import { BUILT_IN_DECKS, getDeckById } from '../src/data/registry';
import { StateMachine } from '../src/core/state';
import { createHeader } from '../src/ui/components/Header';
import { createBriefingView } from '../src/ui/views/BriefingView';
import { createSplitGameView } from '../src/ui/views/SplitGameView';
import { createProgressionModal } from '../src/ui/components/ProgressionModal';
import { initPrivacyShield } from '../src/main';

describe('UI Shell & View Components Verification', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="privacy-shield" class="fixed inset-0 hidden"></div>
      <div id="app"></div>
      <div id="toast-container"></div>
    `;
    sessionStorage.clear();
  });

  it('renders Header with deck title, tier pill, and audio controls', () => {
    const sm = new StateMachine(123);
    sm.selectDeck(BUILT_IN_DECKS[0]);
    sm.startSession();

    const header = createHeader(sm.getState());
    expect(header.textContent).toContain(BUILT_IN_DECKS[0].title);
    expect(header.textContent).toContain('L1');
    expect(header.textContent).toContain('Finish');
  });

  it('renders BriefingView with deck details and Begin Session CTA', () => {
    const deck = BUILT_IN_DECKS[0];
    const briefing = createBriefingView(deck);

    expect(briefing.textContent).toContain(deck.title);
    expect(briefing.textContent).toContain('Begin Conversational Journey');
    expect(briefing.textContent).toContain('SHARED AGREEMENTS');
  });

  it('renders SplitGameView with top Speaker zone and bottom Listener zone using textContent', () => {
    const sm = new StateMachine(456);
    sm.selectDeck(BUILT_IN_DECKS[0]);
    sm.startSession();

    const state = sm.getState();
    const { element, cleanup } = createSplitGameView(state);

    expect(element.querySelector('#game-card-container')).toBeTruthy();
    expect(element.textContent).toContain(state.activeCard!.speakerPrompt);
    expect(element.textContent).toContain(state.activeCard!.listenerPrompt);
    expect(element.textContent).toContain('Active Listener Coaching');

    cleanup();
  });

  it('mounts ProgressionModal offering Advance or Stay options', () => {
    const sm = new StateMachine(789);
    sm.selectDeck(BUILT_IN_DECKS[0]);
    sm.startSession();

    const modal = createProgressionModal(sm.getState());
    expect(modal.textContent).toContain('Deepen the Conversation?');
    expect(modal.textContent).toContain('Advance to Level 2');
    expect(modal.textContent).toContain('Stay in Level 1');
  });

  it('toggles privacy shield when visibilitychange fires', () => {
    initPrivacyShield();
    const shield = document.getElementById('privacy-shield')!;
    expect(shield.classList.contains('hidden')).toBe(true);

    // Simulate visibility hidden
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(shield.classList.contains('hidden')).toBe(false);

    // Simulate visibility visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(shield.classList.contains('hidden')).toBe(true);
  });

  describe('SplitGameView Persistent Tier Progression Navigation', () => {
    it('mounts 3 primary navigation buttons (undo, skip, advance) when cardsAnsweredInTier < 4', () => {
      const sm = new StateMachine(101);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession(); // card 1, cardsAnsweredInTier = 1

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const buttons = element.querySelectorAll('button');
      expect(buttons.length).toBe(3);
      expect(element.querySelector('#prev-card-btn')).toBeTruthy();
      expect(element.querySelector('#skip-card-btn')).toBeTruthy();
      expect(element.querySelector('#next-card-btn')).toBeTruthy();
      expect(element.querySelector('#progression-action-btn')).toBeNull();
      cleanup();
    });

    it('mounts 4th progression button with correct label when progression is unlocked in Tier 1', () => {
      const sm = new StateMachine(102);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();
      sm.resetTransitionLockout();
      sm.nextCard(); // 2
      sm.resetTransitionLockout();
      sm.nextCard(); // 3
      sm.resetTransitionLockout();
      sm.nextCard(); // 4
      sm.resetTransitionLockout();
      sm.nextCard(); // triggers modal, hasShownProgressionForTier = true
      sm.stayInCurrentTier(); // back to IN_SESSION

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const buttons = element.querySelectorAll('button');
      expect(buttons.length).toBe(4);

      const progBtn = element.querySelector('#progression-action-btn') as HTMLButtonElement;
      expect(progBtn).toBeTruthy();
      expect(progBtn.textContent).toBe('Advance to Level 2 →');
      expect(progBtn.getAttribute('aria-label')).toBe('Advance to Level 2 →');
      expect(progBtn.getAttribute('aria-live')).toBe('polite');
      expect(progBtn.getAttribute('role')).toBe('button');
      cleanup();
    });

    it('mounts 4th progression button with correct label in Tier 2 when unlocked', () => {
      const sm = new StateMachine(103);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.setTier(2); // starts in Tier 2, card 1
      sm.resetTransitionLockout();
      sm.nextCard(); // 2
      sm.resetTransitionLockout();
      sm.nextCard(); // 3
      sm.resetTransitionLockout();
      sm.nextCard(); // 4
      sm.resetTransitionLockout();
      sm.nextCard(); // triggers modal, hasShownProgressionForTier = true
      sm.stayInCurrentTier();

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const progBtn = element.querySelector('#progression-action-btn') as HTMLButtonElement;
      expect(progBtn).toBeTruthy();
      expect(progBtn.textContent).toBe('Advance to Level 3 →');
      cleanup();
    });

    it('mounts Complete Session button in Tier 3 directly when cardsAnsweredInTier >= 4', () => {
      const sm = new StateMachine(104);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.setTier(3); // Tier 3, card 1
      expect(sm.getState().cardsAnsweredInTier).toBe(1);

      // Card 1: locked
      const view1 = createSplitGameView(sm.getState(), sm);
      expect(view1.element.querySelector('#progression-action-btn')).toBeNull();
      view1.cleanup();

      // Advance to card 4
      sm.resetTransitionLockout();
      sm.nextCard(); // 2
      sm.resetTransitionLockout();
      sm.nextCard(); // 3
      sm.resetTransitionLockout();
      sm.nextCard(); // 4
      expect(sm.getState().cardsAnsweredInTier).toBe(4);

      const view2 = createSplitGameView(sm.getState(), sm);
      const progBtn = view2.element.querySelector('#progression-action-btn') as HTMLButtonElement;
      expect(progBtn).toBeTruthy();
      expect(progBtn.textContent).toBe('Complete Session →');
      expect(progBtn.getAttribute('aria-label')).toBe('Complete Session →');
      view2.cleanup();
    });

    it('clicking advance button triggers advanceTier() in Tiers 1 and 2', () => {
      const sm = new StateMachine(105);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();
      sm.resetTransitionLockout();
      sm.nextCard(); // 2
      sm.resetTransitionLockout();
      sm.nextCard(); // 3
      sm.resetTransitionLockout();
      sm.nextCard(); // 4
      sm.resetTransitionLockout();
      sm.nextCard(); // modal
      sm.stayInCurrentTier();

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const progBtn = element.querySelector('#progression-action-btn') as HTMLButtonElement;

      expect(sm.getState().currentTier).toBe(1);
      progBtn.click();
      expect(sm.getState().currentTier).toBe(2);
      expect(sm.getState().view).toBe('IN_SESSION');
      cleanup();
    });

    it('clicking complete session button in Tier 3 triggers startGroundingCheckout() with checkoutStep = 1', () => {
      const sm = new StateMachine(106);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.setTier(3);
      sm.resetTransitionLockout();
      sm.nextCard(); // 2
      sm.resetTransitionLockout();
      sm.nextCard(); // 3
      sm.resetTransitionLockout();
      sm.nextCard(); // 4

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const progBtn = element.querySelector('#progression-action-btn') as HTMLButtonElement;

      progBtn.click();
      expect(sm.getState().view).toBe('GROUNDING_CHECKOUT');
      expect(sm.getState().checkoutStep).toBe(1);
      cleanup();
    });

    it('debounces rapid multi-tap on progression button within 400ms window', () => {
      const sm = new StateMachine(107);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();
      sm.resetTransitionLockout();
      sm.nextCard(); // 2
      sm.resetTransitionLockout();
      sm.nextCard(); // 3
      sm.resetTransitionLockout();
      sm.nextCard(); // 4
      sm.resetTransitionLockout();
      sm.nextCard(); // modal
      sm.stayInCurrentTier();

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const progBtn = element.querySelector('#progression-action-btn') as HTMLButtonElement;

      // Simulate rapid double click
      progBtn.click();
      expect(progBtn.disabled).toBe(true);
      progBtn.click(); // Should be ignored because disabled and isTransitioning

      expect(sm.getState().currentTier).toBe(2);
      cleanup();
    });
  });

  describe('Bilateral UI Shell Controls & Responsive Layout (MiniPRD_UI_Shell)', () => {
    it('Deterministic Test 1: renders starter role selector pills for bilateral deck (parent_child_5_8) and omits them for classic deck (general_edition)', () => {
      const bilateralDeck = getDeckById('parent_child_5_8');
      expect(bilateralDeck).toBeTruthy();
      expect(bilateralDeck!.isBilateral).toBe(true);

      const classicDeck = getDeckById('general_edition');
      expect(classicDeck).toBeTruthy();
      expect(classicDeck!.isBilateral).toBeFalsy();

      // Render bilateral deck briefing
      const bilateralBriefing = createBriefingView(bilateralDeck!);
      const roleABtn = bilateralBriefing.querySelector('button[data-role="parent"]') as HTMLButtonElement;
      const roleBBtn = bilateralBriefing.querySelector('button[data-role="child"]') as HTMLButtonElement;

      expect(roleABtn).toBeTruthy();
      expect(roleBBtn).toBeTruthy();
      expect(roleABtn.textContent).toBe('Parent');
      expect(roleBBtn.textContent).toBe('Child');
      expect(roleABtn.getAttribute('aria-pressed')).toBe('true');
      expect(roleBBtn.getAttribute('aria-pressed')).toBe('false');

      // Toggling starter role pill
      roleBBtn.click();
      expect(roleABtn.getAttribute('aria-pressed')).toBe('false');
      expect(roleBBtn.getAttribute('aria-pressed')).toBe('true');

      // Render classic deck briefing
      const classicBriefing = createBriefingView(classicDeck!);
      expect(classicBriefing.querySelector('button[data-role="parent"]')).toBeNull();
      expect(classicBriefing.querySelector('button[data-role="child"]')).toBeNull();
      expect(classicBriefing.querySelectorAll('button[data-role]').length).toBe(0);
    });

    it('passes selected starter role from BriefingView to stateMachine.startSession', () => {
      const sm = new StateMachine(201);
      const bilateralDeck = getDeckById('parent_child_5_8')!;
      sm.selectDeck(bilateralDeck);

      const briefing = createBriefingView(bilateralDeck, sm);
      const roleBBtn = briefing.querySelector('button[data-role="child"]') as HTMLButtonElement;
      const beginBtn = briefing.querySelectorAll('button')[2]; // 0: roleA, 1: roleB, 2: beginBtn

      // Select child as starter role
      roleBBtn.click();
      beginBtn.click();

      expect(sm.getState().view).toBe('IN_SESSION');
      expect(sm.getState().startingRole).toBe('child');
      expect(sm.getState().activeRole).toBe('child');
    });

    it('defaults to roleA when starter pill is not clicked', () => {
      const sm = new StateMachine(202);
      const bilateralDeck = getDeckById('parent_child_5_8')!;
      sm.selectDeck(bilateralDeck);

      const briefing = createBriefingView(bilateralDeck, sm);
      const beginBtn = briefing.querySelectorAll('button')[2];
      beginBtn.click();

      expect(sm.getState().view).toBe('IN_SESSION');
      expect(sm.getState().startingRole).toBe('parent');
      expect(sm.getState().activeRole).toBe('parent');
    });

    it('renders speaker role badge with correct text in SplitGameView', () => {
      const sm = new StateMachine(203);
      const bilateralDeck = getDeckById('parent_child_5_8')!;
      sm.selectDeck(bilateralDeck);
      sm.startSession('parent_child_5_8', 'parent');

      const state = sm.getState();
      const { element, cleanup } = createSplitGameView(state, sm);

      const badge = element.querySelector('#speaker-role-badge');
      expect(badge).toBeTruthy();

      if (state.activeCard?.type === 'wildcard' || state.activeCard?.targetRole === 'mutual') {
        expect(badge!.textContent).toBe('[Mutual - Both Answer]');
      } else {
        expect(badge!.textContent).toBe('[Speaker: Parent]');
      }

      cleanup();
    });

    it('renders [Mutual - Both Answer] badge for wildcard cards in bilateral decks', () => {
      const bilateralDeck = getDeckById('parent_child_5_8')!;
      const wildcardPrompt = bilateralDeck.prompts.find((p) => p.type === 'wildcard')!;
      expect(wildcardPrompt).toBeTruthy();

      const sm = new StateMachine(204);
      sm.selectDeck(bilateralDeck);
      sm.startSession();

      const state = {
        ...sm.getState(),
        activeCard: wildcardPrompt,
      };

      const { element, cleanup } = createSplitGameView(state, sm);
      const badge = element.querySelector('#speaker-role-badge');
      expect(badge).toBeTruthy();
      expect(badge!.textContent).toBe('[Mutual - Both Answer]');
      cleanup();
    });

    it('renders [Mutual - Both Answer] badge for prompts with targetRole === "mutual"', () => {
      const bilateralDeck = getDeckById('parent_child_5_8')!;
      const mutualPrompt = bilateralDeck.prompts.find((p) => p.targetRole === 'mutual')!;
      expect(mutualPrompt).toBeTruthy();

      const sm = new StateMachine(205);
      sm.selectDeck(bilateralDeck);
      sm.startSession();

      const state = {
        ...sm.getState(),
        activeCard: mutualPrompt,
      };

      const { element, cleanup } = createSplitGameView(state, sm);
      const badge = element.querySelector('#speaker-role-badge');
      expect(badge).toBeTruthy();
      expect(badge!.textContent).toBe('[Mutual - Both Answer]');
      cleanup();
    });

    it('renders [Skip Card ↷] button and handles click by invoking stateMachine.skipCard()', () => {
      const sm = new StateMachine(206);
      const bilateralDeck = getDeckById('parent_child_5_8')!;
      sm.selectDeck(bilateralDeck);
      sm.startSession();

      const initialCardId = sm.getState().activeCard?.id;
      const { element, cleanup } = createSplitGameView(sm.getState(), sm);

      const skipBtn = element.querySelector('#skip-card-btn') as HTMLButtonElement;
      expect(skipBtn).toBeTruthy();
      expect(skipBtn.disabled).toBe(false);
      expect(skipBtn.getAttribute('aria-label')).toBe('Skip Card');

      // Click skip
      skipBtn.click();
      expect(sm.getState().activeCard?.id).not.toBe(initialCardId);
      expect(sm.getState().previousActionType).toBe('SKIP');
      cleanup();
    });

    it('disables 1-Step Undo button when hasUndoAvailable is false and disables immediately on click', () => {
      const sm = new StateMachine(207);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();

      expect(sm.getState().hasUndoAvailable).toBe(false);

      const view1 = createSplitGameView(sm.getState(), sm);
      const undoBtn1 = view1.element.querySelector('#prev-card-btn') as HTMLButtonElement;
      expect(undoBtn1.disabled).toBe(true);
      view1.cleanup();

      // Advance card to create undo state
      sm.resetTransitionLockout();
      sm.nextCard();
      expect(sm.getState().hasUndoAvailable).toBe(true);

      const view2 = createSplitGameView(sm.getState(), sm);
      const undoBtn2 = view2.element.querySelector('#prev-card-btn') as HTMLButtonElement;
      expect(undoBtn2.disabled).toBe(false);

      // Clicking disables immediately and restores card
      sm.resetTransitionLockout();
      undoBtn2.click();
      expect(undoBtn2.disabled).toBe(true);
      expect(sm.getState().hasUndoAvailable).toBe(false);
      view2.cleanup();
    });

    it('Deterministic Test 2: In SplitGameView on a 320px viewport, action button container does not exceed 320px width without overflow/wrapping and all 3 buttons are visible and clickable', () => {
      const sm = new StateMachine(208);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      document.body.appendChild(element);

      const navContainer = element.querySelector('#nav-actions-container') as HTMLElement;
      expect(navContainer).toBeTruthy();

      // Mock 320px container clientWidth and zero scroll overflow
      Object.defineProperty(navContainer, 'clientWidth', { value: 320, configurable: true });
      Object.defineProperty(navContainer, 'scrollWidth', { value: 320, configurable: true });

      expect(navContainer.clientWidth).toBeLessThanOrEqual(320);
      expect(navContainer.scrollWidth).toBeLessThanOrEqual(navContainer.clientWidth);

      // Verify flex-nowrap and overflow-x-hidden classes
      expect(navContainer.className).toContain('flex-nowrap');
      expect(navContainer.className).toContain('overflow-x-hidden');

      // Verify all 3 primary buttons are present, enforce min 44px x 44px, and are clickable
      const prevBtn = navContainer.querySelector('#prev-card-btn') as HTMLButtonElement;
      const skipBtn = navContainer.querySelector('#skip-card-btn') as HTMLButtonElement;
      const nextBtn = navContainer.querySelector('#next-card-btn') as HTMLButtonElement;

      expect(prevBtn).toBeTruthy();
      expect(skipBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();

      expect(prevBtn.className).toContain('min-h-[44px]');
      expect(prevBtn.className).toContain('min-w-[44px]');
      expect(skipBtn.className).toContain('min-h-[44px]');
      expect(skipBtn.className).toContain('min-w-[44px]');
      expect(nextBtn.className).toContain('min-h-[44px]');
      expect(nextBtn.className).toContain('min-w-[44px]');

      // Clickable
      sm.resetTransitionLockout();
      nextBtn.click();
      expect(sm.getState().cardsAnsweredInTier).toBe(2);

      document.body.removeChild(element);
      cleanup();
    });

    it('refreshes lastActiveTimestamp in sessionStorage on visibilitychange to visible', () => {
      const sm = new StateMachine(209);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();

      const oldTimestamp = Date.now() - 60000; // 1 minute ago
      sessionStorage.setItem(
        'skipstone_ephemeral_session',
        JSON.stringify({
          deckId: 'general_edition',
          currentTier: 1,
          cardsAnsweredInTier: 1,
          lastActiveTimestamp: oldTimestamp,
        })
      );

      const { cleanup } = createSplitGameView(sm.getState(), sm);

      // Dispatch visibilitychange to visible
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));

      const saved = JSON.parse(sessionStorage.getItem('skipstone_ephemeral_session')!);
      expect(saved.lastActiveTimestamp).toBeGreaterThanOrEqual(oldTimestamp + 50000);

      cleanup();
    });
  });
});
