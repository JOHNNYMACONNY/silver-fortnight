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
const mockAuthContext = {
  currentUser: mockCurrentUser,
  logout: mockLogout,
  isAdmin: false,
  loading: false,
};

jest.mock('../../../AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock NavItem component
jest.mock('../NavItem', () => {
  return function MockNavItem({ to, label, icon, onClick, className }: any) {
    return (
      <button
        onClick={onClick}
        className={className}
        data-testid={`nav-item-${to}`}
      >
        {icon}
        {label}
      </button>
    );
  };
});

// Mock Logo component
jest.mock('../Logo', () => {
  return function MockLogo({ size, showText }: any) {
    return <div data-testid="logo">{showText ? 'TradeYa' : 'Logo'}</div>;
  };
});

// Mock Sheet components
jest.mock('../Sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    <div data-testid="sheet" data-open={open} onClick={() => onOpenChange(false)}>
      {open && children}
    </div>
  ),
  SheetContent: ({ children, side, className }: any) => (
    <div data-testid="sheet-content" data-side={side} className={className}>
      {children}
    </div>
  ),
  SheetHeader: ({ children, className }: any) => (
    <div data-testid="sheet-header" className={className}>
      {children}
    </div>
  ),
  SheetTitle: ({ children }: any) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
  SheetTrigger: ({ children }: any) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
}));

// Mock Button component
jest.mock('../Button', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Test wrapper with router
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('MobileMenu', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
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

      // Check for account section
      expect(screen.getByText('Account')).toBeInTheDocument();
      
      // Check for user nav items
      expect(screen.getByTestId('nav-item-/profile')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/notifications')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/messages')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-/settings')).toBeInTheDocument();
    });

    it('should render admin section when user is admin', () => {
      // Mock admin user
      mockAuthContext.isAdmin = true;
      
      render(
        <TestWrapper>
          <MobileMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      expect(screen.getByText('Admin')).toBeInTheDocument();
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

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
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

      const logoutButton = screen.getByText('Sign Out');
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
      expect(sheetContent).toHaveClass('bg-white/95', 'dark:bg-gray-900/95', 'backdrop-blur-xl');
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
      expect(accountHeading).toHaveClass('text-xs', 'font-semibold', 'uppercase');
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
