import { describe, it, expect, beforeEach } from 'vitest';
import { Mulberry32 } from '../src/core/prng';
import { SmoothedBernoulliDealer } from '../src/core/dealer';
import { StateMachine } from '../src/core/state';
import { EphemeralStorageManager, SESSION_STORAGE_KEY } from '../src/core/storage';
import { BUILT_IN_DECKS } from '../src/data/registry';

describe('Core Engine Verification', () => {
  const generalDeck = BUILT_IN_DECKS.find(d => d.id === 'general_edition')!;

  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('Mulberry32 PRNG', () => {
    it('produces identical deterministic sequences given the same seed', () => {
      const prng1 = new Mulberry32(123456);
      const prng2 = new Mulberry32(123456);

      const seq1 = Array.from({ length: 10 }, () => prng1.next());
      const seq2 = Array.from({ length: 10 }, () => prng2.next());

      expect(seq1).toEqual(seq2);
    });

    it('generates numbers within bounds [min, max]', () => {
      const prng = new Mulberry32(42);
      for (let i = 0; i < 100; i++) {
        const val = prng.nextInt(1, 5);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Smoothed Bernoulli Dealer', () => {
    const generalDeck = BUILT_IN_DECKS.find(d => d.id === 'general_edition')!;

    it('satisfies min spacing constraint (>= 3 cards between wildcards)', () => {
      const dealer = new SmoothedBernoulliDealer(generalDeck, 0xDEADBEEF);
      let cardsSinceWildcard = 3;

      for (let i = 0; i < 100; i++) {
        const result = dealer.drawNext();
        if (result.isWildcard) {
          expect(cardsSinceWildcard).toBeGreaterThanOrEqual(3);
          cardsSinceWildcard = 0;
        } else {
          cardsSinceWildcard++;
        }
      }
    });

    it('recycles pool seamlessly without throwing when tier cards are exhausted', () => {
      const dealer = new SmoothedBernoulliDealer(generalDeck, 9999);
      // General edition tier 1 has ~30 cards
      let sawRecycle = false;
      for (let i = 0; i < 80; i++) {
        const draw = dealer.drawNext();
        expect(draw.card).toBeDefined();
        expect(draw.card.tier).toBe(1);
        if (draw.isRecycled) {
          sawRecycle = true;
        }
      }
      expect(sawRecycle).toBe(true);
    });
  });

  describe('Ephemeral Session Storage Manager', () => {
    it('saves and restores session within 15-minute TTL', () => {
      const payload = {
        deckId: 'general_edition',
        currentTier: 1 as const,
        cardsAnsweredInTier: 3,
        drawnPromptIds: ['gen_1', 'gen_2', 'gen_3'],
        activeCard: generalDeck.prompts[0],
        previousCard: null,
        soundEnabled: true,
        lastActiveTimestamp: Date.now()
      };

      EphemeralStorageManager.saveSession(payload);
      const loaded = EphemeralStorageManager.loadSession();

      expect(loaded).toBeDefined();
      expect(loaded?.deckId).toBe('general_edition');
      expect(loaded?.cardsAnsweredInTier).toBe(3);
    });

    it('discards session older than 15-minute TTL', () => {
      const expiredPayload = {
        deckId: 'general_edition',
        currentTier: 1 as const,
        cardsAnsweredInTier: 1,
        drawnPromptIds: ['gen_1'],
        activeCard: generalDeck.prompts[0],
        previousCard: null,
        soundEnabled: true,
        lastActiveTimestamp: Date.now() - (16 * 60 * 1000) // 16 mins ago
      };

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(expiredPayload));
      const loaded = EphemeralStorageManager.loadSession();

      expect(loaded).toBeNull();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('preserves hasShownProgressionForTier across session serialization and tryRestoreSession', () => {
      const sm = new StateMachine(4321);
      sm.selectDeck(generalDeck);
      sm.startSession();
      // Draw until progression modal triggers at card 4+
      sm.nextCard(); // card 2
      sm.nextCard(); // card 3
      sm.nextCard(); // card 4
      sm.nextCard(); // triggers PROGRESSION_MODAL, sets hasShownProgressionForTier = true
      expect(sm.getHasShownProgressionForTier()).toBe(true);
      sm.stayInCurrentTier(); // back to IN_SESSION, auto-persisting session

      // Restore into fresh state machine
      const smRestored = new StateMachine(9999);
      const restored = smRestored.tryRestoreSession(BUILT_IN_DECKS);
      expect(restored).toBe(true);
      expect(smRestored.getHasShownProgressionForTier()).toBe(true);
      expect(smRestored.getState().cardsAnsweredInTier).toBe(4);
    });
  });

  describe('Finite State Machine', () => {
    const generalDeck = BUILT_IN_DECKS[0];

    it('tracks getHasShownProgressionForTier getter transitions and resets correctly', () => {
      const sm = new StateMachine(5555);
      expect(sm.getHasShownProgressionForTier()).toBe(false);

      sm.selectDeck(generalDeck);
      sm.startSession();
      expect(sm.getHasShownProgressionForTier()).toBe(false);

      sm.nextCard(); // 2
      sm.nextCard(); // 3
      sm.nextCard(); // 4
      expect(sm.getHasShownProgressionForTier()).toBe(false);

      sm.nextCard(); // triggers PROGRESSION_MODAL
      expect(sm.getHasShownProgressionForTier()).toBe(true);

      sm.stayInCurrentTier();
      expect(sm.getHasShownProgressionForTier()).toBe(true);

      sm.advanceTier();
      expect(sm.getHasShownProgressionForTier()).toBe(false);
    });

    it('manages complete session progression from DECK_SELECT to GROUNDING_CHECKOUT', () => {
      const sm = new StateMachine(1234);
      expect(sm.getState().view).toBe('DECK_SELECT');

      sm.selectDeck(generalDeck);
      expect(sm.getState().view).toBe('BRIEFING');
      expect(sm.getState().currentDeck?.id).toBe(generalDeck.id);

      sm.startSession();
      expect(sm.getState().view).toBe('IN_SESSION');
      expect(sm.getState().activeCard).toBeDefined();
      expect(sm.getState().cardsAnsweredInTier).toBe(1);

      // Advance cards up to card 4
      sm.nextCard(); // card 2
      sm.nextCard(); // card 3
      sm.nextCard(); // card 4

      expect(sm.getState().cardsAnsweredInTier).toBe(4);

      // Trigger progression modal on 5th draw attempt
      sm.nextCard();
      expect(sm.getState().view).toBe('PROGRESSION_MODAL');

      // Test Advance
      sm.advanceTier();
      expect(sm.getState().view).toBe('IN_SESSION');
      expect(sm.getState().currentTier).toBe(2);

      // Test 1-step undo
      const firstCardT2 = sm.getState().activeCard;
      sm.nextCard();
      expect(sm.getState().previousCard).toBe(firstCardT2);

      sm.previousCard();
      expect(sm.getState().activeCard).toBe(firstCardT2);

      // Grounding checkout
      sm.startGroundingCheckout();
      expect(sm.getState().view).toBe('GROUNDING_CHECKOUT');
      expect(sm.getState().checkoutStep).toBe(1);

      sm.nextCheckoutStep();
      expect(sm.getState().checkoutStep).toBe(2);

      sm.nextCheckoutStep();
      expect(sm.getState().checkoutStep).toBe(3);
      // Storage should be wiped
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

      sm.nextCheckoutStep();
      expect(sm.getState().view).toBe('DECK_SELECT');
    });
  });
});
