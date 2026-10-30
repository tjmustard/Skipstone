# MiniPRD: Project Scaffolding, Asset Pipeline & Offline Service Worker

**Hypergraph Node ID:** module_scaffolding_pwa  
**Parent Node:** system_skipstone

## 1. The Confidence Mandate
- **Confidence Score:** 10 / 10
- **Clarifying Questions:** None. Build pipeline, asset budgets, font subsetting, and non-intrusive Service Worker lifecycle resolved in SuperPRD.

## 2. Atomic User Stories
- **US-PWA-01:** As a user in airplane mode, I want the web app to load instantaneously from cache so I can access Skipstone anywhere.
- **US-PWA-02:** As a mobile player, I want local fonts (Inter, Outfit) and Tailwind styles to render offline without FOIT or external CDN calls.
- **US-PWA-03:** As an active conversation participant, I want Service Worker updates to install silently in the background without auto-reloading my page.

## 3. Implementation Plan (Task List)
- [x] Task 1: Initialize project configuration (`package.json`, `tsconfig.json`, `vite.config.ts`) with zero runtime dependencies.
- [x] Task 2: Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`) and bundle typography utilities.
- [x] Task 3: Bundle local Latin-subset WOFF2 font files for Inter (Regular, Medium) and Outfit (Medium, Semi-Bold) with `@font-face { font-display: swap; }`.
- [x] Task 4: Create PWA Web App Manifest (`manifest.webmanifest`) and standard apple-touch/favicon icons.
- [x] Task 5: Implement `service-worker.ts` with cache-first asset pre-caching (`install` event) and non-disruptive update semantics (no immediate `skipWaiting()`).
- [x] Task 6: Implement client-side service worker registration in `src/main.ts` with idle update listener.
- [x] Task 7: Apply root mobile styles: `overscroll-behavior: none`, `touch-action: pan-y`, and safe-area-inset padding utilities.
- [x] Task 8: Configure bundle size analyzer / ceiling check script asserting total production build $\le 180\text{KB}$ gzipped.

## 4. The Negative Space (Constraints)
- **DO NOT** include any CDN `<link>` or `<script>` tags in `index.html`.
- **DO NOT** execute `skipWaiting()` or reload active windows during an active session.
- **DO NOT** exceed the 180KB total gzipped bundle size ceiling for fonts, styles, and scripts.

## 5. Integration Tests & Verification
- **Test 1 (Deterministic):** Build output validation: `npm run build` generates assets $\le 180\text{KB}$ gzipped with 0 external network URLs in output HTML/JS/CSS.
- **Test 2 (Deterministic):** Service worker pre-cache validation: Service worker registers successfully and caches all shell assets on `install`.
