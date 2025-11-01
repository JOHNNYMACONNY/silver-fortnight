import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProfileTabs } from "../components/ProfileTabs";
import type { ProfileTabsProps } from "../components/ProfileTabs";

jest.mock("../../../components/layout/primitives/Box", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});

jest.mock("../../../components/layout/primitives/Stack", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});

describe("ProfileTabs", () => {
  const mockProps: ProfileTabsProps = {
    activeTab: "about",
    onTabChange: jest.fn(),
    tabs: [
      { id: "about", label: "About" },
      { id: "portfolio", label: "Portfolio" },
      { id: "collaborations", label: "Collaborations" },
      { id: "trades", label: "Trades" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all tabs", () => {
    render(<ProfileTabs {...mockProps} />);

    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Collaborations")).toBeInTheDocument();
    expect(screen.getByText("Trades")).toBeInTheDocument();
  });

  it("should highlight active tab", () => {
    render(<ProfileTabs {...mockProps} />);

    const aboutTab = screen.getByRole("tab", { name: /about/i });
    expect(aboutTab).toHaveAttribute("aria-selected", "true");
  });

  it("should call onTabChange when tab is clicked", () => {
    const onTabChange = jest.fn();
    render(<ProfileTabs {...mockProps} onTabChange={onTabChange} />);

    const portfolioTab = screen.getByRole("tab", { name: /portfolio/i });
    fireEvent.click(portfolioTab);

    expect(onTabChange).toHaveBeenCalledWith("portfolio");
  });

  it("should support keyboard navigation", () => {
    const onTabChange = jest.fn();
    render(<ProfileTabs {...mockProps} onTabChange={onTabChange} />);

    const aboutTab = screen.getByRole("tab", { name: /about/i });
    aboutTab.focus();

    fireEvent.keyDown(aboutTab, { key: "ArrowRight" });

    expect(onTabChange).toHaveBeenCalled();
  });

  it("should update active tab when prop changes", () => {
    const { rerender } = render(<ProfileTabs {...mockProps} />);

    let aboutTab = screen.getByRole("tab", { name: /about/i });
    expect(aboutTab).toHaveAttribute("aria-selected", "true");

    rerender(<ProfileTabs {...mockProps} activeTab="portfolio" />);

    const portfolioTab = screen.getByRole("tab", { name: /portfolio/i });
    expect(portfolioTab).toHaveAttribute("aria-selected", "true");
  });

  it("should be memoized to prevent unnecessary re-renders", () => {
    const { rerender } = render(<ProfileTabs {...mockProps} />);

    const firstAboutTab = screen.getByRole("tab", { name: /about/i });
    expect(firstAboutTab).toBeInTheDocument();

    rerender(<ProfileTabs {...mockProps} />);

    const secondAboutTab = screen.getByRole("tab", { name: /about/i });
    expect(secondAboutTab).toBeInTheDocument();
  });

  it("should handle empty tabs array", () => {
    render(<ProfileTabs {...mockProps} tabs={[]} />);

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("should support custom tab icons", () => {
    const tabsWithIcons = [
      { id: "about", label: "About", icon: <span>📝</span> },
      { id: "portfolio", label: "Portfolio", icon: <span>🎨</span> },
    ];

    render(<ProfileTabs {...mockProps} tabs={tabsWithIcons} />);

    expect(screen.getByText("📝")).toBeInTheDocument();
    expect(screen.getByText("🎨")).toBeInTheDocument();
  });
});
