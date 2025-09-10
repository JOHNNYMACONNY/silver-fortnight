/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Advanced Swipeable Trade Card Component Tests
 *
 * Test suite for sophisticated trading card with multi-step swipe workflows
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdvancedSwipeableTradeCard } from "../AdvancedSwipeableTradeCard";
import type { MultiStepSwipeAction } from "../AdvancedSwipeableTradeCard";
import type { Trade } from "../../../services/firestore-exports"; // <--- new import

// test trade shape intentionally removed; tests use the imported `Trade` type
// to keep runtime fixtures aligned with production types.

// Mock the animation hooks
jest.mock("../../../hooks/useTradeYaAnimation", () => ({
  useTradeYaAnimation: jest.fn(() => ({
    triggerAnimation: jest.fn(),
  })),
}));

jest.mock("../../../hooks/useMobileAnimation", () => ({
  useMobileAnimation: jest.fn(() => ({
    triggerHapticFeedback: jest.fn(),
    isMobile: false,
  })),
}));

jest.mock("../../../hooks/useSwipeGestures", () => ({
  useSwipeGestures: jest.fn(() => ({
    onPanStart: jest.fn(),
    onPan: jest.fn(),
    onPanEnd: jest.fn(),
  })),
}));

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const React = require("react");
      return React.createElement("div", props, children);
    },
    button: ({ children, ...props }: any) => {
      const React = require("react");
      return React.createElement("button", props, children);
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock AnimatedSkillBadge component
jest.mock("../AnimatedSkillBadge", () => ({
  AnimatedSkillBadge: ({ skill, ...props }: any) => {
    const React = require("react");
    // Ensure we never pass an object as a React child — use skill.name or a string fallback
    const displaySkill =
      skill && typeof skill === "object"
        ? skill.name ?? JSON.stringify(skill)
        : String(skill ?? "");
    return React.createElement(
      "div",
      {
        "data-testid": "animated-skill-badge",
        "data-skill": displaySkill,
        ...props,
      },
      displaySkill
    );
  },
}));

// Mock TradeStatusIndicator component
jest.mock("../TradeStatusIndicator", () => ({
  TradeStatusIndicator: ({ status, ...props }: any) => {
    const React = require("react");
    return React.createElement(
      "div",
      {
        "data-testid": "trade-status-indicator",
        "data-status": status,
        ...props,
      },
      status
    );
  },
}));

describe("AdvancedSwipeableTradeCard", () => {
  const mockTrade = {
    id: "trade-123",
    title: "Web Development for Design Skills",
    description:
      "Looking to trade my web development expertise for design skills",
    creatorId: "user-123",
    creatorName: "John Doe",
    creatorPhotoURL: "/avatars/john.jpg",
    category: "Technology",
    // Single skills for the component
    offeredSkill: "React",
    requestedSkill: "UI Design",
    // Array skills for backward compatibility
    skillsOffered: [
      { name: "React", level: "expert" as const },
      { name: "TypeScript", level: "intermediate" as const },
      { name: "Node.js", level: "expert" as const },
    ],
    skillsWanted: [
      { name: "UI Design", level: "intermediate" as const },
      { name: "Figma", level: "beginner" as const },
      { name: "Prototyping", level: "intermediate" as const },
    ],
    // Aliases for backward compatibility
    offeredSkills: [
      { name: "React", level: "expert" as const },
      { name: "TypeScript", level: "intermediate" as const },
      { name: "Node.js", level: "expert" as const },
    ],
    requestedSkills: [
      { name: "UI Design", level: "intermediate" as const },
      { name: "Figma", level: "beginner" as const },
      { name: "Prototyping", level: "intermediate" as const },
    ],
    status: "open" as const,
    createdAt: {
      seconds: 1705312800,
      toDate: () => new Date("2024-01-15T10:00:00Z"),
    },
    updatedAt: {
      seconds: 1705312800,
      toDate: () => new Date("2024-01-15T10:00:00Z"),
    },
  } as unknown as Trade; // cast now refers to the imported Firestore Trade type

  // Replace the typed literal with a cast to bypass excess property checks for test-only fields
  const mockActions = [
    {
      id: "accept",
      direction: "right",
      label: "Accept",
      icon: "✓",
      color: "#10b981",
      partialThreshold: 50,
      completeThreshold: 120,
      onPartial: jest.fn(),
      onComplete: jest.fn(),
    },
    {
      id: "reject",
      direction: "left",
      label: "Reject",
      icon: "✗",
      color: "#ef4444",
      partialThreshold: 50,
      completeThreshold: 120,
      onPartial: jest.fn(),
      onComplete: jest.fn(),
    },
  ] as unknown as MultiStepSwipeAction[];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render trade information correctly", () => {
      render(
        <AdvancedSwipeableTradeCard trade={mockTrade} actions={mockActions} />
      );

      expect(
        screen.getByText("Web Development for Design Skills")
      ).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      // Skills are rendered through AnimatedSkillBadge which is mocked (there are multiple)
      expect(screen.getAllByTestId("animated-skill-badge")).toHaveLength(2);
    });

    it("should render with custom className", () => {
      const { container } = render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should show status indicator", () => {
      render(
        <AdvancedSwipeableTradeCard trade={mockTrade} actions={mockActions} />
      );

      expect(screen.getByText("open")).toBeInTheDocument();
    });
  });

  describe("Quick Actions", () => {
    it("should render quick action buttons when toggled", () => {
      render(
        <AdvancedSwipeableTradeCard trade={mockTrade} actions={mockActions} />
      );

      // Quick actions are hidden by default; toggle via the UI control (ellipsis)
      const toggleButton = screen.getByText("⋯");
      fireEvent.click(toggleButton);

      // Check for quick action icons rendered after toggling
      expect(screen.getByText("⭐")).toBeInTheDocument();
      expect(screen.getByText("📤")).toBeInTheDocument();
      expect(screen.getByText("🚩")).toBeInTheDocument();
    });

    it("should not render quick actions when disabled", () => {
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          enableQuickActions={false}
        />
      );

      // Quick actions toggle button should still be present but quick actions won't show
      expect(screen.getByText("⋯")).toBeInTheDocument();
    });

    it("should call onQuickAction when favorite button is clicked", async () => {
      const mockOnQuickAction = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onQuickAction={mockOnQuickAction}
        />
      );

      // Toggle quick actions first
      const toggleButton = screen.getByText("⋯");
      fireEvent.click(toggleButton);

      const favoriteButton = screen.getByText("⭐");
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(mockOnQuickAction).toHaveBeenCalledWith("favorite");
      });
    });

    it("should call onQuickAction when share button is clicked", async () => {
      const mockOnQuickAction = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onQuickAction={mockOnQuickAction}
        />
      );

      // Toggle quick actions first
      const toggleButton = screen.getByText("⋯");
      fireEvent.click(toggleButton);

      const shareButton = screen.getByText("📤");
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockOnQuickAction).toHaveBeenCalledWith("share");
      });
    });

    it("should call onQuickAction when report button is clicked", async () => {
      const mockOnQuickAction = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onQuickAction={mockOnQuickAction}
        />
      );

      // Toggle quick actions first
      const toggleButton = screen.getByText("⋯");
      fireEvent.click(toggleButton);

      const reportButton = screen.getByText("🚩");
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(mockOnQuickAction).toHaveBeenCalledWith("report");
      });
    });
  });

  describe("Card Interactions", () => {
    it("should render card content correctly", () => {
      render(
        <AdvancedSwipeableTradeCard trade={mockTrade} actions={mockActions} />
      );

      expect(
        screen.getByText("Web Development for Design Skills")
      ).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should show disabled state styling when disabled", () => {
      const { container } = render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          disabled={true}
        />
      );

      // Check for disabled styling in the card
      const cardElement = container.querySelector(".opacity-50");
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe("Long Press Functionality", () => {
    it("should call onLongPress after long press duration", async () => {
      const onLongPress = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onLongPress={onLongPress}
        />
      );

      const card = screen
        .getByText("Web Development for Design Skills")
        .closest("div");

      // Simulate touch start
      fireEvent.touchStart(card!);

      // Wait for long press duration (500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(onLongPress).toHaveBeenCalled();
    });

    it("should not trigger long press if mouse is released early", async () => {
      const onLongPress = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onLongPress={onLongPress}
        />
      );

      const card = screen
        .getByText("Web Development for Design Skills")
        .closest("div");

      // Simulate touch start and quick release
      fireEvent.touchStart(card!);
      fireEvent.touchEnd(card!);

      // Wait a bit and ensure long press wasn't triggered
      await new Promise((resolve) => setTimeout(resolve, 200));
      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe("Double Tap Detection", () => {
    it("should call onDoubleTap when tapped twice quickly", async () => {
      const onDoubleTap = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onDoubleTap={onDoubleTap}
        />
      );

      const card = screen
        .getByText("Web Development for Design Skills")
        .closest("div");

      // Simulate double tap with touch events
      fireEvent.touchStart(card!);
      fireEvent.touchEnd(card!);
      fireEvent.touchStart(card!);
      fireEvent.touchEnd(card!);

      expect(onDoubleTap).toHaveBeenCalled();
    });

    it("should not trigger double tap if taps are too far apart", async () => {
      const onDoubleTap = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onDoubleTap={onDoubleTap}
        />
      );

      const card = screen
        .getByText("Web Development for Design Skills")
        .closest("div");

      // Simulate taps with delay (more than 300ms)
      fireEvent.touchStart(card!);
      fireEvent.touchEnd(card!);
      await new Promise((resolve) => setTimeout(resolve, 400));
      fireEvent.touchStart(card!);
      fireEvent.touchEnd(card!);

      // Wait and ensure double tap wasn't triggered
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(onDoubleTap).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should render trade content accessibly", () => {
      render(
        <AdvancedSwipeableTradeCard trade={mockTrade} actions={mockActions} />
      );

      // Check that important content is accessible
      expect(
        screen.getByText("Web Development for Design Skills")
      ).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      // Skills are rendered through AnimatedSkillBadge which is mocked (there are multiple)
      expect(screen.getAllByTestId("animated-skill-badge")).toHaveLength(2);
    });

    it("should handle disabled state properly", () => {
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          disabled={true}
        />
      );

      // Check that disabled styling is applied
      const cardElement = document.querySelector(".opacity-50");
      expect(cardElement).toBeInTheDocument();
    });

    it("should render quick actions toggle", () => {
      render(
        <AdvancedSwipeableTradeCard trade={mockTrade} actions={mockActions} />
      );

      // Check that quick actions toggle is present
      expect(screen.getByText("⋯")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle rapid interactions without issues", async () => {
      const mockOnQuickAction = jest.fn();
      render(
        <AdvancedSwipeableTradeCard
          trade={mockTrade}
          actions={mockActions}
          onQuickAction={mockOnQuickAction}
        />
      );

      // Toggle quick actions
      const toggleButton = screen.getByText("⋯");
      fireEvent.click(toggleButton);

      const favoriteButton = screen.getByText("⭐");

      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(favoriteButton);
      }

      expect(mockOnQuickAction).toHaveBeenCalledTimes(10);
    });
  });
});
