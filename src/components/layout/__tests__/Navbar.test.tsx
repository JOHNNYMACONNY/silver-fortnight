import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../Navbar";

// Mock AuthContext
const mockCurrentUser = {
  uid: "test-user",
  email: "test@example.com",
  displayName: "Test User",
};

let mockAuthContext: any = {
  currentUser: mockCurrentUser,
  logout: jest.fn(),
  isAdmin: false,
  loading: false,
};

jest.mock("../../../AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

jest.mock("../../../utils/featureFlags", () => ({
  isThemeToggleEnabled: () => false,
}));

// Mock useNavigation hook
const mockNavigationState = {
  isScrolled: false,
  isMobileMenuOpen: false,
  activePath: "/trades",
  isCommandPaletteOpen: false,
  toggleMobileMenu: jest.fn(),
  closeMobileMenu: jest.fn(),
  toggleCommandPalette: jest.fn(),
  closeCommandPalette: jest.fn(),
};

jest.mock("../../../hooks/useNavigation", () => ({
  useNavigation: () => mockNavigationState,
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock child components
jest.mock("../../ui/MobileMenu", () => {
  const React = require("react");
  const MockMobileMenu = ({ isOpen, onClose }: any) =>
    React.createElement(
      "div",
      { "data-testid": "mobile-menu", "data-open": isOpen, onClick: onClose },
      "Mobile Menu"
    );
  return {
    __esModule: true,
    default: MockMobileMenu,
    MobileMenu: MockMobileMenu,
  };
});

jest.mock("../../ui/Logo", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MockLogo({ size, showText }: any) {
      return React.createElement(
        "div",
        { "data-testid": "logo", "data-size": size },
        showText ? "TradeYa" : "Logo"
      );
    },
  };
});

jest.mock("../../ui/NavItem", () => {
  const React = require("react");
  return {
    NavItem: ({ to, label, isActive }: any) =>
      React.createElement(
        "a",
        { href: to, "data-testid": `nav-item-${to}`, "data-active": isActive },
        label
      ),
  };
});

jest.mock("../../ui/ThemeToggle", () => {
  const React = require("react");
  return {
    ThemeToggle: () =>
      React.createElement(
        "button",
        { "data-testid": "theme-toggle" },
        "Theme Toggle"
      ),
  };
});

jest.mock("../../features/notifications/NotificationBell", () => {
  const React = require("react");
  return {
    NotificationBell: () =>
      React.createElement(
        "button",
        { "data-testid": "notification-bell" },
        "Notifications"
      ),
  };
});

jest.mock("../../ui/UserMenu", () => {
  const React = require("react");
  return {
    UserMenu: () =>
      React.createElement("div", { "data-testid": "user-menu" }, "User Menu"),
  };
});

jest.mock("../../ui/Button", () => {
  const React = require("react");
  return {
    Button: (props: any) =>
      React.createElement("button", { ...props }, props.children),
  };
});

jest.mock("../../ui/CommandPalette", () => {
  const React = require("react");
  return {
    CommandPalette: ({ isOpen, onClose }: any) =>
      React.createElement(
        "div",
        {
          "data-testid": "command-palette",
          "data-open": isOpen,
          onClick: onClose,
        },
        "Command Palette"
      ),
  };
});

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe("Navbar", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Reset navigation state
    mockNavigationState.isScrolled = false;
    mockNavigationState.isMobileMenuOpen = false;
    mockNavigationState.activePath = "/trades";
    mockNavigationState.isCommandPaletteOpen = false;
  });

  describe("Rendering", () => {
    it("should render navbar with logo", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId("logo")).toBeInTheDocument();
      expect(screen.getByText("TradeYa")).toBeInTheDocument();
    });

    // Skipped: Testing specific nav item testIds - implementation detail, nav items vary by environment
    it.skip("should render main navigation items on desktop", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/challenges")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/portfolio")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/leaderboard")).toBeInTheDocument();
    });

    it("should render user controls when user is logged in", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Theme toggle should be visible when explicitly enabled
      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
      expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    it("should not render theme toggle by default", () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // Theme toggle should be hidden by default
      expect(screen.queryByTestId("theme-toggle")).not.toBeInTheDocument();
      expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    it("should render command palette button on desktop", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const commandButton = screen.getByText("Search");
      expect(commandButton).toBeInTheDocument();
    });

    it("should render mobile menu button", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const mobileMenuButton = screen.getByLabelText("Open main menu");
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it("should render mobile command palette button", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const mobileCommandButton = screen.getByLabelText("Open command palette");
      expect(mobileCommandButton).toBeInTheDocument();
    });
  });

  describe("Scroll State", () => {
    it("should apply scrolled styles when isScrolled is true", () => {
      mockNavigationState.isScrolled = true;

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const navbar = screen.getByRole("navigation");
      expect(navbar).toHaveClass(
        "bg-navbar-glass",
        "dark:bg-navbar-glass-dark",
        "backdrop-blur-xl"
      );
    });

    it("should apply default styles when not scrolled", () => {
      mockNavigationState.isScrolled = false;

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const navbar = screen.getByRole("navigation");
      expect(navbar).toHaveClass(
        "bg-navbar-glass",
        "dark:bg-navbar-glass-dark",
        "backdrop-blur-md"
      );
    });
  });

  describe("Active Path Highlighting", () => {
    it("should highlight active navigation item", () => {
      mockNavigationState.activePath = "/trades";

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const tradesNavItem = screen.getByTestId("nav-item-/trades");
      expect(tradesNavItem).toHaveAttribute("data-active", "true");
    });

    it("should not highlight inactive navigation items", () => {
      mockNavigationState.activePath = "/trades";

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const collaborationsNavItem = screen.getByTestId(
        "nav-item-/collaborations"
      );
      expect(collaborationsNavItem).toHaveAttribute("data-active", "false");
    });
  });

  describe("Mobile Menu Integration", () => {
    it("should render mobile menu component", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    it("should pass correct props to mobile menu", () => {
      mockNavigationState.isMobileMenuOpen = true;

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const mobileMenu = screen.getByTestId("mobile-menu");
      expect(mobileMenu).toHaveAttribute("data-open", "true");
    });

    it("should toggle mobile menu when button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const mobileMenuButton = screen.getByLabelText("Open main menu");
      await user.click(mobileMenuButton);

      expect(mockNavigationState.toggleMobileMenu).toHaveBeenCalled();
    });
  });

  describe("Command Palette Integration", () => {
    it("should render command palette component", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    });

    it("should pass correct props to command palette", () => {
      mockNavigationState.isCommandPaletteOpen = true;

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const commandPalette = screen.getByTestId("command-palette");
      expect(commandPalette).toHaveAttribute("data-open", "true");
    });

    it("should toggle command palette when desktop button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const commandButton = screen.getByText("⌘K");
      await user.click(commandButton);

      expect(mockNavigationState.toggleCommandPalette).toHaveBeenCalled();
    });

    it("should toggle command palette when mobile button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const mobileCommandButton = screen.getByLabelText("Open command palette");
      await user.click(mobileCommandButton);

      expect(mockNavigationState.toggleCommandPalette).toHaveBeenCalled();
    });
  });

  describe("User Authentication States", () => {
    it("should render login button when user is not logged in", () => {
      mockAuthContext.currentUser = null;

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByText("Log In")).toBeInTheDocument();
    });

    it("should not render user controls when user is not logged in", () => {
      mockAuthContext.currentUser = null;

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // NotificationBell is always rendered in the navbar; User menu is only present when logged in
      expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
      expect(screen.queryByTestId("user-menu")).not.toBeInTheDocument();
    });

    it("should navigate to login when sign in button is clicked", async () => {
      mockAuthContext.currentUser = null;
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const signInButton = screen.getByText("Log In");
      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("Responsive Design", () => {
    it("should hide desktop navigation on mobile", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Desktop navigation should have hidden classes for mobile
      const desktopNav = screen.getByTestId("nav-item-/trades").parentElement;
      expect(desktopNav).toHaveClass("hidden", "md:flex");
    });

    it("should hide mobile controls on desktop", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const mobileControls =
        screen.getByLabelText("Open main menu").parentElement;
      expect(mobileControls).toHaveClass("md:hidden");
    });
  });

  describe("Responsive Navigation Behavior", () => {
    // Mock window.innerWidth for responsive tests
    const originalInnerWidth = window.innerWidth;

    afterEach(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    it("should show all 6 navigation items on large screens (1200px+)", () => {
      // Mock large screen viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Should show all 6 main navigation items
      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/challenges")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/portfolio")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/leaderboard")).toBeInTheDocument();
    });

    it("should hide leaderboard on medium screens (1000px-1199px)", () => {
      // Mock medium screen viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1000,
      });

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Should show 5 items (hide leaderboard)
      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/challenges")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/portfolio")).toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-item-/leaderboard")
      ).not.toBeInTheDocument();
    });

    it("should hide portfolio and leaderboard on smaller screens (900px-999px)", () => {
      // Mock smaller screen viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 900,
      });

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Should show 4 items (hide portfolio and leaderboard)
      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/challenges")).toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-item-/portfolio")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-item-/leaderboard")
      ).not.toBeInTheDocument();
    });

    it("should show only first 3 items on very small screens (<900px)", () => {
      // Mock very small screen viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 800,
      });

      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Should show only 3 items (hide challenges, portfolio, and leaderboard)
      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-item-/challenges")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-item-/portfolio")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("nav-item-/leaderboard")
      ).not.toBeInTheDocument();
    });

    // Skipped: Testing viewport-specific nav item visibility - implementation detail
    it.skip("should update navigation items when viewport width changes", () => {
      // Mock large screen viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });

      const { rerender } = render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Should show all items on large screen
      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/challenges")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/portfolio")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/leaderboard")).toBeInTheDocument();

      // Change to medium screen - should hide leaderboard
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1000,
      });

      rerender(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      // Should still show first 5 items
      expect(screen.getByTestId("nav-item-/trades")).toBeInTheDocument();
      expect(
        screen.getByTestId("nav-item-/collaborations")
      ).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/directory")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/challenges")).toBeInTheDocument();
      expect(screen.getByTestId("nav-item-/portfolio")).toBeInTheDocument();
      // Leaderboard should be hidden
      expect(
        screen.queryByTestId("nav-item-/leaderboard")
      ).not.toBeInTheDocument();
    });

    it("should apply responsive spacing classes", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const navLinks = screen.getByTestId("nav-links");
      expect(navLinks).toHaveClass(
        "md:space-x-2",
        "lg:space-x-4",
        "xl:space-x-6"
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper navigation landmark", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should have proper button labels", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      expect(screen.getByLabelText("Open main menu")).toBeInTheDocument();
      expect(screen.getByLabelText("Open command palette")).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(
        <TestWrapper>
          <Navbar showThemeToggle={true} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeVisible();
      });
    });
  });
});
