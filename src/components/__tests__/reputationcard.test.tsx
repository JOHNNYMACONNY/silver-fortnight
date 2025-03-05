import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ReputationCard } from '../ReputationCard';
import { UserProfile } from '../../types';

// Mock profile data
const mockProfile: UserProfile = {
  id: 'test123',
  email: 'test@example.com',
  displayName: 'Test User',
  bio: 'Test bio',
  skills: ['React', 'TypeScript'],
  portfolio: '',
  experience: 0,
  level: 1,
  badges: [],
  endorsements: {},
  skillLevels: {},
  activeQuests: [],
  completedQuests: [],
  challengeProgress: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('ReputationCard', () => {
  it('shows Level 1 for 0 XP', () => {
    render(<ReputationCard profile={mockProfile} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });

  it('shows Level 1 for undefined XP', () => {
    const profileWithUndefinedXP = { ...mockProfile, experience: undefined };
    render(<ReputationCard profile={profileWithUndefinedXP as UserProfile} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });

  it('shows Level 1 for negative XP', () => {
    const profileWithNegativeXP = { ...mockProfile, experience: -100 };
    render(<ReputationCard profile={profileWithNegativeXP} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });

  it('shows correct XP progress', () => {
    const profileWithXP = { ...mockProfile, experience: 50 };
    render(<ReputationCard profile={profileWithXP} />);
    expect(screen.getByText('50 / 100 XP')).toBeInTheDocument();
  });

  it('handles missing skill levels gracefully', () => {
    const profileWithoutSkills = { ...mockProfile, skillLevels: undefined };
    render(<ReputationCard profile={profileWithoutSkills as UserProfile} />);
    // Should render without errors
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });
});