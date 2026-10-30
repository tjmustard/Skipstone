# Red Team Report: Adversarial Analysis of Bilateral Turn Alternation & Role-Aware Shuffling

**Target Document:** `spec/active/Draft_PRD.md`  
**System Graph Baseline:** `spec/compiled/architecture.yml`  
**Evaluation Role:** Red Team Agent  
**Status:** Hostile Technical Evaluation  

---

## Executive Summary & System Blast Radius

The proposed specification introduces bilateral turn alternation and role-partitioned prompt dealing to Skipstone's parent-child decks. While the high-level intent is clear, the architecture exposes several critical resilience, state mutation, and edge-case failure modes across three primary hypergraph nodes:
1. `module_prompt_catalogs`: Untyped/free-form role strings, legacy session catalog poisoning, and custom deck validator omission.
2. `module_core_engine`: Flawed 1-step undo state symmetry, missing dealer pool rehydration on reload, wildcard starvation across asymmetric role draws, and skip-loop traps.
3. `module_ui_shell`: Mobile viewport navigation button blowout on 320px screens, lack of gesture coordination with skip actions, and ambiguous audio feedback.

---

### 1. Introduction & Goals Analysis

* **Clarifying Questions:**
  1. How are target roles formally identified and normalized across catalogs? The PRD lists varied raw strings (`child_asks_parent`, `preteen_asks_parent`, `teen_asks_parent`, `adult_child_asks_parent`). Does `SmoothedBernoulliDealer` parse these ad-hoc, or are they mapped to an abstract binary role model (`roleA` vs `roleB`) defined in `DeckCatalog` metadata?
  2. What is the lifecycle and migration path for active client sessions stored in `sessionStorage`? If a user was mid-session in an existing unidirectional deck when the app updates to bilateral catalogs, will deserialization encounter missing prompt IDs or corrupted role pointers?
  3. During a `mutual` wildcard prompt, what is the exact semantic role displayed in the UI? Does the card attribute speaker coaching to whoever holds the device, or does the UI switch into an explicit third state (e.g. `[Both Answer Together]`), and how does this affect turn alternation on Next vs Skip?

* **What-If Scenarios:**
  1. *Legacy In-Flight Session Crash:* A user resumes a session saved under `parent_child_5_8` 10 minutes prior to a service worker update. The stored `drawnPromptIds` contain legacy IDs that do not exist in the new bilateral catalog. When `tryRestoreSession()` executes, the state machine fails to locate prompts or attempts to draw from an empty pool, leading to a silent blank screen.
  2. *Asymmetrical Deck Exhaustion Stall:* If an author or future deck configuration provides 16 cards for `roleA` and only 4 cards for `roleB` in Tier 1, `roleB` will cycle and repeat cards 4 times while `roleA` has not yet cycled once. If `cardsAnsweredInTier` relies on answers across both roles, one participant suffers prompt fatigue while the other receives fresh prompts.
  3. *Typo-Induced Prompt Stranding:* A catalog prompt contains a malformed `targetRole` (e.g., `chlid_asks_parent` or empty string). If the dealer strictly checks against `roleA` and `roleB`, this prompt is excluded from all pools and silently lost, lowering tier card density below the progression threshold.

* **Points for Improvement:**
  1. Normalize role architecture: enforce that `DeckCatalog` explicitly defines `roleA: string` and `roleB: string`, and `SmoothedBernoulliDealer` partitions prompts strictly against these two keys plus `'mutual'`.
  2. Add an explicit session compatibility and version check in `EphemeralStorageManager`: if the stored session's deck prompt count or catalog hash does not match the active catalog, gracefully purge the session and return to `DECK_SELECT`.
  3. Explicitly specify the UI and state contract for `mutual` cards: badge displays `[Mutual - Both Answer]`, and turn alternates on Next Card.

---

### 2. Confidence Mandate Analysis

* **Clarifying Questions:**
  1. The PRD claims a 10/10 confidence score, but how can 10/10 confidence be justified when `previousCard()` has no stateful tracking of whether the previous transition was a `nextCard()` (turn advance) or `skipCard()` (role-preserving draw)?
  2. How does session rehydration reconcile the dealer's internal shuffle pools (`roleAPool`, `roleBPool`, `wildcardPool`) with `drawnPromptIds`? Currently, `tryRestoreSession()` calls `dealer.loadDeck()` which seeds a fresh shuffle with `Date.now()`, completely ignoring remaining card orders.
  3. What is the impact on `module_custom_decks`? `validateCustomDeck` in `src/data/validator.ts` directly dependencies on `prompt_schema_types`. Does the confidence mandate verify custom deck ingestion or does it risk breaking custom deck import/export?

* **What-If Scenarios:**
  1. *Undo Counter & Role Corruption:* User on Role A completes Card 1 (`cardsAnsweredInTier = 1`). User on Role B skips Card 2 and receives Card 3 (`cardsAnsweredInTier = 1`). Role B immediately taps `[↩ Previous Card]`. If `previousCard()` naively decrements `cardsAnsweredInTier`, the counter drops to 0, and if it naively toggles `activeRole`, Role A receives the device back even though Role B was the one who skipped.
  2. *Reload Immediate Redraw Duplicate:* A user has drawn 5 cards, skips 2, and then locks their phone. Upon unlocking, the page reloads. `tryRestoreSession()` restores `activeCard`, but re-seeds the dealer from scratch without removing drawn cards from `roleAPool` and `roleBPool`. The next tap on Next Card draws a card the user already answered 3 minutes ago.

* **Points for Improvement:**
  1. Downgrade confidence score from 10/10 to 8/10 until the state transition ledger (`previousActionType: 'NEXT' | 'SKIP'`) and dealer pool rehydration mechanisms are formally specified.
  2. Require stateful undo mechanics in `StateMachine`: track `previousRole: string | null` and `previousActionType: 'NEXT' | 'SKIP'` alongside `previousCard`. If the previous action was `SKIP`, undo restores the card without decrementing `cardsAnsweredInTier` and without flipping `activeRole`.
  3. Update `src/data/validator.ts` in MiniPRD 1 to sanitize or safely pass optional bilateral properties without corrupting custom decks.

---

### 3. Scope Analysis

* **Clarifying Questions:**
  1. How do touch gestures (`GestureHandler`) interact with bilateral turn alternation? SplitGameView currently binds horizontal swipes to `onNext` and `onPrevious`. Does swipe-left trigger `nextCard()`? If so, is there a swipe gesture for `skipCard()`, or is skip strictly an explicit button tap?
  2. Does `skipCard()` trigger synthesized Web Audio feedback? If it plays `playCardSlide()`, how does a user distinguish between a successful skip (same role) and an advance (turn pass)?
  3. The 15-minute TTL on `EphemeralSessionPayload` is standard for casual decks, but parent-child vulnerability prompts often involve lengthy 15–25 minute conversations on a single card. If the screen locks during a long discussion, will the session expire and discard their progress?

* **What-If Scenarios:**
  1. *Unintentional Turn Handoff via Pass Gesture:* A parent finishes reading, taps the screen to hand the phone to the child, and an accidental horizontal thumb swipe triggers `nextCard()`. The card advances to Role A again (skipping the child's turn entirely), leaving the child confused with a card meant for the parent.
  2. *Auditory Ambiguity for Accessibility:* A visually impaired user or a user relying on audio cues hears the identical card slide chime on both `skipCard()` and `nextCard()`, making it impossible to confirm auditorily whether the device should be passed to the partner or retained.
  3. *Session Expiration Mid-Breakthrough:* A dyad engages in an emotional, 18-minute discussion on a Level 2 prompt. The phone screen turns off. When the child picks the phone back up and unlocks it, the browser checks TTL (`now - lastActiveTimestamp > 15 min`), wipes the session, and boots them to `DECK_SELECT`, destroying the emotional moment.

* **Points for Improvement:**
  1. Restrict `skipCard()` strictly to a physical button click; do not bind ambiguous swipe gestures to skip. Enforce that horizontal swipe triggers `nextCard()` only, with visual confirmation.
  2. Implement a dedicated, distinct audio cue for `skipCard()` in `src/core/audio.ts` (e.g. a subtle neutral double-tick rather than the sweeping slide chime used for turn handoff).
  3. Implement automatic TTL refresh on visibility change: when the PWA visibility state changes to `visible`, if the session has not yet expired, refresh `lastActiveTimestamp` to prevent abrupt session loss during active deep discussions.

---

### 4. User Stories (Atomic) Analysis

* **Clarifying Questions:**
  1. In **US-001**, what occurs if a user taps "Begin Conversation" without explicitly selecting a starter pill in `BriefingView`? Does it gracefully fall back to `roleA`, and is `roleA` guaranteed to be the parent in all catalogs?
  2. In **US-003**, is there any ceiling or rate-limiting on `[Skip Card]`? What occurs if a user skips repeatedly until the entire role pool is exhausted?
  3. In **US-005**, what is the exact state behavior if the user clicks `[↩ Previous Card]` multiple times consecutively? Does the button become disabled after one use, or does it toggle continuously?

* **What-If Scenarios:**
  1. *Single-Card Skip Infinite Loop:* A user reaches the end of Tier 3 where only 1 prompt remains in `roleAPool`. The user taps `[Skip Card ↷]`. The dealer moves the card to the back of the pool (length 1) and immediately draws index 0—returning the exact same card. The UI appears unresponsive or frozen, leading the user to report a broken Skip button.
  2. *Progression Lockout via Skip Abuse:* An anxious teenager skips every uncomfortable prompt in Level 1. Because `cardsAnsweredInTier` does not increment on skip, they never reach the 4-card threshold required to unlock Level 2. The dyad is trapped in Level 1 indefinitely with no explanation or escape hatch.
  3. *Rapid Double-Tap State De-synchronization:* A user rapidly taps `[Next Card →]` twice within 100ms. The state machine fires two transitions in rapid succession: Role A -> Role B -> Role A. The device was passed to the child, but the screen now displays a prompt intended for the parent.

* **Points for Improvement:**
  1. Add an edge-case guard for `skipCard()`: if `activeRolePool.length <= 1`, disable the Skip button or display a toast: `"No other cards to skip to in this level"`.
  2. Specify that `[↩ Previous Card]` is a single-step undo that disables itself (`disabled = true`) immediately upon being invoked, preventing ping-pong toggling.
  3. Enforce an execution lockout / debounce (350ms) in `StateMachine.ts` directly, rejecting any state transitions while an animation or audio transition is active.

---

### 5. Technical Specifications Analysis

* **Clarifying Questions:**
  1. In `SmoothedBernoulliDealer`, how are wildcards scheduled relative to role turns? If `cardsSinceWildcard` is shared globally, does a wildcard appear on whoever's turn happens to hit the Bernoulli threshold? If so, does the PRD guarantee that wildcards are equally distributed between roles over time?
  2. When `skipCard()` is called on a wildcard, the PRD states it draws a regular prompt for the current speaker role. What happens to the skipped wildcard? Does it go to the back of `wildcardPool`, and does skipping a wildcard reset `cardsSinceWildcard` or leave it eligible for another immediate wildcard?
  3. In `src/core/types.ts`, `targetRole` is defined as `string`. Why is this not a strictly checked union type or validated against catalog role keys?

* **What-If Scenarios:**
  1. *Wildcard Drought Cluster on Single Role:* If Role A draws 4 prompts and Role B skips 3 prompts, the Bernoulli spacing counter increments on every draw. If wildcards consistently trigger on odd turns, Role A receives 100% of the wildcards while Role B receives none, breaking the intended bilateral equity.
  2. *Wildcard Skip Cascading Loop:* A user encounters a wildcard and taps Skip. The wildcard is returned to the wildcard pool, but `cardsSinceWildcard` was not reset (because the wildcard wasn't "completed"). On the very next draw, the drought guard forces another wildcard immediately, preventing the user from skipping to a regular card.
  3. *Memory Allocation Churn via Array Splice/Shift:* On repeated skips and draws, calling `shift()` and `push()` on large prompt arrays causes memory reallocation. While small in impact for 40 cards, repeated recycling without immutable index pointers can trigger unnecessary garbage collection pauses on low-end mobile devices.

* **Points for Improvement:**
  1. Explicitly define wildcard skip rules in `SmoothedBernoulliDealer`: skipping a wildcard resets `cardsSinceWildcard` to `minSpacing` (e.g. 3) to prevent immediate consecutive wildcard draws, and pushes the wildcard to the back of `wildcardPool`.
  2. Implement index-pointer based pool consumption (`currentIndex`) rather than destructive array shifting (`shift()`), simplifying pool recycling and serialization.
  3. Expand `EphemeralSessionPayload` to persist the state of the active turn and previous action:
     ```typescript
     export interface EphemeralSessionPayload {
       // ... existing fields
       activeRole: string | null;
       startingRole: string | null;
       previousRole: string | null;
       lastActionWasSkip: boolean;
     }
     ```

---

### 6. Negative Constraints Analysis

* **Clarifying Questions:**
  1. The constraint dictates: "DO NOT modify non-bilateral decks (`general_edition`, `dating_courtship`, etc.)". How does `SmoothedBernoulliDealer` determine which mode to execute in? Does it rely strictly on `deck.isBilateral === true`, and what is the fallback if `deck.isBilateral` is undefined?
  2. The constraint states: "DO NOT increment `cardsAnsweredInTier` when a user taps 'Skip Card'". In `SplitGameView`, the Active Listener Zone currently renders `Card #${state.cardsAnsweredInTier}`. If a user skips, the card text updates but the counter stays identical. Will this confuse users into thinking the app failed to record their action?
  3. The constraint states: "DO NOT discard skipped cards permanently—place them at the back of the active role's pool." If a user skips 5 cards in a row, does the pool retain those cards in FIFO order, and how are they tracked if the tier advances?

* **What-If Scenarios:**
  1. *Undetected Non-Bilateral Degradation:* If `SmoothedBernoulliDealer` refactors `drawNext()` to require role partitioning by default, an imported custom deck or legacy deck with no role tags could produce empty role pools, causing `drawNext()` to return `undefined` and throw an uncaught runtime error.
  2. *Visual Counter Stagnation:* A parent skips three cards consecutively. The Listener Coaching box continues to display `Card #2`. The parent believes the counter is frozen and taps repeatedly, triggering race conditions or frustration.
  3. *Tier Advancement Skip Retention Leak:* When a user advances from Tier 1 to Tier 2 via `advanceTier()`, if skipped cards from Tier 1 were retained in a global queue, they could accidentally bleed into Tier 2 pools.

* **Points for Improvement:**
  1. Ensure strict fallback in `SmoothedBernoulliDealer`:
     ```typescript
     if (!deck.isBilateral || !deck.roleA || !deck.roleB) {
       return this.drawNextClassic();
     }
     ```
  2. Update the Listener Zone counter UI in `SplitGameView.ts`: when a card is drawn via skip, render a subtle indicator (e.g., `Card #3 (Skipped)` or separate `Answered: 3` from prompt draw index) so the user has immediate visual feedback that skip was registered.
  3. Explicitly purge all tier-specific pools and skipped queues upon `advanceTier()`.

---

### 7. Risks & Mitigation Analysis

* **Clarifying Questions:**
  1. Risk 2 proposes button debouncing of 300ms–400ms. Is this debouncing implemented on DOM event listeners, or inside `StateMachine`? If implemented only in the DOM, does it protect against keyboard shortcuts or programmatic triggers?
  2. Risk 3 addresses session reload losing turn identity, but does not address what happens if `sessionStorage` is unavailable (e.g., private browsing mode quota limits or security restrictions). How does the state machine degrade gracefully?
  3. When waking from mobile OS background sleep, the browser's `AudioContext` is often placed into a suspended state. How does the turn transition handle suspended audio without throwing uncaught promise rejections?

* **What-If Scenarios:**
  1. *Uncaught AudioContext Rejection on Advance:* After passing the phone, the child unlocks the device and taps `[Next Card →]`. The Web Audio API throws `The AudioContext was not allowed to start. It must be resumed on user gesture`. If the audio call is unhandled or synchronous, it halts execution of the state update, freezing the card view.
  2. *Private Browsing Quota Failure:* On iOS Safari Private Browsing, setting items in `sessionStorage` can throw `QuotaExceededError`. If `EphemeralStorageManager` does not wrap writes in a safe try/catch block, tapping Next or Skip will throw an unhandled exception and crash the application shell.
  3. *Debounce Leak on Rapid Alternation:* If a user rapidly taps `Skip` then immediately `Next`, a 400ms debounce on `Next` might swallow the turn alternation entirely, leaving the card skipped but the device with the same speaker.

* **Points for Improvement:**
  1. Enforce debouncing directly in `StateMachine.ts` with a transition locking flag (`isTransitioning = true`) that releases after 350ms, ensuring all entry points (UI buttons, gestures, keyboard) are uniformly guarded.
  2. Verify that `EphemeralStorageManager.saveSession()` wraps storage operations in a silent try/catch with in-memory fallback to guarantee uninterrupted play in private browsing.
  3. Ensure all Web Audio playback calls in `src/core/audio.ts` catch and ignore suspended context errors gracefully.

---

### 8. Success Metrics Analysis

* **Clarifying Questions:**
  1. Success Metric 3 mandates "Zero layout shift, horizontal clipping, or touch target violations on mobile viewports ($\ge 320\text{px}$)." What is the exact layout formula for accommodating `[Previous Card]`, `[Skip Card]`, and `[Next Card]` alongside the persistent tier progression button on a 320px screen?
  2. Does the success metric define a maximum bundle size increase for ingesting the 4 bilateral catalogs? What is the threshold to ensure Skipstone's PWA performance budget is not exceeded?
  3. Are there non-functional performance benchmarks for draw/skip transition latency (e.g. $\le 50\text{ms}$ DOM update)?

* **What-If Scenarios:**
  1. *Mobile Navigation Button Overflow on 320px Display:* On an iPhone SE or 320px wide viewport, three buttons in a single row with standard padding (`[↩ Previous Card]` ~115px, `[Skip Card ↷]` ~105px, `[Next Card →]` ~105px = 325px + padding) overflow the 320px container, causing horizontal scrolling or wrapping that pushes the action bar out of view.
  2. *Bundle Size Budget Failure:* Compiling four 40-prompt bilateral decks into raw JSON assets adds 60KB+ to the JavaScript bundle, causing the automated Vitest bundle budget assertion in `tests/engine.test.ts` to fail CI.
  3. *Unbounded Vitest Flakiness:* If bilateral dealer tests do not use fixed PRNG seeds, PRNG rolls might intermittently produce wildcard clashing or unexpected draw orders, leading to non-deterministic test failures in CI.

* **Points for Improvement:**
  1. Specify responsive navigation styling for $\le 360\text{px}$ screens: use icon-augmented compact labels (`[↩ Prev]`, `[Skip ↷]`, `[Next →]`) on narrow viewports to guarantee zero horizontal overflow while strictly maintaining $\ge 44\text{px}$ touch targets.
  2. Enforce a bundle budget ceiling: the compiled bilateral JSON catalogs must not exceed 25KB gzipped, verified by Vitest bundle size assertions.
  3. Mandate fixed seeds for all Vitest dealer tests to guarantee 100% deterministic CI execution.

---

## Final Recommendation

The Draft PRD represents a solid functional premise, but requires architectural hardening before implementation:
1. Formalize the stateful undo model (`previousActionType`, `previousRole`) to prevent counter and role corruption on Previous Card.
2. Formulate explicit responsive button dimensions for 320px mobile viewports to prevent UI overflow.
3. Establish wildcard skip pacing and dealer pool rehydration rules to guarantee deterministic session resumption.

**Next Action:** Run `/hyper-resolve` to mediate these findings and compile the production-ready SuperPRD and MiniPRDs.