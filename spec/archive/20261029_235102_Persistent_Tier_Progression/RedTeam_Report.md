# Red Team Adversarial Report: Persistent Tier Progression & Session Completion Navigation

**Target Specification:** `spec/active/Draft_PRD.md`  
**Analysis Date:** 2026-10-29  
**Reviewing Agent:** The Red Team Agent (`/hyper-redteam`)  
**Status:** Hostile Technical Evaluation Completed  

---

## Executive Summary & System Blast Radius

The Draft PRD proposes introducing a dynamic, persistent third action button to the bottom navigation bar of `SplitGameView` after $\ge 4$ cards are answered in an intimacy tier, providing a deterministic route to advance tiers or conclude the session.

While the intent solves a clear user trap, our architectural stress-test reveals critical state collisions, race conditions in rapid touch events, undo/backtracking counter desynchronization, unverified duplicate API methods, and severe mobile viewport ergonomic hazards on 320px screens.

### Blast Radius Assessment (`spec/compiled/architecture.yml`)
Evaluating the proposal against the compiled hypergraph:

```
system_skipstone (System)
 ├── module_core_engine (src/core/state.ts, src/core/storage.ts) [DIRTY]
 │    ├── API duplication: openCheckout() vs startGroundingCheckout()
 │    ├── Counter mutation desync: previousCard() does not decrement cardsAnsweredInTier
 │    └── EphemeralStorage desync: hasShownProgressionForTier not persisted across reloads
 ├── module_ui_shell (src/ui/views/SplitGameView.ts, Header.ts, ProgressionModal.ts) [DIRTY]
 │    ├── Layout overflow & hit target crowding on 320px viewports
 │    ├── Modal vs 3rd button collision on Card 4 Next-click
 │    └── Conflicting navigation channels (Header L1/L2/L3 & Finish vs Bottom Bar CTAs)
 └── module_verification_suite (tests/ui.test.ts, tests/contrast.test.ts) [DIRTY]
      ├── Missing multi-tap race condition assertions
      └── Contrast verification needed for tier-specific 3rd button states against WCAG AAA (7.0:1)
```

---

## Section-by-Section Adversarial Analysis

### 1. Introduction & Goals Analysis
* **Clarifying Questions:**
  1. The problem statement asserts that participants are "permanently trapped with no manual mechanism to advance or conclude." However, `Header.ts` already provides active `L1`, `L2`, and `L3` direct tier selector pills (`setTier(level)`) and a dedicated `Finish` button (`startGroundingCheckout()`). Does this feature intend to deprecate/remove the header's tier switches and finish button to centralize all session pacing into the bottom navigation bar, or are we deliberately maintaining two competing, divergent navigation channels on screen simultaneously?
  2. Is the 3rd button intended to appear *only after* a user has actively encountered the `ProgressionModal` on card 4 and explicitly chosen "Stay in Level N", or is it intended to appear unconditionally the moment Card 4 renders?
* **What-If Scenarios:**
  - *Conflicting Navigation Paradigm:* A participant reaches Card 4. In the bottom bar, they see `[Advance to Level 2 →]`. In the top header, they see `[L1] [L2] [L3]` and `[Finish]`. The user taps `L3` in the header (jumping directly to Tier 3), but the bottom bar state was rendered for Tier 1. If state propagation is asynchronous or partial, the bottom bar could render Tier 2 transition controls while the active card is Tier 3.
  - *Intimacy Trajectory Inversion:* A participant taps `[Finish]` in the header, entering `GROUNDING_CHECKOUT`, then uses browser history back button or OS swipe-back to return. The bottom bar state machine could be unmounted or left in an indeterminate view state.
* **Points for Improvement:**
  - Explicitly document the single source of truth for session progression: establish whether header controls should remain, become read-only indicators, or align synchronously with bottom bar capabilities.
  - Clarify the behavioral contract: specify whether the 3rd button is an "always-unlocked at card 4+" affordance or strictly an "extended stay fallback" affordance.

---

### 2. Confidence Mandate Analysis
* **Clarifying Questions:**
  1. The PRD claims a Confidence Score of 10/10 with "None remaining" clarifying questions. Why were the interaction of 1-step undo (`previousCard()`), double-tap race conditions, and existing `startGroundingCheckout()` API parity marked as resolved when no constraints for them exist in the specification?
  2. How can confidence be 10/10 when the visual and hit-target layout on a 320px viewport has not been proven against WCAG 2.5.8 touch target spacing constraints?
* **What-If Scenarios:**
  - *Premature Implementation Failure:* An engineer implements the 3rd button using the PRD's exact snippet `openCheckout()`. Vitest passes because tests mock the method, but in production the grounding checkout initializes with `checkoutStep === undefined`, breaking the 3-step checkout sequence and leaving participants trapped on an unfinishable screen.
* **Points for Improvement:**
  - Downgrade confidence score from 10/10 to 7/10 until state edge cases (undo, checkout step initialization, debouncing) and 320px ergonomic layouts are rigorously resolved in Phase 1 specs.

---

### 3. Scope Analysis
* **Clarifying Questions:**
  1. The out-of-scope section states "Schema alterations to `sessionStorage` or IndexedDB (existing `currentTier` and `cardsAnsweredInTier` are fully sufficient)." If `hasShownProgressionForTier` is NOT added to `EphemeralSessionPayload`, what is the intended behavior when a participant on Card 6 refreshes their mobile browser or resumes an OS-backgrounded tab?
  2. If touch swipe gestures for tier advancement are strictly out-of-scope, what happens if a user performs the existing horizontal swipe gesture (`onNext`) while looking at Card 4? Does swipe-next trigger the `ProgressionModal`, draw Card 5, or advance the tier?
* **What-If Scenarios:**
  - *Session Reload State Reset:* A couple reaches Card 7 in Level 1 (having chosen to stay), locks their phone to discuss a question for 3 minutes, and unlocks it. The mobile browser wakes up and executes `tryRestoreSession()`. Because `hasShownProgressionForTier` was in-memory only, it resets to `false`. When the user taps `Next Card`, the app abruptly slams the `ProgressionModal` in their face again, destroying conversational flow.
  - *Swipe vs Button Behavioral Asymmetry:* The user taps `[Next Card →]` and sees Card 5, but swiping horizontally might trigger a different code path if gestures are bound directly to `nextCard()` while the UI promotes the 3rd button.
* **Points for Improvement:**
  - Bring `hasShownProgressionForTier` into `EphemeralSessionPayload` in `src/core/storage.ts` so session restoration preserves modal presentation state across page reloads.
  - Define exact gesture handling behavior when `cardsAnsweredInTier >= 4`: explicitly confirm that swipe-right triggers `nextCard()` and NEVER triggers `advanceTier()` or `startGroundingCheckout()`.

---

### 4. User Stories (Atomic) Analysis
* **Clarifying Questions:**
  1. In **US-NAV-01**, acceptance criterion 1 states: "If `cardsAnsweredInTier >= 4` and `currentTier < 3`, a 3rd button labeled `Advance to Level [N+1] →` appears." On Card 4, before the user has ever attempted to go to Card 5, is this button visible? If so, why does clicking `[Next Card →]` on Card 4 trigger a modal asking them if they want to advance when they already have an advance button visible right next to it?
  2. In **US-NAV-02**, acceptance criterion 2 states: "Clicking the button immediately transitions the app to `GroundingCheckoutView`." Does this action provide any visual or audio transition feedback, and does it reset active card pointers to prevent stale memory references?
  3. In **US-NAV-04**, acceptance criterion 1 specifies "Buttons use compact padding and text clamping." What are the explicit minimum touch target boundaries (in CSS pixels) to prevent misclicks?
* **What-If Scenarios:**
  - *The "Ghost Modal" Collision:* A player is reading Card 4. They see the 3rd button `Advance to Level 2 →`. They decide: "No, I want another Card 1 first", so they tap `Next Card →`. Instead of showing Card 5, the screen freezes and opens `ProgressionModal`, asking them again if they want to advance to Level 2! If they tap "Stay in Level 1", they are still looking at Card 4, and the 3rd button is still there. They must tap `Next Card →` a second time to finally get Card 5. This double-prompt loop is hostile and confusing.
  - *Fat-Finger Skip on Mobile:* On a 320px viewport, a user intends to tap `[Next Card →]` to draw another prompt, but due to cramped 3-button horizontal flex packing, their finger clips the adjacent `[Advance to Level 2 →]` button. Because the action executes immediately with no confirmation, the tier advances irreversibly, revealing high-vulnerability prompts before the group was emotionally ready.
* **Points for Improvement:**
  - Harmonize the modal and 3rd button triggers: either (A) suppress the automatic `ProgressionModal` popup entirely and rely purely on the persistent 3rd button, OR (B) render the 3rd button only *after* the user has reached card 4 AND dismissed the modal by choosing "Stay in Level N".
  - Add spacing and minimum hit targets ($\ge 44\times 44\text{px}$ touch envelope or dedicated separation) to satisfy US-NAV-04 safely.

---

### 5. Technical Specifications Analysis
* **Clarifying Questions:**
  1. The API Contract specifies:
     ```typescript
     public openCheckout(): void {
       if (this.state.view !== 'IN_SESSION') return;
       this.state.view = 'GROUNDING_CHECKOUT';
       globalSoundEngine.playCardSlide();
       this.notify();
     }
     ```
     Why is this method proposed when `src/core/state.ts` already has `public startGroundingCheckout(): void` which properly initializes `this.state.checkoutStep = 1` and plays `globalSoundEngine.playFinishGrounding()`?
  2. If `openCheckout()` does not initialize `checkoutStep = 1`, what renders in `GroundingCheckoutView` if a session was previously interrupted during checkout step 2 or 3?
  3. Why does `openCheckout()` play `playCardSlide()` instead of the dedicated harmonic sound `playFinishGrounding()` designed for session closure?
  4. What prevents an end-user from double-tapping `[Advance to Level 2 →]` quickly and triggering two consecutive `advanceTier()` calls in rapid succession, skipping Level 2 entirely and landing in Level 3?
* **What-If Scenarios:**
  - *Double-Tap Tier Skip (The Fast-Forward Exploit):* An impatient user double-clicks or double-taps `Advance to Level 2 →`. Tap 1 runs `advanceTier()`: `currentTier` changes from 1 to 2, `cardsAnsweredInTier` resets to 1, and `this.notify()` is triggered. If Tap 2 fires before the DOM re-render completes and detaches the button, Tap 2 executes `advanceTier()` again! Since `currentTier === 2 < 3`, `currentTier` immediately becomes 3. The users are unintentionally rocketed from Warm Up directly into deep Core Truths.
  - *Undo Backtracking Desynchronization:* A user on Card 3 taps `Next Card` to see Card 4 (`cardsAnsweredInTier = 4`). The 3rd button unlocks. The user then taps `[↩ Previous Card]`. `previousCard()` swaps `activeCard` and `previousCard`, but does NOT decrement `cardsAnsweredInTier`. The user is now looking at Card 3, but `cardsAnsweredInTier` remains 4! The 3rd button (`Advance to Level 2 →`) is visible and active on Card 3. If they click it, they advance having seen only 3 cards. If they instead click `Next Card`, `cardsAnsweredInTier` increments to 5, permanently decoupling card count from actual deck progression.
* **Points for Improvement:**
  - **Eliminate `openCheckout()`**: Use the existing, battle-tested `startGroundingCheckout()` method in `src/core/state.ts` to guarantee `checkoutStep = 1` initialization and `playFinishGrounding()` audio triggering.
  - **Add Debounce / Re-entrancy Guard**: Wrap `advanceTier()` and `startGroundingCheckout()` in `SplitGameView` with an execution lock or disable the button immediately upon click (`btn.disabled = true`) to physically prevent multi-tap race conditions.
  - **Fix Undo Counter Semantics**: Clarify whether `cardsAnsweredInTier` tracks maximum reached card index or current view position, and prevent `previousCard()` from exposing premature advancement controls.

---

### 6. Negative Constraints Analysis
* **Clarifying Questions:**
  1. The constraint states: "DO NOT display the advance or completion button before 4 cards have been answered in the active tier." If a user uses `Header.ts` to switch to Tier 2 after answering 1 card in Tier 1, does Tier 2 require 4 cards from scratch before the button appears?
  2. The constraint states: "DO NOT alter the `EphemeralSessionPayload` storage schema." Given that `hasShownProgressionForTier` is omitted from storage and causes modal re-prompting on refresh, why is this negative constraint enforced rather than safely adding an optional boolean to the payload?
  3. The constraint states: "DO NOT permit contrast ratios below WCAG AAA ($\ge 7.0:1$) for the 3rd button styling." Have the hover, active, and focus-visible states been mathematically evaluated against dark background tokens (`#0f172a`, `#1c1917`, `#18181b`)?
* **What-If Scenarios:**
  - *Contrast Failure on Dynamic Tier Themes:* The PRD proposes tier-aware styling for the 3rd button (e.g., amber accent in Tier 2, rose accent in Tier 3). If an engineer uses Tailwind's default `amber-500` text on `amber-950/60` background, the contrast ratio is ~4.8:1—passing AA but failing AAA ($\ge 7.0:1$), causing an immediate regression in `tests/contrast.test.ts`.
  - *Focus-Trap / Blind Spot for Screen Readers:* When the 3rd button mounts on Card 4, keyboard and screen-reader users navigating sequentially with Tab or virtual cursors have the DOM structure change underneath them without an `aria-live` notification or accessible label announcement.
* **Points for Improvement:**
  - Pre-calculate and specify the exact hex values or Tailwind utility combinations for the 3rd button in Tiers 1, 2, and 3 that mathematically exceed 7.0:1 contrast against their respective card container backgrounds.
  - Reconsider the constraint prohibiting `EphemeralSessionPayload` modification: adding `hasShownProgressionForTier?: boolean` is backward-compatible and fixes session reload desynchronization.

---

### 7. Risks & Mitigation Analysis
* **Clarifying Questions:**
  1. Risk 1 proposes: "Position `[↩ Previous Card]` on the far left, `[Next Card →]` in the center, and `[Advance / Complete →]` on the far right." In a 2-button state (Cards 1–3), what is the layout? Is `[Next Card →]` on the far right or center? If `Next Card` jumps from the right edge on Card 3 to the center on Card 4, the user's thumb has to move to avoid accidentally hitting the newly appeared 3rd button in its old spot!
  2. Risk 2 proposes: "Use responsive text sizing (`text-[11px] sm:text-xs`) and compact padding (`px-2.5 py-1.5`)." On a 320px viewport, three buttons with text like "Advance to Level 2 →" require at least 340px total width without clipping. How will text overflow, ellipsis, or flex-shrink be handled to ensure text remains readable and buttons don't clip?
* **What-If Scenarios:**
  - *Muscle Memory Misclick (The Shifting Button Hazard):* On Cards 1, 2, and 3, `[Next Card →]` is at the right edge of the screen (`justify-between`). The user rhythmically taps the bottom-right corner to proceed. On Card 4, the layout shifts to 3 buttons: `[Advance to Level 2 →]` suddenly occupies the bottom-right corner, and `[Next Card →]` is pushed to the middle! The user taps the bottom-right corner by muscle memory, expecting another card, but instantly triggers an irreversible Tier Advance.
  - *CSS Layout Shatter on 320px:* On a 320px screen, `flex justify-between` with 3 non-wrapping flex children causes the buttons to compress beyond minimum readable widths. The labels become `Advance to...` or `Complete...`, or worse, the container horizontally scrolls, breaking the PWA's fixed layout viewport.
* **Points for Improvement:**
  - **Preserve Spatial Consistency:** Keep `[Next Card →]` stable on the right (or center) across all card counts, or clearly stack/format the 3rd button (e.g. as a distinct pill bar or dedicated row) so primary card navigation coordinates never shift under the user's finger.
  - **Specify Responsive Behavior:** On `< 380px` viewports, consider a 2-row navigation layout or distinct accent pill docked above the Previous/Next bar to guarantee full touch targets ($\ge 44\text{px}$) and zero horizontal clipping.

---

### 8. Success Metrics Analysis
* **Clarifying Questions:**
  1. Metric 1 states: "100% of participants choosing 'Stay in Current Level' can subsequently advance or complete the session at will." How is this measured offline without telemetry or privacy-violating logging?
  2. Metric 2 states: "0 accidental tier skips reported via touch gestures." How is an accidental skip differentiated from an intentional skip without analytics?
  3. Metric 3 states: "100% passing automated Vitest suite." Does the current test plan cover all permutation branches (Card 1–3 button absence, Card 4+ presence, Undo button count preservation, double-tap prevention, and checkout step integrity)?
* **What-If Scenarios:**
  - *Silent Failure Under Offline Conditions:* Because Skipstone is offline-first and collects zero tracking telemetry, if the 3rd button fails to render on certain iOS Safari versions due to flexbox clamping bugs, participants will remain stuck in Tier 1 with 0 error logs ever reaching the team.
* **Points for Improvement:**
  - Transform qualitative/telemetry-dependent success metrics into deterministic, automated test assertions in `tests/ui.test.ts`:
    1. Assert 2 buttons mounted when `cardsAnsweredInTier < 4`.
    2. Assert exactly 3 buttons mounted when `cardsAnsweredInTier >= 4`.
    3. Assert correct label strings for Tiers 1, 2, and 3.
    4. Assert `startGroundingCheckout()` executes with step 1 and correct audio trigger.
    5. Assert rapid successive clicks on the advance button fire exactly 1 tier transition.

---

## Consolidated Triage Matrix for `/hyper-resolve`

| Issue ID | Severity | Category | Description | Recommended Resolution |
|---|---|---|---|---|
| **VULN-01** | **CRITICAL** | State / Architecture | PRD specifies redundant `openCheckout()` method that skips `checkoutStep = 1` initialization and plays incorrect sound. | Discard `openCheckout()`. Call existing `globalStateMachine.startGroundingCheckout()` directly. |
| **VULN-02** | **CRITICAL** | State Machine | Double-tapping `Advance` button fires `advanceTier()` twice before re-render, skipping entire tier. | Add click disablement / debouncing on advance button in `SplitGameView`. |
| **VULN-03** | **HIGH** | UX / Flow Collision | On Card 4, both 3rd button and `ProgressionModal` (via `nextCard`) trigger advance options simultaneously. | Harmonize progression trigger: either replace modal or show 3rd button strictly after modal dismissal. |
| **VULN-04** | **HIGH** | State Desync | 1-step undo (`previousCard()`) does not decrement `cardsAnsweredInTier`, leaving 3rd button unlocked on Card 3. | Reconcile `cardsAnsweredInTier` semantics during undo or lock advance button if viewing previous card. |
| **VULN-05** | **HIGH** | Ergonomics / Layout | 3 buttons crammed horizontally on 320px viewport causes text truncation and muscle-memory misclicks. | Fix button layout: keep `Next Card` position stable and test flex wrapping down to 320px. |
| **VULN-06** | **MEDIUM** | State Persistence | `hasShownProgressionForTier` is omitted from `sessionStorage`, causing re-prompt on tab reload. | Persist `hasShownProgressionForTier` in `EphemeralSessionPayload`. |
| **VULN-07** | **MEDIUM** | Accessibility | Unspecified button color tokens may fail WCAG AAA ($\ge 7.0:1$) contrast against dynamic tier backgrounds. | Explicitly define tested hex tokens for 3rd button in `tests/contrast.test.ts`. |

---
*Report generated and written to `spec/active/RedTeam_Report.md`. Proceed to resolution.*
