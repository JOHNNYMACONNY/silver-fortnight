 // Feature flags utility
 // Controls runtime feature toggles exposed via Vite env vars (VITE_*).
 // Default behavior is permissive (feature enabled) when the env var is missing.
 export const isThemeToggleEnabled = (): boolean => {
   // Prefer reading from process.env first to avoid referencing import.meta at parse time,
   // which causes Jest to throw "Cannot use 'import.meta' outside a module".
   try {
     if (typeof process !== 'undefined' && (process.env as any)?.VITE_THEME_TOGGLE_ENABLED !== undefined) {
       const raw = (process.env as any).VITE_THEME_TOGGLE_ENABLED;
       if (raw === undefined || raw === null || raw === '') return true;
       const s = String(raw).toLowerCase();
       return s !== 'false' && s !== '0';
     }
   } catch {
     // ignore and fall through to default
   }
 
   // Do not reference import.meta directly here — return the safe default (enabled).
   return true;
 };