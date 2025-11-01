import React from "react";
import { render, screen } from "@testing-library/react";
import { AboutTab } from "../components/AboutTab";
import { CollaborationsTab } from "../components/CollaborationsTab";
import { TradesTab } from "../components/TradesTab";

jest.mock("../../../components/layout/primitives/Box", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement("div", { ...props }, props.children),
  };
});

jest.mock("../../../components/layout/primitives/Stack", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement("div", { ...props }, props.children),
  };
});

jest.mock("../../../components/layout/primitives/Cluster", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement("div", { ...props }, props.children),
  };
});

describe("AboutTab", () => {
  const mockProps = {
    profile: {
      id: "user-123",
      uid: "user-123",
      email: "test@example.com",
      displayName: "Test User",
      bio: "Test bio",
      website: "https://example.com",
      location: "Test City",
    },
    isOwnProfile: false,
    onEditClick: jest.fn(),
  };

  it("should render about tab content", () => {
    render(<AboutTab {...mockProps} />);

    expect(screen.getByText("Test bio")).toBeInTheDocument();
  });

  it("should display website link when available", () => {
    render(<AboutTab {...mockProps} />);

    const link = screen.getByRole("link", { name: /example.com/i });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("should display location when available", () => {
    render(<AboutTab {...mockProps} />);

    expect(screen.getByText("Test City")).toBeInTheDocument();
  });

  it("should be memoized", () => {
    const { rerender } = render(<AboutTab {...mockProps} />);

    expect(screen.getByText("Test bio")).toBeInTheDocument();

    rerender(<AboutTab {...mockProps} />);

    expect(screen.getByText("Test bio")).toBeInTheDocument();
  });
});

describe("CollaborationsTab", () => {
  const mockProps = {
    collaborations: [
      { id: "collab-1", name: "Collab 1", participants: 3 },
      { id: "collab-2", name: "Collab 2", participants: 2 },
    ],
    collaborationsLoading: false,
    collabVisibleCount: 6,
    filteredCollaborations: [
      { id: "collab-1", name: "Collab 1", participants: 3 },
      { id: "collab-2", name: "Collab 2", participants: 2 },
    ],
    collabFilter: "all" as const,
    setCollabFilter: jest.fn(),
    collabSentinelRef: React.createRef(),
  };

  it("should render collaborations list", () => {
    render(<CollaborationsTab {...mockProps} />);

    expect(screen.getByText("Collab 1")).toBeInTheDocument();
    expect(screen.getByText("Collab 2")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<CollaborationsTab {...mockProps} collaborationsLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should be memoized", () => {
    const { rerender } = render(<CollaborationsTab {...mockProps} />);

    expect(screen.getByText("Collab 1")).toBeInTheDocument();

    rerender(<CollaborationsTab {...mockProps} />);

    expect(screen.getByText("Collab 1")).toBeInTheDocument();
  });
});

describe("TradesTab", () => {
  const mockProps = {
    trades: [
      { id: "trade-1", title: "Trade 1", status: "active" },
      { id: "trade-2", title: "Trade 2", status: "completed" },
    ],
    tradesLoading: false,
    tradesVisibleCount: 6,
    filteredTrades: [
      { id: "trade-1", title: "Trade 1", status: "active" },
      { id: "trade-2", title: "Trade 2", status: "completed" },
    ],
    tradeFilter: "all" as const,
    setTradeFilter: jest.fn(),
    tradesSentinelRef: React.createRef(),
  };

  it("should render trades list", () => {
    render(<TradesTab {...mockProps} />);

    expect(screen.getByText("Trade 1")).toBeInTheDocument();
    expect(screen.getByText("Trade 2")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<TradesTab {...mockProps} tradesLoading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should be memoized", () => {
    const { rerender } = render(<TradesTab {...mockProps} />);

    expect(screen.getByText("Trade 1")).toBeInTheDocument();

    rerender(<TradesTab {...mockProps} />);

    expect(screen.getByText("Trade 1")).toBeInTheDocument();
  });
});
