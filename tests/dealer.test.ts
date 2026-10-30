import { describe, it, expect } from 'vitest';
import { SmoothedBernoulliDealer } from '../src/core/dealer';
import { getDeckById } from '../src/data/registry';

describe('SmoothedBernoulliDealer Bilateral Dealing', () => {
  const pc58Deck = getDeckById('parent_child_5_8')!;
  const generalDeck = getDeckById('general_edition')!;

  it('partitions bilateral deck into role pools and wildcard pool', () => {
    const dealer = new SmoothedBernoulliDealer(pc58Deck, 42);
    expect(dealer.getIsBilateral()).toBe(true);
    expect(dealer.getCurrentTier()).toBe(1);

    // Initial pool remaining should match prompts in tier 1
    const roleAPrompts = pc58Deck.prompts.filter(
      (p) => p.tier === 1 && p.type === 'prompt' && p.targetRole === 'parent'
    );
    const roleBPrompts = pc58Deck.prompts.filter(
      (p) => p.tier === 1 && p.type === 'prompt' && p.targetRole === 'child'
    );

    expect(dealer.getPoolRemaining('parent')).toBe(roleAPrompts.length);
    expect(dealer.getPoolRemaining('child')).toBe(roleBPrompts.length);
  });

  it('draws prompts matching the requested speaker role', () => {
    const dealer = new SmoothedBernoulliDealer(pc58Deck, 12345);

    // Draw for parent
    const drawParent = dealer.drawNext('parent');
    if (!drawParent.isWildcard) {
      expect(drawParent.card.targetRole).toBe('parent');
    }

    // Draw for child
    const drawChild = dealer.drawNext('child');
    if (!drawChild.isWildcard) {
      expect(drawChild.card.targetRole).toBe('child');
    }
  });

  it('recycles skipped standard card to the back of the active role pool and draws next', () => {
    const dealer = new SmoothedBernoulliDealer(pc58Deck, 999);
    const initialRemaining = dealer.getPoolRemaining('parent');

    const firstDraw = dealer.drawNext('parent');
    expect(dealer.getPoolRemaining('parent')).toBe(initialRemaining - 1);

    // Skip the first card
    const skippedDraw = dealer.skipCurrent(firstDraw.card, 'parent');
    expect(skippedDraw.card.id).not.toBe(firstDraw.card.id);

    // Drawing through the pool should eventually yield the skipped card at the back
    let foundSkipped = false;
    for (let i = 0; i < initialRemaining + 2; i++) {
      const draw = dealer.drawNext('parent');
      if (draw.card.id === firstDraw.card.id) {
        foundSkipped = true;
        break;
      }
    }
    expect(foundSkipped).toBe(true);
  });

  it('recycles skipped wildcard to tail of wildcardPool, resets spacing to 3, and draws regular prompt', () => {
    const dealer = new SmoothedBernoulliDealer(pc58Deck, 777);

    // Create a mock wildcard from tier 1
    const wildcard = pc58Deck.prompts.find((p) => p.tier === 1 && p.type === 'wildcard')!;
    expect(wildcard).toBeDefined();

    const draw = dealer.skipCurrent(wildcard, 'parent');
    expect(draw.isWildcard).toBe(false);
    expect(draw.card.type).toBe('prompt');
    expect(draw.card.targetRole).toBe('parent');
    // cardsSinceWildcard was reset to 3 then incremented for the regular draw -> 4
    expect(dealer.getCardsSinceWildcard()).toBe(4);
  });

  it('filters already-drawn prompt IDs on pool rehydration in loadDeck()', () => {
    const tier1ParentPrompts = pc58Deck.prompts.filter(
      (p) => p.tier === 1 && p.type === 'prompt' && p.targetRole === 'parent'
    );
    const drawnIds = [tier1ParentPrompts[0].id, tier1ParentPrompts[1].id];

    const dealer = new SmoothedBernoulliDealer(undefined, 888);
    dealer.loadDeck(pc58Deck, 1, drawnIds);

    // Pool count should be reduced by the drawn count
    expect(dealer.getPoolRemaining('parent')).toBe(tier1ParentPrompts.length - drawnIds.length);

    // Draw remaining prompts; none should match drawnIds
    const remainingCount = dealer.getPoolRemaining('parent');
    for (let i = 0; i < remainingCount; i++) {
      const draw = dealer.drawNext('parent');
      if (!draw.isWildcard) {
        expect(drawnIds).not.toContain(draw.card.id);
      }
    }
  });

  it('maintains classic unified pool dealing for non-bilateral decks', () => {
    const dealer = new SmoothedBernoulliDealer(generalDeck, 555);
    expect(dealer.getIsBilateral()).toBe(false);

    const initialRemaining = dealer.getPoolRemaining();
    expect(initialRemaining).toBeGreaterThan(0);

    const draw = dealer.drawNext();
    expect(draw.card).toBeDefined();
    expect(draw.card.tier).toBe(1);
  });

  it('disables canSkip when pool has <= 1 prompt remaining', () => {
    const dealer = new SmoothedBernoulliDealer(pc58Deck, 333);
    expect(dealer.canSkip('parent')).toBe(true);

    // Drain parent pool until 1 remaining
    while (dealer.getPoolRemaining('parent') > 1) {
      dealer.drawNext('parent');
    }
    expect(dealer.canSkip('parent')).toBe(false);
  });

  it('guarantees deterministic draw order with fixed PRNG seed', () => {
    const dealer1 = new SmoothedBernoulliDealer(pc58Deck, 0xACE);
    const dealer2 = new SmoothedBernoulliDealer(pc58Deck, 0xACE);

    const seq1 = Array.from({ length: 6 }, () => dealer1.drawNext('parent').card.id);
    const seq2 = Array.from({ length: 6 }, () => dealer2.drawNext('parent').card.id);

    expect(seq1).toEqual(seq2);
  });
});
