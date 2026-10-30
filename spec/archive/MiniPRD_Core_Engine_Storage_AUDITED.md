# MiniPRD: Core Engine & Storage Progression State

**Hypergraph Node ID:** `module_core_engine`  
**Parent Node:** `system_skipstone`

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None remaining. Storage schema extension and getter exposure verified against existing `src/core/state.ts` and `src/core/storage.ts`.

## 2. Atomic User Stories
- **US-ENG-01:** As a returning player who reloads or resumes a session, I want `hasShownProgressionForTier` restored from session storage, so that I am not re-prompted with the progression modal if I already chose to stay.
- **US-ENG-02:** As the UI shell, I want a clean accessor on `StateMachine` to check `hasShownProgressionForTier`, so that `SplitGameView` can deterministically render the persistent 3rd action button.

## 3. Implementation Plan (Task List) - 100% Complete ✅
- [x] Task 1: Extend `EphemeralSessionPayload` in `src/core/storage.ts` with optional field `hasShownProgressionForTier?: boolean`.
- [x] Task 2: Update `saveSession()` in `src/core/storage.ts` to include `hasShownProgressionForTier` from the state machine.
- [x] Task 3: Update `tryRestoreSession()` in `src/core/storage.ts` to restore `hasShownProgressionForTier` onto the restored state machine instance.
- [x] Task 4: Add public getter `public getHasShownProgressionForTier(): boolean` to `StateMachine` in `src/core/state.ts`.
- [x] Task 5: Verify that existing `advanceTier()` and `startGroundingCheckout()` remain intact without regressions.

## 4. The Negative Space (Constraints)
- **DO NOT** create a duplicate `openCheckout()` method; use existing `startGroundingCheckout()`.
- **DO NOT** alter non-ephemeral storage or introduce external dependencies.
- **DO NOT** break backward compatibility of `EphemeralSessionPayload` (field must be optional).

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Storage serialization round-trip: save session with `hasShownProgressionForTier = true`, execute `tryRestoreSession()`, verify restored instance preserves `hasShownProgressionForTier === true`.
- **Test 2 (Deterministic):** Getter verification: `sm.getHasShownProgressionForTier()` reflects initial `false`, changes to `true` after modal display, and resets to `false` upon `advanceTier()`.
