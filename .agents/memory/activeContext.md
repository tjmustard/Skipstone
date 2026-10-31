# Active Context: Relational Sequence Deck Reordering

## Current Objective
Reorder built-in deck catalogs into natural relational progression: General Edition, Family Circles, Parent & Child (5–8, 9–12, 13–17, adult offspring), Dating & Early Courtship, and Lovers & Committed Partners.

## Completed Changes (v1.0.3)
1. `src/data/registry.ts`: Reordered `BUILT_IN_DECKS` array and catalog imports.
2. `README.md`: Updated canonical 8-deck reference table to match new ordering.
3. `scripts/compile_catalogs.mjs`: Kept compilation file list synchronized.
4. `tests/catalogs.test.ts`: Added deterministic regression test verifying deck catalog ID order.

## System Status
- Version: `1.0.3` (`package.json`, `src/service-worker.ts`, `CHANGELOG.md`).
- Architecture Hypergraph: `spec/compiled/architecture.yml` clean.
- Vitest Suite: 78/78 deterministic unit & integration tests passing.
- Production Build: 171.73 KB gzipped (verified against 180.00 KB budget ceiling).
- WCAG AAA Contrast: 100% compliant ($\ge 7.0:1$) across all tiers, buttons, and badges.
- Branch: `swimlane/reorder-deck-catalogs`.
