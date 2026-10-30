import { describe, it, expect, beforeEach } from 'vitest';
import { BUILT_IN_DECKS } from '../src/data/registry';
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
    it('mounts exactly 2 navigation buttons when cardsAnsweredInTier < 4', () => {
      const sm = new StateMachine(101);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession(); // card 1, cardsAnsweredInTier = 1

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const buttons = element.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(element.querySelector('#progression-action-btn')).toBeNull();
      cleanup();
    });

    it('mounts 3rd progression button with correct label when progression is unlocked in Tier 1', () => {
      const sm = new StateMachine(102);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.startSession();
      sm.nextCard(); // 2
      sm.nextCard(); // 3
      sm.nextCard(); // 4
      sm.nextCard(); // triggers modal, hasShownProgressionForTier = true
      sm.stayInCurrentTier(); // back to IN_SESSION

      const { element, cleanup } = createSplitGameView(sm.getState(), sm);
      const buttons = element.querySelectorAll('button');
      expect(buttons.length).toBe(3);

      const progBtn = element.querySelector('#progression-action-btn') as HTMLButtonElement;
      expect(progBtn).toBeTruthy();
      expect(progBtn.textContent).toBe('Advance to Level 2 →');
      expect(progBtn.getAttribute('aria-label')).toBe('Advance to Level 2 →');
      expect(progBtn.getAttribute('aria-live')).toBe('polite');
      expect(progBtn.getAttribute('role')).toBe('button');
      cleanup();
    });

    it('mounts 3rd progression button with correct label in Tier 2 when unlocked', () => {
      const sm = new StateMachine(103);
      sm.selectDeck(BUILT_IN_DECKS[0]);
      sm.setTier(2); // starts in Tier 2, card 1
      sm.nextCard(); // 2
      sm.nextCard(); // 3
      sm.nextCard(); // 4
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
      sm.nextCard(); // 2
      sm.nextCard(); // 3
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
      sm.nextCard(); // 2
      sm.nextCard(); // 3
      sm.nextCard(); // 4
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
      sm.nextCard(); // 2
      sm.nextCard(); // 3
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
      sm.nextCard(); // 2
      sm.nextCard(); // 3
      sm.nextCard(); // 4
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
});
