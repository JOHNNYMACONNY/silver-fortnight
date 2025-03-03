import { Challenge, Quest, UserProfile } from '../types';
import { doc, collection, addDoc, updateDoc, increment, arrayUnion, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { getDb } from './firebase';
import { awardExperience, awardBadge } from './reputation';

// Challenge Templates
export const WEEKLY_CHALLENGES: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'participants' | 'completions'>[] = [
  {
    title: 'Skill Exchange Master',
    description: 'Complete 3 trades within a week',
    type: 'weekly',
    requirements: [{ type: 'trades', count: 3 }],
    rewards: { xp: 300 }
  },
  {
    title: 'Community Builder',
    description: 'Join or create 2 collaboration projects',
    type: 'weekly',
    requirements: [{ type: 'collaborations', count: 2 }],
    rewards: { xp: 250 }
  },
  {
    title: 'Skill Endorser',
    description: 'Endorse 5 different users\' skills',
    type: 'weekly',
    requirements: [{ type: 'endorsements', count: 5 }],
    rewards: { xp: 200 }
  }
];

export const MONTHLY_CHALLENGES: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'participants' | 'completions'>[] = [
  {
    title: 'Full Stack Developer',
    description: 'Complete trades involving both frontend and backend skills',
    type: 'monthly',
    requirements: [
      { type: 'skills', count: 2, skillCategory: 'frontend' },
      { type: 'skills', count: 2, skillCategory: 'backend' }
    ],
    rewards: {
      xp: 1000,
      badge: 'full_stack_master'
    }
  },
  {
    title: 'Project Leader',
    description: 'Successfully complete 3 collaboration projects as leader',
    type: 'monthly',
    requirements: [{ type: 'collaborations', count: 3 }],
    rewards: {
      xp: 800,
      badge: 'project_leader'
    }
  }
];

// Quest Templates
export const QUEST_CHAINS: Omit<Quest, 'id' | 'userId' | 'startedAt' | 'completedAt' | 'expiresAt'>[] = [
  {
    title: 'Web Development Journey',
    description: 'Master the art of web development through a series of trades and collaborations',
    steps: [
      {
        id: 'html_css',
        description: 'Complete a trade involving HTML/CSS skills',
        type: 'trade',
        requirement: { count: 1, skillCategory: 'frontend' },
        completed: false
      },
      {
        id: 'javascript',
        description: 'Complete a trade involving JavaScript',
        type: 'trade',
        requirement: { count: 1, skillCategory: 'javascript' },
        completed: false
      },
      {
        id: 'framework',
        description: 'Join a collaboration project using a modern framework',
        type: 'collaboration',
        requirement: { count: 1, skillCategory: 'framework' },
        completed: false
      }
    ],
    rewards: {
      xp: 500,
      badge: 'web_developer'
    }
  }
];

// Create a new weekly challenge
export async function createWeeklyChallenge() {
  const template = WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

  await addDoc(collection(await getDb(), 'challenges'), {
    ...template,
    startDate: now,
    endDate,
    participants: [],
    completions: []
  });
}

// Create a new monthly challenge
export async function createMonthlyChallenge() {
  const template = MONTHLY_CHALLENGES[Math.floor(Math.random() * MONTHLY_CHALLENGES.length)];
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // End of current month

  await addDoc(collection(await getDb(), 'challenges'), {
    ...template,
    startDate: now,
    endDate,
    participants: [],
    completions: []
  });
}

// Start a quest chain for a user
export async function startQuestChain(userId: string, questTemplate: typeof QUEST_CHAINS[0]) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days to complete

  const db = await getDb();
  const questRef = await addDoc(collection(db, 'quests'), {
    ...questTemplate,
    userId,
    startedAt: now,
    expiresAt
  });

  // Add quest to user's active quests
  await updateDoc(doc(await getDb(), 'users', userId), {
    activeQuests: arrayUnion(questRef.id)
  });

  return questRef.id;
}

// Join a challenge
export async function joinChallenge(userId: string, challengeId: string) {
  const db = await getDb();
  const challengeRef = doc(db, 'challenges', challengeId);
  await updateDoc(challengeRef, {
    participants: arrayUnion(userId)
  });

  // Initialize challenge progress for user
  await updateDoc(doc(await getDb(), 'users', userId), {
    [`challengeProgress.${challengeId}`]: {
      progress: 0,
      completed: false,
      claimedRewards: false
    }
  });
}

// Update challenge progress
export async function updateChallengeProgress(
  userId: string,
  challengeId: string,
  progress: number
) {
  await updateDoc(doc(await getDb(), 'users', userId), {
    [`challengeProgress.${challengeId}.progress`]: progress
  });
}

// Complete a challenge
export async function completeChallenge(userId: string, challengeId: string) {
  const db = await getDb();
  const challengeRef = doc(db, 'challenges', challengeId);
  await updateDoc(challengeRef, {
    completions: arrayUnion(userId)
  });

  await updateDoc(doc(await getDb(), 'users', userId), {
    [`challengeProgress.${challengeId}.completed`]: true
  });
}

// Claim challenge rewards
export async function claimChallengeRewards(userId: string, challenge: Challenge) {
  // Award XP
  await awardExperience(userId, challenge.rewards.xp);

  // Award badge if any
  if (challenge.rewards.badge) {
    await awardBadge(userId, challenge.rewards.badge as any);
  }

  // Mark rewards as claimed
  await updateDoc(doc(await getDb(), 'users', userId), {
    [`challengeProgress.${challenge.id}.claimedRewards`]: true
  });
}

// Update quest progress
export async function updateQuestProgress(
  userId: string,
  questId: string,
  stepId: string
) {
  const db = await getDb();
  const questRef = doc(db, 'quests', questId);
  await updateDoc(questRef, {
    'steps.$[step].completed': true
  }, {
    arrayFilters: [{ 'step.id': stepId }]
  });

  // Check if all steps are completed
  const questDoc = await getDocs(query(
    collection(await getDb(), 'quests'),
    where('id', '==', questId)
  ));

  const quest = questDoc.docs[0].data() as Quest;
  if (quest.steps.every(step => step.completed)) {
    await completeQuest(userId, questId, quest);
  }
}

// Complete a quest
async function completeQuest(userId: string, questId: string, quest: Quest) {
  // Update quest completion
  await updateDoc(doc(await getDb(), 'quests', questId), {
    completedAt: new Date()
  });

  // Update user profile
  await updateDoc(doc(await getDb(), 'users', userId), {
    activeQuests: arrayUnion(questId),
    completedQuests: arrayUnion(questId)
  });

  // Award rewards
  await awardExperience(userId, quest.rewards.xp);
  if (quest.rewards.badge) {
    await awardBadge(userId, quest.rewards.badge as any);
  }
}
