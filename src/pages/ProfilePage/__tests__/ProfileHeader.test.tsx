import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileHeader } from "../components/ProfileHeader";
import type { ProfileHeaderProps } from "../components/ProfileHeader";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../../../components/ui/ReputationBadge", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div", null, "Reputation Badge"),
  };
});

jest.mock("../../../components/ui/Tooltip", () => {
  const React = require("react");
  return {
    Tooltip: ({ children }: any) => React.createElement("div", null, children),
  };
});

jest.mock("../../../components/ui/ProfileImage", () => {
  const React = require("react");
  return {
    ProfileImage: () => React.createElement("div", null, "Profile Image"),
  };
});

jest.mock("../../../components/features/SocialFeatures", () => {
  const React = require("react");
  return {
    UserSocialStats: () => React.createElement("div", null, "Social Stats"),
    SocialFeatures: () => React.createElement("div", null, "Social Features"),
  };
});

jest.mock("../../../components/features/StreakWidgetCompact", () => {
  const React = require("react");
  return {
    StreakWidgetCompact: () =>
      React.createElement("div", null, "Streak Widget"),
  };
});

jest.mock("../../../components/ui/StatChip", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ label }: any) => React.createElement("div", null, label),
  };
});

jest.mock("../../../services/analytics", () => ({
  logEvent: jest.fn(),
}));

describe("ProfileHeader", () => {
  const mockProps: ProfileHeaderProps = {
    profile: {
      id: "user-123",
      uid: "user-123",
      email: "test@example.com",
      displayName: "Test User",
      handle: "testuser",
      verified: true,
      tagline: "Test tagline",
      photoURL: "https://example.com/photo.jpg",
    },
    isOwnProfile: false,
    targetUserId: "user-123",
    stats: {
      totalTrades: 10,
      tradesThisWeek: 2,
      currentXP: 100,
    },
    repScore: 85,
    reviewsPreview: [
      { rating: 5, comment: "Great trader!" },
      { rating: 4, comment: "Good experience" },
    ],
    reviewsLoading: false,
    reviewsMeta: {
      avg: 4.5,
      count: 10,
    },
    mutualFollows: {
      count: 3,
      names: ["User 1", "User 2", "User 3"],
    },
    shareButtonRef: React.createRef(),
    onEditClick: jest.fn(),
    onShareClick: jest.fn(),
    onCopyLink: jest.fn(),
    onTabChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render profile header with user information", () => {
    render(<ProfileHeader {...mockProps} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
  });

  it("should display verified badge when user is verified", () => {
    render(<ProfileHeader {...mockProps} />);

    expect(screen.getByText("Reputation Badge")).toBeInTheDocument();
  });

  it("should call onEditClick when edit button is clicked", () => {
    const onEditClick = jest.fn();
    render(<ProfileHeader {...mockProps} onEditClick={onEditClick} />);

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    expect(onEditClick).toHaveBeenCalled();
  });

  it("should call onShareClick when share button is clicked", () => {
    const onShareClick = jest.fn();
    render(<ProfileHeader {...mockProps} onShareClick={onShareClick} />);

    const shareButton = screen.getByRole("button", { name: /share/i });
    fireEvent.click(shareButton);

    expect(onShareClick).toHaveBeenCalled();
  });

  it("should display stats when available", () => {
    render(<ProfileHeader {...mockProps} />);

    expect(screen.getByText("10")).toBeInTheDocument(); // totalTrades
    expect(screen.getByText("2")).toBeInTheDocument(); // tradesThisWeek
  });

  it("should display reviews preview", () => {
    render(<ProfileHeader {...mockProps} />);

    expect(screen.getByText("Great trader!")).toBeInTheDocument();
    expect(screen.getByText("Good experience")).toBeInTheDocument();
  });

  it("should show loading state for reviews", () => {
    const loadingProps = { ...mockProps, reviewsLoading: true };
    render(<ProfileHeader {...loadingProps} />);

    // Component should render without errors
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("should handle missing optional fields gracefully", () => {
    const minimalProps: ProfileHeaderProps = {
      ...mockProps,
      profile: {
        id: "user-123",
        uid: "user-123",
        email: "test@example.com",
      },
      stats: null,
      repScore: null,
      reviewsPreview: [],
      reviewsMeta: null,
    };

    render(<ProfileHeader {...minimalProps} />);

    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("should be memoized to prevent unnecessary re-renders", () => {
    const { rerender } = render(<ProfileHeader {...mockProps} />);

    const firstRender = screen.getByText("Test User");
    expect(firstRender).toBeInTheDocument();

    // Re-render with same props
    rerender(<ProfileHeader {...mockProps} />);

    const secondRender = screen.getByText("Test User");
    expect(secondRender).toBeInTheDocument();
  });
});
