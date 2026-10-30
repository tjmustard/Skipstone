# LIVING MASTER PLAN: SKIPSTONE (formerly Open Depth Engine)
**Document Version:** 2.2.0  
**Status:** In Progress — Phase 2 Completed, Phase 3 Next  
**Target:** Free, Open-Source, Offline-First Relational Intimacy Application  
**Public Brand:** **Skipstone** (*"Start on the surface. Settle in the deep."*)  
**Architectural Paradigm:** Zero-Cloud, Single-Device Pass-and-Play (Dyadic & Group)

---

## 1. Project Objectives & Value Proposition
- **Primary Goal:** Engineer a 100% free, privacy-first, open-access mobile software alternative to commercial card games (e.g., *How Deep Will You Go?*, *We're Not Really Strangers*, *Skin Deep*).
- **Brand Identity & Metaphor (Skipstone):**
  - Modeled on skipping a stone across water: Level 1 skips lightly across the surface (playful, low-stakes observation); Level 2 slows into ripples (vulnerability and formative habits); Level 3 settles into the clear deep water (existential truths, core needs, and repair).
  - Playful, tactile, and multi-generational—accessible for 5-year-olds and comforting for partners and elders without clinical self-help jargon.
- **Core Differentiation:**
  - **Zero Monetization / Zero Dark Patterns:** No paywalls, subscription tiers, locked expansion decks, streaks, or behavioral addiction loops.
  - **Empirical Grounding:** Prompts structured upon validated interpersonal psychology:
    - *Social Penetration Theory* (Altman & Taylor) — Graduated breadth and depth.
    - *Interpersonal Process Model of Intimacy* (Reis & Shaver; Laurenceau et al.) — Intimacy as a function of Perceived Partner Responsiveness (PPR: Understanding, Validation, Caring).
    - *Reciprocal Escalation Protocols* (Aron et al., 1997) — Symmetrical, stepped disclosure.
    - *Restorative Circles & Felt Safety* — Unconditional right to pass, talking piece discipline, and mutual confidentiality.
  - **Hardware Ergonomics:** Single-device pass-and-play. No Bluetooth discovery, Wi-Fi pairing, or player profile typing. The physical device acts as the talking piece.
  - **Dual-Zone Split Layout:** Screen presents the prompt to read aloud on top, coupled with dedicated Active Listener Attunement coaching on the bottom.

---

## 2. System Architecture & Technical Specifications

### 2.1 Hardware Interaction & Network Topology
- **Topology:** Pure local execution. Sandboxed single-client execution environment.
- **Network Dependency:** Zero network requirements ($0\text{ bytes}$ transmitted post-load).
- **Hardware Abstraction:** The phone is passed physically:
  - *Dyadic mode (1-on-1):* Top instruction reads `"Answer, then pass to your partner"`.
  - *Group mode ($N \ge 3$):* Top instruction reads `"Answer, then pass to your left"`.

### 2.2 Software Stack
- **Runtime Environment:** Single-file Progressive Web Application (PWA) / Single-Page Application (SPA) deployable to standard browsers and wrappable into native wrappers (Capacitor/React Native).
- **Styling Engine:** Tailwind CSS with dynamic chromatic theme tokens calibrated to emotional depth.
- **Audio Synthesis:** Native Web Audio API synthesizer (`SoundEngine`) producing parametric sines and harmonic sweeps (440 Hz–880 Hz) for zero external asset network overhead.
- **Touch Gesture System:** Native touch event responders listening for horizontal swipes ($\Delta x < -60\text{px}$) and vertical flicks ($\Delta y < -60\text{px}$) to advance cards naturally.

### 2.3 Tier Progression & Statistical Randomization Logic
- **Tier Structure:**
  - **Tier 1 (Warm Up / Perception):** Low-stakes observation, nostalgic grounding, sensory preferences, and humor.
  - **Tier 2 (Confessions / Vulnerability):** Formative lessons, blind spots, relational habits, unmet needs, and childhood patterns.
  - **Tier 3 (Getting Deep / Core Truths):** Existential reflections, mortality, forgiveness, sacred yearnings, and core repair.
- **Progressive Gating & Autonomous Pacing:**
  - Premature emotional flooding is mitigated by locking Level 2 and Level 3 behind a baseline exposure threshold ($N \ge 4$ prompts answered in the preceding tier).
  - *Non-Coercive Advancement:* Upon reaching the threshold, the app triggers an autonomous selection modal offering two clear choices:
    1. **"Advance to Next Level"** (advances state into deeper tier).
    2. **"Stay in Current Level (Draw More)"** (allows the group to exhaust or continue drawing from the current level's pool indefinitely).
  - *Manual Override:* Top header level pill is interactive, enabling facilitators to view or trigger tier choices at any time.
- **Statistical Wildcard Randomization:**
  - Wildcards are separated into tier-specific pools (somatic/playful in Tier 1; candor/hot-seat in Tier 2; silence/covenant in Tier 3).
  - Each card draw triggers an independent Bernoulli trial with $P(\text{wildcard}) \approx 0.12$ (matching physical deck distributions of ~10–12 wildcards per 100 cards).
  - Eliminates predictable, slotted card draws in favor of authentic randomness.

---

## 3. Data Schema & Catalog Inventories

### 3.1 Prompt Item Data Specification
```typescript
interface ConversationPrompt {
  id: string;                         // Unique identifier (e.g., 'gen_t1_01')
  tier: 1 | 2 | 3;                    // Depth classification
  type: 'prompt' | 'wildcard';        // Interaction archetype
  speakerPrompt: string;              // Read aloud by the person holding phone
  listenerPrompt: string;             // Active listening attunement guidance
  passAction: 'pass_partner' | 'pass_left'; // Physical hand-off instruction
  tags: string[];                     // Semantic taxonomy tags
}
```

### 3.2 Implemented Catalog Registry (Total: 415 Prompts)
1. **General Edition** (`decks/general_edition.json`):
   - *Target:* Friends, acquaintances, dinner parties, community circles, and strangers.
   - *Scope:* 100 structured items (30 Tier 1, 30 Tier 2, 30 Tier 3, 10 Wildcards).
   - *Participant Mode:* `"pass_left"` ($N \ge 2$).
2. **Parent & Child Cohort 1: Ages 5–8** (`decks/parent_child_ages_5_8.json`):
   - *Target:* Early childhood and primary caregivers.
   - *Focus:* Playful imagination, sensory anchors, big feelings, emotional naming, and unconditional safety.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_partner"`.
3. **Parent & Child Cohort 2: Ages 9–12** (`decks/parent_child_ages_9_12.json`):
   - *Target:* Pre-teens / middle childhood and caregivers.
   - *Focus:* Peer acceptance, moral courage, school pressures, emerging autonomy, and non-defensive listening.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_partner"`.
4. **Parent & Child Cohort 3: Ages 13–17** (`decks/parent_child_ages_13_17.json`):
   - *Target:* Adolescents and caregivers.
   - *Focus:* Individuation, privacy boundaries, digital life realities, unsolicited advice passes, and safe harbor commitments.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_partner"`.
5. **Parent & Child Cohort 4: Adult Offspring** (`decks/parent_child_adult_offspring.json`):
   - *Target:* Adult children and aging parents.
   - *Focus:* Filial maturity, shifting from hierarchy to peer reciprocity, untold biographical lore, and cross-generational forgiveness.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_partner"`.
6. **Dating & Early Courtship** (`decks/dating_courtship.json`):
   - *Target:* Dates, early romance, and new connections.
   - *Focus:* Dismantling the interview dynamic, attraction perception, lifestyle alignment, attachment reflexes, and candor.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_partner"`.
7. **Lovers & Committed Partners** (`decks/lovers_committed.json`):
   - *Target:* Long-term couples, life partners, and marriages.
   - *Focus:* Reversing relational drift, resolving recurring gridlock, voicing unmet needs, sensual yearnings, and deep covenant reaffirmation.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_partner"`.
8. **Family Circles & Intergenerational Groups** (`decks/family_circles.json`):
   - *Target:* Multi-generational family gatherings of 3 or more (grandparents, parents, siblings, cousins).
   - *Focus:* Oral history, legendary mishaps, shedding childhood role pigeonholes, gratitude circles, and cycle-breaking.
   - *Scope:* 45 structured items (15 Tier 1, 15 Tier 2, 10 Tier 3, 5 Wildcards).
   - *Participant Mode:* `"pass_left"`.

---

## 4. Current Roadmap & Milestone Status

### Phase 1: Psychological Mechanics & Deck Taxonomy (COMPLETE)
- [x] **Milestone 1.1:** Standard JSON Schema definition with listener attunement prompts.
- [x] **Milestone 1.2:** Author General Edition Catalog (100 prompts).
- [x] **Milestone 1.3:** Author Parent-to-Child 4-Cohort Catalog (180 prompts total across Ages 5–8, 9–12, 13–17, and Adult Offspring).
- [x] **Milestone 1.4:** Author Dating & Early Courtship Catalog (45 prompts).
- [x] **Milestone 1.5:** Author Lovers & Committed Partners Catalog (45 prompts).
- [x] **Milestone 1.6:** Author Family Circles ($N \ge 3$) Catalog (45 prompts).

### Phase 2: Application Core Engine & Interaction Design (COMPLETE)
- [x] **Milestone 2.1:** Single-file mobile architecture (`index.html`) with zero remote asset requirements.
- [x] **Milestone 2.2:** Dual-Zone Split Layout (Speaker Read-Aloud on top; Active Listener Attunement on bottom).
- [x] **Milestone 2.3:** Social Contract & Briefing screen (Agreement to unconditional pass, confidentiality, and active listening).
- [x] **Milestone 2.4:** Physical turn indicator headers (`"pass to your partner"` vs. `"pass to your left"`).
- [x] **Milestone 2.5:** Audio synthesis engine via Web Audio API.
- [x] **Milestone 2.6:** Touch gestures (swipe left/up to draw next card).
- [x] **Milestone 2.7:** Grounding 2-Step De-escalation Checkout module (1-word emotional state + mutual listening appreciation) and final "Put The Phone Away" screen.
- [x] **Milestone 2.8:** Autonomous tier progression choice modal ("Advance" vs. "Stay in current level to draw more").
- [x] **Milestone 2.9:** True statistical wildcard randomization via Poisson/Bernoulli probability ($P \approx 0.12$).

### Phase 3: PWA Offline Shell & Community Extensibility (ACTIVE)
- [ ] **Milestone 3.1: Offline PWA Packaging**
  - Inject Web App Manifest (`manifest.webmanifest`) data URI for "Add to Home Screen" installation on iOS/Android.
  - Implement zero-dependency Service Worker for complete offline asset caching.
- [ ] **Milestone 3.2: Custom Deck Authoring & JSON Import/Export**
  - Create client-side file reader allowing users, educators, and therapists to load custom `.json` prompt decks into local storage.
  - Export active decks to JSON for offline sharing.
- [ ] **Milestone 3.3: Accessibility & Contrast Audit**
  - WCAG AAA contrast ratio validation for low-light intimate environments.
  - Screen reader semantic announcements for top/bottom split cards.

---

## 5. Active Technical Constraints & Open Inquiries
1. **PWA Standalone Storage Limits:** Browsers (especially Mobile Safari) can evict `localStorage` or `IndexedDB` after weeks of inactivity if the app is not saved to the Home Screen.  
   *Current Mitigation:* Core decks are statically bundled directly into the client binary; no network loss can delete built-in cards.
2. **Display Scaling on Compact Viewports:** On small devices (e.g., iPhone SE / mini), the dual-zone split layout requires strict `leading-snug` typographic clamping to prevent vertical overflow while retaining comfortable font sizes.

---

## 6. The Graveyard (Failed Iterations, Discarded Patterns, & Bugs)
- **Multiplayer Cloud / WebSocket Sync (Discarded):** Discarded in favor of single-device physical passing. Passing a physical phone preserves co-located eye contact, somatic awareness, and vocal cues, while eliminating server bills, login friction, and connection dropouts.
- **Mandatory Turn Progression Gates (Discarded):** Forcing users to jump to Level 2 after $N$ cards caused social anxiety when groups wanted to stay playful longer. Replaced with an autonomous suggestion modal offering an explicit "Stay in Current Level" choice.
- **Slotted/Deterministic Wildcards (Discarded):** Inserting wildcards at fixed indexes felt mechanical and predictable. Replaced with true independent Bernoulli trials ($P = 0.12$) pulling from tier-specific wildcard pools.
- **Native `alert()` / `confirm()` Dialogs (Discarded):** Interrupted immersive atmospheres with harsh browser system dialogs. Replaced with custom non-blocking toast notifications and in-app modal cards.
- **Bug Fix (Oct 2026):** Resolved `ReferenceError: switchView is not defined`. Initial view controller helper functions were omitted from the runtime script block; resolved by defining `switchView`, `renderDeckList`, `selectDeck`, and `showToast` directly in the client lifecycle.