// Web Audio Sound Engine with Node Reclamation and Visual Pulse Fallback
export class SoundEngine {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  public onVisualPulse?: () => void;

  constructor(soundEnabled: boolean = true) {
    this.soundEnabled = soundEnabled;
  }

  private initContext(): AudioContext | null {
    if (this.ctx) return this.ctx;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.ctx = new AudioContextClass();
      } catch (err) {
        console.warn('[SoundEngine] Could not initialize AudioContext:', err);
      }
    }
    return this.ctx;
  }

  public async resumeIfNeeded(): Promise<void> {
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('[SoundEngine] Resume audio context failed:', err);
      }
    }
  }

  public triggerVisualPulse(): void {
    if (this.onVisualPulse) {
      this.onVisualPulse();
    }
  }

  /**
   * Play distinct double-tick acoustic cue for card skip.
   */
  public playCardSkip(): void {
    this.triggerVisualPulse();
    if (!this.soundEnabled) return;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const ticks = [
        { freq: 750, time: now, duration: 0.035 },
        { freq: 1100, time: now + 0.055, duration: 0.035 },
      ];

      ticks.forEach((tick) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(tick.freq, tick.time);

        gain.gain.setValueAtTime(0.001, tick.time);
        gain.gain.linearRampToValueAtTime(0.07, tick.time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, tick.time + tick.duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(tick.time);
        osc.stop(tick.time + tick.duration + 0.01);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            // ignore disconnect errors
          }
        };
      });
    } catch (err) {
      console.warn('[SoundEngine] playCardSkip error:', err);
    }
  }

  /**
   * Play gentle card slide sound with strict node reclamation.
   */
  public playCardSlide(): void {
    this.triggerVisualPulse();
    if (!this.soundEnabled) return;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignore disconnect errors
        }
      };
    } catch (err) {
      console.warn('[SoundEngine] playCardSlide error:', err);
    }
  }

  /**
   * Play mystical wildcard chime.
   */
  public playWildcardChime(): void {
    this.triggerVisualPulse();
    if (!this.soundEnabled) return;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + idx * 0.07;
        const duration = 0.35;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.07, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            // ignore
          }
        };
      });
    } catch (err) {
      console.warn('[SoundEngine] playWildcardChime error:', err);
    }
  }

  /**
   * Play ascending tier advance harmonic chord.
   */
  public playTierAdvance(): void {
    this.triggerVisualPulse();
    if (!this.soundEnabled) return;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + idx * 0.08;
        const duration = 0.45;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.09, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            // ignore
          }
        };
      });
    } catch (err) {
      console.warn('[SoundEngine] playTierAdvance error:', err);
    }
  }

  /**
   * Play grounding checkout low meditative frequency.
   */
  public playFinishGrounding(): void {
    this.triggerVisualPulse();
    if (!this.soundEnabled) return;

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(146.83, now); // D3
      osc.frequency.exponentialRampToValueAtTime(110.0, now + 1.2); // A2

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.warn('[SoundEngine] playFinishGrounding error:', err);
    }
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }
}

export const globalSoundEngine = new SoundEngine();
