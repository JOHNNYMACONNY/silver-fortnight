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

// Generic helper that accepts env var name
const readEnvValueGeneric = (envVarName: string): unknown => {
  // In Vite, environment variables are exposed via import.meta.env
  try {
    // @ts-ignore - import.meta.env is available in Vite
    if (typeof import.meta !== "undefined" && import.meta.env?.[envVarName] !== undefined) {
      // @ts-ignore
      return import.meta.env[envVarName];
    }
  } catch {
    // ignore and try next source
  }

  try {
    if (typeof process !== "undefined" && (process.env as any)?.[envVarName] !== undefined) {
      return (process.env as any)[envVarName];
    }
  } catch {
    // ignore and try next source
  }

  const globalEnv = (globalThis as any) || {};

  if (globalEnv.__VITE_ENV__?.[envVarName] !== undefined) {
    return globalEnv.__VITE_ENV__[envVarName];
  }

  if (globalEnv[envVarName] !== undefined) {
    return globalEnv[envVarName];
  }

  return undefined;
};

// Keep existing readEnvValue for backward compatibility with isThemeToggleEnabled
const readEnvValue = (): unknown => {
  return readEnvValueGeneric('VITE_THEME_TOGGLE_ENABLED');
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

// New flag functions using generic helper
export const isVisualSelectionEnabled = (): boolean => {
  const rawValue = readEnvValueGeneric('VITE_VISUAL_SELECTION_ENABLED');
  const normalized = normalizeFlagValue(rawValue);
  return normalized ?? false; // Default: false
};

export const isConversationalLabelsEnabled = (): boolean => {
  const rawValue = readEnvValueGeneric('VITE_CONVERSATIONAL_LABELS_ENABLED');
  const normalized = normalizeFlagValue(rawValue);
  return normalized ?? true; // Default: true (safe, text-only)
};

export const isDynamicFeedbackEnabled = (): boolean => {
  const rawValue = readEnvValueGeneric('VITE_DYNAMIC_FEEDBACK_ENABLED');
  const normalized = normalizeFlagValue(rawValue);
  return normalized ?? true; // Default: true (safe, additive)
};
