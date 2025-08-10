import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../Navbar';

// Mock AuthContext
const mockCurrentUser = {
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockAuthContext = {
  currentUser: mockCurrentUser,
  logout: jest.fn(),
  isAdmin: false,
  loading: false,
};

jest.mock('../../../AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock useNavigation hook
const mockNavigationState = {
  isScrolled: false,
  isMobileMenuOpen: false,
  activePath: '/trades',
  isCommandPaletteOpen: false,
  toggleMobileMenu: jest.fn(),
  closeMobileMenu: jest.fn(),
  toggleCommandPalette: jest.fn(),
  closeCommandPalette: jest.fn(),
};

jest.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => mockNavigationState,
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock child components
jest.mock('../../ui/MobileMenu', () => ({
  MobileMenu: ({ isOpen, onClose }: any) => (
    <div data-testid="mobile-menu" data-open={isOpen} onClick={onClose}>
      Mobile Menu
    </div>
  ),
}));

jest.mock('../../ui/Logo', () => {
  return function MockLogo({ size, showText }: any) {
    return <div data-testid="logo" data-size={size}>{showText ? 'TradeYa' : 'Logo'}</div>;
  };
});

jest.mock('../../ui/NavItem', () => ({
  NavItem: ({ to, label, isActive }: any) => (
    <a href={to} data-testid={`nav-item-${to}`} data-active={isActive}>
      {label}
    </a>
  ),
}));

jest.mock('../../ui/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

jest.mock('../../features/notifications/NotificationBell', () => ({
  NotificationBell: () => <button data-testid="notification-bell">Notifications</button>,
}));

jest.mock('../../ui/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../ui/CommandPalette', () => ({
  CommandPalette: ({ isOpen, onClose }: any) => (
    <div data-testid="command-palette" data-open={isOpen} onClick={onClose}>
      Command Palette
    </div>
  ),
}));

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigation state
    mockNavigationState.isScrolled = false;
    mockNavigationState.isMobileMenuOpen = false;
    mockNavigationState.activePath = '/trades';
    mockNavigationState.isCommandPaletteOpen = false;
  });

  describe('Rendering', () => {
    it('should render navbar with logo', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('TradeYa')).toBeInTheDocument();
    });

    it('should render main navigation items on desktop', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByTestId('nav-item-/trades')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/collaborations')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/challenges')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/portfolio')).toBeInTheDocument();
    });

    it('should render user controls when user is logged in', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('should render command palette button on desktop', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const commandButton = screen.getByText('⌘K');
      expect(commandButton).toBeInTheDocument();
    });

    it('should render mobile menu button', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileMenuButton = screen.getByLabelText('Open main menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should render mobile command palette button', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileCommandButton = screen.getByLabelText('Open command palette');
      expect(mobileCommandButton).toBeInTheDocument();
    });
  });

  describe('Scroll State', () => {
    it('should apply scrolled styles when isScrolled is true', () => {
      mockNavigationState.isScrolled = true;
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass('bg-white/80', 'dark:bg-gray-900/80', 'backdrop-blur-xl');
    });

    it('should apply default styles when not scrolled', () => {
      mockNavigationState.isScrolled = false;
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const navbar = screen.getByRole('navigation');
      expect(navbar).toHaveClass('bg-white/60', 'dark:bg-gray-900/60', 'backdrop-blur-lg');
    });
  });

  describe('Active Path Highlighting', () => {
    it('should highlight active navigation item', () => {
      mockNavigationState.activePath = '/trades';
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const tradesNavItem = screen.getByTestId('nav-item-/trades');
      expect(tradesNavItem).toHaveAttribute('data-active', 'true');
    });

    it('should not highlight inactive navigation items', () => {
      mockNavigationState.activePath = '/trades';
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const collaborationsNavItem = screen.getByTestId('nav-item-/collaborations');
      expect(collaborationsNavItem).toHaveAttribute('data-active', 'false');
    });
  });

  describe('Mobile Menu Integration', () => {
    it('should render mobile menu component', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    it('should pass correct props to mobile menu', () => {
      mockNavigationState.isMobileMenuOpen = true;
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).toHaveAttribute('data-open', 'true');
    });

    it('should toggle mobile menu when button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileMenuButton = screen.getByLabelText('Open main menu');
      await user.click(mobileMenuButton);

      expect(mockNavigationState.toggleMobileMenu).toHaveBeenCalled();
    });
  });

  describe('Command Palette Integration', () => {
    it('should render command palette component', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });

    it('should pass correct props to command palette', () => {
      mockNavigationState.isCommandPaletteOpen = true;
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const commandPalette = screen.getByTestId('command-palette');
      expect(commandPalette).toHaveAttribute('data-open', 'true');
    });

    it('should toggle command palette when desktop button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const commandButton = screen.getByText('⌘K');
      await user.click(commandButton);

      expect(mockNavigationState.toggleCommandPalette).toHaveBeenCalled();
    });

    it('should toggle command palette when mobile button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileCommandButton = screen.getByLabelText('Open command palette');
      await user.click(mobileCommandButton);

      expect(mockNavigationState.toggleCommandPalette).toHaveBeenCalled();
    });
  });

  describe('User Authentication States', () => {
    it('should render login button when user is not logged in', () => {
      mockAuthContext.currentUser = null;
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should not render user controls when user is not logged in', () => {
      mockAuthContext.currentUser = null;
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });

    it('should navigate to login when sign in button is clicked', async () => {
      mockAuthContext.currentUser = null;
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const signInButton = screen.getByText('Sign In');
      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Responsive Design', () => {
    it('should hide desktop navigation on mobile', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      // Desktop navigation should have hidden classes for mobile
      const desktopNav = screen.getByTestId('nav-item-/trades').parentElement;
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('should hide mobile controls on desktop', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const mobileControls = screen.getByLabelText('Open main menu').parentElement;
      expect(mobileControls).toHaveClass('md:hidden');
    });
  });

  describe('Accessibility', () => {
    it('should have proper navigation landmark', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Open main menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Open command palette')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });
});
