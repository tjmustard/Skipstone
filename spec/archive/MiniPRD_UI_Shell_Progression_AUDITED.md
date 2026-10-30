# MiniPRD: UI Shell Persistent Tier Progression Navigation

**Hypergraph Node ID:** `module_ui_shell`  
**Parent Node:** `system_skipstone`

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None remaining. Layout responsiveness, double-tap debounce, WCAG AAA styling, and button routing resolved during mediation.

## 2. Atomic User Stories
- **US-UI-01:** As a participant who stayed in Tier 1 or 2, I want a persistent `Advance to Level [N+1] →` button in `SplitGameView`, so that our group can deepen our conversation whenever we are ready.
- **US-UI-02:** As a participant in Tier 3 (Core Truths), I want a persistent `Complete Session →` button after answering 4 cards, so that we can conclude into emotional grounding without hunting for header controls.
- **US-UI-03:** As a mobile user on a 320px viewport, I want the progression button on a dedicated top row and Previous/Next on the bottom row, so that buttons have full $\ge 44\text{px}$ touch targets without label clipping or shifting positions.
- **US-UI-04:** As an impatient participant, I want clicks on the advance button debounced immediately, so that rapid tapping does not skip an entire tier.

## 3. Implementation Plan (Task List) - 100% Complete ✅
- [x] Task 1: In `src/ui/views/SplitGameView.ts`, define WCAG AAA color token constants for Tier 1 (`teal-300`), Tier 2 (`amber-300`), and Tier 3 (`emerald-300`).
- [x] Task 2: Compute progression button unlock state:
  - Tiers 1 & 2: `currentTier < 3 && globalStateMachine.getHasShownProgressionForTier()`
  - Tier 3: `currentTier === 3 && state.cardsAnsweredInTier >= 4`
- [x] Task 3: When locked, render the standard 2-button layout (`[↩ Previous Card]` and `[Next Card →]`).
- [x] Task 4: When unlocked, render responsive layout:
  - Mobile (<640px): 2-row layout with 3rd button spanning full width on row 1, and `[↩ Previous]` / `[Next →]` row below.
  - Desktop (>=640px): 3-button flex row with equalized spacing.
- [x] Task 5: Implement click handler with immediate button disablement (`btn.disabled = true`), 400ms transition lock, and routing:
  - Tiers 1 & 2: `globalStateMachine.advanceTier()`
  - Tier 3: `globalStateMachine.startGroundingCheckout()`
- [x] Task 6: Add accessibility attributes (`aria-label`, `aria-live="polite"`, `role="button"`).

## 4. The Negative Space (Constraints)
- **DO NOT** render the 3rd button when `cardsAnsweredInTier < 4`.
- **DO NOT** render the 3rd button on Card 4 in Tiers 1 or 2 before the modal has been displayed and dismissed.
- **DO NOT** shift the position of `[↩ Previous Card]` or `[Next Card →]` on mobile viewports.
- **DO NOT** bind swipe gestures to tier progression or grounding checkout.
- **DO NOT** permit contrast ratios below WCAG AAA ($\ge 7.0:1$).

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** View mounts 2 buttons when progression is locked; mounts 3rd button when progression is unlocked.
- **Test 2 (Deterministic):** 3rd button displays exact expected labels:
  - Tier 1: `"Advance to Level 2 →"`
  - Tier 2: `"Advance to Level 3 →"`
  - Tier 3: `"Complete Session →"`
- **Test 3 (Deterministic):** Clicking 3rd button invokes `advanceTier()` in Tiers 1/2 and `startGroundingCheckout()` in Tier 3.
- **Test 4 (Deterministic):** Rapid duplicate clicks fire action handler exactly once within 400ms window.
