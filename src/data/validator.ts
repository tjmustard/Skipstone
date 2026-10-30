import type { DeckCatalog, ConversationPrompt, TierLevel, PassAction } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  deck?: DeckCatalog;
}

const MAX_STRING_LEN = 1000;
const MAX_PROMPT_COUNT = 500;

/**
 * Lightweight Zero-Dependency Schema Validator (< 2KB)
 */
export function validateCustomDeck(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Custom deck JSON must be an object.'] };
  }

  const raw = data as Record<string, unknown>;

  // 1. Title validation
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) {
    errors.push('Deck must have a non-empty string title.');
  } else if (raw.title.length > MAX_STRING_LEN) {
    errors.push(`Title exceeds maximum length of ${MAX_STRING_LEN} characters.`);
  }

  // 2. Description validation
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  if (description.length > MAX_STRING_LEN) {
    errors.push(`Description exceeds maximum length of ${MAX_STRING_LEN} characters.`);
  }

  // 3. Subtitle / Target Audience
  const subtitle = typeof raw.subtitle === 'string' ? raw.subtitle.trim() : '';
  const targetAudience = typeof raw.targetAudience === 'string' ? raw.targetAudience.trim() : 'Custom Audience';
  const defaultPassAction: PassAction = raw.defaultPassAction === 'pass_left' ? 'pass_left' : 'pass_partner';

  // 4. Prompts array validation
  if (!Array.isArray(raw.prompts) || raw.prompts.length === 0) {
    errors.push('Deck must contain a non-empty prompts array.');
    return { valid: false, errors };
  }

  if (raw.prompts.length > MAX_PROMPT_COUNT) {
    errors.push(`Deck cannot contain more than ${MAX_PROMPT_COUNT} prompts.`);
    return { valid: false, errors };
  }

  // ID namespacing: ensure custom_ prefix
  const rawDeckId = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `deck_${Date.now()}`;
  const sanitizedDeckId = rawDeckId.startsWith('custom_') ? rawDeckId : `custom_${rawDeckId}`;

  const cleanPrompts: ConversationPrompt[] = [];

  raw.prompts.forEach((p, idx) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      errors.push(`Prompt #${idx + 1} must be an object.`);
      return;
    }

    const rp = p as Record<string, unknown>;

    // Tier check (1, 2, or 3)
    const tierNum = Number(rp.tier);
    if (![1, 2, 3].includes(tierNum)) {
      errors.push(`Prompt #${idx + 1} has invalid tier: must be 1, 2, or 3.`);
    }

    // Speaker prompt
    const speakerPrompt = String(rp.speakerPrompt || rp.speaker || '').trim();
    if (speakerPrompt.length === 0) {
      errors.push(`Prompt #${idx + 1} missing speakerPrompt.`);
    }

    // Listener prompt
    const listenerPrompt = String(rp.listenerPrompt || rp.listener || '').trim();
    if (listenerPrompt.length === 0) {
      errors.push(`Prompt #${idx + 1} missing listenerPrompt.`);
    }

    // Prompt ID with custom_ prefix
    const rawPid = typeof rp.id === 'string' && rp.id.trim() ? rp.id.trim() : `p_${idx + 1}`;
    const sanitizedPid = rawPid.startsWith('custom_') ? rawPid : `custom_${sanitizedDeckId}_${rawPid}`;

    const promptType = rp.type === 'wildcard' ? 'wildcard' : 'prompt';
    const passAction: PassAction = rp.passAction === 'pass_left' ? 'pass_left' : defaultPassAction;
    const tags = Array.isArray(rp.tags) ? rp.tags.map(t => String(t).slice(0, 50)) : [];

    cleanPrompts.push({
      id: sanitizedPid,
      tier: tierNum as TierLevel,
      type: promptType,
      speakerPrompt,
      listenerPrompt,
      passAction,
      tags
    });
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitizedDeck: DeckCatalog = {
    id: sanitizedDeckId,
    title: String(raw.title).trim(),
    subtitle,
    description,
    targetAudience,
    defaultPassAction,
    badge: `${cleanPrompts.length} Custom Cards`,
    isCustom: true,
    prompts: cleanPrompts
  };

  return { valid: true, errors: [], deck: sanitizedDeck };
}
