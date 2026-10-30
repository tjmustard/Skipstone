# SuperPRD: Bilateral Turn Alternation & Role-Aware Shuffling

## Metadata
- **Project Name**: Skipstone
- **Feature Name**: Bilateral Turn Alternation & Role-Aware Shuffling
- **Version**: 1.1.0
- **Status**: Approved
- **Owner**: The Resolution Agent & tjmustard

---

## 1. Introduction & Goals

### 1.1 Problem Statement
Skipstone's parent-child conversational decks (`parent_child_5_8`, `parent_child_9_12`, `parent_child_13_17`, and `parent_child_adult`) currently present cards in a random or linear order without distinguishing between prompts intended for the parent to ask the child versus the child to ask the parent. In cross-generational intimacy dyads, roles are asymmetrical: developmental language, cognitive framing, and emotional vulnerability differ fundamentally between parent and child. Without bilateral alternation, one participant may ask multiple consecutive prompts, while prompts framed for a child may mistakenly be shown to the parent (or vice versa), eroding psychological safety and conversational flow.

### 1.2 Solution Overview
Implement role-aware bilateral turn alternation across Skipstone:
1. **Catalog Metadata & Prompt Tagging:** Tag prompts across the four parent-child catalogs with explicit `targetRole` tags (`roleA`, `roleB`, or `mutual`), while maintaining backwards-compatible non-bilateral handling for all other decks and custom decks.
2. **Dealer Role Pools & Alternating Draws:** `SmoothedBernoulliDealer` partitions active tier cards into `roleAPool`, `roleBPool`, and `wildcardPool`. Turn alternation draws strictly for the current speaker and toggles to the counterpart upon `nextCard()`.
3. **Dedicated Skip Action:** Add `[Skip Card ↷]`, allowing the current speaker to bypass a prompt without forfeiting their turn. Skipped cards are recycled to the back of the active role's pool without advancing `cardsAnsweredInTier` or toggling `activeRole`.
4. **Stateful 1-Step Undo:** Enhance `StateMachine` to track `previousActionType: 'NEXT' | 'SKIP'`, `previousRole`, and `previousCard`. Undo restores the exact prior state without role or counter corruption, and disables itself after a single invocation.
5. **Starter Role Selection:** In `BriefingView`, provide role selector pills allowing dyads to choose who asks the first question (defaulting to `roleA` if unselected).
6. **Mobile Ergonomics & Audio:** Guarantee zero horizontal overflow on $\ge 320\text{px}$ viewports with responsive compact labels (`[↩ Prev]`, `[Skip ↷]`, `[Next →]`) and $\ge 44\text{px}$ touch targets, alongside distinct audio feedback for skip vs next transitions.

### 1.3 Target Audience
Parent-child pairs, guardians, mentors, and generational dyads seeking structured, balanced, and developmentally attuned conversational vulnerability.

---

## 2. Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions & Resolved Vulnerabilities:**
  1. *Undo State Symmetry & Counter Corruption (Red Team #2 & #4):* Resolved with a stateful 1-step undo ledger tracking `previousActionType: 'NEXT' | 'SKIP'`, `previousRole`, and `previousCard`. Role toggle and `cardsAnsweredInTier` decrement only occur if the prior action was `NEXT`. Button disables immediately after 1 invocation.
  2. *Session Rehydration & Dealer Desynchronization (Red Team #1 & #5):* Resolved via filtered pool rehydration and catalog version validation. `activeRole`, `startingRole`, and `drawnPromptIds` are persisted in `EphemeralSessionPayload`. On restore, dealer filters drawn IDs from role pools. Stale or invalid sessions gracefully purge to `DECK_SELECT`.
  3. *Role Architecture Normalization (Red Team #1):* Resolved by declaring explicit `roleA: string`, `roleB: string`, and `roleLabels` in `DeckCatalog` metadata. Decks without bilateral metadata fall back seamlessly to classic linear dealing. Custom deck validator permits optional bilateral properties.
  4. *Wildcard Skip & Drought Pacing (Red Team #5):* Resolved by recycling skipped wildcards to the back of `wildcardPool`, resetting `cardsSinceWildcard = 3` (minimum spacing), and immediately drawing a regular prompt for the active role.
  5. *Single-Card Skip Exhaustion (Red Team #4):* Resolved by disabling `[Skip Card]` when the active role pool has $\le 1$ prompt remaining.
  6. *Transition Debouncing (Red Team #7):* Resolved via a 350ms lockout flag in `StateMachine` (`isTransitioning = true`) guarding Next, Skip, and Previous across all input methods.
  7. *Mobile Viewport Fit (Red Team #8):* Resolved via responsive compact labels on $\le 360\text{px}$ viewports while maintaining $\ge 44\text{px}$ touch targets.
  8. *Audio Safety & Distinct Cue (Red Team #3 & #7):* Resolved by adding `playCardSkip()` double-tick sound and wrapping all Web Audio calls in safe promise catch handlers for suspended context.
  9. *Deterministic Testing (Red Team #8):* Runtime code is 100% deterministic; all Vitest dealer tests enforce fixed PRNG seeds to guarantee zero CI flakiness.

---

## 3. Scope

### 3.1 In-Scope
- **`src/data/types.ts`:** Add `targetRole` to `ConversationPrompt`; add `isBilateral`, `roleA`, `roleB`, and `roleLabels` to `DeckCatalog`; update `EphemeralSessionPayload` with `activeRole`, `startingRole`, `previousRole`, and `lastActionWasSkip`.
- **`src/data/catalogs/`:** Tag prompts across 4 parent-child catalogs (`parent_child_5_8`, `parent_child_9_12`, `parent_child_13_17`, `parent_child_adult`) with appropriate `targetRole` values (`roleA`, `roleB`, or `mutual`).
- **`src/data/validator.ts`:** Support optional bilateral fields without schema errors for imported custom decks.
- **`src/core/dealer.ts` (`SmoothedBernoulliDealer`):** Partition cards by role into `roleAPool`, `roleBPool`, and `wildcardPool`. Add role-aware `drawNext(role)` and `skipCurrent(card, role)`. Implement filtered rehydration from `drawnPromptIds`. Maintain classic linear fallback for non-bilateral decks.
- **`src/core/state.ts` (`StateMachine`):** Support bilateral turn alternation, starter role initialization, `skipCard()` transition, stateful 1-step undo, 350ms transition debounce lockout, and session compatibility validation.
- **`src/core/audio.ts`:** Add `playCardSkip()` distinct acoustic cue and wrap AudioContext calls in safe error handling.
- **`src/ui/views/BriefingView.ts`:** Render starter role pills for bilateral decks; default gracefully to `roleA` if unselected.
- **`src/ui/views/SplitGameView.ts`:** Display speaker role badge (`[Speaker: Parent]` / `[Speaker: Child]` / `[Mutual - Both Answer]`), active listener coaching counter, `[Skip Card ↷]` button, and responsive button styling for $\le 360\text{px}$ screens.
- **`tests/`:** Unit and integration test coverage for bilateral alternation, skip semantics, undo symmetry, rehydration, and responsive layout.

### 3.2 Out-of-Scope
- Modifications to non-bilateral decks (`general_edition`, `dating_courtship`, `lovers_committed`, `family_circles`).
- Multi-party bilateral turn rotation (>2 roles).
- Permanent card deletion or discarding on skip.
- Server-side synchronization, user accounts, or telemetry.

---

## 4. User Stories (Atomic)

| ID | User Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **US-001** | As a parent opening a parent-child deck, I want to choose who asks the first question in the briefing view, so that we can establish comfort before beginning. | 1. BriefingView displays role selector pills for bilateral decks.<br>2. Selected role is stored in state as `startingRole` and `activeRole`.<br>3. If no pill is clicked, defaults to `roleA`.<br>4. Non-bilateral decks do not display starter pills. | High |
| **US-002** | As a speaker holding the phone, I want to see clearly whose turn it is on the card, so that I know whether to read or listen. | 1. SplitGameView renders role badge indicating active speaker.<br>2. For mutual cards, badge renders `[Mutual - Both Answer]`.<br>3. Listener Zone displays prompt guidance for the active listener. | High |
| **US-003** | As an active speaker, I want to advance to the next card so that turn passes to my conversational partner. | 1. Tapping `[Next Card →]` increments `cardsAnsweredInTier`.<br>2. Alternates `activeRole` to the opposite role.<br>3. Plays slide chime audio cue.<br>4. Re-enables `[Previous Card]`. | High |
| **US-004** | As a speaker facing an uncomfortable or unsuited prompt, I want to skip it without losing my turn, so that I receive another prompt meant for me. | 1. Tapping `[Skip Card ↷]` draws next prompt for current role.<br>2. Does NOT increment `cardsAnsweredInTier`.<br>3. Does NOT toggle `activeRole`.<br>4. Moves skipped card to back of active role pool.<br>5. Plays distinct skip tick audio cue. | High |
| **US-005** | As a user who accidentally tapped Next or Skip, I want to tap Previous Card to restore the previous state without corrupting our turn or level progression. | 1. Tapping `[↩ Prev]` restores previous card and previous role.<br>2. If previous action was `NEXT`, decrements `cardsAnsweredInTier` and restores previous role.<br>3. If previous action was `SKIP`, restores previous card without altering counter or role.<br>4. Button disables immediately after 1 tap. | High |
| **US-006** | As a user on a small mobile device (320px width), I want all navigation buttons to fit cleanly without overlapping or horizontal scrolling. | 1. Navigation buttons use compact labels on viewports $\le 360\text{px}$ (`[↩ Prev]`, `[Skip ↷]`, `[Next →]`).<br>2. Touch targets maintain $\ge 44\text{px} \times 44\text{px}$.<br>3. Zero horizontal scrollbar or clipping. | High |

---

## 5. Technical Specifications (The Blueprint)

### 5.1 Architecture & Resolved Trade-offs

#### Architecture Flow
```
BriefingView (Starter Role Selection)
   │
   ▼
StateMachine.startSession(deck, starterRole)
   │
   ▼
SmoothedBernoulliDealer.loadDeck(deck, drawnIds)
   ├── roleAPool (filtered of drawnIds)
   ├── roleBPool (filtered of drawnIds)
   └── wildcardPool (filtered of drawnIds)
   │
   ▼
Game Loop in SplitGameView:
   ├── Action: nextCard()
   │     ├── Record { type: 'NEXT', card: currentCard, role: activeRole }
   │     ├── cardsAnsweredInTier++
   │     ├── activeRole = toggleRole(activeRole)
   │     └── drawNext(activeRole)
   │
   ├── Action: skipCard()
   │     ├── Record { type: 'SKIP', card: currentCard, role: activeRole }
   │     ├── recycleCard(currentCard, activeRole)
   │     └── drawNext(activeRole) [cardsAnsweredInTier unchanged, activeRole unchanged]
   │
   └── Action: previousCard() (1-step only)
         ├── if lastAction.type === 'NEXT':
         │     ├── cardsAnsweredInTier--
         │     └── activeRole = lastAction.role
         ├── if lastAction.type === 'SKIP':
         │     └── (cardsAnsweredInTier & activeRole untouched)
         ├── restore card = lastAction.card
         └── disable [Previous Card]
```

#### Resolved Trade-offs Log
1. **Issue:** Undo state symmetry & counter corruption on `previousCard()`.
   - **Options Considered:** Option A: Stateful 1-step undo ledger vs Option B: Multi-step historical stack vs Option C: Next-only undo.
   - **Resolution:** Adopted Option A. Stateful 1-step undo ledger (`previousActionType`, `previousRole`, `previousCard`). Only toggles role and decrements counter if prior action was `NEXT`. Disables button immediately after 1 use.
2. **Issue:** Session rehydration, catalog poisoning & pool desynchronization on page reload.
   - **Options Considered:** Option A: Filtered pool rehydration + catalog compatibility guard vs Option B: Full dealer internal state serialization vs Option C: Stateless reload reset.
   - **Resolution:** Adopted Option A. Persist `activeRole`, `startingRole`, and `drawnPromptIds`. Dealer filters drawn IDs from role pools on rehydrate. Purges stale/corrupt session to `DECK_SELECT` if catalog version/prompt IDs don't match.
3. **Issue:** Role architecture normalization & custom deck validation.
   - **Options Considered:** Option A: Explicit `roleA`/`roleB` metadata + classic fallback vs Option B: Dynamic ad-hoc role inference vs Option C: Hardcoded global role pairs.
   - **Resolution:** Adopted Option A. Decks define `roleA: string`, `roleB: string`, and `roleLabels`. Prompts match `roleA`, `roleB`, or `mutual`. Non-bilateral and custom decks fall back safely to classic linear dealing.
4. **Issue:** Wildcard skip behavior & drought guard pacing.
   - **Options Considered:** Option A: Recycle wildcard + reset `cardsSinceWildcard = 3` vs Option B: Treat wildcard skip as consumed vs Option C: Disallow skipping wildcards.
   - **Resolution:** Adopted Option A. Recycle wildcard to tail of `wildcardPool`, set `cardsSinceWildcard = 3` (minimum spacing), and draw a regular prompt for current role.
5. **Issue:** NFR defaults for debounce, TTL, exhaustion guard, and 320px viewport fit.
   - **Resolution:** Approved defaults: 350ms lockout flag in `StateMachine`; 15-minute inactivity TTL refreshed on `visibilitychange === 'visible'`; disable skip button when active pool $\le 1$; responsive compact labels on $\le 360\text{px}$; distinct skip tick audio cue with safe AudioContext error handling.
6. **Issue:** Candidate artifacts & test determinism.
   - **Resolution:** Zero candidate artifacts; 100% deterministic code and data; fixed PRNG seeds in all Vitest tests.

---

### 5.2 System Graph Blast Radius
The following nodes in `spec/compiled/architecture.yml` are modified:
- `module_prompt_catalogs`: Catalog schema types and bilateral parent-child prompt data.
- `module_core_engine`: Dealer role partitioning, stateful undo, rehydration, skip transition, audio cues.
- `module_ui_shell`: Briefing role pills, role attribution badge, skip button, responsive button bar.
- `module_custom_decks`: Schema validator compatibility for optional bilateral properties.
- `module_verification_suite`: Unit and integration test coverage with fixed PRNG seeds.

---

### 5.3 Execution Checklist (MiniPRDs)
The following modular PRDs execute this SuperPRD in isolated branches:
- [ ] `spec/compiled/MiniPRD_Prompt_Catalogs.md` (Data schemas, parent-child catalog tagging, validator compatibility)
- [ ] `spec/compiled/MiniPRD_Core_Engine.md` (Dealer role partitioning, state machine transitions, undo ledger, audio cues)
- [ ] `spec/compiled/MiniPRD_UI_Shell.md` (BriefingView starter pills, SplitGameView role badge & skip button, 320px responsiveness)

---

### 5.4 API Contracts & Schemas

```typescript
// src/data/types.ts
export type TierLevel = 1 | 2 | 3;
export type PromptType = 'standard' | 'wildcard';
export type PassAction = 'pass_phone' | 'hold_and_read' | 'together';

export interface ConversationPrompt {
  id: string;
  tier: TierLevel;
  type: PromptType;
  targetRole?: string;                // e.g. 'roleA', 'roleB', 'mutual'
  speakerPrompt: string;
  listenerPrompt: string;
  passAction: PassAction;
  tags: string[];
}

export interface DeckCatalog {
  id: string;
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
  lastActiveTimestamp: number;
}
```

---

### 5.5 Dependencies
- Zero external runtime dependencies (pure TypeScript, Web Audio API, Web Storage API).
- Vitest for deterministic test execution.

---

## 6. Negative Constraints
- **DO NOT** modify non-bilateral decks (`general_edition`, `dating_courtship`, `lovers_committed`, `family_circles`). Non-bilateral decks must continue drawing seamlessly from a single unified pool.
- **DO NOT** increment `cardsAnsweredInTier` when a user taps "Skip Card". Tier progression must reflect answered prompts only.
- **DO NOT** toggle `activeRole` on "Skip Card". The device must stay with the current speaker until "Next Card" is pressed.
- **DO NOT** allow `[↩ Previous Card]` to be invoked multiple times in succession. It is strictly a 1-step undo and must disable itself immediately upon use.
- **DO NOT** introduce network calls, cloud state, telemetry, or user authentication. Skipstone is 100% offline-first.
- **DO NOT** reduce touch targets below $44\text{px} \times 44\text{px}$ or create horizontal overflow on viewports down to 320px width.
- **DO NOT** discard skipped cards permanently—place them at the back of the active role's pool.

---

## 7. Risks & Mitigation
- **Risk 1: Role pool starvation or asymmetry in small custom decks.**  
  *Mitigation:* Check active pool length; if $\le 1$ prompt remaining, disable Skip button. Fall back gracefully to classic dealing if deck lacks bilateral metadata.
- **Risk 2: Double-tap race conditions on mobile.**  
  *Mitigation:* 350ms transition debounce lockout in `StateMachine` (`isTransitioning = true`), rejecting concurrent transitions from any input source.
- **Risk 3: AudioContext suspended state throwing uncaught exceptions on mobile unlock.**  
  *Mitigation:* Wrap all audio synthesis invocations in safe promise catch handlers in `src/core/audio.ts`.
- **Risk 4: Session corruption across PWA updates or invalid storage.**  
  *Mitigation:* Validate session against active catalog prompt IDs in `tryRestoreSession()`; safely purge and redirect to `DECK_SELECT` if invalid. Wrap storage writes in try/catch for private browsing support.

---

## 8. Success Metrics
- 100% test pass rate in Vitest verification suite across bilateral dealer, state transitions, undo symmetry, and UI rendering.
- Zero horizontal layout overflow or touch target violations ($\ge 44\text{px}$) on 320px viewport.
- Sub-50ms draw and skip transition latency on low-end mobile devices.
- Gzipped catalog payload remains well within PWA performance budget.
