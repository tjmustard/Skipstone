import type { EphemeralSessionPayload } from '../data/types';

export const SESSION_STORAGE_KEY = 'skipstone_ephemeral_session';
export const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class EphemeralStorageManager {
  private static isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  public static saveSession(payload: EphemeralSessionPayload): void {
    if (!this.isAvailable()) return;
    try {
      const data: EphemeralSessionPayload = {
        ...payload,
        lastActiveTimestamp: Date.now()
      };
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[EphemeralStorageManager] Failed to save session:', err);
    }
  }

  public static loadSession(): EphemeralSessionPayload | null {
    if (!this.isAvailable()) return null;
    try {
      const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;

      const payload: EphemeralSessionPayload = JSON.parse(raw);
      const now = Date.now();

      // Check TTL
      if (!payload.lastActiveTimestamp || now - payload.lastActiveTimestamp > SESSION_TTL_MS) {
        this.clearSession();
        return null;
      }

      // Valid session
      return payload;
    } catch (err) {
      console.warn('[EphemeralStorageManager] Failed to load session:', err);
      this.clearSession();
      return null;
    }
  }

  public static clearSession(): void {
    if (!this.isAvailable()) return;
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('[EphemeralStorageManager] Failed to clear session:', err);
    }
  }
}
