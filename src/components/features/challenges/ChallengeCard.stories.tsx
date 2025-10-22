import type { Meta, StoryObj } from '@storybook/react';
import { ChallengeCard } from './ChallengeCard';
import type { Challenge } from '../../../types/gamification';

const meta: Meta<typeof ChallengeCard> = {
  title: 'Features/Challenges/ChallengeCard',
  component: ChallengeCard,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChallengeCard>;

const baseChallenge: Challenge = {
  id: 'challenge-1',
  title: 'Build a Responsive Portfolio',
  description:
    'Create a modern, responsive portfolio using React and Tailwind. Include at least 3 projects and an about section.',
  type: 'solo' as any,
  category: 'development' as any,
  difficulty: 'intermediate' as any,
  requirements: [],
  rewards: { xp: 200 },
  startDate: { toDate: () => new Date() } as any,
  endDate: { toDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } as any,
  status: 'active' as any,
  participantCount: 42,
  completionCount: 10,
  instructions: [],
  objectives: [],
  timeEstimate: '2-4 hours',
  tags: ['react', 'tailwind', 'responsive'],
  createdBy: 'user-1',
  createdAt: { toDate: () => new Date() } as any,
  updatedAt: { toDate: () => new Date() } as any,
};

export const Default: Story = {
  args: {
    challenge: baseChallenge,
  },
};

export const WithFooterCTA: Story = {
  args: {
    challenge: baseChallenge,
    footer: (
      <div className="flex items-center justify-between">
        <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-medium text-primary hover:underline">
          View Details
        </a>
        <button className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground">Join</button>
      </div>
    ),
  },
};

export const LongContent: Story = {
  args: {
    challenge: {
      ...baseChallenge,
      title: 'Create a Full-Stack Application with Authentication, Authorization, and Payments',
      description:
        'Build a full-stack app with robust auth (email/OAuth), role-based access control, subscription billing, feature flags, and CI/CD. Optimize performance and ensure accessibility.',
      tags: ['react', 'typescript', 'firebase', 'stripe', 'a11y', 'performance', 'testing'],
    },
  },
};

export const WithRecommendation: Story = {
  args: {
    challenge: baseChallenge,
    recommendation: {
      challenge: baseChallenge,
      score: 86,
      reasons: ['Matches your React skills', 'Fits your preferred difficulty'],
      matchedSkills: ['react', 'tailwind'],
      difficultyMatch: 'perfect',
      estimatedCompletionTime: '2-4 hours',
    },
  },
};

