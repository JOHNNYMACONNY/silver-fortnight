// Feature flags utility
// Controls runtime feature toggles exposed via Vite env vars (VITE_*).
// Theme toggle remains disabled by default unless explicitly enabled.

const normalizeFlagValue = (raw: unknown): boolean | null => {
  if (raw === undefined || raw === null) {
    return null;
  }

  const normalized = String(raw).trim().toLowerCase();

  if (normalized === "") {
    return false;
  }

  if (["false", "0", "off", "no"].includes(normalized)) {
    return false;
  }

  if (["true", "1", "on", "yes"].includes(normalized)) {
    return true;
  }

  // Treat any other truthy value (e.g. "enabled") as enabled
  return true;
};

const readEnvValue = (): unknown => {
  try {
    if (
      typeof process !== "undefined" &&
      (process.env as any)?.VITE_THEME_TOGGLE_ENABLED !== undefined
    ) {
      return (process.env as any).VITE_THEME_TOGGLE_ENABLED;
    }
  } catch {
    // ignore and try next source
  }

  const importMetaEnv = (globalThis as any)?.import?.meta?.env;
  if (importMetaEnv?.VITE_THEME_TOGGLE_ENABLED !== undefined) {
    return importMetaEnv.VITE_THEME_TOGGLE_ENABLED;
  }

  const globalEnv = (globalThis as any) || {};

  if (globalEnv.__VITE_ENV__?.VITE_THEME_TOGGLE_ENABLED !== undefined) {
    return globalEnv.__VITE_ENV__.VITE_THEME_TOGGLE_ENABLED;
  }

  if (globalEnv.VITE_THEME_TOGGLE_ENABLED !== undefined) {
    return globalEnv.VITE_THEME_TOGGLE_ENABLED;
  }

  return undefined;
};

export const isThemeToggleEnabled = (): boolean => {
  const rawValue = readEnvValue();
  const normalized = normalizeFlagValue(rawValue);

  if (normalized !== null) {
    return normalized;
  }

  // Theme toggle is disabled by default
  return false;
};
