import { Timestamp } from "firebase/firestore";
import {
  tradeMatchesSkillFilters,
  getNormalizedTradeSkillNames,
  tradeMatchesFilters,
  tradeMatchesSearchTerm,
  isTradeVisibleToPublic,
  type Trade,
  type TradeFilters,
} from "@/services/firestore";

const createTrade = (overrides: Partial<Trade> = {}): Trade => ({
  title: "Skill Swap",
  description: "Exchange expertise",
  creatorId: "creator-1",
  category: "Development",
  status: "open",
  skillsOffered: [{ name: "React", level: "expert" }],
  skillsWanted: [{ name: "UX", level: "intermediate" }],
  offeredSkills: [{ name: "React", level: "expert" }],
  requestedSkills: [{ name: "UX", level: "intermediate" }],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  visibility: "public",
  ...overrides,
});

describe("tradeMatchesSkillFilters", () => {
  it("matches general skill filters across modern fields", () => {
    const trade = createTrade({
      skillsOffered: [
        { name: "React", level: "expert" },
        { name: "TypeScript", level: "intermediate" },
      ],
      skillsWanted: [{ name: "UX", level: "intermediate" }],
    });

    const filters: TradeFilters = { skills: ["react", "typescript"] };

    expect(tradeMatchesSkillFilters(trade, filters)).toBe(true);
  });

  it("matches offered and wanted filters independently", () => {
    const trade = createTrade({
      skillsOffered: [
        { name: "React", level: "expert" },
        { name: "Node.js", level: "intermediate" },
      ],
      skillsWanted: [{ name: "Design", level: "beginner" }],
    });

    expect(
      tradeMatchesSkillFilters(trade, { skillsOffered: ["node.js"] })
    ).toBe(true);
    expect(tradeMatchesSkillFilters(trade, { skillsWanted: ["design"] })).toBe(
      true
    );
    expect(tradeMatchesSkillFilters(trade, { skillsOffered: ["python"] })).toBe(
      false
    );
  });

  it("supports legacy skill formats and indexes", () => {
    const trade = createTrade({
      skillsOffered: undefined,
      skillsWanted: undefined,
      offeredSkills: ["GraphQL", "React"],
    });

    (trade as any).requestedSkills = "Design, Illustration";
    (trade as any).skills = "React, GraphQL";
    (trade as any).skillsIndex = ["react", "graphql", "design"];

    expect(tradeMatchesSkillFilters(trade, { skills: ["design"] })).toBe(true);
    expect(
      tradeMatchesSkillFilters(trade, { skillsWanted: ["illustration"] })
    ).toBe(true);
  });

  it("returns false when filters have no overlap", () => {
    const trade = createTrade();

    expect(tradeMatchesSkillFilters(trade, { skills: ["python"] })).toBe(false);
  });
});

describe("getNormalizedTradeSkillNames integration", () => {
  it("normalizes combined modern and legacy skill data", () => {
    const trade = createTrade({
      skillsOffered: [{ name: "React", level: "expert" }],
      offeredSkills: ["React", "GraphQL"],
      skills: "React,GraphQL",
    });

    const normalized = getNormalizedTradeSkillNames(trade);

    expect(normalized).toEqual(expect.arrayContaining(["react", "graphql"]));
    expect(new Set(normalized).size).toBe(normalized.length);
  });
});

describe("tradeMatchesFilters", () => {
  it("enforces creator and participant filters in addition to skills", () => {
    const trade = createTrade({
      creatorId: "creator-1",
      participantId: "participant-9",
    });

    expect(
      tradeMatchesFilters(trade, { creatorId: "creator-1", skills: ["react"] })
    ).toBe(true);
    expect(tradeMatchesFilters(trade, { creatorId: "someone-else" })).toBe(
      false
    );
    expect(tradeMatchesFilters(trade, { participantId: "participant-9" })).toBe(
      true
    );
  });
});

describe("tradeMatchesSearchTerm", () => {
  it("matches across title, description, category, and skills", () => {
    const trade = createTrade({
      title: "Pair Programming Session",
      description: "Let us explore advanced node techniques",
      category: "Development",
      skillsOffered: [{ name: "Node.js", level: "expert" }],
    });

    expect(tradeMatchesSearchTerm(trade, "programming")).toBe(true);
    expect(tradeMatchesSearchTerm(trade, "advanced node")).toBe(true);
    expect(tradeMatchesSearchTerm(trade, "development")).toBe(true);
    expect(tradeMatchesSearchTerm(trade, "typescript")).toBe(false);
  });
});

describe("isTradeVisibleToPublic", () => {
  it("treats undefined visibility as public for legacy trades", () => {
    const trade = createTrade({ visibility: undefined });

    expect(isTradeVisibleToPublic(trade)).toBe(true);
  });

  it("respects explicit non-public visibility settings", () => {
    const trade = createTrade({ visibility: "private" });

    expect(isTradeVisibleToPublic(trade)).toBe(false);
  });
});
