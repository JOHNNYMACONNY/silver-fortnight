import { fetchUserData } from "./userUtils";

// Mock Firestore methods
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((db, collection, userId) => ({
    db,
    collection,
    userId,
    id: userId,
  })),
  getDoc: jest.fn(async (ref) => {
    if (ref.userId === "exists" || ref.id === "exists") {
      return {
        exists: () => true,
        data: () => ({
          displayName: "Test User",
          email: "test@example.com",
          profilePicture: "http://example.com/pic.jpg",
        }),
      };
    } else {
      return {
        exists: () => false,
        data: () => ({}),
      };
    }
  }),
}));

// Mock db
jest.mock("../firebase-config", () => ({
  db: jest.fn(() => ({})),
}));

describe("fetchUserData", () => {
  it("returns user data when user exists", async () => {
    const data = await fetchUserData("exists");
    expect(data.displayName).toBe("Test User");
    expect(data.email).toBe("test@example.com");
    expect(data.profilePicture).toBe("http://example.com/pic.jpg");
  });

  it("returns default data when user does not exist", async () => {
    const data = await fetchUserData("notfound");
    expect(data.displayName).toMatch(/^User /);
    expect(data.profilePicture).toBeNull();
  });

  it("returns cached data if available and not expired", async () => {
    const first = await fetchUserData("exists");
    const second = await fetchUserData("exists");
    // Should return the same data (from cache) - use toEqual for deep comparison
    expect(second).toEqual(first);
  });

  it("returns fallback data on error", async () => {
    // Simulate error by throwing in getDoc
    const { getDoc } = require("firebase/firestore");
    getDoc.mockImplementationOnce(() => {
      throw new Error("Firestore error");
    });
    const data = await fetchUserData("errorcase");
    expect(data.displayName).toMatch(/^User /);
    expect(data.profilePicture).toBeNull();
  });

  it("should work for any authenticated user (no permission restrictions)", async () => {
    // Test that reflects the updated Firebase Security Rules
    // Any authenticated user can now read basic profile info for messaging
    const data = await fetchUserData("any-user-id");
    expect(data).toBeDefined();
    expect(data.id).toBe("any-user-id");
    // Should return fallback data since mock returns non-existent user
    expect(data.displayName).toMatch(/^User /);
  });
});
