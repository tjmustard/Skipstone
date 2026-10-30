import { describe, it, expect, beforeEach } from 'vitest';
import { StateMachine } from '../src/core/state';
import { getDeckById, BUILT_IN_DECKS } from '../src/data/registry';
import { SESSION_STORAGE_KEY } from '../src/core/storage';

describe('StateMachine Bilateral Turn Alternation & State Management', () => {
  const pc58Deck = getDeckById('parent_child_5_8')!;

  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('Starter Role Initialization', () => {
    it('initializes activeRole and startingRole to declared roleA by default', () => {
      const sm = new StateMachine(1001);
      sm.selectDeck(pc58Deck);
      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().startingRole).toBe('parent');

      sm.startSession();
      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().startingRole).toBe('parent');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);
      expect(sm.getState().activeCard?.targetRole).toBe('parent');
    });

    it('honors selected starterRole when passed to startSession', () => {
      const sm = new StateMachine(1002);
      sm.selectDeck(pc58Deck);
      sm.startSession('child');

      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().startingRole).toBe('child');
      expect(sm.getState().activeCard?.targetRole).toBe('child');
    });

    it('sets starter role via setStarterRole before session start', () => {
      const sm = new StateMachine(1003);
      sm.selectDeck(pc58Deck);
      sm.setStarterRole('child');
      expect(sm.getState().activeRole).toBe('child');

      sm.startSession();
      expect(sm.getState().activeRole).toBe('child');
    });
  });

  describe('Bilateral Turn Alternation', () => {
    it('alternates roles strictly between parent and child on nextCard()', () => {
      const sm = new StateMachine(2001);
      sm.selectDeck(pc58Deck);
      sm.startSession('parent');
      expect(sm.getState().activeRole).toBe('parent');

      // Next card -> switches to child
      sm.resetTransitionLockout();
      sm.nextCard();
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(2);

      // Next card -> switches back to parent
      sm.resetTransitionLockout();
      sm.nextCard();
      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().cardsAnsweredInTier).toBe(3);
    });
  });

  describe('Skip Card Isolation', () => {
    it('preserves activeRole and cardsAnsweredInTier on skipCard()', () => {
      const sm = new StateMachine(3001);
      sm.selectDeck(pc58Deck);
      sm.startSession('child');
      const initialCard = sm.getState().activeCard;

      sm.resetTransitionLockout();
      sm.skipCard();

      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);
      expect(sm.getState().activeCard?.id).not.toBe(initialCard?.id);
      expect(sm.getState().previousActionType).toBe('SKIP');
      expect(sm.getState().hasUndoAvailable).toBe(true);
    });
  });

  describe('Stateful 1-Step Undo Symmetry', () => {
    it('restores previous card and role after nextCard(), then immediately disables undo', () => {
      const sm = new StateMachine(4001);
      sm.selectDeck(pc58Deck);
      sm.startSession('parent');

      const card1 = sm.getState().activeCard;
      expect(sm.getState().activeRole).toBe('parent');

      // Advance
      sm.resetTransitionLockout();
      sm.nextCard();
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(2);

      // 1-step undo
      sm.resetTransitionLockout();
      sm.previousCard();
      expect(sm.getState().activeCard?.id).toBe(card1?.id);
      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);
      expect(sm.getState().hasUndoAvailable).toBe(false);

      // Second consecutive call must be rejected
      sm.resetTransitionLockout();
      sm.previousCard();
      expect(sm.getState().activeCard?.id).toBe(card1?.id);
      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);
    });

    it('restores previous card after skipCard() without altering role or counter', () => {
      const sm = new StateMachine(4002);
      sm.selectDeck(pc58Deck);
      sm.startSession('child');

      const cardBeforeSkip = sm.getState().activeCard;
      sm.resetTransitionLockout();
      sm.skipCard();

      expect(sm.getState().activeCard?.id).not.toBe(cardBeforeSkip?.id);
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);

      // Undo the skip
      sm.resetTransitionLockout();
      sm.previousCard();

      expect(sm.getState().activeCard?.id).toBe(cardBeforeSkip?.id);
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);
      expect(sm.getState().hasUndoAvailable).toBe(false);
    });
  });

  describe('Transition Debounce Lockout', () => {
    it('blocks rapid consecutive nextCard, skipCard, and previousCard calls within 350ms', () => {
      const sm = new StateMachine(5001);
      sm.selectDeck(pc58Deck);
      sm.startSession();

      expect(sm.getIsTransitioning()).toBe(false);

      // Call nextCard -> starts transition lockout
      sm.nextCard();
      expect(sm.getIsTransitioning()).toBe(true);
      const cardAfterNext = sm.getState().activeCard;

      // Second rapid nextCard call while locked out -> must be ignored!
      sm.nextCard();
      expect(sm.getState().activeCard?.id).toBe(cardAfterNext?.id);
      expect(sm.getState().cardsAnsweredInTier).toBe(2);

      // Reset lockout
      sm.resetTransitionLockout();
      expect(sm.getIsTransitioning()).toBe(false);

      // Skip card -> starts transition lockout
      sm.skipCard();
      expect(sm.getIsTransitioning()).toBe(true);
      const cardAfterSkip = sm.getState().activeCard;

      // Second rapid skipCard call while locked out -> ignored!
      sm.skipCard();
      expect(sm.getState().activeCard?.id).toBe(cardAfterSkip?.id);

      // Reset lockout
      sm.resetTransitionLockout();
      sm.previousCard();
      expect(sm.getIsTransitioning()).toBe(true);
      const cardAfterPrev = sm.getState().activeCard;

      // Second rapid previousCard call -> ignored!
      sm.previousCard();
      expect(sm.getState().activeCard?.id).toBe(cardAfterPrev?.id);
    });
  });

  describe('Session Persistence & Rehydration Validation', () => {
    it('persists and restores activeRole, startingRole, previousRole, and drawnPromptIds', () => {
      const sm = new StateMachine(6001);
      sm.selectDeck(pc58Deck);
      sm.startSession('parent');

      sm.resetTransitionLockout();
      sm.nextCard(); // to child

      const stateBeforeUnload = sm.getState();
      expect(stateBeforeUnload.activeRole).toBe('child');
      expect(stateBeforeUnload.startingRole).toBe('parent');
      expect(stateBeforeUnload.previousRole).toBe('parent');
      expect(stateBeforeUnload.previousActionType).toBe('NEXT');

      // Rehydrate into a fresh StateMachine
      const smFresh = new StateMachine(6002);
      const restored = smFresh.tryRestoreSession(BUILT_IN_DECKS);
      expect(restored).toBe(true);

      const stateRestored = smFresh.getState();
      expect(stateRestored.activeRole).toBe('child');
      expect(stateRestored.startingRole).toBe('parent');
      expect(stateRestored.previousRole).toBe('parent');
      expect(stateRestored.previousActionType).toBe('NEXT');
      expect(stateRestored.cardsAnsweredInTier).toBe(2);
      expect(stateRestored.activeCard?.id).toBe(stateBeforeUnload.activeCard?.id);
      expect(stateRestored.hasUndoAvailable).toBe(true);
    });

    it('purges session and returns false if saved activeCard is invalid for deck catalog', () => {
      const invalidPayload = {
        deckId: 'parent_child_5_8',
        currentTier: 1 as const,
        cardsAnsweredInTier: 1,
        drawnPromptIds: ['pc58_t1_01'],
        activeCard: {
          id: 'non_existent_card_id',
          tier: 1 as const,
          type: 'prompt' as const,
          speakerPrompt: 'Corrupt',
          listenerPrompt: 'Corrupt',
          passAction: 'pass_partner' as const,
          tags: [],
        },
        previousCard: null,
        soundEnabled: true,
        lastActiveTimestamp: Date.now(),
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(invalidPayload));

      const sm = new StateMachine(6003);
      const restored = sm.tryRestoreSession(BUILT_IN_DECKS);
      expect(restored).toBe(false);
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('purges session and returns false if catalog ID is not recognized', () => {
      const unknownDeckPayload = {
        deckId: 'alien_unknown_catalog',
        currentTier: 1 as const,
        cardsAnsweredInTier: 1,
        drawnPromptIds: ['alien_01'],
        activeCard: pc58Deck.prompts[0],
        previousCard: null,
        soundEnabled: true,
        lastActiveTimestamp: Date.now(),
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(unknownDeckPayload));

      const sm = new StateMachine(6004);
      const restored = sm.tryRestoreSession(BUILT_IN_DECKS);
      expect(restored).toBe(false);
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe('MiniPRD Integration Tests', () => {
    it('Integration Test 1: starter role parent -> nextCard to child -> skipCard maintains child -> previousCard restores previous child card', () => {
      const sm = new StateMachine(7001);
      sm.selectDeck(pc58Deck);
      sm.startSession('parent');

      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().cardsAnsweredInTier).toBe(1);

      // Call nextCard() -> verify active card is for child, turn passes
      sm.resetTransitionLockout();
      sm.nextCard();
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(2);
      const childCard1 = sm.getState().activeCard;
      expect(childCard1?.targetRole).toBe('child');

      // Call skipCard() -> verify active card is still for child, counter unchanged
      sm.resetTransitionLockout();
      sm.skipCard();
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(2);
      const childCard2 = sm.getState().activeCard;
      expect(childCard2?.id).not.toBe(childCard1?.id);
      expect(childCard2?.targetRole).toBe('child');

      // Call previousCard() -> verify active card is returned to previous child card, counter remains unchanged, role remains child
      sm.resetTransitionLockout();
      sm.previousCard();
      expect(sm.getState().activeCard?.id).toBe(childCard1?.id);
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(2);
    });

    it('Integration Test 2: call nextCard() from child -> turn passes to parent, counter increments -> previousCard drops counter, restores child, 2nd undo rejected', () => {
      const sm = new StateMachine(7002);
      sm.selectDeck(pc58Deck);
      sm.startSession('parent');

      sm.resetTransitionLockout();
      sm.nextCard(); // turn passes to child
      const childCard = sm.getState().activeCard;
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().cardsAnsweredInTier).toBe(2);

      // Call nextCard() from role child -> turn passes to parent, counter increments to 3
      sm.resetTransitionLockout();
      sm.nextCard();
      expect(sm.getState().activeRole).toBe('parent');
      expect(sm.getState().cardsAnsweredInTier).toBe(3);

      // Call previousCard() -> card returned to prior child card, counter drops to 2, activeRole restores to child
      sm.resetTransitionLockout();
      sm.previousCard();
      expect(sm.getState().activeCard?.id).toBe(childCard?.id);
      expect(sm.getState().cardsAnsweredInTier).toBe(2);
      expect(sm.getState().activeRole).toBe('child');

      // Second consecutive call to previousCard() is rejected
      sm.resetTransitionLockout();
      sm.previousCard();
      expect(sm.getState().activeCard?.id).toBe(childCard?.id);
      expect(sm.getState().cardsAnsweredInTier).toBe(2);
      expect(sm.getState().activeRole).toBe('child');
      expect(sm.getState().hasUndoAvailable).toBe(false);
    });
  });
});
