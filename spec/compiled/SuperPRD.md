# SuperPRD: Skipstone Codebase Rebuild

## Metadata
- **Project Name**: Skipstone
- **Version**: 1.0.0
- **Status**: Approved
- **Owner**: The Resolution Agent & tjmustard

## 1. Introduction & Goals
### 1.1 Problem Statement
The current Skipstone prototype is a single monolithic 67KB HTML file (`index.html`) coupling all user interface markup, styles, Web Audio code, application state logic, and 415 hardcoded conversational prompts into one unmaintainable document. Furthermore, it depends on external CDNs (`cdn.tailwindcss.com` and `fonts.googleapis.com`) for styling and typography, which violates the zero-cloud, 100% offline-first reliability required for an intimate pass-and-play mobile experience.

### 1.2 Solution Overview
Rebuild Skipstone from scratch as a modular, 100% self-contained Progressive Web Application (PWA). The architecture decouples data catalogs (compiled JSON from `SI/` markdown decks), UI components, state management (finite state machine with ephemeral session recovery, card navigation and tier progression), audio synthesis (`SoundEngine` with Web Audio API and visual fallback), gesture handlers (touch swipes with 400ms debounce and undo buffer), and offline caching (Service Worker + Web App Manifest). It enforces a privacy-first model using short-lived `sessionStorage` (15-min TTL, wiped on finish/quit) with local `IndexedDB` storage for custom user-imported decks.

### 1.3 Target Audience
Dyads (couples, dating partners, parent-child pairs) and small intergenerational groups ($N \ge 3$) seeking relational depth without subscription paywalls, surveillance, or connection drops.

## 2. Confidence Mandate
- **Confidence Score**: 10 / 10
- **Clarifying Questions**: All resolved through Red Team triage and human mediation:
  1. Ephemeral session resilience resolved via 15-min TTL `sessionStorage` and `onbeforeunload` reload protection.
  2. Deck exhaustion resolved via non-blocking recycling with visual toast notifications.
  3. Custom deck security resolved via lightweight schema validation (<2KB), 1MB byte limit, `custom_` ID namespacing, and `textContent`-only rendering.
  4. Service worker lifecycle resolved via passive background updates without intrusive page reloads.
  5. Interaction, audio, and distribution NFRs resolved with 400ms debounce, node cleanup on ended, and smoothed Bernoulli trials.
  6. Privacy blur, safe areas, bundle budget (≤ 180KB gzipped), and deterministic PRNG (Mulberry32) fully standardized.

## 3. Scope
### 3.1 In-Scope
- Modular TypeScript + Vite build setup with 100% local bundling (Tailwind CSS, local Inter & Outfit WOFF2 fonts, zero external CDN links).
- Data compilation layer parsing all 8 markdown prompt catalogs from `SI/` into structured JSON decks (415 verified items).
- Ephemeral state machine with 15-minute `sessionStorage` recovery, `onbeforeunload` guard, and non-blocking pool recycling on deck exhaustion.
- Core pass-and-play UI with Dual-Zone Split Layout (Speaker top, Active Listener bottom), responsive clamp down to 320px viewport width, and `env(safe-area-inset-*)` support.
- Smoothed Bernoulli Dealer engine ($P \approx 0.12$, minimum 3 cards spacing, max 15-card drought) with seedable Mulberry32 PRNG.
- Web Audio parametric sound engine with instant mute, auto-resumption on first gesture, strict node disconnection on ended, and chromatic visual pulse fallback for iOS silent mode.
- Non-coercive progression choice modal after answering 4 cards in a tier ("Advance to Next Level" vs. "Stay in Current Level") and 2-step emotional grounding checkout ("Put The Phone Away").
- Custom deck import/export module with lightweight schema validation (<2KB), 1MB payload ceiling, `custom_` ID prefixing, and `IndexedDB` persistence.
- Service Worker with cache-first offline strategy, passive non-disruptive update semantics, and PWA Web App Manifest.
- Privacy protection with `visibilitychange` blur shield in OS App Switcher.
- Comprehensive Vitest test suite with deterministic PRNG assertions and mocked AudioContext.

### 3.2 Out-of-Scope
- Cloud backends, remote databases, WebSockets, Bluetooth, or local network pairing.
- User accounts, logins, telemetry, behavioral tracking, or analytics.
- Monetization, advertisements, in-app purchases, or locked content.
- Runtime LLM / generative prompt generation.
- Long-term persistence of drawn card IDs or answered prompt histories on disk.

## 4. User Stories (Atomic)
| ID | User Story | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- |
| US-001 | As a player, I want to launch the app while in airplane mode or deep offline, so that I can play anywhere without an internet connection. | 1. App loads and renders completely with 0 network calls.<br>2. Local fonts (Inter & Outfit) and Tailwind styles render correctly without CDN calls.<br>3. Service worker pre-caches app shell and activates updates passively without interrupting active sessions. | High |
| US-002 | As a facilitator, I want to select from the 8 built-in decks across all age cohorts and relationship dynamics, so that the prompts fit our exact group context. | 1. Deck selector lists all 8 catalogs with tags, item counts, and descriptions.<br>2. Selecting a deck displays the Social Contract & Briefing screen.<br>3. Briefing reflects the deck's pass instruction (`"pass to your partner"` vs. `"pass to your left"`). | High |
| US-003 | As a speaker and listener pair, I want a dual-zone split card layout, so that the speaker knows what to read aloud and the listener receives dedicated attunement guidance. | 1. Screen splits into top (Speaker) and bottom (Active Listener) cards.<br>2. Top card displays prompt, deck title, and level indicator; bottom card displays active listening cue and pass guidance.<br>3. Responsive layout with `env(safe-area-inset-*)` and text clamp prevents internal nested scrolling down to 320px viewport width. | High |
| US-004 | As a group, I want to advance cards via touch swipes or taps with synthesized audio feedback, so that interaction feels tactile and smooth. | 1. Horizontal swipe left ($\Delta x < -60\text{px}$) or vertical flick ($\Delta y < -60\text{px}$) triggers next card with 400ms debounce window.<br>2. A 1-step "Previous Card" undo button allows recovering from accidental swipes.<br>3. Web Audio produces clean frequencies without audio glitches; nodes disconnect on `onended`.<br>4. Chromatic visual pulse fires on card transition as a fallback when device is in silent mode. | High |
| US-005 | As players reaching depth thresholds, I want a non-coercive progression choice modal after answering 4 cards in a tier, so that we control our vulnerability pacing. | 1. Modal surfaces after 4 answered cards offering "Advance" or "Stay in Current Level".<br>2. Choosing "Stay" allows continued play; when tier cards are exhausted, the pool recycles non-blockingly with a toast.<br>3. Interactive header level pill permits manual tier selection at any time. | High |
| US-006 | As players drawing cards, I want wildcards to appear authentically at a statistical rate of ~12% per tier without clumping, so that exercises are pleasantly unpredictable. | 1. Card draw runs smoothed Bernoulli trials ($P \approx 0.12$) with minimum 3-card spacing and max 15-card drought guard.<br>2. Wildcard pulls from the current tier's dedicated wildcard pool.<br>3. PRNG is seedable via Mulberry32 in test environments for deterministic verification. | Medium |
| US-007 | As participants completing a conversation, I want a grounding checkout process, so that we de-escalate emotionally before concluding. | 1. Tapping "Finish" triggers Step 1: One-word emotional state share.<br>2. Step 2: Mutual active listening appreciation prompt.<br>3. Concludes on a calming "Put The Phone Away" screen and wipes session storage. | High |
| US-008 | As a therapist or educator, I want to import and export custom `.json` decks offline, so that I can use tailored prompts for specific sessions safely. | 1. File picker accepts valid `.json` decks $\le 1\text{MB}$ matching schema via lightweight validator (<2KB).<br>2. Prompts render strictly via `textContent` (no HTML/XSS).<br>3. Custom deck IDs are auto-prefixed with `custom_` to prevent catalog collisions.<br>4. Custom decks persist in `IndexedDB` and can be exported back to `.json`. | Medium |
| US-009 | As a user concerned with privacy, I want sensitive prompts protected while having session resilience against accidental mobile browser tab death. | 1. Active session state is kept in ephemeral `sessionStorage` with a 15-minute TTL, wiped immediately on Finish or Quit.<br>2. `onbeforeunload` guard confirms before accidental reload if a session is in progress.<br>3. `visibilitychange` listener blurs the card view in the mobile OS App Switcher. | High |

## 5. Technical Specifications (The Blueprint)
### 5.1 Architecture & Resolved Trade-offs
The rebuild replaces the 67KB single-file monolith (`index.html`) with a modular, offline-first client architecture:

```
src/
├── assets/         # Bundled WOFF2 fonts (Inter, Outfit), CSS styles, manifest
├── core/
│   ├── audio.ts    # SoundEngine (Web Audio synthesis, node recycling, visual pulse)
│   ├── dealer.ts   # Smoothed Bernoulli dealer, Mulberry32 PRNG, pool recycling
│   ├── gestures.ts # Touch/swipe gesture recognizer with 400ms debounce
│   ├── storage.ts  # Ephemeral sessionStorage (15-min TTL) & IndexedDB custom deck store
│   └── state.ts    # FSM managing deck, tier, draw history, recovery, and modals
├── data/
│   ├── catalogs/   # 8 static compiled JSON decks extracted from SI/
│   └── validator.ts# Lightweight schema validator (<2KB) for deck imports
├── ui/
│   ├── components/ # SplitCard, ProgressionModal, GroundingCheckout, Header, Toast
│   └── views/      # DeckSelectorView, BriefingView, GameView, CheckoutView
├── service-worker.ts # Cache-first offline shell with passive update lifecycle
└── main.ts         # App entrypoint, error boundary, and routing
```

**Resolved Trade-offs Log:**
- **Issue 1: Tab Sleep / Memory Pressure vs. Zero-Trace Mandate:**
  - *Options Considered:* Option A: Ephemeral `sessionStorage` (15-min TTL) + `onbeforeunload` guard vs. Option B: Pure in-memory state vs. Option C: Encrypted `localStorage`.
  - *Resolution:* Option A approved. Survives OS tab sleep/app switching with automatic self-destruction on tab close or session checkout, preserving emotional safety without persistent residue.
- **Issue 2: Infinite Card Draw Deadlock on Deck Exhaustion:**
  - *Options Considered:* Option A: Non-blocking recycle with visual toast vs. Option B: Forced progression boundary vs. Option C: Fallback to cross-tier reflection pool.
  - *Resolution:* Option A approved. If players draw all tier cards and choose "Stay in Current Level", drawn cards are reshuffled and a reassuring toast notification informs players the pool has recycled.
- **Issue 3: Custom Deck Security, XSS & Bundle Budget:**
  - *Options Considered:* Option A: Lightweight zero-dep schema validator (<2KB), 1MB limit, auto `custom_` prefix, `textContent`-only rendering vs. Option B: Zod (~40KB) + DOMPurify vs. Option C: In-app form only.
  - *Resolution:* Option A approved. Eliminates XSS and DoS attack surface while preserving the strict <180KB total gzipped bundle budget.
- **Issue 4: Service Worker Update Disruption:**
  - *Options Considered:* Option A: Non-intrusive passive update (background install, activate on next fresh launch or deck selector toast) vs. Option B: Immediate `skipWaiting()` modal prompt vs. Option C: Manual check only.
  - *Resolution:* Option A approved. Ensures intimate conversations in progress are never interrupted by unsolicited page reloads.
- **Issue 5: Interaction, Audio & Dealer Engine NFRs:**
  - *Resolution:* 400ms swipe debounce, 1-step "Previous Card" undo buffer, `overscroll-behavior: none`, `node.disconnect()` on `onended`, chromatic visual pulse fallback for iOS silent switch, and smoothed Bernoulli trials ($P \approx 0.12$, min 3 cards spacing, max 15-card drought).
- **Issue 6: Privacy, Layout & Budgets NFRs:**
  - *Resolution:* App Switcher privacy blur on `visibilitychange`, `env(safe-area-inset-*)` layout padding, Mulberry32 deterministic integer PRNG, and total gzipped bundle ceiling $\le 180\text{KB}$.

### 5.2 System Graph Blast Radius
The following nodes in `spec/compiled/architecture.yml` will be established by this feature:
- `system_skipstone`
- `module_scaffolding_pwa`
- `module_prompt_catalogs`
- `module_core_engine`
- `module_ui_shell`
- `module_custom_decks`
- `module_verification_suite`

### 5.3 Execution Checklist (MiniPRDs)
The following modular PRDs have been generated to execute this SuperPRD in isolated branches:
- [x] `spec/compiled/MiniPRD_Project_Scaffolding.md`
- [x] `spec/compiled/MiniPRD_Prompt_Catalogs.md`
- [x] `spec/compiled/MiniPRD_Core_Engine.md`
- [x] `spec/compiled/MiniPRD_UI_Shell.md`
- [x] `spec/compiled/MiniPRD_Custom_Decks.md`
- [x] `spec/compiled/MiniPRD_Verification_Suite.md`

### 5.4 API Contracts / Schema
```typescript
export type PromptType = 'prompt' | 'wildcard';
export type PassAction = 'pass_partner' | 'pass_left';
export type TierLevel = 1 | 2 | 3;

export interface ConversationPrompt {
  id: string;                         // e.g. 'gen_t1_01'
  tier: TierLevel;                    // 1: Warm Up, 2: Vulnerability, 3: Core Truths
  type: PromptType;                   // 'prompt' | 'wildcard'
  speakerPrompt: string;              // Read aloud by the person holding phone
  listenerPrompt: string;             // Active listener attunement coaching
  passAction: PassAction;             // Physical device handoff instruction
  tags: string[];                     // Semantic tags
}

export interface DeckCatalog {
  id: string;                         // e.g. 'general_edition' or 'custom_123'
  title: string;
  subtitle: string;
  targetAudience: string;
  defaultPassAction: PassAction;
  isCustom?: boolean;
  prompts: ConversationPrompt[];
}

export interface EphemeralSessionPayload {
  deckId: string;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  drawnPromptIds: string[];
  activeCard: ConversationPrompt | null;
  previousCard: ConversationPrompt | null;
  soundEnabled: boolean;
  lastActiveTimestamp: number;        // For 15-min TTL expiry check
}
```

### 5.5 Dependencies
- Build & Bundler: `vite`, `typescript`
- Styling: `tailwindcss`, `autoprefixer`, `postcss`
- Testing: `vitest`, `jsdom`
- Zero runtime dependencies (`0` external production dependencies).

## 6. Negative Constraints (The "Do NOTs")
- **DO NOT** use any external CDN links (`fonts.googleapis.com`, `cdn.tailwindcss.com`, etc.); 100% of assets must be locally bundled.
- **DO NOT** implement cloud backends, user signups, telemetry, or third-party analytics trackers.
- **DO NOT** persist conversation history or drawn card IDs to persistent storage (`localStorage` or permanent `IndexedDB`).
- **DO NOT** allow raw HTML rendering or `innerHTML` in prompt cards; use strict `textContent` to prevent DOM XSS.
- **DO NOT** auto-reload or call `skipWaiting()` on active sessions during Service Worker updates.
- **DO NOT** use naive independent Bernoulli trials without variance smoothing; prevent wildcard clustering and droughts.
- **DO NOT** force tier progression; progression must remain non-coercive with autonomous opt-in modals.

## 7. Risks & Mitigation
- **Risk 1: Bundle Size Exceeding 200KB Ceiling:** Subsetting fonts (Latin basic only) to $\le 60\text{KB}$, JSON decks compressed $\le 50\text{KB}$, and eliminating runtime libraries like Zod keeps total gzipped bundle $\le 180\text{KB}$.
- **Risk 2: Web Audio Memory Leaks in Safari:** Explicitly schedule `.stop()` and disconnect all audio nodes on `onended` callback.
- **Risk 3: iOS Silent Hardware Switch Suppressing Audio:** Provide subtle chromatic visual border pulses on card transition so muted users receive visual feedback.
- **Risk 4: Accidental Pull-to-Refresh & Edge-Swipe Navigation:** Apply root `overscroll-behavior: none` and handle a 1-step "Previous Card" buffer.

## 8. Success Metrics
- **Performance:** 100% offline launch with 0 network requests post-installation; production bundle $\le 180\text{KB}$ gzipped.
- **Accessibility:** WCAG AAA compliance for text contrast on high-contrast and low-light intimate themes.
- **Reliability:** 100% test pass rate across all 8 decks (415 verified items) with deterministic PRNG assertions.
- **Zero Vulnerability:** 0 XSS vulnerabilities on custom deck import, 0 memory leaks from Web Audio nodes, 0 accidental session loss on mobile background tab sleep.
