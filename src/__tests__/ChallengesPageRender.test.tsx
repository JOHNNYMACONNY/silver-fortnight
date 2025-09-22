import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Add mock for firebase config so getSyncFirebaseDb exists during module initialization
jest.mock("../firebase_config", () => ({
  getSyncFirebaseDb: jest.fn(() => ({
    // minimal RTDB-like API surface used by services that call getSyncFirebaseDb()
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
jest.mock("../AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "test-user" }, loading: false }),
}));

// Mock toast
jest.mock("../contexts/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

// Mock business metrics
jest.mock("../contexts/PerformanceContext", () => ({
  useBusinessMetrics: () => ({ track: jest.fn() }),
}));

// Mock challenge services
jest.mock("../services/challenges", () => ({
  getChallenges: jest.fn().mockResolvedValue({
    success: true,
    challenges: [
      {
        id: "c1",
        title: "Test Challenge A",
        description: "Desc A",
        type: "solo",
        category: "development",
        difficulty: undefined, // intentionally missing to test hardening
        requirements: [],
        rewards: { xp: 50 },
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: "active",
        participantCount: 1,
        completionCount: 0,
        instructions: [],
        objectives: [],
        createdBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    total: 1,
    hasMore: false,
  }),
  getUserChallenges: jest
    .fn()
    .mockResolvedValue({ success: true, challenges: [] }),
  // Provide a typed callback signature so tests avoid `any` usage
  onActiveChallenges: (cb: (items: unknown[]) => void) => {
    cb([]);
    return () => {};
  },
  getRecommendedChallenges: jest.fn().mockImplementation(() =>
    Promise.resolve({
      success: true,
      challenges: [
        {
          id: "r1",
          title: "Recommended Challenge",
          description: "Try this one",
          type: "solo",
          category: "development",
          difficulty: "beginner",
          requirements: [],
          rewards: { xp: 25 },
          startDate: new Date(),
          endDate: new Date(Date.now() + 172800000),
          status: "active",
          participantCount: 0,
          completionCount: 0,
          instructions: [],
          objectives: [],
          createdBy: "u1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    })
  ),
  joinChallenge: jest.fn().mockResolvedValue({ success: true }),
}));

import { ChallengesPage } from "../pages/ChallengesPage";

describe("ChallengesPage", () => {
  it("renders without crashing and shows header and recommendations", async () => {
    render(
      <MemoryRouter>
        <ChallengesPage />
      </MemoryRouter>
    );

    // Header
    const headers = await screen.findAllByText(/Challenges/i);
    expect(headers.length).toBeGreaterThan(0);

    // Recommended section appears
    await waitFor(() =>
      expect(screen.getByText(/Recommended for you/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Recommended Challenge/i)).toBeInTheDocument();
  });

  test("renders challenge page header", () => {
    const _uid = "test-user";
    void _uid;
    const { getByText } = render(<ChallengesPage />);
    expect(getByText(/Challenges/i)).toBeInTheDocument();
  });
});
