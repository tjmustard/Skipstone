# SuperPRD: Persistent Tier Progression & Session Completion Navigation

## Metadata
- **Project Name**: Skipstone
- **Feature Name**: Persistent Tier Progression & Session Completion Navigation
- **Version**: 1.0.1
- **Status**: Approved
- **Owner**: The Resolution Agent & tjmustard

---

## 1. Introduction & Goals

### 1.1 Problem Statement
In Skipstone's `SplitGameView`, when participants reach card 4 and choose "Stay in Current Level" in `ProgressionModal`, the state machine flags `hasShownProgressionForTier = true`. Consequently, the progression modal never reappears, leaving participants with no prominent, localized mechanism to advance to Level 2 or 3, or conclude their conversation into the grounding checkout from Tier 3. While direct tier pills exist in the top `Header`, participants focused on the card and bottom controls lack an intuitive, persistent pathway to progress on their own terms.

### 1.2 Solution Overview
Introduce a dynamic, tier-aware third action button in `SplitGameView`.
- **Tiers 1 & 2 (Warm Up & Vulnerability):** When cards 1–3 are answered, the bottom navigation maintains a clean 2-button layout (`[↩ Previous Card]` and `[Next Card →]`). After answering card 4, the initial `ProgressionModal` triggers as designed. If participants select "Stay in Current Level", a persistent third action button unlocks in `SplitGameView` labeled `Advance to Level [N+1] →`.
- **Tier 3 (Core Truths):** Since no further intimacy tier exists, answering 4 or more cards directly unlocks `[Complete Session →]`, transitioning immediately into `GroundingCheckoutView`.
- **Ergonomics & Layout:** On mobile viewports (<640px, down to 320px), the 3rd Action Button is stacked on its own row/pill docked above the `[↩ Previous]` and `[Next →]` row. This guarantees 100% spatial stability for primary navigation, prevents muscle-memory misclicks, and ensures full $\ge 44\text{px}$ touch targets without text clipping.
- **State Integrity:** Immediate UI disablement (`btn.disabled = true`) and a 400ms transition guard eliminate double-tap race conditions. Direct invocation of `startGroundingCheckout()` guarantees proper `checkoutStep = 1` initialization and dedicated audio feedback. Session persistence via optional `hasShownProgressionForTier` in `EphemeralSessionPayload` prevents modal re-prompt loops on mobile tab lock or reload.

### 1.3 Target Audience
All conversational dyads and small groups seeking unhurried immersion in vulnerability levels while retaining complete, non-coercive autonomy to deepen or conclude the session whenever emotionally prepared.

---

## 2. Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** All resolved via Red Team triage and human mediation:
  1. *API Parity (VULN-01):* Redundant `openCheckout()` discarded; invokes existing `globalStateMachine.startGroundingCheckout()` directly.
  2. *Race Condition (VULN-02):* Double-tap tier skipping prevented by immediate UI disablement (`btn.disabled = true`) and 400ms transition debounce.
  3. *Modal vs 3rd Button Collision (VULN-03):* Modal First, Button on Extended Stay. `ProgressionModal` triggers after Card 4; upon choosing "Stay", the 3rd button unlocks persistently in `SplitGameView` for that tier (and renders directly at Card 4+ in Tier 3).
  4. *Undo Counter Desync (VULN-04):* Cumulative threshold unlock. Once progression is unlocked for the tier, 1-step undo (`previousCard`) does not re-lock the 3rd button.
  5. *Ergonomics on 320px Viewports (VULN-05):* Stacked 2-row layout on mobile (<640px) with 3rd button spanning top row and Previous/Next on bottom row; side-by-side flex on desktop (>=640px).
  6. *Session Persistence (VULN-06):* Optional `hasShownProgressionForTier?: boolean` added to `EphemeralSessionPayload` in `src/core/storage.ts`.
  7. *WCAG AAA Contrast (VULN-07):* Pre-calculated tokens exceeding $\ge 7.0:1$ ratio on dark slate container backgrounds.

---

## 3. Scope

### 3.1 In-Scope
- **`src/ui/views/SplitGameView.ts`:**
  - Dynamic navigation rendering: 2-button layout when progression locked; 2-row stacked layout on mobile / 3-button layout on desktop when unlocked.
  - Progression unlock condition: `(currentTier < 3 && hasShownProgressionForTier) || (currentTier === 3 && cardsAnsweredInTier >= 4)`.
  - Action routing: `advanceTier()` for Tiers 1 and 2; `startGroundingCheckout()` for Tier 3.
  - Button state: Immediate click disablement and 400ms transition guard.
  - Visual styling: Tier-specific WCAG AAA tokens (teal for Tier 1, amber for Tier 2, emerald for Tier 3).
- **`src/core/state.ts`:**
  - Public getter `public getHasShownProgressionForTier(): boolean` (or exposing flag on state) to inform UI rendering.
  - Preservation of existing `advanceTier()` and `startGroundingCheckout()` contracts.
- **`src/core/storage.ts`:**
  - Extend `EphemeralSessionPayload` with optional `hasShownProgressionForTier?: boolean`.
  - Save and restore `hasShownProgressionForTier` in `saveSession()` and `tryRestoreSession()`.
- **`tests/`:**
  - Automated unit and integration tests in `tests/ui.test.ts`, `tests/contrast.test.ts`, and `tests/engine.test.ts`.

### 3.2 Out-of-Scope
- Swipe gestures for tier advancement or session completion (avoiding accidental leaps).
- Removing or altering existing Header level pills or Header Finish button (retained as complementary quick controls).
- New sound assets (reuses `playTierAdvance()` and `playFinishGrounding()`).
- Modifying prompt catalogs or Mulberry32 PRNG dealer logic.

---

## 4. User Stories (Atomic)

| ID | User Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| **US-NAV-01** | As a player who stayed in Tier 1 or 2, I want a persistent button to advance to the next level so that our group can deepen the conversation whenever ready. | 1. If `currentTier < 3` and `hasShownProgressionForTier === true`, a 3rd action button labeled `Advance to Level [N+1] →` renders in `SplitGameView`.<br>2. Clicking advances to Tier N+1, resets tier card count, and draws the first card of that tier. | P0 |
| **US-NAV-02** | As a player in Tier 3 (Core Truths), I want a persistent button to complete the session after 4 cards so that we can transition smoothly into grounding. | 1. If `currentTier === 3` and `cardsAnsweredInTier >= 4`, the 3rd button renders labeled `Complete Session →`.<br>2. Clicking invokes `startGroundingCheckout()`, initializing `checkoutStep = 1` and transitioning to `GROUNDING_CHECKOUT`. | P0 |
| **US-NAV-03** | As players on cards 1–3, I want only Previous and Next controls visible so that our focus remains on early comfort without progression distractions. | 1. While progression unlock conditions are not met, exactly 2 buttons (`[↩ Previous Card]` and `[Next Card →]`) are rendered.<br>2. The 3rd button is completely omitted from the DOM. | P1 |
| **US-NAV-04** | As a mobile user on a narrow screen (320px), I want navigation buttons to fit comfortably without text clipping or shifting button positions. | 1. On mobile (<640px), the 3rd button renders on its own row above Previous and Next.<br>2. `[↩ Previous Card]` and `[Next Card →]` maintain fixed bottom corners.<br>3. Touch targets meet $\ge 44\text{px}$ height with zero container overflow down to 320px viewport width. | P1 |
| **US-NAV-05** | As an impatient or double-tapping user, I want clicks to be debounced so that a rapid double-tap does not skip an entire intimacy tier. | 1. Clicking `Advance` or `Complete Session` immediately disables the button (`btn.disabled = true`).<br>2. A 400ms transition guard rejects duplicate invocations before re-render. | P0 |

---

## 5. Technical Specifications

### 5.1 Architecture & Resolved Trade-offs

#### Resolved Trade-offs Log
1. **API Parity (VULN-01):**
   - *Conflict:* Draft PRD introduced `openCheckout()` which lacked `checkoutStep = 1` initialization and used card slide audio instead of grounding chime.
   - *Resolution:* Discarded `openCheckout()`. Call existing `globalStateMachine.startGroundingCheckout()` directly.
2. **Race Condition Prevention (VULN-02):**
   - *Conflict:* Double-tapping advance button could trigger two consecutive `advanceTier()` calls before re-render, skipping an entire tier.
   - *Resolution:* UI-level immediate button disablement (`btn.disabled = true`) and a 400ms transition lock in `SplitGameView`.
3. **Modal vs 3rd Button Coexistence (VULN-03):**
   - *Conflict:* Showing 3rd button on Card 4 causes visual collision when clicking Next also opens `ProgressionModal`.
   - *Resolution:* Modal First, Button on Extended Stay. The non-coercive `ProgressionModal` triggers after Card 4. If the user selects "Stay in Current Level", the 3rd button unlocks permanently in `SplitGameView` for that tier. In Tier 3 (where no modal exists), the 3rd button unlocks directly at `cardsAnsweredInTier >= 4`.
4. **Undo Backtracking Semantics (VULN-04):**
   - *Conflict:* Using 1-step undo (`previousCard`) on Card 4+ returns visual view to previous card while `cardsAnsweredInTier` remains 4.
   - *Resolution:* Cumulative threshold unlock. Once progression is unlocked for the tier, it remains unlocked even if viewing the previous card.
5. **Mobile Viewport Ergonomics (VULN-05):**
   - *Conflict:* 3 buttons horizontally packed on 320px screens cause text clipping and shifts the spatial position of `Next Card`.
   - *Resolution:* Two-row stacked layout on mobile (<640px) with the 3rd Action Button spanning full width on the top row, and Previous/Next on the bottom row. Side-by-side flex row on desktop (>=640px).
6. **Session Persistence (VULN-06):**
   - *Conflict:* `hasShownProgressionForTier` was in-memory only, causing modal re-prompts after phone unlock or tab reload.
   - *Resolution:* Added optional `hasShownProgressionForTier?: boolean` to `EphemeralSessionPayload` in `src/core/storage.ts`.

### 5.2 System Graph Blast Radius
The following nodes in `spec/compiled/architecture.yml` are modified by this feature:
- `module_core_engine` (`src/core/state.ts`, `src/core/storage.ts`)
- `module_ui_shell` (`src/ui/views/SplitGameView.ts`)
- `module_verification_suite` (`tests/ui.test.ts`, `tests/contrast.test.ts`, `tests/engine.test.ts`)

### 5.3 Execution Checklist (MiniPRDs)
The following modular PRDs are generated to execute this SuperPRD:
- [ ] `spec/compiled/MiniPRD_Core_Engine_Storage.md`
- [ ] `spec/compiled/MiniPRD_UI_Shell_Progression.md`
- [ ] `spec/compiled/MiniPRD_Verification_Suite.md`

### 5.4 API Contracts & State Extensions

#### `src/core/storage.ts`
```typescript
export interface EphemeralSessionPayload {
  deckId: string;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  hasShownProgressionForTier?: boolean; // New: persists modal dismissal across reloads
  drawnPromptIds: string[];
  activeCardId: string;
  previousCardId: string | null;
  timestamp: number;
}
```

#### `src/core/state.ts`
```typescript
public getHasShownProgressionForTier(): boolean {
  return this.hasShownProgressionForTier;
}
```

#### `src/ui/views/SplitGameView.ts`
```typescript
// Styling tokens meeting WCAG AAA (>= 7.0:1) on dark slate container
const TIER_BUTTON_STYLES = {
  tier1: 'bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 active:bg-teal-500/30 focus-visible:ring-teal-400',
  tier2: 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 active:bg-amber-500/30 focus-visible:ring-amber-400',
  tier3: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 active:bg-emerald-500/30 focus-visible:ring-emerald-400',
};
```

---

## 6. Negative Constraints
- **DO NOT** create a duplicate `openCheckout()` method in `state.ts`; use existing `startGroundingCheckout()`.
- **DO NOT** display the progression button before 4 cards have been answered in the active tier.
- **DO NOT** display the progression button on Card 4 in Tiers 1 and 2 before the participant has encountered and dismissed the `ProgressionModal`.
- **DO NOT** bind swipe gestures to tier advancement or session completion.
- **DO NOT** shift the horizontal corner alignment of `[↩ Previous Card]` and `[Next Card →]` on mobile viewports.
- **DO NOT** permit contrast ratios below WCAG AAA ($\ge 7.0:1$) for any button state.
- **DO NOT** use browser `alert()` or `confirm()` dialogs.

---

## 7. Risks & Mitigation
- **Risk 1: Accidental multi-tap tier skipping** $\rightarrow$ *Mitigation:* Immediate `btn.disabled = true` on click plus 400ms transition lock.
- **Risk 2: Visual truncation and touch crowding on 320px screens** $\rightarrow$ *Mitigation:* Two-row stacked layout on mobile viewports (<640px) with $\ge 44\text{px}$ touch target height.
- **Risk 3: Tab reload desynchronization** $\rightarrow$ *Mitigation:* `hasShownProgressionForTier` persisted in `EphemeralSessionPayload`.

---

## 8. Success Metrics
- 100% of participants choosing "Stay in Current Level" can advance or conclude at will via the persistent 3rd action button.
- 0 accidental tier skips caused by rapid double-taps.
- 100% compliance with WCAG AAA ($\ge 7.0:1$) color contrast across all tier button variants.
- 100% pass rate across automated Vitest suite in `tests/ui.test.ts`, `tests/contrast.test.ts`, and `tests/engine.test.ts`.
