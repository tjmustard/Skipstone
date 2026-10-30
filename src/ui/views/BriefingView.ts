import type { DeckCatalog } from '../../data/types';
import { globalStateMachine } from '../../core/state';

export function createBriefingView(deck: DeckCatalog): HTMLElement {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col justify-between overflow-y-auto px-4 py-6 max-w-xl mx-auto';

  // Content Block
  const content = document.createElement('div');
  content.className = 'flex flex-col gap-5';

  // Badge & Title Block
  const headerBlock = document.createElement('div');
  headerBlock.className = 'text-center flex flex-col items-center gap-2';

  const badge = document.createElement('span');
  badge.className = 'px-3.5 py-1 text-xs font-semibold rounded-full border border-amber-500/40 bg-amber-950/40 text-amber-300 tracking-wider uppercase';
  badge.textContent = deck.subtitle || 'Friends, Acquaintances, & Strangers';
  headerBlock.appendChild(badge);

  const title = document.createElement('h2');
  title.className = 'font-display text-2xl sm:text-3xl font-bold text-white tracking-tight';
  title.textContent = deck.title;
  headerBlock.appendChild(title);

  content.appendChild(headerBlock);

  // Intro Card (Deck Description)
  if (deck.description) {
    const descCard = document.createElement('div');
    descCard.className = 'p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-blue-900/40 shadow-lg text-xs sm:text-sm text-slate-300 leading-relaxed';
    descCard.textContent = deck.description;
    content.appendChild(descCard);
  }

  // Card 1: How This Works
  const howCard = document.createElement('div');
  howCard.className = 'flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-blue-900/40 shadow-lg text-xs sm:text-sm text-slate-300';

  const howHeader = document.createElement('div');
  howHeader.className = 'flex items-center gap-2 text-sky-400 font-semibold tracking-wider text-xs uppercase';
  howHeader.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>HOW THIS WORKS</span>
  `;
  howCard.appendChild(howHeader);

  const passTarget = deck.defaultPassAction === 'pass_partner' ? 'partner' : 'left';

  const stepsList = document.createElement('div');
  stepsList.className = 'flex flex-col gap-3';

  // Step 1: Top Half
  const step1 = document.createElement('div');
  step1.className = 'leading-relaxed';
  step1.innerHTML = `<span class="text-amber-400 font-bold">1. Top Half:</span> <strong class="text-white font-semibold">Read aloud.</strong> <span class="text-slate-300">The person holding the device answers first.</span>`;
  stepsList.appendChild(step1);

  // Step 2: Bottom Half
  const step2 = document.createElement('div');
  step2.className = 'leading-relaxed';
  step2.innerHTML = `<span class="text-emerald-400 font-bold">2. Bottom Half:</span> <strong class="text-white font-semibold">Listener Coaching.</strong> <span class="text-slate-300">Guidance for holding space—listen to understand rather than advise or fix.</span>`;
  stepsList.appendChild(step2);

  // Step 3: Pass Device
  const step3 = document.createElement('div');
  step3.className = 'leading-relaxed';
  step3.innerHTML = `<span class="text-rose-400 font-bold">3. Pass the Device:</span> <strong class="text-white font-semibold">Answer, then pass to your ${passTarget}.</strong> <span class="text-slate-300">The phone serves as the talking piece.</span>`;
  stepsList.appendChild(step3);

  howCard.appendChild(stepsList);
  content.appendChild(howCard);

  // Card 2: Shared Agreements
  const agreementCard = document.createElement('div');
  agreementCard.className = 'flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-blue-900/40 shadow-lg text-xs sm:text-sm text-slate-300';

  const agreementHeader = document.createElement('div');
  agreementHeader.className = 'flex items-center gap-2 text-sky-400 font-semibold tracking-wider text-xs uppercase';
  agreementHeader.innerHTML = `
    <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
    <span>SHARED AGREEMENTS</span>
  `;
  agreementCard.appendChild(agreementHeader);

  const agreementsList = document.createElement('div');
  agreementsList.className = 'flex flex-col gap-2.5';

  const agreements = [
    { title: 'Zero Pressure', body: 'You always have the freedom to pass or pause without needing to justify it.' },
    { title: 'Total Confidentiality', body: 'Stories and reflections shared here remain between us.' },
    { title: 'Deep Listening', body: 'Listen to connect and explore, not to evaluate or solve.' },
  ];

  agreements.forEach(({ title, body }) => {
    const item = document.createElement('div');
    item.className = 'leading-relaxed';
    item.innerHTML = `<span class="text-white font-semibold">• ${title}:</span> <span class="text-slate-300">${body}</span>`;
    agreementsList.appendChild(item);
  });

  agreementCard.appendChild(agreementsList);
  content.appendChild(agreementCard);

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
