import { renderHook, act, waitFor } from "@testing-library/react";
import { useCollaborationsData } from "../useCollaborationsData";

jest.mock("../../../services/entities/CollaborationService", () => ({
  collaborationService: {
    getCollaborationsByUserId: jest.fn(),
  },
}));

jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

describe("useCollaborationsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() =>
      useCollaborationsData("user-123", "about", false, jest.fn())
    );

    expect(result.current.collaborationsLoading).toBe(true);
    expect(result.current.collaborations).toBeNull();
  });

  it("should not fetch collaborations when tab is not active", () => {
    const {
      collaborationService,
    } = require("../../../services/entities/CollaborationService");

    const { result } = renderHook(() =>
      useCollaborationsData("user-123", "about", false, jest.fn())
    );

    expect(
      collaborationService.getCollaborationsByUserId
    ).not.toHaveBeenCalled();
  });

  it("should fetch collaborations when tab becomes active", async () => {
    const mockCollaborations = [
      { id: "collab-1", name: "Collab 1" },
      { id: "collab-2", name: "Collab 2" },
    ];

    const {
      collaborationService,
    } = require("../../../services/entities/CollaborationService");
    collaborationService.getCollaborationsByUserId.mockResolvedValue({
      data: mockCollaborations,
    });

    const { result, rerender } = renderHook(
      ({ tab }) => useCollaborationsData("user-123", tab, false, jest.fn()),
      { initialProps: { tab: "about" as const } }
    );

    rerender({ tab: "collaborations" as const });

    await waitFor(() => {
      expect(result.current.collaborationsLoading).toBe(false);
    });

    expect(result.current.collaborations).toEqual(mockCollaborations);
  });

  it("should filter collaborations based on filter state", async () => {
    const mockCollaborations = [
      { id: "collab-1", participants: ["user-123", "user-456"] },
      { id: "collab-2", participants: ["user-789"] },
    ];

    const {
      collaborationService,
    } = require("../../../services/entities/CollaborationService");
    collaborationService.getCollaborationsByUserId.mockResolvedValue({
      data: mockCollaborations,
    });

    const { result, rerender } = renderHook(
      ({ tab, filter }) =>
        useCollaborationsData("user-123", tab, false, jest.fn()),
      {
        initialProps: {
          tab: "collaborations" as const,
          filter: "all" as const,
        },
      }
    );

    await waitFor(() => {
      expect(result.current.collaborationsLoading).toBe(false);
    });

    act(() => {
      result.current.setCollabFilter("yours");
    });

    expect(result.current.collabFilter).toBe("yours");
  });

  it("should manage pagination with visible count", async () => {
    const mockCollaborations = Array.from({ length: 20 }, (_, i) => ({
      id: `collab-${i}`,
      name: `Collab ${i}`,
    }));

    const {
      collaborationService,
    } = require("../../../services/entities/CollaborationService");
    collaborationService.getCollaborationsByUserId.mockResolvedValue({
      data: mockCollaborations,
    });

    const { result, rerender } = renderHook(
      ({ tab }) => useCollaborationsData("user-123", tab, false, jest.fn()),
      { initialProps: { tab: "collaborations" as const } }
    );

    await waitFor(() => {
      expect(result.current.collaborationsLoading).toBe(false);
    });

    expect(result.current.collabVisibleCount).toBe(6);

    act(() => {
      result.current.setCollabVisibleCount(12);
    });

    expect(result.current.collabVisibleCount).toBe(12);
  });

  it("should provide refetch function", async () => {
    const { result } = renderHook(() =>
      useCollaborationsData("user-123", "collaborations", false, jest.fn())
    );

    expect(typeof result.current.refetch).toBe("function");
  });
});
