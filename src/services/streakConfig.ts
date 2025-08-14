/**
 * Returns streak milestone thresholds, optionally overridden by env var
 * VITE_STREAK_THRESHOLDS (comma-separated numbers, e.g., "3,7,14,30").
 */
export function getStreakMilestoneThresholds(defaults: number[] = [3, 7, 14, 30]): number[] {
  try {
    const raw =
      // Prefer process.env in test/node environments
      (typeof process !== 'undefined' && (process as any).env?.VITE_STREAK_THRESHOLDS) ||
      // Allow global override in non-Vite contexts
      (typeof globalThis !== 'undefined' && (globalThis as any).VITE_STREAK_THRESHOLDS) ||
      // In Vite builds, this will be statically replaced
      undefined as unknown as string | undefined;
    if (!raw) return defaults;
    const parsed = String(raw)
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    return parsed.length > 0 ? parsed : defaults;
  } catch {
    return defaults;
  }
}

/**
 * Returns max freezes allowed per streak, optionally overridden by env var
 * VITE_STREAK_MAX_FREEZES (integer, e.g., "1").
 */
export function getStreakMaxFreezes(defaults: number = 1): number {
  try {
    const raw =
      (typeof process !== 'undefined' && (process as any).env?.VITE_STREAK_MAX_FREEZES) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).VITE_STREAK_MAX_FREEZES) ||
      undefined as unknown as string | undefined;
    if (!raw) return defaults;
    const parsed = parseInt(String(raw).trim(), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaults;
  } catch {
    return defaults;
  }
}

/**
 * Returns whether auto-freeze is enabled for a given user.
 * Reads from localStorage in browser or env/global in tests; defaults to true.
 */
export function isAutoFreezeEnabled(userId?: string, defaults: boolean = true): boolean {
  try {
    // Node/Jest overrides
    const envOverride = (typeof process !== 'undefined' && (process as any).env?.VITE_STREAK_AUTO_FREEZE) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).VITE_STREAK_AUTO_FREEZE);
    if (typeof envOverride !== 'undefined') {
      const v = String(envOverride).toLowerCase();
      return v === '1' || v === 'true' || v === 'yes';
    }
    // Browser per-user preference
    if (typeof window !== 'undefined' && userId) {
      const v = window.localStorage.getItem(`streak-auto-freeze-${userId}`);
      if (v === null) return defaults;
      const low = v.toLowerCase();
      return low === '1' || low === 'true' || low === 'yes';
    }
    return defaults;
  } catch {
    return defaults;
  }
}


