# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
