// Lightweight Toast Notification Component
export function showToast(message: string, durationMs: number = 3000): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'w-full px-4 py-3 bg-slate-800/95 border border-slate-700/80 text-slate-100 text-xs sm:text-sm font-medium rounded-xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 transform transition-all duration-300 opacity-0 translate-y-[-8px] pointer-events-auto';

  const textSpan = document.createElement('span');
  textSpan.textContent = message; // strict textContent
  toast.appendChild(textSpan);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'text-slate-400 hover:text-slate-200 text-xs font-bold px-1.5 py-0.5 rounded';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => {
    toast.classList.add('opacity-0', 'translate-y-[-8px]');
    setTimeout(() => toast.remove(), 250);
  };
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Trigger animation in
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-[-8px]');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  // Auto dismiss
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-[-8px]');
      setTimeout(() => toast.remove(), 250);
    }
  }, durationMs);
}
