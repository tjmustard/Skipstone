# System Patterns: Skipstone

## Architectural Patterns
- **Zero-Dependency TypeScript PWA:** Modular client-side architecture built with Vite and Tailwind CSS. Zero external runtime CDN dependencies.
- **Finite State Machine (`src/core/state.ts`):** Single source of truth for navigation view, tier level, card history, audio settings, and active role state. Uses an observer subscription pattern (`subscribe(listener)`).
- **Deterministic PRNG Dealer (`src/core/dealer.ts`, `src/core/prng.ts`):** Seedable Mulberry32 pseudo-random number generator ensuring reproducible decks, smooth pool recycling, and smoothed Bernoulli wildcard distribution ($\ge 3$ regular cards between wildcards, 15-card drought guard).
- **Role-Partitioned Dealer & Bilateral Alternation (`src/core/dealer.ts`):** Bilateral decks partition active tier cards into `roleAPool`, `roleBPool`, and `wildcardPool`. Dealing strictly pulls for the active speaker and toggles counterpart roles upon `nextCard()`. Classic non-bilateral decks fall back seamlessly to a unified pool.
- **Stateful 1-Step Undo Symmetry (`src/core/state.ts`):** Single-step undo tracks `previousActionType: 'NEXT' | 'SKIP'`, `previousRole`, and `previousCard`. Reverting a `NEXT` decrements tier counts and restores the previous role; reverting a `SKIP` restores the skipped card without modifying counters or active roles. The undo action disables immediately after a single invocation.
- **Non-Advancing Skip with Pool Tail Recycling (`src/core/dealer.ts`):** Skipped prompts recycle to the end of the active role's pool without advancing `cardsAnsweredInTier` or toggling `activeRole`. Disables when $\le 1$ prompt remains in the role pool to prevent redundant immediate redraws.
- **Ephemeral Storage (`src/core/storage.ts`):** 15-minute sliding window TTL stored in browser `sessionStorage`. Captures active deck, tier, cards answered, drawn history, sound toggle, bilateral roles, and `hasShownProgressionForTier`. Wiped completely upon session completion. Strict rehydration validation discards corrupt or stale sessions.
- **Parametric Web Audio Synthesizer (`src/core/audio.ts`):** Browser-native harmonic oscillator/gain node synthesis (440 Hz–880 Hz chime, 750 Hz/1100 Hz skip tick) with zero audio file assets. Disconnects nodes immediately on `onended` to prevent memory leaks; provides visual pulse fallback when audio is disabled or unavailable.
- **View Lifecycle Pattern (`src/ui/views/`):** All views export factory functions returning `{ element: HTMLElement; cleanup: () => void }`. State changes trigger cleanup before remounting.
- **Strict DOM Insertion:** All user-facing prompt and coaching text is inserted via `textContent` or text nodes—`innerHTML` is strictly forbidden to eliminate XSS attack surfaces.
- **Spatial Ergonomics & WCAG AAA:** Touch targets maintain $\ge 44$px minimum dimensions. All active text and button tokens meet or exceed WCAG AAA ($\ge 7.0:1$) contrast ratios against dark container backgrounds. Horizontal layout strictly preserves `flex-nowrap` on $\ge 320$px viewports.

## Anti-Patterns & Constraints
- **NO Cloud Calls / Telemetry:** The application must never emit HTTP requests, analytics pings, or telemetry.
- **NO Third-Party CDNs:** Fonts (Outfit, Inter) and scripts must remain locally bundled in `/dist`.
- **NO Unseeded Randomness:** All shuffling and card dealing must flow through the seedable PRNG dealer.
- **NO Coercive Progression:** Players must always be permitted to stay in their current tier or pass on any prompt.
- **NO Multi-Tap Race Conditions:** Next, Skip, Previous, and tier advance actions must enforce a 350ms transition debounce lockout.
