import { jest, beforeEach } from '@jest/globals';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode } from 'react';

// Basic Types
export type MockOperation = {
  type: 'set' | 'update' | 'delete';
  ref: any;
  data?: any;
};

// Timestamp Mock
export class MockTimestamp {
  constructor(
    public readonly seconds: number,
    public readonly nanoseconds: number = 0
  ) {}

  static now(): MockTimestamp {
    return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
  }

  static fromDate(date: Date): MockTimestamp {
    return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
  }

  toDate(): Date {
    return new Date(this.toMillis());
  }

  toMillis(): number {
    return this.seconds * 1000;
  }
}

// Document Mock
export type MockDocData = {
  id?: string;
  [key: string]: any;
};

export type MockDoc<T> = {
  id: string;
  exists: () => boolean;
  data: () => T;
  ref: {
    id: string;
    path: string;
  };
};

export function createMockDoc<T extends MockDocData>(data: T): MockDoc<T> {
  const id = data.id || generateTestId();
  return {
    id,
    exists: () => true,
    data: () => ({ ...data }),
    ref: {
      id,
      path: `mock/path/${id}`
    }
  };
}

// Batch Mock
export type MockBatchResult = {
  operations: MockOperation[];
  set: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  commit: jest.Mock<() => Promise<void>>;
};

export function createMockBatch(): MockBatchResult {
  const operations: MockOperation[] = [];
  
  const batchMock = {
    operations,
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn<() => Promise<void>>().mockImplementation(() => Promise.resolve())
  };

  // Setup method implementations with proper this binding
  batchMock.set.mockImplementation(function(ref: any, data: any) {
    operations.push({ type: 'set', ref, data });
    return batchMock;
  });

  batchMock.update.mockImplementation(function(ref: any, data: any) {
    operations.push({ type: 'update', ref, data });
    return batchMock;
  });

  batchMock.delete.mockImplementation(function(ref: any) {
    operations.push({ type: 'delete', ref });
    return batchMock;
  });

  return batchMock;
}

// Role Mock
export type MockRole = {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: MockTimestamp;
  userId: string;
  collaborationId: string;
  [key: string]: any;
};

export function generateMockRole(overrides: Partial<MockRole> = {}): MockRole {
  return {
    id: generateTestId(),
    title: 'Mock Role',
    status: 'active',
    createdAt: MockTimestamp.now(),
    userId: generateTestId(),
    collaborationId: generateTestId(),
    ...overrides
  };
}

// Event Mocks
export const mockEvent = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' }
};

export function createChangeEvent(value: string) {
  return {
    target: { value },
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  };
}

// Error Types
export class RoleMonitoringError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RoleMonitoringError';
  }
}

// Async Utilities
export function mockAsyncOperation<T>(result: T, delay: number = 100): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(result), delay);
  });
}

export function waitForMockCall(
  mock: jest.Mock,
  timeout: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (mock.mock.calls.length > 0) {
        clearInterval(interval);
        clearTimeout(timeoutId);
        resolve();
      }
    }, 10);

    const timeoutId = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Mock was not called within timeout'));
    }, timeout);
  });
}

export async function flushPromises(): Promise<void> {
  return new Promise(resolve => {
    // Queue a macrotask
    setTimeout(() => {
      // Run any pending timers
      jest.runAllTimers();
      // Allow any remaining microtasks to complete
      resolve();
    }, 0);
  });
}

// ID Generation
export function generateTestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Type Guards
export function isValidRole(value: any): value is MockRole {
  return (
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    ['active', 'pending', 'inactive'].includes(value.status) &&
    value.createdAt instanceof MockTimestamp &&
    typeof value.userId === 'string' &&
    typeof value.collaborationId === 'string'
  );
}

// Mock framer-motion for consistent testing
export const mockFramerMotion = () => {
  jest.mock('framer-motion', () => {
    const React = require('react');
    return {
      motion: {
        div: ({ children, ...props }: any) => React.createElement('div', props, children),
        button: ({ children, ...props }: any) => React.createElement('button', props, children),
        form: ({ children, ...props }: any) => React.createElement('form', props, children),
        span: ({ children, ...props }: any) => React.createElement('span', props, children),
        section: ({ children, ...props }: any) => React.createElement('section', props, children),
      },
      AnimatePresence: ({ children }: any) => children,
      useAnimation: () => ({
        start: jest.fn(),
        stop: jest.fn(),
        set: jest.fn(),
      }),
      useMotionValue: (initial: any) => ({ get: () => initial, set: jest.fn() }),
    };
  });
};

// Mock intersection observer for animation testing
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

// Mock resize observer for responsive testing
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// Mock CSS backdrop-filter support
export const mockBackdropFilterSupport = (supported: boolean = true) => {
  Object.defineProperty(CSS, 'supports', {
    value: jest.fn((property: string, value: string) => {
      if (property === 'backdrop-filter' || property === '-webkit-backdrop-filter') {
        return supported;
      }
      return true;
    }),
    writable: true,
  });
};

// Mock viewport dimensions
export const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

// Mock touch device
export const mockTouchDevice = (isTouch: boolean = true) => {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    writable: true,
    configurable: true,
    value: isTouch ? 1 : 0,
  });

  if (isTouch) {
    window.ontouchstart = () => {};
  } else {
    delete (window as any).ontouchstart;
  }
};

// Mock prefers-reduced-motion
export const mockReducedMotion = (reduced: boolean = true) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reduced : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};