import { describe, it, expect, beforeEach } from 'vitest';
import { BUILT_IN_DECKS } from '../src/data/registry';
import { StateMachine } from '../src/core/state';
import { createHeader } from '../src/ui/components/Header';
import { createBriefingView } from '../src/ui/views/BriefingView';
import { createSplitGameView } from '../src/ui/views/SplitGameView';
import { createProgressionModal } from '../src/ui/components/ProgressionModal';
import { initPrivacyShield } from '../src/main';

describe('UI Shell & View Components Verification', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="privacy-shield" class="fixed inset-0 hidden"></div>
      <div id="app"></div>
      <div id="toast-container"></div>
    `;
  });

  it('renders Header with deck title, tier pill, and audio controls', () => {
    const sm = new StateMachine(123);
    sm.selectDeck(BUILT_IN_DECKS[0]);
    sm.startSession();

    const header = createHeader(sm.getState());
    expect(header.textContent).toContain(BUILT_IN_DECKS[0].title);
    expect(header.textContent).toContain('L1');
    expect(header.textContent).toContain('Finish');
  });

  it('renders BriefingView with deck details and Begin Session CTA', () => {
    const deck = BUILT_IN_DECKS[0];
    const briefing = createBriefingView(deck);

    expect(briefing.textContent).toContain(deck.title);
    expect(briefing.textContent).toContain('Begin Conversational Journey');
    expect(briefing.textContent).toContain('Relational Agreements');
  });

  it('renders SplitGameView with top Speaker zone and bottom Listener zone using textContent', () => {
    const sm = new StateMachine(456);
    sm.selectDeck(BUILT_IN_DECKS[0]);
    sm.startSession();

    const state = sm.getState();
    const { element, cleanup } = createSplitGameView(state);

    expect(element.querySelector('#game-card-container')).toBeTruthy();
    expect(element.textContent).toContain(state.activeCard!.speakerPrompt);
    expect(element.textContent).toContain(state.activeCard!.listenerPrompt);
    expect(element.textContent).toContain('Active Listener Coaching');

    cleanup();
  });

  it('mounts ProgressionModal offering Advance or Stay options', () => {
    const sm = new StateMachine(789);
    sm.selectDeck(BUILT_IN_DECKS[0]);
    sm.startSession();

    const modal = createProgressionModal(sm.getState());
    expect(modal.textContent).toContain('Deepen the Conversation?');
    expect(modal.textContent).toContain('Advance to Level 2');
    expect(modal.textContent).toContain('Stay in Level 1');
  });

  it('toggles privacy shield when visibilitychange fires', () => {
    initPrivacyShield();
    const shield = document.getElementById('privacy-shield')!;
    expect(shield.classList.contains('hidden')).toBe(true);

    // Simulate visibility hidden
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(shield.classList.contains('hidden')).toBe(false);

    // Simulate visibility visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(shield.classList.contains('hidden')).toBe(true);
  });
});
