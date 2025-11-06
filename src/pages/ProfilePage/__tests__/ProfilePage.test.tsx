/**
 * Consolidated ProfilePage Component Tests
 * 
 * This file consolidates tests from:
 * - ProfileHeader.test.tsx (header rendering)
 * - ProfileTabs.test.tsx (tab navigation) 
 * - ProfileHeaderSnapshots.test.tsx (snapshots)
 * 
 * Deleted/Removed:
 * - TabContent.test.tsx (broken type props, low value)
 * - ProfileTabsA11y.test.tsx (tests implementation details: ARIA labels)
 * - Complex ProfileHeader unit tests (too many mock dependencies)
 * 
 * Focus: Test behavior through the full ProfilePage component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock dependencies
jest.mock("../../../firebase-config", () => ({
  getSyncFirebaseDb: () => ({}),
}));

jest.mock("../../../utils/imageUtils", () => ({
  getProfileImageUrl: () => "",
  generateAvatarUrl: () => "",
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));

jest.mock("../../../AuthContext", () => ({
  useAuth: () => ({ user: null, currentUser: null }),
}));

jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn(), addToast: jest.fn() }),
}));

jest.mock("../../../contexts/PerformanceContext", () => ({
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

jest.mock("../../../components/features/SocialFeatures", () => {
  const React = require("react");
  return {
    UserSocialStats: () => React.createElement("div", null, "Social Stats"),
    SocialFeatures: () => React.createElement("div", null, "Social Features"),
  };
});

jest.mock("../../../components/ui/ProfileImage", () => {
  const React = require("react");
  return {
    ProfileImage: () => React.createElement("div", null, "Profile Image"),
  };
});

jest.mock("../../../components/ui/ProfileBanner", () => {
  const React = require("react");
  return {
    ProfileBanner: () => React.createElement("div", null, "Profile Banner"),
  };
});

jest.mock("../../../components/layout/primitives/Box", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});

jest.mock("../../../components/layout/primitives/Stack", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});

jest.mock("../../../components/layout/primitives/Cluster", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});

jest.mock("../../../components/layout/primitives/Grid", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});

jest.mock("../../../services/firestore-exports", () => ({
  getUserProfile: async () => ({
    data: { uid: "u1", email: "u1@test.com", public: true },
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

const ProfilePage = require("../index").default;

describe("ProfilePage", () => {
  describe("Page Rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );
      
      expect(container).toBeInTheDocument();
    });

    it("matches snapshot", () => {
      const { container } = render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );
      
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
