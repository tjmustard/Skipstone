# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-10-30

### Added
- **Bilateral Turn Alternation (`src/core/dealer.ts`, `src/core/state.ts`)**: Implemented role-partitioned card dealing (`roleAPool`, `roleBPool`, `wildcardPool`) for parent-child dyads (`parent_child_5_8`, `parent_child_9_12`, `parent_child_13_17`, `parent_child_adult_offspring`), drawing prompts for the active speaker and toggling counterpart roles upon advance.
- **Dedicated Skip Action (`src/core/dealer.ts`, `src/ui/views/SplitGameView.ts`)**: Added `[Skip Card ↷]` navigation control allowing the active speaker to bypass a prompt without forfeiting their turn or advancing tier counters; recycles the skipped card to the tail of the active role's pool and automatically disables when $\le 1$ prompt remains in the pool.
- **Stateful 1-Step Undo Symmetry (`src/core/state.ts`)**: Implemented 1-step undo ledger tracking `previousActionType: 'NEXT' | 'SKIP'`, `previousRole`, and `previousCard`. Accurately restores prior state without turn desynchronization or counter corruption, and disables immediately after a single invocation.
- **Starter Role Selection (`src/ui/views/BriefingView.ts`)**: Added interactive starter role selector pills in `BriefingView` for bilateral decks, allowing dyads to choose who asks the first question before beginning (defaults to `roleA`).
- **Acoustic Skip Cue (`src/core/audio.ts`)**: Synthesized distinct double-tick acoustic cue (750 Hz / 1100 Hz triangle oscillator pulse) via the native Web Audio API with safe context error handling.
- **Mobile Action Bar Ergonomics (`src/ui/views/SplitGameView.ts`)**: Configured responsive compact button labels (`[↩ Prev]`, `[Skip ↷]`, `[Next →]`) with `flex-nowrap`, preserving $\ge 44$px touch targets and eliminating horizontal overflow on $\ge 320$px viewports.
- **Tab Visibility Inactivity Refresh (`src/ui/views/SplitGameView.ts`)**: Added document visibility listener updating `lastActiveTimestamp` in `sessionStorage` when returning from background or tab suspension.
- **Bilateral Catalog Metadata & Schema Validation (`src/data/types.ts`, `src/data/validator.ts`, `src/data/catalogs/`)**: Tagged all 180 prompts across 4 parent-child catalogs with explicit `targetRole` values (`roleA`, `roleB`, or `mutual`), added deck-level bilateral properties (`isBilateral`, `roleA`, `roleB`, `roleLabels`), and supported optional bilateral schema fields in custom deck validation.
- **Deterministic Test Coverage (`tests/dealer.test.ts`, `tests/state.test.ts`, `tests/catalogs.test.ts`, `tests/ui.test.ts`)**: Expanded automated Vitest suite to 77 deterministic tests covering role pool partitioning, turn alternation, skip semantics, undo symmetry, rehydration filtering, and UI role badges.

### Changed
- **`package.json`**: Bumped version to `1.0.2`.
- **Service Worker (`src/service-worker.ts`)**: Incremented cache name to `skipstone-v1.0.2`.
- **Session Rehydration Validation (`src/core/state.ts`)**: Enforced strict validation of saved session deck existence, current tier, active card presence, role alignment, and drawn prompt IDs; filters drawn cards from dealer role pools during rehydration and purges corrupted payloads to `DECK_SELECT`.
- **Transition Debounce Lockout (`src/core/state.ts`)**: Implemented 350ms lockout flag (`isTransitioning`) preventing multi-tap race conditions across Next, Skip, and Previous actions.
- **Catalog Writing Style & Tone Alignment (`src/data/catalogs/`)**: Aligned all 415 prompts across the 8 built-in catalogs with writing style standards and verified against `voice_lint.py`:
  - Eliminated 13 em dashes, restructuring clauses with colons, semicolons, commas, or parentheses.
  - Replaced florid AI vocabulary (`transformative`, `pivotal`) with plain language (`major formative`, `turning point`).
  - Rewrote 7 figurative term usages (`navigate`, `unlock`, `cultural landscape`) to concrete verbs and domain descriptions.

### Fixed
- **Parent-Child Conversational Asymmetry**: Resolved conversational dissonance where prompts framed for a child were dealt to parents or vice-versa, and eliminated consecutive turn imbalances.

## [1.0.1] - 2026-10-30

### Added
- **Persistent Tier Progression Button (`src/ui/views/SplitGameView.ts`)**: Added dynamic, tier-aware third action button (`#progression-action-btn`) mounted in bottom navigation when progression is unlocked (`(currentTier < 3 && hasShownProgressionForTier) || (currentTier === 3 && cardsAnsweredInTier >= 4)`).
- **Mobile-Responsive 2-Row Navigation**: Implemented stacked 2-row layout on mobile viewports (<640px) with the persistent progression button on top and Previous/Next buttons below, preserving $\ge 44$px touch targets and preventing spatial displacement.
- **Session Persistence (`src/core/state.ts`, `src/data/types.ts`)**: Added `hasShownProgressionForTier` tracking and getter to `StateMachine`, persisting state through `EphemeralSessionPayload` in `sessionStorage` across mobile tab suspension and page refreshes.
- **Verification & Accessibility Suite (`tests/ui.test.ts`, `tests/contrast.test.ts`, `tests/engine.test.ts`)**: Added 15 new automated deterministic tests (expanding suite to 41 tests) asserting navigation button mounting, action dispatching, transition debouncing, session serialization, and WCAG AAA contrast compliance ($\ge 7.0:1$) across all tier progression button tokens.

### Changed
- **`src/ui/views/BriefingView.ts`**: Refined agreement card typography and styling to match dark-surface aesthetic.
- **Service Worker (`src/service-worker.ts`)**: Incremented cache name to `skipstone-v1.0.1`.

### Fixed
- **Tier Progression Deadlock**: Resolved issue where participants selecting "Stay in Current Level" in `ProgressionModal` had no persistent, localized controls in `SplitGameView` to advance tiers or conclude the session.
- **Transition Race Conditions**: Added immediate button disablement and 400ms transition guard to prevent accidental double-tap tier skipping.

## [1.0.0] - 2026-10-29

### Added
- **Modular TypeScript PWA**: Re-architected application from monolithic prototype to zero-runtime-dependency Vite + TypeScript modular architecture.
- **Local Asset Pipeline**: Bundled local Latin-subset WOFF2 fonts (Inter and Outfit) and Tailwind typography utilities, eliminating external CDN dependencies.
- **Offline Service Worker (`src/service-worker.ts`)**: Cache-first asset pre-caching with non-disruptive update flow (no abrupt `skipWaiting()` during active sessions).
- **Static Catalog Bundling (`src/data/registry.ts`)**: Built-in static compilation of all 8 relationship and age-appropriate catalogs (415 verified prompt cards) from `SI/`.
- **Deterministic Core Engine (`src/core/dealer.ts`, `src/core/prng.ts`)**: Mulberry32 seedable PRNG dealer with smoothed Bernoulli wildcard distribution ($\ge 3$ regular cards between wildcards, max 15-card drought guard) and seamless pool recycling.
- **Web Audio Sound Engine (`src/core/audio.ts`)**: Pure harmonic oscillator/gain synthesizer with strict `disconnect()` node reclamation on `onended` and visual chromatic pulse fallback.
- **Mobile Touch Gestures & Privacy Shield (`src/core/gestures.ts`, `src/main.ts`)**: 400ms debounced swipe/flick navigation and OS app switcher backdrop-blur privacy shield.
- **Custom Deck Import/Export (`src/data/validator.ts`, `src/core/indexeddb.ts`)**: Offline JSON deck import with <2KB zero-dependency validator, 1MB payload ceiling, `custom_` ID namespacing, and IndexedDB storage.
- **Verification Suite & Quality Gates**: 26 deterministic Vitest tests covering engine determinism, catalog schema integrity, WCAG AAA contrast compliance ($\ge 7.0:1$), and production bundle budget assertion script ($\le 180$ KB gzipped; actual: 167.35 KB).

### Changed
- **`index.html`**: Converted to clean, secure PWA shell with zero third-party CDN scripts or fonts.
- **Card Rendering**: Enforced strict `textContent` DOM insertion across all prompt and active listener coaching components to guarantee zero XSS surface.

### Added
- **Skipstone Application (`index.html`)**: Single-file, zero-dependency offline web application and PWA.
- **Dual-Zone Split Layout**: Upper speaker read-aloud prompt paired with lower real-time active listener attunement coaching.
- **8 Pre-loaded Conversational Decks (415 Total Prompts)**:
  - General Edition (100 prompts)
  - Dating & Early Courtship (45 prompts)
  - Lovers & Committed Partners (45 prompts)
  - Family Circles & Intergenerational Groups (45 prompts)
  - Parent & Child: Ages 5–8 (45 prompts)
  - Parent & Child: Ages 9–12 (45 prompts)
  - Parent & Child: Ages 13–17 (45 prompts)
  - Parent & Child: Adult Offspring (45 prompts)
- **Harmonic Audio Synthesizer**: Web Audio API sine synthesizer delivering 440 Hz–880 Hz cues with zero external audio assets.
- **Touch Gesture Navigation**: Swipe left and flick up support for seamless physical card drawing.
- **Autonomous Pacing & Felt Safety**: Non-coercive level advancement modal and unconditional right to pass.
- **2-Step Grounding Checkout**: Cooldown module featuring one-word emotional state naming and listener appreciation.
