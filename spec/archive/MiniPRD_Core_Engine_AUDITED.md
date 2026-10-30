# MiniPRD: Core Engine Bilateral Dealing & State Machine

**Hypergraph Node ID:** module_core_engine  
**Parent Node:** system_skipstone  

## 1. The Confidence Mandate
- **Confidence Score:** 10/10
- **Clarifying Questions:** None. All state machine transitions, dealer role pools, 1-step undo symmetry, debounce locking, rehydration filtering, and audio cues have been mediated and approved.

## 2. Atomic User Stories
- **US-ENG-01:** As the core engine, I want to partition active tier cards into `roleAPool`, `roleBPool`, and `wildcardPool` so that draws strictly provide prompts matching the active speaker's role.
- **US-ENG-02:** As a speaker, I want `nextCard()` to alternate the active role to my partner and increment `cardsAnsweredInTier`.
- **US-ENG-03:** As a speaker, I want `skipCard()` to draw another prompt for my current role, recycle the skipped card to the back of the pool, and leave `cardsAnsweredInTier` and `activeRole` unchanged.
- **US-ENG-04:** As a user tapping `previousCard()`, I want the exact prior card and role restored without corrupting the answer counter, and I want the previous button immediately disabled to prevent ping-pong corruption.
- **US-ENG-05:** As a user whose phone locks during a deep conversation, I want the session to rehydrate cleanly from `sessionStorage` without drawing duplicate cards or crashing.

## 3. Implementation Plan (Task List) — 100% Complete ✅
- [x] **Task 1 (Dealer Role Pools):** In `src/core/dealer.ts`, extend `SmoothedBernoulliDealer` with role-aware pools (`roleAPool`, `roleBPool`, `wildcardPool`) populated in `loadDeck()`. If deck is not bilateral, retain existing unified pool dealing. ✅
- [x] **Task 2 (Dealer Drawing & Skipping):** Implement `drawNext(role?: string): ConversationPrompt | null` and `skipCurrent(card: ConversationPrompt, role: string): ConversationPrompt | null`. Skipped standard cards are pushed to the back of the respective role pool. Skipped wildcards are pushed to `wildcardPool` and reset `cardsSinceWildcard = 3`. ✅
- [x] **Task 3 (Dealer Pool Rehydration):** Update `loadDeck(deck, currentTier, drawnPromptIds)` to filter already-drawn prompt IDs from role pools, preventing immediate redraw of previously answered cards on session reload. ✅
- [x] **Task 4 (State Machine Session & Role Setup):** In `src/core/state.ts`, update `startSession(deckId, starterRole?)` to initialize `startingRole` and `activeRole` (defaulting to `deck.roleA` if unprovided). ✅
- [x] **Task 5 (State Machine Skip Transition):** Implement `skipCard()` in `StateMachine`:
  - Assert `!this.isTransitioning`.
  - Record `{ type: 'SKIP', card: this.state.activeCard, role: this.state.activeRole }` in undo ledger.
  - Draw next card for current `activeRole` via `dealer.skipCurrent(card, activeRole)`.
  - Maintain `cardsAnsweredInTier` and `activeRole` intact. ✅
- [x] **Task 6 (State Machine Stateful Undo):** Update `previousCard()` in `StateMachine`:
  - If previous action was `'NEXT'`, decrement `cardsAnsweredInTier` and restore `previousRole`.
  - If previous action was `'SKIP'`, restore previous card while leaving `cardsAnsweredInTier` and `activeRole` unchanged.
  - Disable further undo operations until another forward transition occurs (`hasUndoAvailable = false`). ✅
- [x] **Task 7 (Transition Debounce):** Add `isTransitioning: boolean` (350ms lockout) to `StateMachine` around `nextCard()`, `skipCard()`, and `previousCard()`. ✅
- [x] **Task 8 (Audio Synthesis):** In `src/core/audio.ts`, add `playCardSkip()` emitting a distinct double-tick sound. Wrap all Web Audio operations in safe error handling for suspended `AudioContext`. ✅
- [x] **Task 9 (Storage Persistence):** In `src/core/storage.ts`, add `activeRole`, `startingRole`, `previousRole`, and `previousActionType` to `EphemeralSessionPayload`. Add validation in `tryRestoreSession()` to purge stale sessions if catalog IDs or tiers are mismatched. ✅
- [x] **Task 10 (Unit Tests):** In `tests/dealer.test.ts` and `tests/state.test.ts`, implement deterministic tests with fixed PRNG seeds covering: role alternation, skip card isolation, stateful 1-step undo, session rehydration, and debounce lockout. ✅

## 4. The Negative Space (Constraints)
- **DO NOT** toggle `activeRole` or increment `cardsAnsweredInTier` on `skipCard()`.
- **DO NOT** allow `previousCard()` to be called more than once consecutively.
- **DO NOT** alter dealer behavior for non-bilateral decks.
- **DO NOT** use unseeded PRNG in Vitest tests.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Load `parent_child_5_8` with starter role `'parent'`. Call `nextCard()` → verify active card is for `'child'`, `cardsAnsweredInTier === 1`. Call `skipCard()` → verify active card is still for `'child'`, `cardsAnsweredInTier === 1`. Call `previousCard()` → verify active card is returned to previous child card, counter remains 1, active role remains `'child'`.
- **Test 2 (Deterministic):** Call `nextCard()` from role `'child'` → verify turn passes to `'parent'`, `cardsAnsweredInTier === 2`. Call `previousCard()` → verify card returned to prior child card, counter drops to 1, active role restores to `'child'`, and a second consecutive call to `previousCard()` is rejected.
