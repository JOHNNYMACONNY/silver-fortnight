/**
 * Theme Initializer for TradeYa
 * Handles theme detection, initialization, and synchronization with Tailwind CSS v4
 */

export type Theme = "light" | "dark" | "system";

interface ThemeConfig {
  defaultTheme: Theme;
  enableSystem: boolean;
  storageKey: string;
  classNames: {
    light: string;
    dark: string;
  };
}

class ThemeInitializer {
  private config: ThemeConfig;
  private mediaQuery: MediaQueryList | null = null;
  private currentTheme: Theme = "system";
  private systemThemeListener: ((event: MediaQueryListEvent) => void) | null =
    null;

  constructor(config: Partial<ThemeConfig> = {}) {
    this.config = {
      defaultTheme: "system",
      enableSystem: true,
      storageKey: "tradeya-theme",
      classNames: {
        light: "light",
        dark: "dark",
      },
      ...config,
    };

    this.init();
  }

  /**
   * Initialize theme system
   */
  private init(): void {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return;

    // Set up system theme detection
    if (this.config.enableSystem && window.matchMedia) {
      this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this.systemThemeListener = this.handleSystemThemeChange.bind(this);
      this.mediaQuery.addEventListener("change", this.systemThemeListener);
    }

    // Load saved theme or use default
    const savedTheme = this.getSavedTheme();
    this.setTheme(savedTheme || this.config.defaultTheme);
  }

  /**
   * Get theme from localStorage
   */
  private getSavedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved as Theme;
      }
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
    }
    return null;
  }

  /**
   * Save theme to localStorage
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.config.storageKey, theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }

  /**
   * Handle system theme changes
   */
  private handleSystemThemeChange(e: MediaQueryListEvent): void {
    if (this.currentTheme === "system") {
      this.applyTheme(e.matches ? "dark" : "light");
    }
  }

  /**
   * Apply theme classes to document
   */
  private applyTheme(resolvedTheme: "light" | "dark"): void {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove(
      this.config.classNames.light,
      this.config.classNames.dark
    );

    // Add new theme class
    root.classList.add(this.config.classNames[resolvedTheme]);

    // Update CSS custom properties for theme variables
    this.updateThemeVariables(resolvedTheme);

    // Dispatch theme change event
    window.dispatchEvent(
      new CustomEvent("theme-changed", {
        detail: { theme: resolvedTheme },
      })
    );
  }

  /**
   * Update CSS custom properties based on theme
   */
  private updateThemeVariables(theme: "light" | "dark"): void {
    const root = document.documentElement;

    if (theme === "dark") {
      // Dark mode variables
      root.style.setProperty("--color-bg-primary", "#1f2937");
      root.style.setProperty("--color-bg-secondary", "#111827");
      root.style.setProperty("--color-bg-card", "#374151");
      root.style.setProperty("--color-text-primary", "#f9fafb");
      root.style.setProperty("--color-text-secondary", "#d1d5db");
      root.style.setProperty("--color-border", "#4b5563");
      root.style.setProperty("--color-shadow", "rgba(0, 0, 0, 0.25)");
    } else {
      // Light mode variables
      root.style.setProperty("--color-bg-primary", "#ffffff");
      root.style.setProperty("--color-bg-secondary", "#f9fafb");
      root.style.setProperty("--color-bg-card", "#ffffff");
      root.style.setProperty("--color-text-primary", "#1f2937");
      root.style.setProperty("--color-text-secondary", "#4b5563");
      root.style.setProperty("--color-border", "#e5e7eb");
      root.style.setProperty("--color-shadow", "rgba(0, 0, 0, 0.05)");
    }
  }

  /**
   * Get the resolved theme (converts 'system' to 'light' or 'dark')
   */
  private resolveTheme(theme: Theme): "light" | "dark" {
    if (theme === "system") {
      return this.mediaQuery?.matches ? "dark" : "light";
    }
    return theme;
  }

  /**
   * Set theme
   */
  public setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.saveTheme(theme);

    const resolvedTheme = this.resolveTheme(theme);
    this.applyTheme(resolvedTheme);
  }

  /**
   * Get current theme
   */
  public getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get resolved theme (actual light/dark value)
   */
  public getCurrentResolvedTheme(): "light" | "dark" {
    return this.resolveTheme(this.currentTheme);
  }

  /**
   * Toggle between light and dark themes
   */
  public toggleTheme(): void {
    const resolvedTheme = this.getCurrentResolvedTheme();
    this.setTheme(resolvedTheme === "light" ? "dark" : "light");
  }

  /**
   * Check if system theme is supported
   */
  public isSystemThemeSupported(): boolean {
    return this.config.enableSystem && !!this.mediaQuery;
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    if (this.mediaQuery && this.systemThemeListener) {
      this.mediaQuery.removeEventListener("change", this.systemThemeListener);
    }
    this.systemThemeListener = null;
  }
}

// Create singleton instance
let themeInitializer: ThemeInitializer | null = null;

/**
 * Initialize theme system with optional configuration
 */
export function initializeTheme(
  config?: Partial<ThemeConfig>
): ThemeInitializer {
  if (!themeInitializer) {
    themeInitializer = new ThemeInitializer(config);
  }
  return themeInitializer;
}

/**
 * Get the theme initializer instance
 */
export function getThemeInitializer(): ThemeInitializer | null {
  return themeInitializer;
}

/**
 * Hook for React components to use theme
 */
export function useTheme() {
  const theme = getThemeInitializer();

  if (!theme) {
    throw new Error("Theme not initialized. Call initializeTheme() first.");
  }

  return {
    theme: theme.getTheme(),
    resolvedTheme: theme.getCurrentResolvedTheme(),
    setTheme: theme.setTheme.bind(theme),
    toggleTheme: theme.toggleTheme.bind(theme),
    isSystemSupported: theme.isSystemThemeSupported(),
  };
}

// Auto-initialize with default config if in browser
if (typeof window !== "undefined") {
  initializeTheme();
}
