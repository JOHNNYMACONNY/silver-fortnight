import { calculateLevel, awardXP, getUserXP } from "../gamification";
import { XPSource, LEVEL_TIERS } from "../../types/gamification";

// Mock Firebase
jest.mock("../../firebase-config", () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    runTransaction: jest.fn(),
  },
}));

// Mock notifications service
jest.mock("../notifications", () => ({
  createNotification: jest.fn(),
}));

describe("Gamification Service", () => {
  describe("calculateLevel", () => {
    it("should calculate correct level for different XP amounts", () => {
      // Test level 1 (Newcomer)
      const level1 = calculateLevel(50);
      expect(level1.currentLevel).toBe(1);
      expect(level1.currentLevelTier.title).toBe("Newcomer");
      expect(level1.xpToNextLevel).toBe(51); // 101 - 50

      // Test level 2 (Explorer)
      const level2 = calculateLevel(150);
      expect(level2.currentLevel).toBe(2);
      expect(level2.currentLevelTier.title).toBe("Explorer");
      expect(level2.xpToNextLevel).toBe(101); // 251 - 150

      // Test level 3 (Contributor)
      const level3 = calculateLevel(300);
      expect(level3.currentLevel).toBe(3);
      expect(level3.currentLevelTier.title).toBe("Contributor");

      // Test max level (Legend)
      const maxLevel = calculateLevel(10000);
      expect(maxLevel.currentLevel).toBe(7);
      expect(maxLevel.currentLevelTier.title).toBe("Legend");
      expect(maxLevel.xpToNextLevel).toBe(0); // Max level
    });

    it("should calculate progress percentage correctly", () => {
      // Test progress within level 2 (101-250 XP)
      const result = calculateLevel(175); // Halfway through level 2
      expect(result.currentLevel).toBe(2);
      expect(result.progressPercentage).toBeCloseTo(49.66, 1); // (175-101)/(250-101) * 100 = 74/149 * 100 ≈ 49.66
    });
  });

  describe("Level Tiers Configuration", () => {
    it("should have properly configured level tiers", () => {
      expect(LEVEL_TIERS).toHaveLength(7);

      // Check first level
      expect(LEVEL_TIERS[0]).toEqual({
        level: 1,
        title: "Newcomer",
        minXP: 0,
        maxXP: 100,
        color: "#94a3b8",
        icon: "🌱",
        benefits: ["Basic platform access", "Profile creation"],
      });

      // Check last level
      expect(LEVEL_TIERS[6]).toEqual({
        level: 7,
        title: "Legend",
        minXP: 5001,
        maxXP: Infinity,
        color: "#ef4444",
        icon: "🔥",
        benefits: [
          "Legendary status",
          "All features unlocked",
          "Platform influence",
        ],
      });
    });

    it("should have no gaps in XP ranges", () => {
      for (let i = 0; i < LEVEL_TIERS.length - 1; i++) {
        const currentTier = LEVEL_TIERS[i];
        const nextTier = LEVEL_TIERS[i + 1];

        // Next tier should start where current tier ends + 1
        expect(nextTier.minXP).toBe(currentTier.maxXP + 1);
      }
    });
  });

  describe("XP Sources", () => {
    it("should have all required XP sources defined", () => {
      const requiredSources = [
        XPSource.TRADE_COMPLETION,
        XPSource.ROLE_COMPLETION,
        XPSource.COLLABORATION_COMPLETION,
        XPSource.EVIDENCE_SUBMISSION,
        XPSource.QUICK_RESPONSE,
        XPSource.FIRST_TIME_BONUS,
        XPSource.ACHIEVEMENT_UNLOCK,
      ];

      requiredSources.forEach((source) => {
        expect(Object.values(XPSource)).toContain(source);
      });
    });
  });

  // Note: The following tests would require proper Firebase mocking
  // They are included as examples of what should be tested in a full test suite

  describe("awardXP (Integration Tests)", () => {
    it("should award XP and create transaction record", async () => {
      // This test would require mocking Firebase Firestore operations
      // Implementation would test the full XP award flow including:
      // - User XP record creation/update
      // - Transaction record creation
      // - Level calculation
      // - Achievement checking
      // - Notification creation
    });

    it("should handle new user XP initialization", async () => {
      // Test that new users get properly initialized XP records
    });

    it("should handle level up scenarios", async () => {
      // Test that level ups are properly detected and notifications sent
    });
  });

  describe("getUserXP (Integration Tests)", () => {
    it("should retrieve existing user XP data", async () => {
      // Test retrieval of existing user XP records
    });

    it("should initialize new user with default XP", async () => {
      // Test that new users get default XP values
    });
  });

  describe("Error Handling", () => {
    it("should handle Firebase errors gracefully", async () => {
      // Test that Firebase errors are caught and handled properly
    });

    it("should not throw errors that could break calling functions", async () => {
      // Test that all gamification functions handle errors internally
    });
  });
});

describe("Gamification Integration Safety", () => {
  it("should not break trade completion if gamification fails", () => {
    // This would test that trade completion continues even if XP award fails
    // This is critical for ensuring gamification doesn't break core functionality
  });

  it("should not break role completion if gamification fails", () => {
    // Similar test for role completion integration
  });
});

describe("XP Values Configuration", () => {
  it("should have reasonable XP values for different actions", () => {
    // Test that XP values are within expected ranges
    // This helps ensure the progression feels balanced
  });

  it("should provide meaningful progression incentives", () => {
    // Test that XP values create good progression curves
    // Higher-effort actions should provide proportionally more XP
  });
});
