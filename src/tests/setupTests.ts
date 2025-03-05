import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend matchers
declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {}
  }
}

// Setup MSW or other test servers here if needed

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Add custom test utilities
export const createMockRequest = (overrides = {}) => ({
  id: 'test-request-id',
  senderId: 'sender-id',
  recipientId: 'recipient-id',
  status: 'pending',
  type: 'invitation',
  createdAt: new Date(),
  message: 'Test message',
  ...overrides
});

export const createMockTradeRequest = (overrides = {}) => ({
  ...createMockRequest(overrides),
  tradeName: 'Test Trade',
  tradeId: 'trade-id'
});

export const createMockProjectRequest = (overrides = {}) => ({
  ...createMockRequest(overrides),
  projectName: 'Test Project',
  projectId: 'project-id',
  positionName: 'Test Position',
  positionId: 'position-id',
  requiredSkills: ['React', 'TypeScript'],
  proposedSkills: ['React']
});

// Add custom test matchers if needed
// expect.extend({});
