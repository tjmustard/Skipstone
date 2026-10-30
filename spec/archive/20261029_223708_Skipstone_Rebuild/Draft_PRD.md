# SuperPRD: Skipstone Codebase Rebuild

## 1. Introduction & Goals
- **Problem Statement:** The current Skipstone prototype is a single monolithic 67KB HTML file (`index.html`) coupling all user interface markup, styles, Web Audio code, application state logic, and 415 hardcoded conversational prompts into one unmaintainable document. Furthermore, it depends on external CDNs (`cdn.tailwindcss.com` and `fonts.googleapis.com`) for styling and typography, which violates the zero-cloud, 100% offline-first reliability required for an intimate pass-and-play mobile experience.
- **Solution Overview:** Rebuild Skipstone from scratch as a modular, 100% self-contained Progressive Web Application (PWA). The architecture decouples data catalogs (compiled JSON from `SI/` markdown decks), UI components, state management (finite state machine for card navigation and tier progression), audio synthesis (`SoundEngine` with Web Audio API), gesture handlers (touch swipes and keyboard fallbacks), and offline caching (Service Worker + Web App Manifest). It enforces an ephemeral, zero-trace session memory with local IndexedDB storage for custom user-imported decks.
- **Target Audience:** Dyads (couples, dating partners, parent-child pairs) and small intergenerational groups ($N \ge 3$) seeking relational depth without subscription paywalls, surveillance, or connection drops.

## 2. Confidence Mandate
- **Confidence Score:** 9.5 / 10
- **Clarifying Questions:** None remaining; core mutation, data boundaries, offline assets, permissions, and test deterministic seeding have all been resolved during architecture interview.

## 3. Scope
- **In-Scope:**
  - Modular project structure powered by modern, zero-telemetry build tooling (Vite + TypeScript + Tailwind CSS).
  - 100% local self-contained asset pipeline (bundled local fonts Inter & Outfit, bundled Tailwind CSS, zero external CDN dependencies).
  - Full conversion and validation of all 8 core prompt catalogs (415 items) from `SI/` into structured JSON decks.
  - Core Dyadic & Group pass-and-play UI with Dual-Zone Split Layout (Speaker Read-Aloud on top, Active Listener Attunement on bottom).
  - Dynamic visual depth calibration (chromatic transitions for Level 1, Level 2, and Level 3).
  - Parametric Web Audio sound synthesis engine with instant sound toggle/mute.
  - Progressive level gating ($N \ge 4$ baseline cards answered) with autonomous choice modal ("Advance to Next Level" vs. "Stay in Current Level").
  - Independent Bernoulli trials ($P \approx 0.12$) for tier-specific wildcard distribution.
  - 2-Step grounding de-escalation checkout and final "Put The Phone Away" screen.
  - Service Worker implementation with cache-first strategy for complete offline launch and Web App Manifest (`manifest.webmanifest`) for standalone PWA home screen installation.
  - Custom deck authoring and JSON import/export module using browser `IndexedDB` with Zod schema validation.
  - Headless-compatible test suite with deterministic PRNG seeding and mocked `AudioContext`.
- **Out-of-Scope:**
  - Cloud backends, remote databases, WebSockets, Bluetooth, or local network pairing.
  - User accounts, logins, telemetry, behavioral tracking, or analytics.
  - Monetization, advertisements, in-app purchases, or locked content.
  - Runtime LLM / generative prompt generation.
  - Persistent drawn-card history across browser reloads (ephemeral zero-trace mandate).

## 4. User Stories (Atomic)
| ID | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| US-001 | As a player, I want to launch the app while in airplane mode or deep offline, so that I can play anywhere without an internet connection. | 1. App loads and renders completely with zero network requests.<br>2. Local fonts (Inter & Outfit) and Tailwind styles render correctly without CDN calls.<br>3. Service worker registers and pre-caches app shell and core deck assets. | High |
| US-002 | As a facilitator, I want to select from the 8 built-in decks across all age cohorts and relationship dynamics, so that the prompts fit our exact group context. | 1. Deck selector lists all 8 catalogs with tags, item counts, and descriptions.<br>2. Selecting a deck displays the Social Contract & Briefing screen.<br>3. Briefing reflects the deck's pass instruction (`"pass to your partner"` vs. `"pass to your left"`). | High |
| US-003 | As a speaker and listener pair, I want a dual-zone split card layout, so that the speaker knows what to read aloud and the listener receives dedicated attunement guidance. | 1. Screen splits into top (Speaker) and bottom (Active Listener) cards.<br>2. Top card displays the prompt, deck title, and level indicator.<br>3. Bottom card displays the active listening cue and pass action guidance.<br>4. Text remains legible on small viewports (e.g. iPhone SE) without vertical clipping. | High |
| US-004 | As a group, I want to advance cards via touch swipes or taps with synthesized audio feedback, so that interaction feels tactile and smooth. | 1. Horizontal swipe left ($\Delta x < -60\text{px}$) or vertical flick ($\Delta y < -60\text{px}$) triggers next card.<br>2. Web Audio produces clean sine/harmonic frequencies without audio glitches.<br>3. Sound toggle button mutes/unmutes audio instantly and stores preference in `localStorage`. | High |
| US-005 | As players reaching depth thresholds, I want a non-coercive progression choice modal after answering 4 cards in a tier, so that we control our vulnerability pacing. | 1. Modal automatically surfaces after card threshold ($N \ge 4$) offering "Advance" or "Stay in Current Level".<br>2. Choosing "Stay" allows unlimited draws from current tier.<br>3. Interactive header level pill permits manual tier selection at any time. | High |
| US-006 | As players drawing cards, I want wildcards to appear authentically at a statistical rate of ~12% per tier, so that exercises are pleasantly unpredictable. | 1. Card draw runs an independent Bernoulli trial ($P \approx 0.12$).<br>2. Wildcard pulls from the current tier's dedicated wildcard pool.<br>3. PRNG is seedable in test environments for deterministic verification. | Medium |
| US-007 | As participants completing a conversation, I want a grounding checkout process, so that we de-escalate emotionally before concluding. | 1. Tapping "Finish" triggers Step 1: One-word emotional state share.<br>2. Step 2: Mutual active listening appreciation prompt.<br>3. Concludes on a calming "Put The Phone Away" screen with session reset. | High |
| US-008 | As a therapist or educator, I want to import and export custom `.json` decks offline, so that I can use tailored prompts for specific sessions. | 1. File picker accepts valid `.json` decks matching the `ConversationPrompt` schema.<br>2. Validation errors display in a non-blocking toast modal.<br>3. Valid custom decks persist in `IndexedDB` and appear alongside built-in decks in the selector.<br>4. Custom decks can be exported to `.json` for offline sharing. | Medium |
| US-009 | As a user concerned with emotional privacy, I want all drawn card histories and session state to be erased when I close or reload the app, so that no sensitive trace remains. | 1. Session state, card draw history, and tier progress are kept in memory only.<br>2. Reloading or navigating away wipes active session memory.<br>3. No prompt answers or history are ever written to persistent storage. | High |

## 5. Technical Specifications
- **Architecture & Resolved Trade-offs:**
  - *Monolith vs. Modular PWA:* Replaces single-file `index.html` with modular TypeScript modules (`core/state.ts`, `core/audio.ts`, `core/gestures.ts`, `core/decks.ts`, `ui/views.ts`) bundled with Vite.
  - *Zero CDN vs. Remote Fonts/Tailwind:* Replaces CDN scripts with precompiled local Tailwind CSS and bundled WOFF2 font files.
  - *Storage Boundary:* Core catalog decks are bundled static JSON assets. Custom decks are stored in `IndexedDB` with Zod schema validation. Session state is purely in-memory ephemeral. Sound toggle preference is stored in `localStorage`.
  - *Testing Architecture:* Vitest with JSDOM, seedable PRNG mock for card shuffling and wildcard Bernoulli trials, and stubbed `AudioContext` for headless CI.
- **System Graph Blast Radius:**
  - Greenfield rebuild: Initializes modular source tree under `src/`, `public/`, and `tests/`.
- **Execution Checklist (MiniPRD Breakdown):**
  - **MiniPRD 1:** Project Scaffolding, Asset Pipeline & Offline Service Worker (`src/`, `vite.config.ts`, local fonts, Tailwind, PWA manifest, service worker).
  - **MiniPRD 2:** Prompt Catalog Compilation & Data Layer (`src/data/`, schema definition, JSON extraction of 8 decks from `SI/`, IndexedDB custom deck store).
  - **MiniPRD 3:** Core Engine (State Machine, Bernoulli Dealer with seedable PRNG, Web Audio `SoundEngine`, and Gesture Recognizer).
  - **MiniPRD 4:** UI Shell & Views (Deck Selector, Social Contract Briefing, Dual-Zone Split Game View, Progression Modal, and Grounding Checkout).
  - **MiniPRD 5:** Custom Deck Authoring / JSON Import & Export Module with Zod validation.
  - **MiniPRD 6:** End-to-End Verification, Accessibility (WCAG AAA contrast), and Integration Test Suite.
- **API Contracts / Schema:**
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
  id: string;
  title: string;
  subtitle: string;
  targetAudience: string;
  defaultPassAction: PassAction;
  isCustom?: boolean;
  prompts: ConversationPrompt[];
}

export interface SessionState {
  deckId: string;
  currentTier: TierLevel;
  cardsAnsweredInTier: number;
  drawnPromptIds: string[];
  activeCard: ConversationPrompt | null;
  soundEnabled: boolean;
}
```
- **Dependencies:**
  - Build & Bundling: `vite`, `typescript`
  - Styling: `tailwindcss`, `@tailwindcss/typography`, `autoprefixer`, `postcss`
  - Schema Validation: `zod`
  - Testing: `vitest`, `jsdom`

## 6. Negative Constraints
- **DO NOT** use any external CDN links or runtime network queries; $0\text{ bytes}$ post-load must be strictly preserved.
- **DO NOT** implement cloud backends, user signups, OAuth, websockets, or external analytics/trackers.
- **DO NOT** persist conversation history or answered card IDs to `localStorage`, `IndexedDB`, or cookies.
- **DO NOT** use native browser `alert()` or `confirm()` dialogs; all prompts must render within custom thematic UI modals.
- **DO NOT** use slotted/predictable wildcard draws; wildcards must follow independent Bernoulli trials ($P \approx 0.12$).
- **DO NOT** force tier progression; progression must remain non-coercive with autonomous opt-in modals.

## 7. Risks & Mitigation
- **Risk 1: PWA Cache Eviction on iOS Safari:** Safari may evict cached files if unvisited for extended periods.  
  *Mitigation:* Pre-cache core assets in the Service Worker cache and bundle core catalog JSON directly into the application build so built-in decks never disappear.
- **Risk 2: Viewport Overflow on Compact Displays (e.g. iPhone SE):** Dual-zone split view can overflow vertically on short screens.  
  *Mitigation:* Use responsive clamp utilities (`leading-snug`, flex shrink properties, and fluid typography) to ensure neither zone requires internal scrolling.
- **Risk 3: AudioContext Autoplay Blocking:** Modern mobile browsers block audio until user interaction.  
  *Mitigation:* Initialize and resume `AudioContext` only on the first user touch gesture (e.g., clicking "Begin" on the Social Contract screen).
- **Risk 4: Malformed Custom JSON Decks:** User-uploaded decks could break runtime rendering.  
  *Mitigation:* Strict Zod schema validation on file import with clear modal feedback and rejection of invalid structures.

## 8. Success Metrics
- **Performance:** 100% offline launch with 0 network calls after installation.
- **Accessibility:** WCAG AAA compliance for text contrast on high-contrast and low-light intimate themes.
- **Correctness:** 100% test pass rate across all 8 decks (415 verified items) with deterministic PRNG assertions.
- **Efficiency:** Production bundle size < 200KB gzipped including all fonts, styles, scripts, and built-in decks.
