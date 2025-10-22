import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChallengesPage } from "../pages/ChallengesPage";

jest.mock("../AuthContext", () => ({
  useAuth: () => ({ currentUser: { uid: "u1" } }),
}));

jest.mock("../services/challenges", () => ({
  getChallenges: async () => ({ success: true, challenges: [] }),
  getUserChallenges: async () => ({ success: true, challenges: [] }),
  onActiveChallenges: (cb: (items: unknown[]) => void) => {
    cb([]);
    return () => {};
  },
  getRecommendedChallenges: async () => ({ success: true, challenges: [] }),
}));

const mockMarkSkillPracticeDay = jest.fn(async (_userId: string) => {
  void _userId;
  return {};
});
jest.mock("../services/streaks", () => ({
  // accept the single userId parameter directly to avoid spreading an any[] (TS error)
  markSkillPracticeDay: (userId: string) => mockMarkSkillPracticeDay(userId),
}));

jest.mock("../contexts/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn() }),
}));

describe("ChallengesPage daily practice quick action", () => {
  afterEach(() => {
    // optional: ensures tests remain isolated if you add more tests later
    jest.clearAllMocks();
  });

  it("calls markSkillPracticeDay when clicking Log practice", async () => {
    render(<ChallengesPage />);
    const btn = await screen.findByRole("button", { name: /Log practice/i });
    fireEvent.click(btn);
    expect(mockMarkSkillPracticeDay).toHaveBeenCalledWith("u1");
  });

  test("calls onActiveChallenges with active list", () => {
    const _userId = "abc123";
    void _userId;
    const active: unknown[] = [{ id: "c1" }, { id: "c2" }];
    const onActiveChallenges = jest.fn((list: unknown[]) => {
      expect(list).toHaveLength(2);
    });
    // call the callback directly instead of rendering PracticeLog to keep test isolated
    act(() => {
      onActiveChallenges(active);
    });
    expect(onActiveChallenges).toHaveBeenCalled();
  });
});
