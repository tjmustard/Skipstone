# MiniPRD: Verification Suite & Contrast Assertions

**Hypergraph Node ID:** `module_verification_suite`  
**Parent Node:** `system_skipstone`

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None remaining. Deterministic test assertions and WCAG AAA contrast algorithm aligned with Vitest suite.

## 2. Atomic User Stories
- **US-VER-01:** As a developer running tests, I want automated Vitest specs asserting 3rd button mounting, visibility, and click handling, so that regression risks are caught immediately.
- **US-VER-02:** As an accessibility compliance auditor, I want automated contrast assertions in `tests/contrast.test.ts` verifying that the 3rd button styling in Tiers 1, 2, and 3 meets WCAG AAA ($\ge 7.0:1$) against container backgrounds.

## 3. Implementation Plan (Task List) - 100% Complete ✅
- [x] Task 1: In `tests/ui.test.ts`, add test cases verifying:
  - Exactly 2 navigation buttons exist when `cardsAnsweredInTier < 4`.
  - 3rd button mounts when `getHasShownProgressionForTier() === true` in Tiers 1 and 2.
  - 3rd button mounts when `cardsAnsweredInTier >= 4` in Tier 3.
  - Correct label text rendered across all 3 tiers.
  - Advance button click triggers `advanceTier()`.
  - Complete session button click triggers `startGroundingCheckout()` and sets `checkoutStep = 1`.
  - Multi-tap debounce prevents double invocation.
- [x] Task 2: In `tests/contrast.test.ts`, add contrast verification tests:
  - Calculate relative luminance for Tier 1 (`#5eead4`), Tier 2 (`#fcd34d`), and Tier 3 (`#6ee7b7`) against card container dark tokens.
  - Assert contrast ratio $\ge 7.0:1$ (WCAG AAA).
- [x] Task 3: In `tests/engine.test.ts`, add test verifying `hasShownProgressionForTier` preservation across serialization and restore.
- [x] Task 4: Run full test suite (`npm test`) and confirm 100% passing tests.

## 4. The Negative Space (Constraints)
- **DO NOT** use non-deterministic outputs or LLM candidate artifacts.
- **DO NOT** mock `startGroundingCheckout` improperly; verify actual state transitions.
- **DO NOT** permit any test failure or unhandled promise rejections.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Run `npm test` -> 100% test suites and tests passing.
- **Test 2 (Deterministic):** Run `tests/contrast.test.ts` -> all contrast ratios mathematically proven $\ge 7.0:1$.
