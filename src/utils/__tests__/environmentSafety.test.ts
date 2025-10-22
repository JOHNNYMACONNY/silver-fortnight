import {
  addConnectionChangeListener,
  addConnectionListeners,
  getNetworkInfo,
  isLowEndDevice,
  isOffline,
} from "../networkUtils";
import { isThemeToggleEnabled } from "../featureFlags";

describe("networkUtils SSR safety", () => {
  let navigatorDescriptor: PropertyDescriptor | undefined;
  let originalWindow: any;

  beforeEach(() => {
    navigatorDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "navigator"
    );
    originalWindow = (globalThis as any).window;
  });

  afterEach(() => {
    if (navigatorDescriptor) {
      Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    } else {
      delete (globalThis as any).navigator;
    }

    (globalThis as any).window = originalWindow;
  });

  const removeNavigator = () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      configurable: true,
      writable: true,
    });
  };

  it("returns default info when navigator is missing", () => {
    removeNavigator();

    const info = getNetworkInfo();

    expect(info.online).toBe(true);
    expect(info.connectionType).toBe("unknown");
  });

  it("does not throw when adding connection listeners without window", () => {
    (globalThis as any).window = undefined;
    const cleanup = addConnectionListeners(jest.fn(), jest.fn());

    expect(() => cleanup()).not.toThrow();
  });

  it("returns a noop cleanup when navigator is missing for connection change listener", () => {
    removeNavigator();

    const cleanup = addConnectionChangeListener(jest.fn());

    expect(() => cleanup()).not.toThrow();
  });

  it("treats missing navigator as online", () => {
    removeNavigator();
    expect(isOffline()).toBe(false);
  });

  it("treats missing navigator as not low-end", () => {
    removeNavigator();
    expect(isLowEndDevice()).toBe(false);
  });
});

describe("isThemeToggleEnabled", () => {
  let originalEnvValue: string | undefined;

  beforeEach(() => {
    originalEnvValue = process.env.VITE_THEME_TOGGLE_ENABLED;
    delete process.env.VITE_THEME_TOGGLE_ENABLED;
    delete (globalThis as any).__VITE_ENV__;
    delete (globalThis as any).VITE_THEME_TOGGLE_ENABLED;
  });

  afterEach(() => {
    if (originalEnvValue === undefined) {
      delete process.env.VITE_THEME_TOGGLE_ENABLED;
    } else {
      process.env.VITE_THEME_TOGGLE_ENABLED = originalEnvValue;
    }
    delete (globalThis as any).__VITE_ENV__;
    delete (globalThis as any).VITE_THEME_TOGGLE_ENABLED;
  });

  it("is disabled by default", () => {
    expect(isThemeToggleEnabled()).toBe(false);
  });

  it("reads from process.env when available", () => {
    process.env.VITE_THEME_TOGGLE_ENABLED = "true";
    expect(isThemeToggleEnabled()).toBe(true);
  });

  it("reads from global vite env fallback", () => {
    (globalThis as any).__VITE_ENV__ = { VITE_THEME_TOGGLE_ENABLED: "1" };
    expect(isThemeToggleEnabled()).toBe(true);
  });

  it('treats "false" values as disabled', () => {
    (globalThis as any).__VITE_ENV__ = { VITE_THEME_TOGGLE_ENABLED: "false" };
    expect(isThemeToggleEnabled()).toBe(false);
  });
});

describe("ThemeInitializer system listener cleanup", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.resetModules();
  });

  it("removes the same listener it registers", () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();
    const mockMediaQuery: MediaQueryList = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    window.matchMedia = jest.fn().mockReturnValue(mockMediaQuery) as any;

    const {
      initializeTheme,
      getThemeInitializer,
    } = require("../../utils/themeInitializer");

    const instance = getThemeInitializer() ?? initializeTheme();
    expect(instance).not.toBeNull();
    expect(addEventListener).toHaveBeenCalledTimes(1);

    const listener = addEventListener.mock.calls[0][1];

    instance?.destroy();

    expect(removeEventListener).toHaveBeenCalledWith("change", listener);
  });
});
