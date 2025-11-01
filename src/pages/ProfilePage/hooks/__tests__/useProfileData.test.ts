import { renderHook, act, waitFor } from "@testing-library/react";
import { useProfileData } from "../useProfileData";

// Mock the services
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

jest.mock("../../../services/firestore", () => ({
  getRelatedUserIds: jest.fn(),
  getUsersByIds: jest.fn(),
}));

jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock("../../../AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "current-user-id" } }),
}));

describe("useProfileData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() =>
      useProfileData("user-123", { uid: "current-user-id" }, false)
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.userProfile).toBeNull();
  });

  it("should fetch profile data successfully", async () => {
    const mockProfile = {
      uid: "user-123",
      displayName: "Test User",
      email: "test@example.com",
    };

    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockResolvedValue({ data: mockProfile });

    const { result } = renderHook(() =>
      useProfileData("user-123", { uid: "current-user-id" }, false)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userProfile).toEqual(mockProfile);
  });

  it("should handle errors gracefully", async () => {
    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useProfileData("user-123", { uid: "current-user-id" }, false)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userProfile).toBeNull();
  });

  it("should provide refetch function", async () => {
    const mockProfile = {
      uid: "user-123",
      displayName: "Test User",
    };

    const { getUserProfile } = require("../../../services/firestore-exports");
    getUserProfile.mockResolvedValue({ data: mockProfile });

    const { result } = renderHook(() =>
      useProfileData("user-123", { uid: "current-user-id" }, false)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");
  });

  it("should return stats when available", async () => {
    const mockProfile = { uid: "user-123" };
    const mockStats = { totalTrades: 10, tradesThisWeek: 2 };

    const { getUserProfile } = require("../../../services/firestore-exports");
    const { getDashboardStats } = require("../../../services/dashboard");

    getUserProfile.mockResolvedValue({ data: mockProfile });
    getDashboardStats.mockResolvedValue({ data: mockStats });

    const { result } = renderHook(() =>
      useProfileData("user-123", { uid: "current-user-id" }, false)
    );

    await waitFor(() => {
      expect(result.current.stats).toBeDefined();
    });
  });

  it("should provide setUserProfile function", async () => {
    const { result } = renderHook(() =>
      useProfileData("user-123", { uid: "current-user-id" }, false)
    );

    expect(typeof result.current.setUserProfile).toBe("function");

    const newProfile = { uid: "user-123", displayName: "Updated" };
    act(() => {
      result.current.setUserProfile(newProfile);
    });

    expect(result.current.userProfile).toEqual(newProfile);
  });
});

