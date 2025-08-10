/**
 * TypeScript interfaces for browser APIs that aren't fully typed
 * This helps eliminate 'as any' type assertions throughout the codebase
 */

// Network Information API
export interface NetworkInformation {
  readonly downlink: number;
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

// Navigator with additional APIs
export interface ExtendedNavigator extends Navigator {
  readonly connection?: NetworkInformation;
  readonly mozConnection?: NetworkInformation;
  readonly webkitConnection?: NetworkInformation;
  getBattery?(): Promise<BatteryManager>;
  memory?: {
    readonly jsHeapSizeLimit: number;
    readonly totalJSHeapSize: number;
    readonly usedJSHeapSize: number;
  };
}

// Battery API
export interface BatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
}

// Performance API extensions
export interface ExtendedPerformance extends Performance {
  readonly memory?: {
    readonly usedJSHeapSize: number;
    readonly totalJSHeapSize: number;
    readonly jsHeapSizeLimit: number;
  };
}

// Window with custom properties
export interface ExtendedWindow extends Window {
  __rum_business_metrics__?: Record<string, any>;
  __COLLECT_METRICS__?: any;
}

// Layout Shift Entry (Web Vitals)
export interface LayoutShiftEntry extends PerformanceEntry {
  readonly value: number;
  readonly hadRecentInput: boolean;
  readonly lastInputTime: number;
  readonly sources: Array<{
    readonly node?: Node;
    readonly currentRect: DOMRect;
    readonly previousRect: DOMRect;
  }>;
}

// First Input Entry (Web Vitals)
export interface FirstInputEntry extends PerformanceEntry {
  readonly processingStart: number;
  readonly processingEnd: number;
  readonly cancelable: boolean;
}

// HTML Link Element with fetch priority
export interface ExtendedHTMLLinkElement extends HTMLLinkElement {
  fetchPriority?: 'high' | 'low' | 'auto';
}

// Resource Priority types
export type ResourcePriority = 'high' | 'low' | 'auto';

// Performance Budget Configuration
export interface PerformanceBudget {
  readonly scripts: number;
  readonly stylesheets: number;
  readonly images: number;
  readonly fonts: number;
  readonly other: number;
}

// Critical Resource Types
export type CriticalResourceType = 
  | 'critical-css'
  | 'critical-js'
  | 'hero-image'
  | 'web-font'
  | 'api-data'
  | 'other';

// Resource Timing with extended properties
export interface ExtendedPerformanceResourceTiming extends PerformanceResourceTiming {
  readonly renderBlockingStatus?: 'blocking' | 'non-blocking';
  readonly deliveryType?: 'cache' | 'navigational-prefetch' | 'resource-prefetch' | '';
}

// Global declarations for TypeScript
declare global {
  interface Navigator extends ExtendedNavigator {}
  interface Performance extends ExtendedPerformance {}
  interface Window extends ExtendedWindow {}
  interface HTMLLinkElement extends ExtendedHTMLLinkElement {}
}

export {};
