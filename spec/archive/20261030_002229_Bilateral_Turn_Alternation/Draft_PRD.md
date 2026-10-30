# SuperPRD: Bilateral Turn Alternation & Role-Aware Shuffling for Parent-Child Decks

## Metadata
- **Project Name**: Skipstone
- **Feature Name**: Bilateral Turn Alternation & Role-Aware Shuffling for Parent-Child Decks
- **Version**: 1.2.0
- **Status**: Draft
- **Author**: The Architect Agent & tjmustard

---

## 1. Introduction & Goals

### 1.1 Problem Statement
In previous iterations of Skipstone's parent-child catalogs (Ages 5–8, Pre-Teen 9–12, Teen 13–17, and Adult Offspring), all prompts were strictly unidirectional—written solely from the parent's point of view asking questions of their child. This established an asymmetric dynamic where the child was always in the hot seat answering inquiries rather than engaging in authentic, reciprocal vulnerability.

Four newly generated bilateral decks (`SI/parent_child_bilateral_deck_ages_5_8.md`, `SI/parent_pre_teen_bilateral_deck_ages_9_12.md`, `SI/parent_teen_bilateral_deck_ages_13_17.md`, and `SI/parent_adult_child_bilateral_deck_ages_18.md`) provide balanced, two-way conversational prompts with explicit role targets (`child_asks_parent`, `parent_asks_child`, `preteen_asks_parent`, `parent_asks_preteen`, `teen_asks_parent`, `parent_asks_teen`, `adult_child_asks_parent`, `parent_asks_adult_child`, and `mutual` wildcards). However, Skipstone's current `SmoothedBernoulliDealer` and `StateMachine` operate on a single flat prompt pool without role partitioning, alternating turn enforcement, or role-preserving skip logic.

### 1.2 Solution Overview
Transform Skipstone's card engine into a role-aware bilateral dialogue system:
1. **Catalog Replacement & Schema Enrichment:** Update `ConversationPrompt` in `src/data/types.ts` with `targetRole?: string`. Directly replace the 4 legacy unidirectional JSON catalogs in `src/data/catalogs/` with the compiled bilateral decks under their established canonical IDs (`parent_child_5_8`, `parent_child_9_12`, `parent_child_13_17`, `parent_child_adult_offspring`).
2. **Initial Speaker Selection:** In `BriefingView`, bilateral decks prompt participants with two ergonomic starter pill buttons (e.g. `[Parent starts]` / `[Child / Teen starts]`), defaulting to `Parent starts`.
3. **Role-Aware Smoothed Bernoulli Dealer:** Update `SmoothedBernoulliDealer` to partition prompts within each tier into role pools (`roleAPool`, `roleBPool`) and a shared `wildcardPool`. Maintains independent PRNG shuffles, zero-repeat cycling per role, and smoothed Bernoulli wildcard insertion.
4. **Bilateral Turn Alternation (`nextCard`):** Answering a prompt and advancing hands the device off, alternating the active role (Role A $\leftrightarrow$ Role B) and drawing from the corresponding role pool. Completing a mutual wildcard alternates to the partner on Next.
5. **Role-Preserving Skip Action (`skipCard`):** Introduce an explicit "Skip Card" action in `SplitGameView` and `StateMachine`. Skipping draws a new card specifically for the *current speaker role* without advancing the turn, places the skipped card to the back of that role's pool, and does *not* increment `cardsAnsweredInTier`.
6. **Mobile Ergonomics & Accessibility:** Position `[Skip Card]` between `[↩ Previous]` and `[Next Card →]` with $\ge 44\text{px}$ touch targets, preserving the stacked row layout for the persistent tier progression button.
7. **Ephemeral Session Resilience:** Persist `activeRole` and `startingRole` in `EphemeralSessionPayload` with 15-minute TTL to survive screen locks or reloads.

### 1.3 Target Audience
Parent-child dyads across childhood, pre-teen, adolescent, and adult stages seeking reciprocal conversational intimacy, mutual active listening, and balanced vulnerability without unilateral power dynamics.

---

## 2. Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions Resolved:**
  1. *Deck Deployment Strategy:* The 4 new bilateral decks replace existing catalogs under identical IDs to preserve bookmarks, registry routes, and catalog stability.
  2. *Initial Turn Selection:* Selected via two distinct pill buttons in `BriefingView` prior to session launch.
  3. *Skip Mechanics:* Skipping does not increment `cardsAnsweredInTier`, recycles the skipped prompt to the back of the role pool, and retains the active role.
  4. *Mutual Wildcard Turn Flow:* Read by active speaker; "Next Card" passes the phone and switches roles; "Skip Card" stays on the active speaker and draws a regular prompt for that role.
  5. *Testing & Determinism:* 100% deterministic via PRNG seed; zero non-deterministic runtime AI; fully covered by Vitest suites without Candidate Artifact routing.

---

## 3. Scope

### 3.1 In-Scope
- **Schema & Types:** Adding `targetRole?: string` to `ConversationPrompt` and bilateral metadata flags to `DeckCatalog` (`isBilateral?: boolean`, `roleA?: string`, `roleB?: string`, `roleLabels?: { [key: string]: string }`).
- **Catalogs:** Compiling and formatting `SI/parent_*_bilateral_deck_*.md` into JSON catalogs in `src/data/catalogs/`.
- **Dealer Engine:** Updating `SmoothedBernoulliDealer` in `src/core/dealer.ts` to manage dual role pools and shared wildcard pool with deterministic Mulberry32 shuffling.
- **State Machine:** Implementing `skipCard()`, `selectStartingRole()`, role-toggling in `nextCard()`, 1-step undo role restoration in `previousCard()`, and updating `EphemeralSessionPayload` in `src/core/storage.ts`.
- **UI Shell:**
  - Two starter pill buttons in `src/ui/views/BriefingView.ts` for bilateral decks.
  - Active speaker badge/label in `SplitGameView.ts` (e.g., `[Parent's Turn to Ask]` vs `[Child's Turn to Ask]`).
  - Dedicated `[Skip Card ↷]` button in `SplitGameView.ts` navigation bar.
- **Regression Test Suites:** Comprehensive unit and integration test coverage for role alternation, skip behavior, pool recycling, and session storage persistence.

### 3.2 Out-of-Scope
- Dynamic audio generation for role names (existing sound synthesis chimes remain unchanged).
- Software authentication, passwords, or PIN gates for role switching (trust-based physical handoff).
- Unilateral or multi-group (>2 participant) role alternation for General Edition or Dating decks.
- Cloud persistence or cross-device synchronization.

---

## 4. User Stories (Atomic)

| ID | User Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **US-001** | As a parent opening a bilateral deck, I want to choose who holds the phone first so that our conversation starts with the right speaker. | 1. `BriefingView` renders two distinct starter pills: e.g. `[Parent Starts]` and `[Child Starts]`.<br>2. Selecting a pill updates `startingRole` and `activeRole`.<br>3. Tapping "Begin Conversation" launches `SplitGameView` with a card drawn from the chosen role's pool. | High |
| **US-002** | As an active speaker finishing a card, I want to tap "Next Card" and hand the phone off so that the other participant receives a card tailored for them to ask. | 1. Tapping `Next Card →` toggles `activeRole` to the reciprocal role.<br>2. Dealer draws a prompt matching the new `activeRole`.<br>3. Speaker zone reflects the new speaker prompt and active role badge.<br>4. Increments `cardsAnsweredInTier`. | High |
| **US-003** | As an active speaker who encounters an awkward or uncomfortable question, I want to tap "Skip Card" so that I get a different question for myself without losing my turn. | 1. Tapping `[Skip Card ↷]` draws the next card from the *same* role pool.<br>2. `activeRole` remains unchanged.<br>3. Skipped card is placed at the back of that role's remaining pool.<br>4. `cardsAnsweredInTier` is NOT incremented. | High |
| **US-004** | As participants engaging in a bilateral conversation, I want wildcards to be shared mutual experiences that still preserve turn order. | 1. Mutual wildcards can appear during either participant's turn based on smoothed Bernoulli spacing.<br>2. Completing a wildcard and tapping "Next Card" alternates the turn to the partner.<br>3. Skipping a wildcard draws a regular prompt for the *current* speaker role. | Medium |
| **US-005** | As a user who accidentally tapped "Skip" or "Next", I want to tap "Previous Card" to return to the card and role I just had. | 1. Tapping `[↩ Previous Card]` restores the previous `activeCard` and previous `activeRole`.<br>2. If returning from an answered card, decrements `cardsAnsweredInTier`. | Medium |
| **US-006** | As a mobile user, I want the Skip button and role indicators to fit comfortably on 320px–640px screens without displacing Tier Progression buttons. | 1. Bottom navigation comfortably houses `Previous`, `Skip`, and `Next` buttons with $\ge 44\text{px}$ touch targets.<br>2. Persistent Tier Progression button continues to dock above in its own dedicated row when unlocked.<br>3. All text labels remain free of awkward wrapping or truncation. | High |

---

## 5. Technical Specifications

### 5.1 Architecture & Resolved Trade-offs
- **Pool Partitioning vs Composite Key Sorting:** Instead of attempting to sort a mixed array with probabilistic filter passes, `SmoothedBernoulliDealer` partitions prompts at `loadDeck` / `setTier` time into:
  - `roleAPool`: Shuffled array of regular prompts for Role A.
  - `roleBPool`: Shuffled array of regular prompts for Role B.
  - `wildcardPool`: Shuffled array of `mutual` wildcards.
- **Independent Pool Recycling:** When `roleAPool` empties, it reshuffles Role A cards independently without affecting `roleBPool`. This guarantees zero repeat prompts for either participant until their specific pool is exhausted.
- **Non-Bilateral Fallback:** For standard decks (e.g. `general_edition`, `dating_courtship`), the dealer operates in classic single-pool mode, ensuring 100% backwards compatibility.
- **Skip Semantics:** Skip is distinct from Next. Next denotes prompt completion + device pass (increments counter, flips role). Skip denotes prompt bypass (leaves counter intact, keeps role).

### 5.2 System Graph Blast Radius (`spec/compiled/architecture.yml`)
- `module_prompt_catalogs`:
  - `src/data/types.ts`: Adds `targetRole?: string` to `ConversationPrompt`, `isBilateral?: boolean`, `roleA?: string`, `roleB?: string`, `roleLabels?: Record<string, string>` to `DeckCatalog`.
  - `src/data/catalogs/`: Replaces `parent_child_5_8.json`, `parent_child_9_12.json`, `parent_child_13_17.json`, and `parent_child_adult_offspring.json`.
- `module_core_engine`:
  - `src/core/dealer.ts`: Dual role pools, role-aware `drawNext(role?: string)`, and `skipCard(currentCard)`.
  - `src/core/state.ts`: `activeRole`, `startingRole`, `skipCard()`, `selectStartingRole()`, updated `nextCard()` and `previousCard()`.
  - `src/core/storage.ts`: Persistence of `activeRole` and `startingRole` in `EphemeralSessionPayload`.
- `module_ui_shell`:
  - `src/ui/views/BriefingView.ts`: Starter role selection pills.
  - `src/ui/views/SplitGameView.ts`: Role indicator pill, `[Skip Card ↷]` button, updated responsive layout.

### 5.3 Execution Checklist (MiniPRD Decomposition)
1. **MiniPRD 1: Data Schema & Bilateral Catalog Ingestion**
   - Update `src/data/types.ts`.
   - Ingest and compile the 4 SI bilateral catalogs into `src/data/catalogs/`.
   - Update catalog metadata and registry entries.
2. **MiniPRD 2: Bilateral Dealer & State Machine Engine**
   - Implement role partitioning, independent shuffle pools, and recycling in `SmoothedBernoulliDealer`.
   - Implement `activeRole` tracking, `skipCard()`, `selectStartingRole()`, and session persistence in `StateMachine` and `EphemeralStorageManager`.
   - Unit tests for dealer and state machine logic.
3. **MiniPRD 3: Bilateral UI Controls & Responsive Shell**
   - Add starter role picker pills in `BriefingView.ts`.
   - Add role attribution badge and `[Skip Card ↷]` button in `SplitGameView.ts`.
   - Update gesture controls and verify $\ge 44\text{px}$ touch targets on 320px–640px viewports.
   - Comprehensive integration testing and regression suite verification.

### 5.4 API Contracts & Schemas

```typescript
// src/data/types.ts additions
export interface ConversationPrompt {
  id: string;
  tier: TierLevel;
  type: PromptType;
  targetRole?: string;                // e.g. 'parent_asks_child', 'child_asks_parent', 'mutual'
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
  isBilateral?: boolean;              // Flag indicating alternating turn logic
  roleA?: string;                     // e.g. 'parent_asks_child'
  roleB?: string;                     // e.g. 'child_asks_parent'
  roleLabels?: {                      // Human-readable pill titles
    roleA: string;                    // e.g. 'Parent'
    roleB: string;                    // e.g. 'Child'
  };
  prompts: ConversationPrompt[];
}

export interface EphemeralSessionPayload {
  deckId: string;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  drawnPromptIds: string[];
  activeCard: ConversationPrompt | null;
  previousCard: ConversationPrompt | null;
  activeRole?: string | null;         // Currently active turn role
  startingRole?: string | null;       // Selected initial role
  soundEnabled: boolean;
  hasShownProgressionForTier?: boolean;
  lastActiveTimestamp: number;
}
```

---

## 6. Negative Constraints
- **DO NOT** modify non-bilateral decks (`general_edition`, `dating_courtship`, `lovers_committed`, `family_circles`). Non-bilateral decks must continue drawing seamlessly from a single unified pool.
- **DO NOT** increment `cardsAnsweredInTier` when a user taps "Skip Card". Tier progression must reflect answered prompts only.
- **DO NOT** toggle `activeRole` on "Skip Card". The device must stay with the current speaker until "Next Card" is pressed.
- **DO NOT** introduce network calls, cloud state, telemetry, or user authentication. Skipstone is 100% offline-first.
- **DO NOT** reduce touch targets below $44\text{px} \times 44\text{px}$ or create horizontal overflow on viewports down to 320px width.
- **DO NOT** discard skipped cards permanently—place them at the back of the active role's pool.

---

## 7. Risks & Mitigation
- **Risk 1: Role Pool Imbalance:** If a tier has unequal counts of Role A vs Role B cards, one pool could exhaust prematurely.
  - *Mitigation:* The 4 SI catalogs have strictly balanced prompt counts per tier. In addition, independent role pool recycling ensures that if one pool exhausts, it reshuffles and cycles cleanly without stalling the game.
- **Risk 2: Accidental Double-Tap on Skip or Next:** Rapid consecutive taps could cause desynchronized turn alternation.
  - *Mitigation:* Apply standard button debouncing (e.g. 300ms–400ms guard) during card transitions.
- **Risk 3: Session Reload Losing Turn Identity:** Reloading or unlocking the phone could revert turn to default parent role.
  - *Mitigation:* `activeRole` and `startingRole` are stored in `EphemeralSessionPayload` via `EphemeralStorageManager.saveSession()` on every state change.

---

## 8. Success Metrics
- 100% of parent-child decks in `SI/` converted to bilateral reciprocal conversation cards.
- 100% deterministic test pass rate in Vitest for alternating turns, skip role-preservation, and seedable draws.
- Zero layout shift, horizontal clipping, or touch target violations on mobile viewports ($\ge 320\text{px}$).
- Zero regression across existing non-bilateral decks, tier progression modal, or grounding checkout flows.
