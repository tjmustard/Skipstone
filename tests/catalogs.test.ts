import { describe, it, expect } from 'vitest';
import { BUILT_IN_DECKS, getDeckById, getAllDecks } from '../src/data/registry';
import { validateCustomDeck } from '../src/data/validator';

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

  it('verifies that exactly 4 parent-child catalogs are bilateral with role metadata', () => {
    const allDecks = getAllDecks();
    expect(allDecks.length).toBe(8);

    const bilateralDecks = allDecks.filter(d => d.isBilateral === true);
    expect(bilateralDecks.length).toBe(4);

    const bilateralIds = bilateralDecks.map(d => d.id).sort();
    expect(bilateralIds).toEqual([
      'parent_child_13_17',
      'parent_child_5_8',
      'parent_child_9_12',
      'parent_child_adult_offspring',
    ]);

    const nonBilateralDecks = allDecks.filter(d => !d.isBilateral);
    expect(nonBilateralDecks.length).toBe(4);
    nonBilateralDecks.forEach(deck => {
      expect(deck.isBilateral).toBeUndefined();
    });
  });

  it('verifies prompt targetRoles and balanced role pools in all tiers of bilateral catalogs', () => {
    const parentChildDecks = BUILT_IN_DECKS.filter(d => d.isBilateral);

    parentChildDecks.forEach((deck) => {
      expect(deck.roleA).toBeDefined();
      expect(deck.roleB).toBeDefined();
      expect(deck.roleLabels?.roleA).toBeDefined();
      expect(deck.roleLabels?.roleB).toBeDefined();

      const validRoles = new Set([deck.roleA, deck.roleB, 'mutual']);

      // Check every prompt has a valid targetRole matching deck definition
      deck.prompts.forEach((prompt) => {
        expect(prompt.targetRole).toBeDefined();
        expect(validRoles.has(prompt.targetRole!)).toBe(true);

        if (prompt.type === 'wildcard') {
          expect(prompt.targetRole).toBe('mutual');
        }
      });

      // Check each tier has prompts for both roleA and roleB
      [1, 2, 3].forEach((tier) => {
        const tierPrompts = deck.prompts.filter(p => p.tier === tier);
        const roleAPrompts = tierPrompts.filter(p => p.targetRole === deck.roleA);
        const roleBPrompts = tierPrompts.filter(p => p.targetRole === deck.roleB);

        expect(roleAPrompts.length).toBeGreaterThanOrEqual(5);
        expect(roleBPrompts.length).toBeGreaterThanOrEqual(5);
      });
    });
  });

  it('verifies validateCustomDeck backwards compatibility with legacy custom decks', () => {
    const legacyDeck = {
      title: 'Legacy Custom Deck',
      description: 'Deck created before bilateral feature was introduced.',
      prompts: [
        {
          tier: 1,
          speakerPrompt: 'Speaker prompt without targetRole',
          listenerPrompt: 'Listener prompt',
          tags: ['test']
        }
      ]
    };

    const res = validateCustomDeck(legacyDeck);
    expect(res.valid).toBe(true);
    expect(res.deck).toBeDefined();
    expect(res.deck?.isBilateral).toBeUndefined();
    expect(res.deck?.roleA).toBeUndefined();
    expect(res.deck?.roleB).toBeUndefined();
    expect(res.deck?.roleLabels).toBeUndefined();
    expect(res.deck?.prompts[0].targetRole).toBeUndefined();
  });

  it('verifies validateCustomDeck correctly validates and preserves bilateral properties', () => {
    const bilateralCustomDeck = {
      title: 'Mentor & Mentee Bilateral Deck',
      description: 'Dyadic bilateral conversation deck.',
      isBilateral: true,
      roleA: 'mentor',
      roleB: 'mentee',
      roleLabels: {
        roleA: 'Mentor',
        roleB: 'Mentee'
      },
      prompts: [
        {
          tier: 1,
          targetRole: 'mentor',
          speakerPrompt: 'What is a skill you are excited to develop?',
          listenerPrompt: 'Listen with enthusiasm.',
          tags: ['career']
        },
        {
          tier: 1,
          targetRole: 'mentee',
          speakerPrompt: 'What was your biggest career pivot?',
          listenerPrompt: 'Listen to their journey.',
          tags: ['advice']
        },
        {
          tier: 1,
          type: 'wildcard',
          targetRole: 'mutual',
          speakerPrompt: 'WILDCARD: Share your favorite productivity trick.',
          listenerPrompt: 'Exchange notes.',
          tags: ['habits']
        }
      ]
    };

    const res = validateCustomDeck(bilateralCustomDeck);
    expect(res.valid).toBe(true);
    expect(res.deck?.isBilateral).toBe(true);
    expect(res.deck?.roleA).toBe('mentor');
    expect(res.deck?.roleB).toBe('mentee');
    expect(res.deck?.roleLabels).toEqual({ roleA: 'Mentor', roleB: 'Mentee' });
    expect(res.deck?.prompts[0].targetRole).toBe('mentor');
    expect(res.deck?.prompts[1].targetRole).toBe('mentee');
    expect(res.deck?.prompts[2].targetRole).toBe('mutual');
  });

  it('verifies validateCustomDeck rejects invalid bilateral types', () => {
    // Non-boolean isBilateral
    const invalidBilateral = {
      title: 'Invalid Deck',
      isBilateral: 'yes',
      prompts: [{ tier: 1, speakerPrompt: 'A', listenerPrompt: 'B' }]
    };
    expect(validateCustomDeck(invalidBilateral).valid).toBe(false);

    // Non-object roleLabels
    const invalidRoleLabels = {
      title: 'Invalid Deck',
      roleLabels: 'not-an-object',
      prompts: [{ tier: 1, speakerPrompt: 'A', listenerPrompt: 'B' }]
    };
    expect(validateCustomDeck(invalidRoleLabels).valid).toBe(false);
  });
});
