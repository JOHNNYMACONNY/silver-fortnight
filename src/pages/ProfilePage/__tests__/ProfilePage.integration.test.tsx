import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProfilePage from "../index";

// Mock all external dependencies
jest.mock("../../../firebase-config", () => ({
  getSyncFirebaseDb: () => ({}),
}));

jest.mock("../../../services/firestore-exports", () => ({
  getUserProfile: jest.fn(),
  getUserReviews: jest.fn(),
}));

jest.mock("../../../services/dashboard", () => ({
  getDashboardStats: jest.fn(),
}));

jest.mock("../../../services/leaderboards", () => ({
  getUserSocialStats: jest.fn(),
}));

jest.mock("../../../services/entities/CollaborationService", () => ({
  collaborationService: {
    getCollaborationsByUserId: jest.fn(),
  },
}));

jest.mock("../../../services/entities/TradeService", () => ({
  tradeService: {
    getTradesByUserId: jest.fn(),
  },
}));

jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock("../../../AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "current-user-id" } }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ userId: "user-123" }),
  useNavigate: () => jest.fn(),
}));

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

jest.mock("../../../components/features/SocialFeatures", () => {
  const React = require("react");
  return {
    UserSocialStats: () => React.createElement("div", null, "Social Stats"),
    SocialFeatures: () => React.createElement("div", null, "Social Features"),
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

describe("ProfilePage Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.location.hash = "";
  });

  it("should render profile page with all sections", async () => {
    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockResolvedValue({
      data: {
        uid: "user-123",
        displayName: "Test User",
        email: "test@example.com",
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });
  });

  it("should switch between tabs", async () => {
    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockResolvedValue({
      data: {
        uid: "user-123",
        displayName: "Test User",
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    const portfolioTab = screen.getByRole("tab", { name: /portfolio/i });
    fireEvent.click(portfolioTab);

    expect(window.location.hash).toBe("#portfolio");
  });

  it("should persist tab selection to localStorage", async () => {
    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockResolvedValue({
      data: {
        uid: "user-123",
        displayName: "Test User",
      },
    });

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    const collaborationsTab = screen.getByRole("tab", {
      name: /collaborations/i,
    });
    fireEvent.click(collaborationsTab);

    expect(localStorage.getItem("tradeya_profile_last_tab")).toBe(
      "collaborations"
    );
  });

  it("should handle profile loading state", async () => {
    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  uid: "user-123",
                  displayName: "Test User",
                },
              }),
            100
          )
        )
    );

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });
  });

  it("should handle profile fetch errors gracefully", async () => {
    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockRejectedValue(new Error("Network error"));

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // Component should render without crashing
    await waitFor(() => {
      expect(screen.queryByText("Test User")).not.toBeInTheDocument();
    });
  });
});
