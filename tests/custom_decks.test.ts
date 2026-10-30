import { describe, it, expect } from 'vitest';
import { validateCustomDeck } from '../src/data/validator';
import { readCustomDeckFile, MAX_FILE_SIZE_BYTES } from '../src/core/indexeddb';

describe('Custom Decks & Schema Validator Verification', () => {
  it('validates and namespaces a compliant custom deck JSON payload', () => {
    const rawDeck = {
      id: 'retreat_deck_2026',
      title: 'Leadership Retreat 2026',
      description: 'Prompts for executive vulnerability and attunement.',
      prompts: [
        {
          id: 'prompt_1',
          tier: 1,
          type: 'prompt',
          speakerPrompt: 'What is a personal assumption you had to let go of this year?',
          listenerPrompt: 'Notice their body language as they reflect.',
          passAction: 'pass_partner',
          tags: ['leadership', 'humility'],
        },
        {
          id: 'prompt_2',
          tier: 2,
          type: 'wildcard',
          speakerPrompt: 'WILDCARD: Share a fear you have never spoken aloud at work.',
          listenerPrompt: 'Hold their gaze with warmth.',
          passAction: 'pass_partner',
        },
      ],
    };

    const result = validateCustomDeck(rawDeck);
    expect(result.valid).toBe(true);
    expect(result.deck).toBeDefined();

    // Check custom_ prefix namespacing on deck ID and prompt IDs
    expect(result.deck!.id).toBe('custom_retreat_deck_2026');
    expect(result.deck!.prompts[0].id).toMatch(/^custom_/);
    expect(result.deck!.prompts[1].id).toMatch(/^custom_/);
    expect(result.deck!.isCustom).toBe(true);
  });

  it('rejects payloads missing required fields or having invalid tiers', () => {
    // Missing title
    const noTitle = { prompts: [{ tier: 1, speakerPrompt: 'A', listenerPrompt: 'B' }] };
    expect(validateCustomDeck(noTitle).valid).toBe(false);

    // Invalid tier (tier 4)
    const invalidTier = {
      title: 'Invalid Tier Deck',
      prompts: [{ tier: 4, speakerPrompt: 'A', listenerPrompt: 'B' }],
    };
    const res = validateCustomDeck(invalidTier);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('invalid tier');

    // Empty prompts array
    const emptyPrompts = { title: 'Empty Deck', prompts: [] };
    expect(validateCustomDeck(emptyPrompts).valid).toBe(false);
  });

  it('safely handles XSS strings as plain strings without evaluation', () => {
    const maliciousDeck = {
      title: '<script>alert("XSS")</script>',
      description: '<img src=x onerror=alert(1)>',
      prompts: [
        {
          tier: 1,
          speakerPrompt: '<svg onload=alert("XSS")>',
          listenerPrompt: 'javascript:alert(1)',
        },
      ],
    };

    const res = validateCustomDeck(maliciousDeck);
    expect(res.valid).toBe(true);
    // Should retain exact string without executing
    expect(res.deck?.title).toBe('<script>alert("XSS")</script>');
    expect(res.deck?.prompts[0].speakerPrompt).toBe('<svg onload=alert("XSS")>');
  });

  it('rejects files exceeding the 1MB payload ceiling', async () => {
    // Mock a file larger than 1MB
    const largeContent = 'a'.repeat(MAX_FILE_SIZE_BYTES + 10);
    const mockFile = new File([largeContent], 'huge_deck.json', { type: 'application/json' });

    await expect(readCustomDeckFile(mockFile)).rejects.toThrow('exceeds the 1MB payload ceiling');
  });
});
