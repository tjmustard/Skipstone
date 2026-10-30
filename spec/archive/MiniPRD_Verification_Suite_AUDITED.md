# MiniPRD: End-to-End Verification, Accessibility & Deterministic Test Suite

**Hypergraph Node ID:** module_verification_suite  
**Parent Node:** system_skipstone

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None. Deterministic testing strategy, headless audio mocks, WCAG AAA contrast requirements, and bundle size limits are fully defined.

## 2. Atomic User Stories
- **US-TEST-01:** As a developer, I want a fast, automated test suite that runs headlessly in CI without requiring real audio hardware or internet connectivity.
- **US-TEST-02:** As a low-vision or night-mode user, I want all prompt text to meet WCAG AAA contrast ratios across all 3 tier color themes.
- **US-TEST-03:** As a maintainer, I want automated bundle size checks preventing accidental bundle bloat beyond 180KB gzipped.

## 3. Implementation Plan (Task List)
- [x] Task 1: Setup Vitest with JSDOM environment in `vite.config.ts` and test mocks for `AudioContext`, `localStorage`, and `sessionStorage`.
- [x] Task 2: Implement prompt catalog test suite asserting 100% schema compliance and exact 415 prompt count across all 8 built-in decks.
- [x] Task 3: Implement deterministic PRNG dealer test suite verifying reproducible sequences with zero clumping under Mulberry32 seed.
- [x] Task 4: Implement state machine lifecycle integration tests (Session Start -> Tier Progression -> Pool Recycling -> Grounding Checkout -> Storage Wipe).
- [x] Task 5: Implement automated color contrast audit utility checking WCAG AAA compliance ($\ge 7:1$ for normal text) across Tier 1, 2, and 3 theme color tokens.
- [x] Task 6: Implement production build size budget script checking that gzipped assets do not exceed 180KB.
- [x] Task 7: Configure test execution in `package.json` (`npm test`, `npm run test:coverage`).

## 4. The Negative Space (Constraints)
- **DO NOT** use non-deterministic tests or unseeded PRNG assertions.
- **DO NOT** permit contrast ratios below WCAG AAA standards for core prompt text.
- **DO NOT** allow test runners to require real browser audio hardware or network sockets.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Complete test suite passes with 100% green status via `npm test`.
- **Test 2 (Deterministic):** Contrast verification test asserts all text color / background combinations meet $\ge 7:1$ contrast ratio.
- **Test 3 (Deterministic):** Bundle check script asserts total gzipped dist size $\le 180\text{KB}$.
