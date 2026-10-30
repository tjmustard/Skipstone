import type { DeckCatalog } from '../../data/types';
import { globalStateMachine } from '../../core/state';

export function createBriefingView(deck: DeckCatalog): HTMLElement {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col justify-between overflow-y-auto px-4 py-6 max-w-xl mx-auto';

  // Content Block
  const content = document.createElement('div');
  content.className = 'flex flex-col gap-5';

  // Badge & Title
  const headerBlock = document.createElement('div');
  headerBlock.className = 'text-center flex flex-col items-center gap-2';

  const badge = document.createElement('span');
  badge.className = 'px-3 py-1 text-xs font-semibold rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 uppercase tracking-wider';
  badge.textContent = deck.subtitle || 'Social Contract & Briefing';
  headerBlock.appendChild(badge);

  const title = document.createElement('h2');
  title.className = 'font-display text-2xl sm:text-3xl font-bold text-white';
  title.textContent = deck.title;
  headerBlock.appendChild(title);

  const passDirection = document.createElement('p');
  passDirection.className = 'text-xs sm:text-sm text-indigo-200 font-medium bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800';
  passDirection.textContent = deck.defaultPassAction === 'pass_partner'
    ? '📱 Device Flow: Answer, then pass phone to your partner.'
    : '📱 Device Flow: Answer, then pass phone to your left.';
  headerBlock.appendChild(passDirection);

  content.appendChild(headerBlock);

  // Description
  const descCard = document.createElement('div');
  descCard.className = 'p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs sm:text-sm text-slate-300 leading-relaxed';
  descCard.textContent = deck.description;
  content.appendChild(descCard);

  // The 3 Agreements
  const agreementBox = document.createElement('div');
  agreementBox.className = 'flex flex-col gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300';

  const agreementTitle = document.createElement('h3');
  agreementTitle.className = 'font-semibold text-slate-200 text-xs uppercase tracking-wider';
  agreementTitle.textContent = 'Relational Agreements';
  agreementBox.appendChild(agreementTitle);

  const agreements = [
    '1. Honor the silence: Do not rush to fill quiet moments after a question.',
    '2. No unsolicited fixing: Listen to understand and attune, not to solve or advise.',
    '3. Autonomous agency: Any participant can pass or take a breath at any time.'
  ];

  agreements.forEach((text) => {
    const p = document.createElement('p');
    p.className = 'text-slate-300/90 pl-1';
    p.textContent = text;
    agreementBox.appendChild(p);
  });

  content.appendChild(agreementBox);
  container.appendChild(content);

  // Bottom Actions
  const bottomBar = document.createElement('div');
  bottomBar.className = 'flex flex-col gap-3 pt-6 pb-2';

  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = 'w-full py-3.5 px-6 rounded-xl font-display font-semibold text-base text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-indigo-950/40 transition-all';
  startBtn.textContent = 'Begin Conversational Journey';
  startBtn.onclick = () => globalStateMachine.startSession();
  bottomBar.appendChild(startBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'w-full py-2 px-4 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors';
  cancelBtn.textContent = 'Choose a Different Deck';
  cancelBtn.onclick = () => globalStateMachine.quitToDeckSelect();
  bottomBar.appendChild(cancelBtn);

  container.appendChild(bottomBar);

  return container;
}
