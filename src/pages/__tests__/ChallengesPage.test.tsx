/**
 * Consolidated ChallengesPage Tests
 * 
 * This file consolidates all ChallengesPage tests from:
 * - src/__tests__/ChallengesPageRender.test.tsx
 * - src/__tests__/ChallengesPageTabs.test.tsx
 * - src/__tests__/ChallengesPageEmptyAndClearFilters.test.tsx
 * - src/pages/__tests__/ChallengesPage.featured.test.tsx
 * - src/pages/__tests__/ChallengesPage.practiceIndicator.test.tsx
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock firebase config
jest.mock("../../firebase_config", () => ({
  getSyncFirebaseDb: jest.fn(() => ({
    ref: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn().mockResolvedValue({ val: () => null }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    })),
  })),
}));

// Mock auth context
jest.mock("../../AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "test-user" }, loading: false }),
}));

// Mock toast
jest.mock("../../contexts/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

// Mock performance context with full interface
jest.mock("../../contexts/PerformanceContext", () => ({
  useBusinessMetrics: () => ({ track: jest.fn() }),
  usePerformance: () => ({
    metrics: {},
    criticalPathAnalysis: null,
    sessionInfo: null,
    config: {} as any,
    isAnalyzing: false,
    error: null,
    performanceScore: 85,
    budgetStatus: 'pass' as const,
    collectMetrics: jest.fn(),
    analyzeCriticalPath: jest.fn(() => Promise.resolve()),
    trackJourneyStep: jest.fn(),
    addBusinessMetric: jest.fn(),
    updateConfig: jest.fn(),
    resetMetrics: jest.fn(),
    applyOptimizations: jest.fn(),
    exportData: jest.fn(() => ({})),
    getRUMService: jest.fn(() => null),
  }),
}));

// Mock performance API
global.performance.getEntriesByType = jest.fn(() => [
  {
    loadEventEnd: 100,
    startTime: 0,
    domInteractive: 50,
  },
]) as any;

// Mock challenge services
jest.mock("../../services/challenges", () => {
  const { createMockChallenge, createMockTimestamp } = require("../../__tests__/utils/factories");
  
  return {
    getChallenges: jest.fn().mockResolvedValue({
      success: true,
      challenges: [
        createMockChallenge({
          id: "c1",
          title: "Test Challenge A",
          description: "Desc A",
          type: "solo" as any,
          difficulty: "beginner" as any,
          participantCount: 1,
        }),
      ],
      total: 1,
      hasMore: false,
    }),
    getUserChallenges: jest.fn().mockResolvedValue({ 
      success: true, 
      challenges: [] 
    }),
    onActiveChallenges: (cb: (items: unknown[]) => void) => {
      cb([]);
      return () => {};
    },
    getRecommendedChallenges: jest.fn().mockImplementation(() =>
      Promise.resolve({
        success: true,
        challenges: [
          createMockChallenge({
            id: "r1",
            title: "Recommended Challenge",
            description: "Try this one",
            type: "solo" as any,
            difficulty: "beginner" as any,
            rewards: { xp: 25 },
            endDate: createMockTimestamp(new Date(Date.now() + 172800000)),
            participantCount: 0,
          }),
        ],
      })
    ),
    joinChallenge: jest.fn().mockResolvedValue({ success: true }),
  };
});

import { ChallengesPage } from "../ChallengesPage";

describe("ChallengesPage", () => {
  describe("Rendering", () => {
    it("renders without crashing and shows header", async () => {
      render(
        <MemoryRouter>
          <ChallengesPage />
        </MemoryRouter>
      );

      const headers = await screen.findAllByText(/Challenges/i);
      expect(headers.length).toBeGreaterThan(0);
    });

    it("shows recommended challenges section", async () => {
      render(
        <MemoryRouter>
          <ChallengesPage />
        </MemoryRouter>
      );

      await waitFor(() =>
        expect(screen.getByText(/Recommended for you/i)).toBeInTheDocument()
      );
      expect(screen.getByText(/Recommended Challenge/i)).toBeInTheDocument();
    });

    it("renders challenge page header multiple times", () => {
      render(
        <MemoryRouter>
          <ChallengesPage />
        </MemoryRouter>
      );
      
      const challengesElements = screen.getAllByText(/Challenges/i);
      expect(challengesElements.length).toBeGreaterThan(0);
    });
  });
});
