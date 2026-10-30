# MiniPRD: Prompt Catalog Compilation & Data Layer

**Hypergraph Node ID:** module_prompt_catalogs  
**Parent Node:** system_skipstone

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None. Schema definitions and exact card item counts across all 8 markdown catalogs in `SI/` are fully defined.

## 2. Atomic User Stories
- **US-CAT-01:** As a facilitator, I want access to all 8 relationship and age-appropriate catalogs (Adult Offspring, Children 6-11, Couples & Dating, Family Gathering, General Edition, Men's Circle, Teenagers, Women's Circle).
- **US-CAT-02:** As a developer, I want all 415 prompt cards strictly validated and statically bundled so they are immediately available offline with 0 runtime fetch latency.

## 3. Implementation Plan (Task List)
- [x] Task 1: Define TypeScript contracts in `src/data/types.ts` (`ConversationPrompt`, `DeckCatalog`, `TierLevel`, `PromptType`, `PassAction`).
- [x] Task 2: Implement extraction script (`scripts/compile_catalogs.mjs`) to parse markdown tables in `SI/` into structured JSON.
- [x] Task 3: Extract and format all 8 built-in catalogs:
  - `general_edition.json`
  - `dating_courtship.json`
  - `lovers_committed.json`
  - `family_circles.json`
  - `parent_child_5_8.json`
  - `parent_child_9_12.json`
  - `parent_child_13_17.json`
  - `parent_child_adult_offspring.json`
- [x] Task 4: Implement catalog registry in `src/data/registry.ts` mapping deck IDs to metadata and prompt arrays.
- [x] Task 5: Add unit tests verifying prompt counts, unique IDs within each deck, non-empty speaker/listener strings, and tier distributions.

## 4. The Negative Space (Constraints)
- **DO NOT** modify prompt copy or intent from the original `SI/` markdown source documents.
- **DO NOT** use runtime asynchronous network fetches for built-in catalog data; all 8 catalogs must be bundled static modules.
- **DO NOT** duplicate card IDs across or within tiers.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Prompt catalog integrity test: Asserts exactly 8 built-in decks loaded with an aggregate count of exactly 415 prompts.
- **Test 2 (Deterministic):** Schema conformity test: Asserts every prompt contains valid `id`, `tier` (1, 2, or 3), `type` ('prompt' | 'wildcard'), `speakerPrompt`, `listenerPrompt`, `passAction`, and `tags`.
