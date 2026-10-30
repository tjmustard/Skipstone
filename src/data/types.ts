export type PromptType = 'prompt' | 'wildcard';
export type PassAction = 'pass_partner' | 'pass_left';
export type TierLevel = 1 | 2 | 3;

export interface ConversationPrompt {
  id: string;                         // e.g. 'gen_t1_01'
  tier: TierLevel;                    // 1: Warm Up, 2: Vulnerability, 3: Core Truths
  type: PromptType;                   // 'prompt' | 'wildcard'
  targetRole?: string;                // e.g. 'roleA', 'roleB', 'mutual'
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
  isBilateral?: boolean;              // Flag indicating bilateral turn alternation
  roleA?: string;                     // e.g. 'parent'
  roleB?: string;                     // e.g. 'child'
  roleLabels?: {                      // Human-readable pill titles
    roleA: string;                    // e.g. 'Parent'
    roleB: string;                    // e.g. 'Child'
  };
  prompts: ConversationPrompt[];
}

export type ActionType = 'NEXT' | 'SKIP';

export interface EphemeralSessionPayload {
  deckId: string;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  drawnPromptIds: string[];
  activeCard: ConversationPrompt | null;
  previousCard: ConversationPrompt | null;
  activeRole?: string | null;         // Currently active turn role
  startingRole?: string | null;       // Selected initial role
  previousRole?: string | null;       // Prior turn role for 1-step undo
  previousActionType?: ActionType | null; // Prior transition type for 1-step undo
  soundEnabled: boolean;
  hasShownProgressionForTier?: boolean;
  lastActiveTimestamp: number;        // For 15-min TTL expiry check
}
