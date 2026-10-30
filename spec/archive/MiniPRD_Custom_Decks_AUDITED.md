# MiniPRD: Custom Deck Import/Export & Lightweight Validation

**Hypergraph Node ID:** module_custom_decks  
**Parent Node:** system_skipstone

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None. 1MB payload ceiling, lightweight validator (<2KB), `custom_` ID namespacing, and IndexedDB boundaries are fully agreed upon.

## 2. Atomic User Stories
- **US-CUST-01:** As a facilitator, I want to import a custom JSON deck file under 1MB offline, so I can use specialized prompts for my workshop or therapy session.
- **US-CUST-02:** As a user, I want invalid or corrupted custom JSON files rejected with descriptive error messages so my app does not crash.
- **US-CUST-03:** As an author, I want to export my custom decks as `.json` files to share with others.

## 3. Implementation Plan (Task List)
- [x] Task 1: Implement lightweight zero-dependency schema validator in `src/data/validator.ts` (<2KB minified) verifying required keys, types, and tier constraints.
- [x] Task 2: Implement file upload reader with strict 1MB byte check and JSON parse error handling.
- [x] Task 3: Implement ID sanitization enforcing a `custom_` prefix on all imported deck and prompt IDs to prevent collision with built-in catalogs.
- [x] Task 4: Implement IndexedDB wrapper (`src/core/indexeddb.ts`) with `getCustomDecks()`, `saveCustomDeck()`, and `deleteCustomDeck()`.
- [x] Task 5: Implement JSON deck export generator creating downloadable `.json` blobs with proper MIME type.
- [x] Task 6: Integrate custom decks into `DeckSelectorView` with custom badges and delete actions.
- [x] Task 7: Unit tests for valid/invalid JSON imports, schema edge cases, XSS-attempt string handling, and ID collision prevention.

## 4. The Negative Space (Constraints)
- **DO NOT** use heavyweight validation packages (e.g. Zod ~40KB); use a compact zero-dependency validator function (<2KB).
- **DO NOT** accept JSON payloads exceeding 1MB in file size.
- **DO NOT** allow imported custom decks to overwrite, shadow, or mutate built-in catalog IDs.
- **DO NOT** store drawn card progress in IndexedDB; IndexedDB is strictly reserved for custom deck definitions.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Valid deck import test: A valid JSON file with 15 prompts is parsed, prefixed with `custom_`, saved to IndexedDB, and returned in the deck selector.
- **Test 2 (Deterministic):** Rejection & DoS protection test: Payloads > 1MB or malformed schema payloads throw clean validation errors without crashing the main UI thread.
