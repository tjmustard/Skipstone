export interface GestureCallbacks {
  onNext: () => void;
  onPrevious?: () => void;
  onToggleSound?: () => void;
}

export class GestureHandler {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private lastTriggerTime: number = 0;
  private readonly debounceMs: number = 400;
  private readonly distanceThreshold: number = 60; // 60px
  private readonly velocityThreshold: number = 0.3; // 0.3px/ms
  private active: boolean = false;

  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(element: HTMLElement, callbacks: GestureCallbacks) {
    this.element = element;
    this.callbacks = callbacks;

    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.attach();
  }

  public attach(): void {
    if (this.active) return;
    this.element.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    this.element.addEventListener('touchend', this.boundTouchEnd, { passive: true });
    window.addEventListener('keydown', this.boundKeyDown);
    this.active = true;
  }

  public detach(): void {
    if (!this.active) return;
    this.element.removeEventListener('touchstart', this.boundTouchStart);
    this.element.removeEventListener('touchend', this.boundTouchEnd);
    window.removeEventListener('keydown', this.boundKeyDown);
    this.active = false;
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.changedTouches.length !== 1) return;
    const now = Date.now();
    if (now - this.lastTriggerTime < this.debounceMs) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const deltaTime = Math.max(1, now - this.startTime);

    const distance = Math.hypot(deltaX, deltaY);
    const velocity = distance / deltaTime;

    // Check horizontal swipe left or vertical flick up
    const isLeftSwipe = deltaX < -this.distanceThreshold && Math.abs(deltaX) > Math.abs(deltaY);
    const isUpFlick = deltaY < -this.distanceThreshold && Math.abs(deltaY) > Math.abs(deltaX);

    // Check right swipe (previous card)
    const isRightSwipe = deltaX > this.distanceThreshold && Math.abs(deltaX) > Math.abs(deltaY);

    if ((isLeftSwipe || isUpFlick) && velocity >= this.velocityThreshold) {
      this.lastTriggerTime = now;
      this.callbacks.onNext();
    } else if (isRightSwipe && velocity >= this.velocityThreshold && this.callbacks.onPrevious) {
      this.lastTriggerTime = now;
      this.callbacks.onPrevious();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Avoid triggering when focused on input/textarea
    const targetTag = (e.target as HTMLElement)?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

    const now = Date.now();

    if (e.code === 'ArrowRight' || e.code === 'Space') {
      e.preventDefault();
      if (now - this.lastTriggerTime >= this.debounceMs) {
        this.lastTriggerTime = now;
        this.callbacks.onNext();
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (this.callbacks.onPrevious && now - this.lastTriggerTime >= this.debounceMs) {
        this.lastTriggerTime = now;
        this.callbacks.onPrevious();
      }
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      if (this.callbacks.onToggleSound) {
        this.callbacks.onToggleSound();
      }
    }
  }
}
