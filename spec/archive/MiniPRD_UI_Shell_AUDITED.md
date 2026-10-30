# MiniPRD: UI Shell Bilateral Controls & Responsive Layout

**Hypergraph Node ID:** module_ui_shell  
**Parent Node:** system_skipstone  
**Status:** Completed (100%) ✅

## 1. The Confidence Mandate
- **Confidence Score:** 10/10
- **Clarifying Questions:** None. All UI component contracts, role selection pills, skip button placement, responsive 320px ergonomics, and gesture interactions have been mediated and approved.

## 2. Atomic User Stories
- **US-UI-01:** As a dyad in `BriefingView`, I want to select who asks the first question using styled role pills, so that we agree on who starts before the conversation begins.
- **US-UI-02:** As a speaker in `SplitGameView`, I want to see a clear speaker badge (`[Speaker: Parent]` / `[Speaker: Child]` / `[Mutual - Both Answer]`) and active listener coaching, so that roles are immediately transparent.
- **US-UI-03:** As a speaker in `SplitGameView`, I want a dedicated `[Skip Card ↷]` button that triggers the skip transition and emits distinct skip audio.
- **US-UI-04:** As a user on a 320px mobile viewport, I want the bottom navigation (`[↩ Prev]`, `[Skip ↷]`, `[Next →]`) to fit without clipping or horizontal overflow while preserving $\ge 44\text{px}$ touch targets.
- **US-UI-05:** As a user engaging in a deep conversation, I want session TTL to refresh when returning to the tab so our session isn't abruptly terminated.

## 3. Implementation Plan (Task List) — 100% Complete ✅
- [x] **Task 1 (BriefingView Starter Pills):** In `src/ui/views/BriefingView.ts`, check if `deck.isBilateral`. If true, render role selector pills displaying `deck.roleLabels.roleA` and `deck.roleLabels.roleB` above the "Begin Conversation" button. Default to `roleA` if unclicked. Pass selected role to `StateMachine.startSession(deckId, selectedRole)`. ✅
- [x] **Task 2 (SplitGameView Speaker Badge):** In `src/ui/views/SplitGameView.ts`, render a distinct speaker role badge in the Speaker Zone: ✅
  - If card `type === 'wildcard'` or `targetRole === 'mutual'`: render `[Mutual - Both Answer]`.
  - Else: render `[Speaker: {roleLabel}]`.
- [x] **Task 3 (SplitGameView Skip Button):** In `src/ui/views/SplitGameView.ts`, add the `[Skip Card ↷]` button in the primary bottom navigation row between `[↩ Previous Card]` and `[Next Card →]`. ✅
  - Bind click to `StateMachine.skipCard()`.
  - Disable button if remaining cards in active role pool is $\le 1$.
- [x] **Task 4 (SplitGameView 1-Step Undo State):** Bind `[↩ Previous Card]` disable state to `!state.hasUndoAvailable`. Disable immediately on click. ✅
- [x] **Task 5 (Responsive Layout for 320px–360px):** Update Tailwind CSS classes in navigation action container: ✅
  - Use responsive text classes (`text-xs sm:text-sm`) and compact labels (`[↩ Prev]`, `[Skip ↷]`, `[Next →]`) on screens $\le 360\text{px}$.
  - Ensure all button dimensions enforce minimum `min-h-[44px] min-w-[44px]`.
  - Verify container uses `flex-wrap: nowrap` with `overflow-x: hidden` and zero layout clipping.
- [x] **Task 6 (Touch Gestures & Skip Protection):** Ensure `GestureHandler` horizontal swipes only trigger `nextCard()` (swipe-left) and `previousCard()` (swipe-right). Skip is strictly an explicit button tap. ✅
- [x] **Task 7 (Visibility Inactivity Refresh):** In `src/ui/views/SplitGameView.ts` or root PWA handler, attach a listener to `document.addEventListener('visibilitychange', ...)` that updates `lastActiveTimestamp` in `sessionStorage` when `document.visibilityState === 'visible'`. ✅
- [x] **Task 8 (UI Component Tests):** In `tests/ui.test.ts`, write DOM tests verifying: ✅
  - BriefingView renders starter role pills for bilateral decks and omits them for classic decks.
  - SplitGameView renders speaker badges and skip button correctly.
  - Navigation container does not exceed 320px width without wrapping/overflow.

## 4. The Negative Space (Constraints)
- **DO NOT** bind swipe gestures to `skipCard()`. Skip must remain an intentional, explicit button click.
- **DO NOT** reduce button touch targets below $44\text{px} \times 44\text{px}$.
- **DO NOT** display starter role selector pills for non-bilateral decks.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Render `BriefingView` with `parent_child_5_8` → assert `button[data-role="parent"]` and `button[data-role="child"]` exist. Render with `general_edition` → assert no role buttons exist. (Verified ✅)
- **Test 2 (Deterministic):** In `SplitGameView` on a 320px viewport, assert `clientWidth` of action button container does not exceed viewport width and all 3 buttons are visible and clickable. (Verified ✅)
