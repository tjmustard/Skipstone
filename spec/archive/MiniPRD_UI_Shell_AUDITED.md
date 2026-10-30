# MiniPRD: UI Shell, Split Game View & Interaction Modals

**Hypergraph Node ID:** module_ui_shell  
**Parent Node:** system_skipstone

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None. Component hierarchy, dual-zone split geometry, privacy blur shield, and chromatic transitions are fully specified.

## 2. Atomic User Stories
- **US-UI-01:** As a dyad or group, I want a dual-zone split screen where the top half clearly displays the speaker prompt and the bottom half displays active listener coaching.
- **US-UI-02:** As players advancing in conversational intimacy, I want background and accent colors to shift chromatically between Tier 1 (Warm Up), Tier 2 (Vulnerability), and Tier 3 (Core Truths).
- **US-UI-03:** As players answering card 4 in a tier, I want a non-coercive modal offering autonomous choice to advance or stay.
- **US-UI-04:** As a participant finishing a conversation, I want a 2-step emotional grounding checkout concluding on a calming "Put The Phone Away" screen.
- **US-UI-05:** As a privacy-conscious user, I want the active card blurred whenever the mobile browser is minimized or switched.

## 3. Implementation Plan (Task List)
- [x] Task 1: Create application root shell with header (Deck Title, Tier Badge, Sound Toggle, Finish Button, Menu) and dynamic container sizing.
- [x] Task 2: Implement `DeckSelectorView` displaying 8 built-in decks and user-imported custom decks with category filters and card count badges.
- [x] Task 3: Implement `BriefingView` displaying deck overview, estimated time, and pass instruction ("pass to partner" vs "pass to left") with "Begin Session" CTA.
- [x] Task 4: Implement `SplitGameView` with top Speaker zone and bottom Listener zone using flex shrink, responsive font clamping, and safe-area padding.
- [x] Task 5: Implement `ProgressionModal` appearing after threshold ($N \ge 4$) offering "Advance to Next Level" vs "Stay in Current Level".
- [x] Task 6: Implement `GroundingCheckoutView` with Step 1 (One-word share), Step 2 (Listener appreciation), and Step 3 ("Put The Phone Away" concluding screen).
- [x] Task 7: Implement visual chromatic pulses on card transition and theme shifts based on active tier level.
- [x] Task 8: Implement `visibilitychange` privacy shield overlay that blurs prompt content when the page loses focus.
- [x] Task 9: Implement lightweight toast notification for deck pool recycling and custom deck import feedback.

## 4. The Negative Space (Constraints)
- **DO NOT** use raw `innerHTML` or unescaped HTML; render prompt strings strictly through `textContent`.
- **DO NOT** introduce nested vertical scrolling within card containers on standard viewports (down to 320px width).
- **DO NOT** allow header buttons or navigation controls to overlap system notch or home indicator (`safe-area-inset-*`).

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** View transition test: Selecting a deck mounts `BriefingView`; clicking "Begin" mounts `SplitGameView` with correct prompt text rendered via `textContent`.
- **Test 2 (Deterministic):** Privacy shield test: Setting `document.visibilityState = 'hidden'` triggers the privacy blur CSS class on the card container.
- **Test 3 (Deterministic):** Progression modal test: Answering 4th card triggers progression modal state flag.
