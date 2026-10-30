import { globalStateMachine, type AppState } from '../../core/state';

export function createProgressionModal(state: AppState): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4';

  const modal = document.createElement('div');
  modal.className = 'w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-center transform transition-all';

  const badge = document.createElement('span');
  badge.className = 'self-center px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/80 rounded-full';
  badge.textContent = `Level ${state.currentTier} Threshold`;
  modal.appendChild(badge);

  const title = document.createElement('h3');
  title.className = 'font-display text-xl font-bold text-white';
  title.textContent = 'Deepen the Conversation?';
  modal.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'text-sm text-slate-300 leading-relaxed';
  const nextTierName = state.currentTier === 1 ? 'Level 2: Vulnerability' : 'Level 3: Core Truths';
  desc.textContent = `You have shared 4 moments in this level. You can choose to step into ${nextTierName}, or remain here to explore further at your own pace.`;
  modal.appendChild(desc);

  const btnContainer = document.createElement('div');
  btnContainer.className = 'flex flex-col gap-2.5 mt-2';

  const advanceBtn = document.createElement('button');
  advanceBtn.type = 'button';
  advanceBtn.className = 'w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-900/30 transition-all';
  advanceBtn.textContent = `Advance to Level ${state.currentTier + 1}`;
  advanceBtn.onclick = () => globalStateMachine.advanceTier();
  btnContainer.appendChild(advanceBtn);

  const stayBtn = document.createElement('button');
  stayBtn.type = 'button';
  stayBtn.className = 'w-full py-2.5 px-4 rounded-xl font-medium text-sm text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all';
  stayBtn.textContent = `Stay in Level ${state.currentTier}`;
  stayBtn.onclick = () => globalStateMachine.stayInCurrentTier();
  btnContainer.appendChild(stayBtn);

  modal.appendChild(btnContainer);
  overlay.appendChild(modal);

  return overlay;
}
