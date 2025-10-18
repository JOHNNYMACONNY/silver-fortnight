import { Timestamp } from "firebase/firestore";
import { getNormalizedTradeSkillNames, Trade } from "@/services/firestore";

const createBaseTrade = (): Trade => ({
  title: "Example Trade",
  description: "A sample trade for testing",
  creatorId: "creator-123",
  creatorName: "Creator",
  category: "Design",
  skillsOffered: [],
  skillsWanted: [],
  offeredSkills: [],
  requestedSkills: [],
  status: "open",
  interestedUsers: [],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  visibility: "public",
});

describe("getNormalizedTradeSkillNames", () => {
  it("collects skills from modern trade fields", () => {
    const trade: Trade = {
      ...createBaseTrade(),
      skillsOffered: [
        { name: "React", level: "expert" },
        { name: "TypeScript", level: "intermediate" },
      ],
      skillsWanted: [{ name: "Design", level: "beginner" }],
    };

    const result = getNormalizedTradeSkillNames(trade);

    expect(result).toEqual(
      expect.arrayContaining(["react", "typescript", "design"])
    );
    expect(new Set(result).size).toBe(result.length);
  });

  it("includes legacy skill fields and removes duplicates", () => {
    const trade = {
      ...createBaseTrade(),
      offeredSkills: [
        { name: "React", level: "expert" },
        { name: "GraphQL", level: "intermediate" },
      ],
      requestedSkills: [{ name: "react", level: "expert" }],
      skills: ["React", "UI Design"],
      skillsIndex: ["graphql", "ui design"],
    } as Trade;

    const result = getNormalizedTradeSkillNames(trade);

    expect(result).toEqual(
      expect.arrayContaining(["react", "graphql", "ui design"])
    );
    expect(result.filter((skill) => skill === "react")).toHaveLength(1);
  });

  it("supports offered and wanted scopes", () => {
    const trade = {
      ...createBaseTrade(),
      skillsOffered: [
        { name: "React", level: "expert" },
        { name: "Node.js", level: "intermediate" },
      ],
      skillsWanted: [{ name: "Design", level: "intermediate" }],
    } as Trade;

    const offered = getNormalizedTradeSkillNames(trade, "offered");
    expect(offered).toEqual(expect.arrayContaining(["react", "node.js"]));
    expect(offered).toHaveLength(2);

    const wanted = getNormalizedTradeSkillNames(trade, "wanted");
    expect(wanted).toEqual(["design"]);
  });

  it("handles legacy comma-separated skill strings", () => {
    const trade = {
      ...createBaseTrade(),
      skills: "React, GraphQL,  ,Design",
      skillsIndex: "typescript,react",
    } as Trade;

    const result = getNormalizedTradeSkillNames(trade);

    expect(result).toEqual(
      expect.arrayContaining(["react", "graphql", "design", "typescript"])
    );
    expect(result.filter((skill) => skill === "react")).toHaveLength(1);
  });
});
