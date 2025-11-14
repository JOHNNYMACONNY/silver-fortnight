import {
  collectParticipantIdsFromTrade,
  isTradeOwnedByUser,
  TradeLike,
} from "../tradeParticipants";

describe("collectParticipantIdsFromTrade", () => {
  it("collects participantId and participantIds strings", () => {
    const trade: TradeLike = {
      participantId: "user-1",
      participantIds: ["user-2", "  user-3  ", "", null],
    };

    expect(collectParticipantIdsFromTrade(trade)).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
  });

  it("collects ids from array of participant objects", () => {
    const trade: TradeLike = {
      participants: [
        { participant: "user-10" },
        { id: "user-11", name: "Alice" },
        { participant: { id: "user-12" } },
        "user-13",
        null,
      ],
    };

    expect(collectParticipantIdsFromTrade(trade)).toEqual([
      "user-10",
      "user-11",
      "user-12",
      "user-13",
    ]);
  });

  it("collects ids from object map schema", () => {
    const trade: TradeLike = {
      participants: {
        creator: "creator-1",
        participant: "participant-2",
        reviewer: { userId: "reviewer-3" },
      },
    };

    expect(collectParticipantIdsFromTrade(trade)).toEqual([
      "creator-1",
      "participant-2",
      "reviewer-3",
    ]);
  });
});

describe("isTradeOwnedByUser", () => {
  it("returns true when user is the creator", () => {
    const trade: TradeLike = {
      creatorId: "owner-1",
      participantId: "user-2",
    };

    expect(isTradeOwnedByUser(trade, "owner-1")).toBe(true);
    expect(isTradeOwnedByUser(trade, "user-2")).toBe(true);
  });

  it("returns true for complex participant arrays", () => {
    const trade: TradeLike = {
      participants: [{ participant: { id: "nested-1" } }],
    };

    expect(isTradeOwnedByUser(trade, "nested-1")).toBe(true);
  });

  it("returns false for empty user ids", () => {
    const trade: TradeLike = {
      participantIds: ["user-1"],
    };

    expect(isTradeOwnedByUser(trade, "")).toBe(false);
    expect(isTradeOwnedByUser(trade, undefined)).toBe(false);
  });
});

