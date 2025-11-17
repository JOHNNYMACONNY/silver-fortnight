// Three-Tier Challenge Flow Components
// Shows how Solo → Trade → Collaboration challenges work together

import React, { useState, useEffect } from 'react';
import { ChallengeType, type Challenge } from '../types/gamification';
import Box from './layout/primitives/Box';
import Stack from './layout/primitives/Stack';
import Grid from './layout/primitives/Grid';
import Cluster from './layout/primitives/Cluster';
import { AICodeReviewInterface } from './challenges/AICodeReviewInterface';
import { AICodeReview } from '../services/ai/codeReviewService';
import { logger } from '@utils/logging/logger';

// Main challenge dashboard showing progression through tiers
export const ChallengeProgressionDashboard: React.FC = () => {
  const [userProgress, setUserProgress] = useState<UserChallengeProgress | null>(null);
  const [recommendedChallenges, setRecommendedChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    loadUserProgress();
    loadRecommendations();
  }, []);

  return (
    <Stack gap="lg" className="challenge-dashboard">
      <ProgressionHeader progress={userProgress} />
      <RecommendedChallenges challenges={recommendedChallenges} />
    </Stack>
  );
};

// Shows user's progression through the three tiers
const ProgressionHeader: React.FC<{ progress: UserChallengeProgress | null }> = ({ progress }) => {
  if (!progress) return <Box>Loading...</Box>;

  return (
    <Stack gap="lg" className="progression-header">
      <h1>Your Challenge Journey</h1>
      <Grid columns={{ base: 1, md: 3 }} gap="md" className="tier-progress">
        <TierProgressCard
          tier="Solo"
          icon="🎯"
          completed={progress.solo.completed}
          total={progress.solo.available}
          unlocked={true}
          description="Build individual skills"
        />
        <TierProgressCard
          tier="Trade"
          icon="🤝"
          completed={progress.trade.completed}
          total={progress.trade.available}
          unlocked={progress.trade.unlocked}
          description="Exchange skills with others"
        />
        <TierProgressCard
          tier="Collaboration"
          icon="👥"
          completed={progress.collaboration.completed}
          total={progress.collaboration.available}
          unlocked={progress.collaboration.unlocked}
          description="Work on team projects"
        />
      </Grid>
    </Stack>
  );
};

const TierProgressCard: React.FC<{
  tier: string;
  icon: string;
  completed: number;
  total: number;
  unlocked: boolean;
  description: string;
}> = ({ tier, icon, completed, total, unlocked, description }) => {
  return (
    <Box className={`tier-card ${unlocked ? 'unlocked' : 'locked'}`}>
      <Stack gap="sm" align="center">
        <Box className="tier-icon">{icon}</Box>
        <h3>{tier}</h3>
        <p>{description}</p>
        {unlocked ? (
          <Stack gap="xs" className="progress">
            <Box className="progress-bar">
              <Box
                className="progress-fill"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </Box>
            <span>{completed}/{total} completed</span>
          </Stack>
        ) : (
          <Box className="locked-state">
            <span>🔒 Complete previous tier to unlock</span>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

// Solo Challenge Components
export const SoloChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const [started, setStarted] = useState(false);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [currentReview, setCurrentReview] = useState<AICodeReview | null>(null);

  const handleReviewComplete = (review: AICodeReview) => {
    setCurrentReview(review);
    // Could trigger challenge completion logic here based on review score
    if (review.overallScore >= 70) {
      // Auto-complete challenge if score is good enough
      logger.debug('Challenge completed with good score!', 'COMPONENT');
    }
  };

  if (showCodeReview) {
    return (
      <Box className="solo-challenge-review">
        <AICodeReviewInterface
          challengeId={challenge.id}
          userId="current-user" // Would come from auth context
          language="javascript" // Would be determined by challenge
          onReviewComplete={handleReviewComplete}
        />
        <button
          className="btn-secondary"
          onClick={() => setShowCodeReview(false)}
          style={{ marginTop: '1rem' }}
        >
          ← Back to Challenge
        </button>
      </Box>
    );
  }

  return (
    <Box className="solo-challenge-card">
      <Stack gap="md">
        <Stack gap="sm" className="challenge-header">
          <h3>{challenge.title}</h3>
           <Cluster gap="sm" className="challenge-meta">
            <span className="difficulty">📊 {challenge.difficulty}</span>
            {challenge.timeEstimate && (
              <span className="duration">⏱️ {challenge.timeEstimate}</span>
            )}
            <span className="type">🎯 Solo Challenge</span>
          </Cluster>
        </Stack>

        <p className="challenge-description">{challenge.description}</p>

         {challenge.tags && challenge.tags.length > 0 && (
          <Stack gap="xs" className="skills-section">
            <h4>Skills you'll develop:</h4>
            <Cluster gap="xs" wrap={true} className="skill-tags">
              {challenge.tags.map((skill) => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </Cluster>
          </Stack>
        )}

         {/* Config is not part of base Challenge type; hide if unavailable */}
        {'config' in (challenge as any) && (challenge as any).config?.deliverables && (
          <Stack gap="xs" className="deliverables">
            <h4>What you'll create:</h4>
            <ul>
              {(challenge as any).config.deliverables.map((deliverable: string, index: number) => (
                <li key={index}>{deliverable}</li>
              ))}
            </ul>
          </Stack>
        )}

        {'config' in (challenge as any) && (challenge as any).config?.aiMentor?.enabled && (
          <Stack gap="xs" className="ai-mentor-info">
            <h4>🤖 AI Mentor Included</h4>
            <p>Get personalized guidance and feedback throughout your challenge</p>
          </Stack>
        )}

        <Stack gap="sm" className="challenge-actions">
          <button
            className="btn-primary challenge-action"
            onClick={() => setStarted(true)}
          >
            {started ? 'Continue Challenge' : 'Start Challenge'}
          </button>

          {started && (
            <button
              className="btn-secondary challenge-action"
              onClick={() => setShowCodeReview(true)}
            >
              🧠 Submit for AI Review
            </button>
          )}
        </Stack>

        {currentReview && (
          <Stack gap="xs" className="review-summary">
            <h4>Latest Review:</h4>
            <p>Score: {currentReview.overallScore}/100 ({currentReview.estimatedSkillLevel})</p>
            <p>{currentReview.strengths[0] || 'Keep up the good work!'}</p>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

// Trade Challenge Components
export const TradeChallengeCard: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <Box className="trade-challenge-card">
      <Stack gap="md">
        <Cluster justify="between" align="center" className="challenge-header">
          <h3>{challenge.title}</h3>
          <span className="challenge-type">🤝 Trade Challenge</span>
        </Cluster>

        <p className="challenge-description">{challenge.description}</p>

        <Grid columns={{ base: 1, md: 2 }} gap="md" className="trade-structure">
          <Stack gap="xs" className="trade-side">
            <h4>Person A teaches:</h4>
            <span className="skill-teach">{(challenge as any).config?.tradeStructure?.participant1?.teaches || '—'}</span>
            <h4>Person A learns:</h4>
            <span className="skill-learn">{(challenge as any).config?.tradeStructure?.participant1?.learns || '—'}</span>
          </Stack>

          <Box className="trade-arrow">↔️</Box>

          <Stack gap="xs" className="trade-side">
            <h4>Person B teaches:</h4>
            <span className="skill-teach">{(challenge as any).config?.tradeStructure?.participant2?.teaches || '—'}</span>
            <h4>Person B learns:</h4>
            <span className="skill-learn">{(challenge as any).config?.tradeStructure?.participant2?.learns || '—'}</span>
          </Stack>
        </Grid>

        <Stack gap="xs" className="trade-details">
          <Cluster justify="between" className="detail-item">
            <span className="label">Time Estimate:</span>
            <span className="value">{challenge.timeEstimate || '—'}</span>
          </Cluster>
          <Cluster justify="between" className="detail-item">
            <span className="label">Format:</span>
            <span className="value">{(challenge as any).config?.exchangeFormat || '—'}</span>
          </Cluster>
          <Cluster justify="between" className="detail-item">
            <span className="label">Time Commitment:</span>
            <span className="value">{(challenge as any).config?.tradeStructure?.participant1?.timeCommitment || '—'}</span>
          </Cluster>
        </Stack>

        <button
          className="btn-primary challenge-action"
          onClick={() => setShowJoinModal(true)}
        >
          Join Trade Challenge
        </button>

        {showJoinModal && (
          <TradeJoinModal
            challenge={challenge}
            onClose={() => setShowJoinModal(false)}
          />
        )}
      </Stack>
    </Box>
  );
};

const TradeJoinModal: React.FC<{
  challenge: Challenge;
  onClose: () => void;
}> = ({ challenge, onClose }) => {
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);

  return (
    <Box className="modal-overlay">
      <Stack gap="lg" className="trade-join-modal">
        <h3>Join {challenge.title}</h3>

        <p>Choose which side of the trade you'd like to participate in:</p>

        <Grid columns={{ base: 1, md: 2 }} gap="md" className="trade-options">
          <Box
            className={`trade-option ${selectedSide === 'A' ? 'selected' : ''}`}
            onClick={() => setSelectedSide('A')}
          >
            <Stack gap="xs">
              <h4>Option A</h4>
              <p><strong>You teach:</strong> {(challenge as any).config?.tradeStructure?.participant1?.teaches || '—'}</p>
              <p><strong>You learn:</strong> {(challenge as any).config?.tradeStructure?.participant1?.learns || '—'}</p>
            </Stack>
          </Box>

          <Box
            className={`trade-option ${selectedSide === 'B' ? 'selected' : ''}`}
            onClick={() => setSelectedSide('B')}
          >
            <Stack gap="xs">
              <h4>Option B</h4>
              <p><strong>You teach:</strong> {(challenge as any).config?.tradeStructure?.participant2?.teaches || '—'}</p>
              <p><strong>You learn:</strong> {(challenge as any).config?.tradeStructure?.participant2?.learns || '—'}</p>
            </Stack>
          </Box>
        </Grid>

        <Cluster gap="sm" justify="end" className="modal-actions">
          <button 
            className="btn-primary"
            disabled={!selectedSide}
            onClick={() => handleJoinTrade(challenge.id, selectedSide!)}
          >
            Join as Option {selectedSide}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </Cluster>
      </Stack>
    </Box>
  );
};

// Challenge Recommendation Engine
const RecommendedChallenges: React.FC<{ challenges: Challenge[] }> = ({ challenges }) => {
  const [activeTab, setActiveTab] = useState<'solo' | 'trade' | 'collaboration'>('solo');
  
  const challengesByType = {
    solo: challenges.filter(c => c.type === ChallengeType.SOLO),
    trade: challenges.filter(c => c.type === ChallengeType.TRADE),
    collaboration: challenges.filter(c => c.type === ChallengeType.COLLABORATION)
  };

  return (
    <Stack gap="lg" className="recommended-challenges">
      <h2>Recommended for You</h2>

      <Cluster gap="sm" className="challenge-tabs">
        <button
          className={`tab ${activeTab === 'solo' ? 'active' : ''}`}
          onClick={() => setActiveTab('solo')}
        >
          🎯 Solo ({challengesByType.solo.length})
        </button>
        <button
          className={`tab ${activeTab === 'trade' ? 'active' : ''}`}
          onClick={() => setActiveTab('trade')}
        >
          🤝 Trade ({challengesByType.trade.length})
        </button>
        <button
          className={`tab ${activeTab === 'collaboration' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaboration')}
        >
          👥 Collaboration ({challengesByType.collaboration.length})
        </button>
      </Cluster>

      <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg" className="challenge-grid">
        {activeTab === 'solo' && challengesByType.solo.map(challenge => (
          <div key={challenge.id}>{challenge.title}</div>
        ))}
        {activeTab === 'trade' && challengesByType.trade.map(challenge => (
          <div key={challenge.id}>{challenge.title}</div>
        ))}
        {activeTab === 'collaboration' && challengesByType.collaboration.map(challenge => (
          <div key={challenge.id}>{challenge.title}</div>
        ))}
      </Grid>
    </Stack>
  );
};

// Smart progression flow
export const ChallengeUnlockNotification: React.FC<{ 
  newTierUnlocked: 'trade' | 'collaboration' 
}> = ({ newTierUnlocked }) => {
  const [showCelebration, setShowCelebration] = useState(true);

  const tierInfo = {
    trade: {
      icon: '🤝',
      title: 'Trade Challenges Unlocked!',
      description: 'You can now exchange skills with other learners',
      benefit: 'Learn faster through skill swapping'
    },
    collaboration: {
      icon: '👥', 
      title: 'Collaboration Challenges Unlocked!',
      description: 'Join team projects and build real-world applications',
      benefit: 'Gain experience working in teams'
    }
  };

  const info = tierInfo[newTierUnlocked];

  if (!showCelebration) return null;

  return (
    <Box className="unlock-notification-overlay">
      <Stack gap="lg" className="unlock-notification">
        <Stack gap="sm" align="center" className="celebration-header">
          <Box className="celebration-icon">{info.icon}</Box>
          <h2>{info.title}</h2>
          <p>{info.description}</p>
        </Stack>

        <Stack gap="xs" className="unlock-benefits">
          <h3>New opportunities:</h3>
          <p>✨ {info.benefit}</p>
          <p>🎯 Access to new skill development paths</p>
          <p>🏆 Unlock new achievements and rewards</p>
        </Stack>

        <Cluster gap="sm" justify="center" className="unlock-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setShowCelebration(false);
              // Navigate to new tier
            }}
          >
            Explore {newTierUnlocked} Challenges
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowCelebration(false)}
          >
            Maybe Later
          </button>
        </Cluster>
      </Stack>
    </Box>
  );
};

// Types for the components
interface UserChallengeProgress {
  solo: {
    completed: number;
    available: number;
    unlocked: boolean;
  };
  trade: {
    completed: number;
    available: number;
    unlocked: boolean;
  };
  collaboration: {
    completed: number;
    available: number;
    unlocked: boolean;
  };
}

// Helper functions
async function loadUserProgress(): Promise<UserChallengeProgress> {
  // Implementation would fetch user's actual progress
  return {} as UserChallengeProgress;
}

async function loadRecommendations(): Promise<Challenge[]> {
  // AI-powered recommendation system
  return [] as Challenge[];
}

async function handleJoinTrade(challengeId: string, side: 'A' | 'B'): Promise<void> {
  // Implementation to join trade challenge
}

// Example challenge data generation
export const generateExampleChallenges = (): Challenge[] => {
  return [
    // Solo challenges
    {
      id: 'solo-1',
      type: 'solo',
      title: 'Master React Hooks in 7 Days',
      description: 'Build three mini-projects while learning useState, useEffect, and custom hooks',
      skills: ['React', 'JavaScript', 'Frontend'],
      difficulty: 'beginner',
      duration: '1 week',
      config: {
        deliverables: [
          'Todo app with useState',
          'Data fetching app with useEffect', 
          'Custom hook for form validation'
        ],
        aiMentor: {
          enabled: true,
          personalityType: 'encouraging',
          checkInFrequency: 'daily'
        },
        validation: {
          type: 'ai',
          criteria: ['Code quality', 'Functionality', 'Best practices']
        }
      }
    } as any,
    
    // Trade challenges
    {
      id: 'trade-1',
      type: 'trade',
      title: 'Code for Design: React ↔ Figma',
      description: 'Exchange React development skills for UI/UX design skills',
      skills: ['React', 'UI/UX', 'Figma'],
      difficulty: 'intermediate',
      duration: '3 weeks',
      config: {
        tradeStructure: {
          participant1: {
            teaches: 'React Components & State Management',
            learns: 'UI/UX Design Principles & Figma',
            timeCommitment: '2 hours/week'
          },
          participant2: {
            teaches: 'UI/UX Design & Figma Prototyping',
            learns: 'React Development & Frontend',
            timeCommitment: '2 hours/week'
          }
        },
        exchangeFormat: 'skill-pairing',
        meetingStructure: {
          frequency: '2 sessions/week',
          duration: '1 hour each',
          format: 'video call + hands-on practice'
        }
      }
    } as any,

    // Collaboration challenges  
    {
      id: 'collab-1',
      type: 'collaboration',
      title: 'Build a Local Business Website',
      description: 'Work with a team to create a real website for a local business',
      skills: ['Web Development', 'Design', 'Project Management'],
      difficulty: 'intermediate',
      duration: '6 weeks',
      config: {
        teamStructure: {
          minMembers: 3,
          maxMembers: 5,
          requiredRoles: ['Leader', 'Contributor', 'Contributor'],
          skillDiversity: ['Frontend', 'Design', 'Content', 'Project Management']
        },
        projectScope: {
          complexity: 'moderate',
          duration: '6 weeks',
          realWorldImpact: true,
          clientInvolved: true
        },
        deliverables: [
          'Project plan and timeline',
          'Design mockups and user flow',
          'Fully functional website',
          'Content strategy and implementation',
          'Client presentation and handoff'
        ]
      }
    } as any
  ];
};
