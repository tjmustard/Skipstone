# MiniPRD: Core Engine (State Machine, Dealer, Audio & Gestures)

**Hypergraph Node ID:** module_core_engine  
**Parent Node:** system_skipstone

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None. State machine transitions, smoothed Bernoulli algorithms, Web Audio node reclamation, and gesture debounce parameters are fully specified.

## 2. Atomic User Stories
- **US-ENG-01:** As a player, I want cards to advance smoothly with tactile touch gestures and keyboard shortcuts (ArrowRight, Space) with a 400ms debounce to prevent accidental double-skips.
- **US-ENG-02:** As a player who accidentally swiped, I want a 1-step "Previous Card" buffer so I can return to the card we just drew.
- **US-ENG-03:** As players staying in a tier beyond available cards, I want the card pool to recycle non-blockingly without throwing runtime errors or deadlocking.
- **US-ENG-04:** As participants, I want wildcards to appear authentically at ~12% probability without clustering or lengthy droughts.
- **US-ENG-05:** As a user on iOS Safari, I want synthesized audio chimes without memory leaks or crashes, and visual chromatic pulses when device is on silent mode.
- **US-ENG-06:** As a mobile user whose phone screen locks for 2 minutes, I want my active conversation state restored upon unlocking via ephemeral 15-minute `sessionStorage`.

## 3. Implementation Plan (Task List)
- [x] Task 1: Implement seedable integer PRNG (`Mulberry32`) in `src/core/prng.ts`.
- [x] Task 2: Implement smoothed Bernoulli dealer (`src/core/dealer.ts`) with spacing rule (min 3 cards between wildcards, max 15-card drought guard) and pool recycling.
- [x] Task 3: Implement Web Audio `SoundEngine` (`src/core/audio.ts`) with oscillator/gain synthesis, user-interaction auto-resume, strict `node.disconnect()` on `onended`, and chromatic pulse callback.
- [x] Task 4: Implement touch and keyboard gesture listener (`src/core/gestures.ts`) with 400ms debounce, velocity check ($> 0.3\text{px/ms}$), and threshold detection ($\Delta x, \Delta y < -60\text{px}$).
- [x] Task 5: Implement ephemeral session storage manager (`src/core/storage.ts`) with 15-minute TTL, write/read serialization, and wipe on session finish/quit.
- [x] Task 6: Implement Finite State Machine (`src/core/state.ts`) coordinating deck selection, tier progression, active/previous cards, modal triggers, and reload warning (`onbeforeunload`).
- [x] Task 7: Unit tests for state transitions, dealer distribution variance, PRNG determinism, and session expiry TTL.

## 4. The Negative Space (Constraints)
- **DO NOT** use native browser `alert()` or `confirm()` dialogs.
- **DO NOT** leak Web Audio nodes; all oscillators and gains must disconnect on `onended`.
- **DO NOT** use unseeded `Math.random()` in the dealer engine; use Mulberry32 for deterministic testability.
- **DO NOT** persist conversation history or drawn cards to `localStorage` or disk.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Dealer distribution test: Given seed `0xDEADBEEF`, 100 draws produce exact deterministic card sequence with 0 wildcard spacing violations (min 3 regular cards between wildcards).
- **Test 2 (Deterministic):** State machine pool exhaustion test: Drawing all cards in a 12-card tier seamlessly recycles the pool, sets `isRecycled = true`, and returns valid card objects without throwing.
- **Test 3 (Deterministic):** Session TTL test: Serialized session in `sessionStorage` older than 15 minutes is treated as expired and discarded.
