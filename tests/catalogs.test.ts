import { describe, it, expect } from 'vitest';
import { BUILT_IN_DECKS, getDeckById } from '../src/data/registry';

describe('Prompt Catalogs Verification', () => {
  it('should load exactly 8 built-in catalogs with an aggregate count of 415 prompts', () => {
    expect(BUILT_IN_DECKS.length).toBe(8);

    const totalPrompts = BUILT_IN_DECKS.reduce((acc, deck) => acc + deck.prompts.length, 0);
    expect(totalPrompts).toBe(415);
  });

  it('should resolve decks by id and v1 alias', () => {
    const general = getDeckById('general_edition');
    expect(general).toBeDefined();
    expect(general?.title).toContain('General Edition');
    expect(general?.prompts.length).toBe(100);

    const generalV1 = getDeckById('general_edition_v1');
    expect(generalV1).toBe(general);
  });

  it('should ensure every prompt conforms strictly to schema', () => {
    BUILT_IN_DECKS.forEach((deck) => {
      const seenIds = new Set<string>();

      deck.prompts.forEach((prompt) => {
        // ID check & uniqueness within deck
        expect(prompt.id).toBeTruthy();
        expect(seenIds.has(prompt.id)).toBe(false);
        seenIds.add(prompt.id);

        // Tier check
        expect([1, 2, 3]).toContain(prompt.tier);

        // Type check
        expect(['prompt', 'wildcard']).toContain(prompt.type);

        // String checks
        expect(prompt.speakerPrompt.trim().length).toBeGreaterThan(0);
        expect(prompt.listenerPrompt.trim().length).toBeGreaterThan(0);

        // Pass action check
        expect(['pass_partner', 'pass_left']).toContain(prompt.passAction);

        // Tags check
        expect(Array.isArray(prompt.tags)).toBe(true);
      });
    });
  });

  it('should ensure each deck has prompts in tiers 1, 2, and 3', () => {
    BUILT_IN_DECKS.forEach((deck) => {
      const t1 = deck.prompts.filter(p => p.tier === 1);
      const t2 = deck.prompts.filter(p => p.tier === 2);
      const t3 = deck.prompts.filter(p => p.tier === 3);

      expect(t1.length).toBeGreaterThan(0);
      expect(t2.length).toBeGreaterThan(0);
      expect(t3.length).toBeGreaterThan(0);
    });
  });
});
