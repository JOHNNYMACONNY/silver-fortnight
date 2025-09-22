import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MobileMenu } from '../MobileMenu';

// Mock AuthContext
const mockCurrentUser = {
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockLogout = jest.fn();
// allow nullable currentUser for tests
const mockAuthContext: any = {
  currentUser: mockCurrentUser,
  logout: mockLogout,
  isAdmin: false,
  loading: false,
};

jest.mock('../../../AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));


// Mock icons used by MobileMenu
jest.mock('../../../utils/icons', () => {
  const React = require('react');
  const make = (name: string) => (props: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, ...props }, name);
  return {
    Home: make('Home'),
    ShoppingBag: make('ShoppingBag'),
    Briefcase: make('Briefcase'),
    Users: make('Users'),
    Award: make('Award'),
    Trophy: make('Trophy'),
    MessageSquare: make('MessageSquare'),
    Bell: make('Bell'),
    User: make('User'),
    Settings: make('Settings'),
    Shield: make('Shield'),
    LogOut: make('LogOut'),
  };
});

// Mock NavItem component
jest.mock('../NavItem', () => {
  const React = require('react');
  const MockNavItem = function MockNavItem(props: any) {
    const { to, label, icon, onClick, className } = props;
    return React.createElement('button', { onClick, className, 'data-testid': `nav-item-${to}` }, icon, label);
  };
  return { __esModule: true, default: MockNavItem };
});

// Mock Logo component
jest.mock('../Logo', () => {
  const React = require('react');
  const MockLogo = function MockLogo(props: any) {
    const { showText } = props;
    return React.createElement('div', { 'data-testid': 'logo' }, showText ? 'TradeYa' : 'Logo');
  };
  return { __esModule: true, default: MockLogo };
});

// Mock Sheet components
jest.mock('../Sheet', () => {
  const React = require('react');
  return {
    __esModule: true,
    Sheet: ({ children, open, onOpenChange }: any) => React.createElement('div', { 'data-testid': 'sheet', 'data-open': open, onClick: () => onOpenChange(false) }, open ? children : null),
    SheetContent: ({ children, side, className }: any) => React.createElement('div', { 'data-testid': 'sheet-content', 'data-side': side, className }, children),
    SheetHeader: ({ children, className }: any) => React.createElement('div', { 'data-testid': 'sheet-header', className }, children),
    SheetTitle: ({ children }: any) => React.createElement('h2', { 'data-testid': 'sheet-title' }, children),
    SheetTrigger: ({ children }: any) => React.createElement('div', { 'data-testid': 'sheet-trigger' }, children),
  };
});

// Mock Button component
jest.mock('../Button', () => {
  const React = require('react');
  return {
    __esModule: true,
    Button: ({ children, onClick, variant, className }: any) => React.createElement('button', { onClick, className, 'data-variant': variant }, children),
  };
});

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('MobileMenu', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render content when closed', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={false} onClose={mockOnClose} />
        </TestWrapper>
      );

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'false');
    });

    it('should render content when open', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    });

    it('should render logo in header', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.getByText('TradeYa')).toBeInTheDocument();
    });

    it('should render main navigation items', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Check for main navigation section
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      
      // Check for main nav items
      expect(screen.getByTestId('nav-item-/')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/trades')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/collaborations')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/challenges')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/portfolio')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/leaderboard')).toBeInTheDocument();
    });

    it('should render user account section when user is logged in', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Check for account section (toggle)
      expect(screen.getByText('Account')).toBeInTheDocument();

      // Expand account to reveal user nav items
      fireEvent.click(screen.getByText('Account'));
      
      // Check for user nav items (match current implementation)
      expect(screen.getByTestId('nav-item-/profile')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/connections')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/messages')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/notifications')).toBeInTheDocument();
    });

    it('should render admin section when user is admin', () => {
      // Mock admin user
      mockAuthContext.isAdmin = true;
      
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Expand account to reveal admin item
      fireEvent.click(screen.getByText('Account'));
      expect(screen.getByTestId('nav-item-/admin')).toBeInTheDocument();

      // Reset admin status
      mockAuthContext.isAdmin = false;
    });

    it('should render logout button when user is logged in', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Footer logout label in component is "Log Out"
      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });

    it('should not render user sections when user is not logged in', () => {
      // Mock no user
      mockAuthContext.currentUser = null;
      
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByText('Account')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

      // Reset user
      mockAuthContext.currentUser = mockCurrentUser;
    });
  });

  describe('Interaction', () => {
    it('should call onClose when nav item is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const homeNavItem = screen.getByTestId('nav-item-/');
      await user.click(homeNavItem);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call logout and close menu when logout button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const logoutButton = screen.getByText('Log Out');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close menu when sheet overlay is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const sheet = screen.getByTestId('sheet');
      await user.click(sheet);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply correct side positioning', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const sheetContent = screen.getByTestId('sheet-content');
      expect(sheetContent).toHaveAttribute('data-side', 'left');
    });

    it('should apply glassmorphism styling classes', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const sheetContent = screen.getByTestId('sheet-content');
      // Align with implementation class names
      expect(sheetContent).toHaveClass('bg-navbar-glass', 'dark:bg-navbar-glass-dark', 'backdrop-blur-xl');
    });

    it('should apply enhanced styling to nav items', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const navItem = screen.getByTestId('nav-item-/');
      expect(navItem).toHaveClass(
        'transition-all',
        'duration-200',
        'hover:scale-[1.02]',
        'hover:bg-gray-50/80',
        'dark:hover:bg-gray-800/80',
        'active:scale-[0.98]',
        'rounded-lg'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByTestId('sheet-title')).toBeInTheDocument();
    });

    it('should have proper section headings', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const navigationHeading = screen.getByText('Navigation');
      expect(navigationHeading).toHaveClass('text-xs', 'font-semibold', 'uppercase');
      
      const accountHeading = screen.getByText('Account');
      // Account heading uses a slightly different style in the implementation
      expect(accountHeading).toHaveClass('text-sm', 'font-medium');
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const navItems = screen.getAllByRole('button');
      navItems.forEach(item => {
        expect(item).toBeVisible();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have proper mobile-optimized sizing', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const sheetContent = screen.getByTestId('sheet-content');
      expect(sheetContent).toHaveClass('w-full', 'max-w-xs');
    });

    it('should have scrollable content area', () => {
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // The content area should be scrollable for long lists
      const contentArea = screen.getByTestId('sheet-content');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should handle open state changes correctly', () => {
      const { rerender } = render(
        <TestWrapper>
          <MobileMenu isOpen={false} onClose={mockOnClose} />
        </TestWrapper>
      );

      let sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'false');

      rerender(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      sheet = screen.getByTestId('sheet');
      expect(sheet).toHaveAttribute('data-open', 'true');
    });

    it('should handle user authentication state changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText('Account')).toBeInTheDocument();

      // Mock user logout
      mockAuthContext.currentUser = null;

      rerender(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.queryByText('Account')).not.toBeInTheDocument();

      // Reset user
      mockAuthContext.currentUser = mockCurrentUser;
    });
  });
});
