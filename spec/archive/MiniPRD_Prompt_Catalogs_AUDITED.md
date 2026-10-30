# MiniPRD: Prompt Catalogs & Data Schemas

**Hypergraph Node ID:** module_prompt_catalogs  
**Parent Node:** system_skipstone  

## 1. The Confidence Mandate
- **Confidence Score:** 10/10
- **Clarifying Questions:** None. All data schemas, catalog role metadata, prompt tags, and custom validator rules have been mediated and approved.

## 2. Atomic User Stories
- **US-CAT-01:** As a developer or deck author, I want prompt definitions to support optional `targetRole` tags so that parent-child prompts can be directed to the appropriate speaker.
- **US-CAT-02:** As a developer, I want `DeckCatalog` to declare `isBilateral`, `roleA`, `roleB`, and human-readable `roleLabels` so that the runtime engine understands role identities.
- **US-CAT-03:** As a user importing custom decks, I want the schema validator to accept optional bilateral properties without failing or stripping valid decks.

## 3. Implementation Plan (Task List)
- [x] **Task 1 (Data Types):** In `src/data/types.ts`, add `targetRole?: string` to `ConversationPrompt`.
- [x] **Task 2 (Deck Schema):** In `src/data/types.ts`, add `isBilateral?: boolean`, `roleA?: string`, `roleB?: string`, and `roleLabels?: { roleA: string; roleB: string }` to `DeckCatalog`.
- [x] **Task 3 (Parent-Child 5-8 Catalog):** In `src/data/catalogs/parentChild5to8.ts`, set `isBilateral: true`, `roleA: 'parent'`, `roleB: 'child'`, and `roleLabels: { roleA: 'Parent', roleB: 'Child' }`. Tag prompts with `targetRole: 'parent'`, `'child'`, or `'mutual'`.
- [x] **Task 4 (Parent-Child 9-12 Catalog):** In `src/data/catalogs/parentChild9to12.ts`, set `isBilateral: true`, `roleA: 'parent'`, `roleB: 'preteen'`, and `roleLabels: { roleA: 'Parent', roleB: 'Preteen' }`. Tag prompts with `targetRole: 'parent'`, `'preteen'`, or `'mutual'`.
- [x] **Task 5 (Parent-Child 13-17 Catalog):** In `src/data/catalogs/parentChild13to17.ts`, set `isBilateral: true`, `roleA: 'parent'`, `roleB: 'teen'`, and `roleLabels: { roleA: 'Parent', roleB: 'Teen' }`. Tag prompts with `targetRole: 'parent'`, `'teen'`, or `'mutual'`.
- [x] **Task 6 (Parent-Child Adult Catalog):** In `src/data/catalogs/parentChildAdult.ts`, set `isBilateral: true`, `roleA: 'parent'`, `roleB: 'adult_child'`, and `roleLabels: { roleA: 'Parent', roleB: 'Adult Child' }`. Tag prompts with `targetRole: 'parent'`, `'adult_child'`, or `'mutual'`.
- [x] **Task 7 (Validator Compatibility):** In `src/data/validator.ts`, update custom deck schema validation to permit optional bilateral properties (`isBilateral`, `roleA`, `roleB`, `roleLabels`, `targetRole`) without failing custom deck validation.
- [x] **Task 8 (Unit Tests):** Add unit tests in `tests/catalogs.test.ts` verifying that all 4 parent-child catalogs contain valid prompts matching their declared `roleA`, `roleB`, or `mutual` roles across all tiers.

**Progress:** 100% (8/8 tasks complete) ✅

## 4. The Negative Space (Constraints)
- **DO NOT** modify non-bilateral decks (`general_edition`, `dating_courtship`, `lovers_committed`, `family_circles`). Non-bilateral decks must remain unmodified.
- **DO NOT** introduce required fields to `ConversationPrompt` or `DeckCatalog` that break existing custom decks. All new properties must be optional.
- **DO NOT** introduce external validation libraries (e.g. Zod). Keep `src/data/validator.ts` zero-dependency.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Validate that `getAllDecks()` returns 8 catalogs where exactly 4 parent-child catalogs have `isBilateral: true` and all prompts have valid `targetRole` values matching their deck definition.
- **Test 2 (Deterministic):** Run `validateCustomDeck` with legacy custom deck JSON missing bilateral properties → returns `{ valid: true }` without errors or warnings.
