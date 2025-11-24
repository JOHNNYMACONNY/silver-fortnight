/**
 * useUserPersonalization Hook Tests
 * 
 * Tests for the useUserPersonalization hook that determines
 * user type and provides personalization data.
 */

import { renderHook } from '@testing-library/react';
import { useUserPersonalization } from '../useUserPersonalization';
import { useAuth } from '../../../AuthContext';

// Mock useAuth
jest.mock('../../../AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useUserPersonalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('No User', () => {
    it('should return new user type for no user', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        userProfile: null,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('new');
      expect(result.current.userProfile).toBeNull();
      expect(result.current.tradeCount).toBe(0);
      expect(result.current.profileCompleteness).toBe(0);
      expect(result.current.activityLevel).toBe('low');
    });
  });

  describe('New User', () => {
    it('should return new user type for user without profile', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123', email: 'test@example.com' },
        userProfile: null,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('new');
      expect(result.current.tradeCount).toBe(0);
      expect(result.current.profileCompleteness).toBe(0);
      expect(result.current.activityLevel).toBe('low');
    });

    it('should return new user type for low trade count', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          tradesCreated: ['trade1', 'trade2'],
          displayName: 'Test User',
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('new');
      expect(result.current.tradeCount).toBe(2);
      expect(result.current.activityLevel).toBe('medium');
    });

    it('should return new user type for low profile completeness', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          displayName: 'Test User',
          // Missing: bio, photo, skills, location
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('new');
      expect(result.current.profileCompleteness).toBe(20); // 1/5 fields
    });
  });

  describe('Regular User', () => {
    it('should return regular user type for moderate trade count', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          tradesCreated: Array.from({ length: 5 }, (_, i) => `trade${i}`),
          displayName: 'Test User',
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('regular');
      expect(result.current.tradeCount).toBe(5);
      expect(result.current.activityLevel).toBe('high');
    });

    it('should return regular user type for moderate profile completeness', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          displayName: 'Test User',
          bio: 'Test bio',
          profilePicture: 'https://example.com/photo.jpg',
          skills: ['React', 'TypeScript'],
          // Missing: location
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('regular');
      expect(result.current.profileCompleteness).toBe(80); // 4/5 fields
    });
  });

  describe('Power User', () => {
    it('should return power user type for high trade count', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          tradesCreated: Array.from({ length: 15 }, (_, i) => `trade${i}`),
          displayName: 'Test User',
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('power');
      expect(result.current.tradeCount).toBe(15);
      expect(result.current.activityLevel).toBe('high');
    });

    it('should return power user type for high profile completeness', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          displayName: 'Test User',
          bio: 'Test bio',
          profilePicture: 'https://example.com/photo.jpg',
          skills: ['React', 'TypeScript', 'Node.js'],
          location: 'San Francisco, CA',
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.userType).toBe('power');
      expect(result.current.profileCompleteness).toBe(100); // 5/5 fields
    });
  });

  describe('Profile Completeness Calculation', () => {
    it('should calculate completeness correctly for all fields', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          displayName: 'Test User',
          bio: 'Test bio',
          profilePicture: 'https://example.com/photo.jpg',
          skills: ['React'],
          location: 'San Francisco',
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.profileCompleteness).toBe(100);
    });

    it('should handle photoURL as alternative to profilePicture', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.profileCompleteness).toBe(40); // 2/5 fields
    });

    it('should handle empty arrays as incomplete', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          displayName: 'Test User',
          skills: [],
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.profileCompleteness).toBe(20); // 1/5 fields (skills array is empty)
    });
  });

  describe('Activity Level Calculation', () => {
    it('should return low activity for 0-1 trades', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          tradesCreated: [],
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.activityLevel).toBe('low');
    });

    it('should return medium activity for 2-5 trades', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          tradesCreated: ['trade1', 'trade2', 'trade3'],
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.activityLevel).toBe('medium');
    });

    it('should return high activity for 6+ trades', () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user123' },
        userProfile: {
          tradesCreated: Array.from({ length: 6 }, (_, i) => `trade${i}`),
        } as any,
        loading: false,
      } as any);

      const { result } = renderHook(() => useUserPersonalization());

      expect(result.current.activityLevel).toBe('high');
    });
  });
});

