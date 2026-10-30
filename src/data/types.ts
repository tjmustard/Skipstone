export type PromptType = 'prompt' | 'wildcard';
export type PassAction = 'pass_partner' | 'pass_left';
export type TierLevel = 1 | 2 | 3;

export interface ConversationPrompt {
  id: string;                         // e.g. 'gen_t1_01'
  tier: TierLevel;                    // 1: Warm Up, 2: Vulnerability, 3: Core Truths
  type: PromptType;                   // 'prompt' | 'wildcard'
  speakerPrompt: string;              // Read aloud by the person holding phone
  listenerPrompt: string;             // Active listener attunement coaching
  passAction: PassAction;             // Physical device handoff instruction
  tags: string[];                     // Semantic tags
}

export interface DeckCatalog {
  id: string;                         // e.g. 'general_edition' or 'custom_123'
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  defaultPassAction: PassAction;
  participantMode?: string;
  themeColor?: string;
  badge?: string;
  isCustom?: boolean;
  prompts: ConversationPrompt[];
}

export interface EphemeralSessionPayload {
  deckId: string;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  drawnPromptIds: string[];
  activeCard: ConversationPrompt | null;
  previousCard: ConversationPrompt | null;
  soundEnabled: boolean;
  lastActiveTimestamp: number;        // For 15-min TTL expiry check
}
