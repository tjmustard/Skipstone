# Draft PRD: Persistent Tier Progression & Session Completion Navigation

## 1. Introduction & Goals
- **Problem Statement:** In the current SplitGameView, when participants reach card 4 and select "Stay in Current Level" from the ProgressionModal, the state machine marks `hasShownProgressionForTier = true`. Consequently, the progression modal never reappears, permanently trapping participants in the current tier with no manual mechanism to advance to Level 2, Level 3, or conclude their conversation into the grounding checkout from Tier 3.
- **Solution Overview:** Introduce a dynamic, tier-aware third action button in the bottom navigation bar of `SplitGameView`. While cards 1–3 are answered, the bar maintains a clean 2-button layout (`Previous Card` and `Next Card`). Once $\ge 4$ cards have been answered in the active tier, a distinct third button unlocks and remains persistently visible:
  - In **Tier 1 (Warm Up):** Unlocks `[Advance to Level 2 →]`
  - In **Tier 2 (Vulnerability):** Unlocks `[Advance to Level 3 →]`
  - In **Tier 3 (Core Truths):** Unlocks `[Complete Session →]`, transitioning directly into the 2-step emotional grounding checkout (`GroundingCheckoutView`).
- **Target Audience:** All Skipstone conversational participants (dyads and groups) who desire unhurried immersion in a depth level while preserving full autonomy to progress whenever they feel emotionally prepared.

## 2. Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None remaining. Value loop, 3-button layout conditions, tier-specific routing, and zero-gesture boundary constraints resolved during Phase 1–4 interview.

## 3. Scope
- **In-Scope:**
  - Dynamic bottom navigation bar in `src/ui/views/SplitGameView.ts` rendering 2 buttons (cards 1–3) or 3 buttons ($\ge 4$ cards answered in tier).
  - Explicit action routing: `globalStateMachine.advanceTier()` for Tier 1 $\rightarrow$ 2 and Tier 2 $\rightarrow$ 3; `globalStateMachine.openCheckout()` for Tier 3 $\rightarrow$ Grounding Checkout.
  - Tier-aware color styling and badges for the 3rd button meeting WCAG AAA ($\ge 7.0:1$) contrast ratios.
  - Responsive flexbox container adapting cleanly down to 320px viewport width without wrapping or overlapping card boundaries.
  - Automated unit and UI integration tests verifying DOM button presence, label accuracy, and transition firing across Tiers 1, 2, and 3.
- **Out-of-Scope:**
  - Touch gesture shortcuts (e.g. swipe-right or double-swipe) for tier advancement (avoiding accidental depth jumps).
  - Schema alterations to `sessionStorage` or IndexedDB (existing `currentTier` and `cardsAnsweredInTier` are fully sufficient).
  - Changes to built-in prompt catalogs or card distribution PRNG logic.

## 4. User Stories (Atomic)
| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| **US-NAV-01** | As a player who chose to stay in Tier 1 or 2, I want a button to advance to the next level so that our group can deepen the conversation whenever we are ready. | 1. If `cardsAnsweredInTier >= 4` and `currentTier < 3`, a 3rd button labeled `Advance to Level [N+1] →` appears in the bottom nav bar.<br>2. Clicking the button immediately advances to Tier N+1 and draws the first card of that tier. | P0 |
| **US-NAV-02** | As a player in Tier 3 (Core Truths), I want a button to complete the session after 4 cards so that we can transition gracefully into the grounding cooldown. | 1. If `cardsAnsweredInTier >= 4` and `currentTier === 3`, the 3rd button displays `Complete Session →`.<br>2. Clicking the button immediately transitions the app to `GroundingCheckoutView`. | P0 |
| **US-NAV-03** | As players just starting a tier (cards 1–3), I want only Previous and Next buttons visible so that our focus remains entirely on establishing initial baseline comfort. | 1. While `cardsAnsweredInTier < 4`, the bottom bar renders exactly 2 buttons (`[↩ Previous Card]` and `[Next Card →]`).<br>2. The 3rd button is not mounted in the DOM. | P1 |
| **US-NAV-04** | As a mobile user on a narrow screen (320px), I want the 3 buttons to fit ergonomically without clipping or vertical stacking. | 1. Buttons use compact padding and text clamping.<br>2. No container overflow or clipped hit targets on standard mobile viewports. | P1 |

## 5. Technical Specifications
- **Architecture & Resolved Trade-offs:**
  - *Persistent Button vs Re-prompting Modal:* Rather than interrupting participants with recurring modals on subsequent draws (e.g. card 8, card 12), the non-intrusive 3rd button remains docked at the bottom of the card frame, respecting participant pacing.
  - *Direct Execution vs Confirmation Gate:* Per Phase 3 resolution, clicking `Advance` or `Complete Session` acts immediately without secondary browser confirmation alerts, avoiding conversational friction.
- **System Graph Blast Radius:**
  - **`module_ui_shell`** (`src/ui/views/SplitGameView.ts`): Modifies bottom nav container structure to add conditional 3rd button element.
  - **`module_core_engine`** (`src/core/state.ts`): Exposes clean `openCheckout()` method callable from the active game view.
  - **`module_verification_suite`** (`tests/ui.test.ts`): Adds test suites verifying button counts, labels, and state callbacks across all 3 tiers.
- **Execution Checklist (MiniPRD candidates):**
  - [ ] Implement conditional 3rd button generation in `src/ui/views/SplitGameView.ts`.
  - [ ] Expose `openCheckout()` helper on `StateMachine` in `src/core/state.ts`.
  - [ ] Verify WCAG AAA color token contrast for the new button states.
  - [ ] Add automated component tests in `tests/ui.test.ts`.
- **API Contracts / Schema:**
  ```typescript
  // src/core/state.ts
  public openCheckout(): void {
    if (this.state.view !== 'IN_SESSION') return;
    this.state.view = 'GROUNDING_CHECKOUT';
    globalSoundEngine.playCardSlide();
    this.notify();
  }
  ```
- **Dependencies:** None. Zero third-party packages.

## 6. Negative Constraints
- **DO NOT** display the advance or completion button before 4 cards have been answered in the active tier.
- **DO NOT** bind swipe gestures to tier advancement or session completion.
- **DO NOT** use browser `alert()` or `confirm()` dialogs on advance click.
- **DO NOT** alter the `EphemeralSessionPayload` storage schema.
- **DO NOT** permit contrast ratios below WCAG AAA ($\ge 7.0:1$) for the 3rd button styling.

## 7. Risks & Mitigation
- **Risk 1: Accidental taps on small screens** $\rightarrow$ *Mitigation:* Position `[↩ Previous Card]` on the far left, `[Next Card →]` in the center, and `[Advance / Complete →]` on the far right with clear margin and visual differentiation.
- **Risk 2: Layout overflow on 320px viewports** $\rightarrow$ *Mitigation:* Use responsive text sizing (`text-[11px] sm:text-xs`) and compact padding (`px-2.5 py-1.5`).

## 8. Success Metrics
- 100% of participants choosing "Stay in Current Level" can subsequently advance or complete the session at will.
- 0 accidental tier skips reported via touch gestures.
- 100% passing automated Vitest suite.
