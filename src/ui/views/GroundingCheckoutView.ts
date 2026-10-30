import type { AppState } from '../../core/state';
import { globalStateMachine } from '../../core/state';

export function createGroundingCheckoutView(state: AppState): HTMLElement {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col justify-between overflow-y-auto px-4 py-8 max-w-md mx-auto text-center';

  const content = document.createElement('div');
  content.className = 'flex flex-col items-center justify-center my-auto gap-6';

  if (state.checkoutStep === 1) {
    // Step 1: One-word share
    const stepBadge = document.createElement('span');
    stepBadge.className = 'px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-teal-950/70 text-teal-300 border border-teal-800/80';
    stepBadge.textContent = 'Step 1 of 2: Emotional Check-In';
    content.appendChild(stepBadge);

    const title = document.createElement('h2');
    title.className = 'font-display text-2xl sm:text-3xl font-bold text-white leading-tight';
    title.textContent = 'One-Word Share';
    content.appendChild(title);

    const promptCard = document.createElement('div');
    promptCard.className = 'p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 text-base sm:text-lg leading-relaxed shadow-xl';
    promptCard.textContent = 'Take one slow, deep breath together. In exactly one word, speak aloud the emotion or sensation you are carrying right now.';
    content.appendChild(promptCard);

    const helper = document.createElement('p');
    helper.className = 'text-xs text-slate-400 italic';
    helper.textContent = 'Do not explain or defend the word. Just name it and let it be held in the circle.';
    content.appendChild(helper);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'w-full py-3.5 px-6 rounded-xl font-medium text-sm text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-950/40 transition-all';
    nextBtn.textContent = 'Both Shared → Continue to Step 2';
    nextBtn.onclick = () => globalStateMachine.nextCheckoutStep();
    content.appendChild(nextBtn);

  } else if (state.checkoutStep === 2) {
    // Step 2: Mutual Appreciation
    const stepBadge = document.createElement('span');
    stepBadge.className = 'px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/80';
    stepBadge.textContent = 'Step 2 of 2: Relational Appreciation';
    content.appendChild(stepBadge);

    const title = document.createElement('h2');
    title.className = 'font-display text-2xl sm:text-3xl font-bold text-white leading-tight';
    title.textContent = 'Attunement Gift';
    content.appendChild(title);

    const promptCard = document.createElement('div');
    promptCard.className = 'p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 text-base sm:text-lg leading-relaxed shadow-xl';
    promptCard.textContent = 'Look at your partner or the person to your left. Tell them one specific thing they shared today that touched you or made you feel closer to them.';
    content.appendChild(promptCard);

    const helper = document.createElement('p');
    helper.className = 'text-xs text-slate-400 italic';
    helper.textContent = 'Receive the appreciation with a simple "Thank you."';
    content.appendChild(helper);

    const finishBtn = document.createElement('button');
    finishBtn.type = 'button';
    finishBtn.className = 'w-full py-3.5 px-6 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/40 transition-all';
    finishBtn.textContent = 'Complete & Ground';
    finishBtn.onclick = () => globalStateMachine.nextCheckoutStep();
    content.appendChild(finishBtn);

  } else {
    // Step 3: Put The Phone Away
    const stoneIcon = document.createElement('div');
    stoneIcon.className = 'text-5xl animate-bounce mb-2';
    stoneIcon.textContent = '🪨';
    content.appendChild(stoneIcon);

    const title = document.createElement('h2');
    title.className = 'font-display text-2xl sm:text-3xl font-bold text-slate-100';
    title.textContent = 'Put The Phone Away';
    content.appendChild(title);

    const finalCard = document.createElement('div');
    finalCard.className = 'p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 text-sm sm:text-base leading-relaxed';
    finalCard.textContent = 'The digital screen has served its purpose. The intimacy belongs to you. Place the phone face-down and enjoy the presence of the room.';
    content.appendChild(finalCard);

    const exitBtn = document.createElement('button');
    exitBtn.type = 'button';
    exitBtn.className = 'w-full py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 transition-all mt-4';
    exitBtn.textContent = 'Done • Return to Deck Selection';
    exitBtn.onclick = () => globalStateMachine.quitToDeckSelect();
    content.appendChild(exitBtn);
  }

  container.appendChild(content);
  return container;
}
