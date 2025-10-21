import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnauthorizedPage from '../UnauthorizedPage';
import ForbiddenPage from '../ForbiddenPage';
import NotFoundPage from '../NotFoundPage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Error Pages', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe('UnauthorizedPage', () => {
    it('renders unauthorized message', () => {
      render(
        <MemoryRouter>
          <UnauthorizedPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/401 - Unauthorized/i)).toBeInTheDocument();
      expect(screen.getByText(/need to be signed in/i)).toBeInTheDocument();
    });

    it('navigates to login when clicking sign in button', () => {
      render(
        <MemoryRouter>
          <UnauthorizedPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Sign In'));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('navigates to home when clicking home button', () => {
      render(
        <MemoryRouter>
          <UnauthorizedPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go to Home'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('ForbiddenPage', () => {
    it('renders forbidden message', () => {
      render(
        <MemoryRouter>
          <ForbiddenPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/403 - Forbidden/i)).toBeInTheDocument();
      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });

    it('navigates back when clicking go back button', () => {
      render(
        <MemoryRouter>
          <ForbiddenPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go Back'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates to home when clicking home button', () => {
      render(
        <MemoryRouter>
          <ForbiddenPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go to Home'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('NotFoundPage', () => {
    it('renders not found message', () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/404 - Page Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/page you're looking for/i)).toBeInTheDocument();
    });

    it('navigates back when clicking go back button', () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go Back'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates to home when clicking home button', () => {
      render(
        <MemoryRouter>
          <NotFoundPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Go to Home'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
