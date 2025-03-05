import { Badge, UserProfile } from '../types';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { getDb } from './firebase';

// Experience points configuration
export const XP_CONFIG = {
  TRADE_COMPLETION: 100,
  COLLABORATION_COMPLETION: 150,
  ENDORSEMENT_RECEIVED: 10,
  GOOD_RATING: 50,
  BADGE_EARNED: 25,
};

// Level thresholds (Fibonacci sequence for increasing difficulty)
export const LEVEL_THRESHOLDS = [0, 100, 200, 300, 500, 800, 1300, 2100, 3400, 5500];

// Available badges
export const BADGES: { [key: string]: Omit<Badge, 'earnedAt'> } = {
  FIRST_TRADE: {
    id: 'first_trade',
    name: 'Trade Pioneer',
    description: 'Completed your first trade',
    icon: 'rocket',
  },
  SKILLED_TRADER: {
    id: 'skilled_trader',
    name: 'Skilled Trader',
    description: 'Completed 10 successful trades',
    icon: 'award',
  },
  MASTER_COLLABORATOR: {
    id: 'master_collaborator',
    name: 'Master Collaborator',
    description: 'Participated in 5 successful collaborations',
    icon: 'users',
  },
  SKILL_MASTER: {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Reached level 5 in any skill',
    icon: 'star',
  },
  ENDORSED_EXPERT: {
    id: 'endorsed_expert',
    name: 'Endorsed Expert',
    description: 'Received 10 endorsements in a single skill',
    icon: 'thumbs-up',
  },
};

// Calculate level from experience
export function calculateLevel(experience: number): number {
  // Handle undefined or negative experience
  if (!experience || experience < 0) {
    return 1;
  }

  const level = LEVEL_THRESHOLDS.findIndex(
    (threshold, index) =>
      experience >= threshold &&
      (index === LEVEL_THRESHOLDS.length - 1 || experience < LEVEL_THRESHOLDS[index + 1])
  );

  // Return level 1 if no threshold was found
  return level === -1 ? 1 : level;
}

// Award experience points
export async function awardExperience(userId: string, amount: number, skills?: string[]) {
  const db = await getDb();
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    experience: increment(amount),
    level: calculateLevel(amount), // This will be calculated on the client as well
    ...(skills
      ? skills.reduce(
          (acc, skill) => ({
            ...acc,
            [`skillLevels.${skill}.experience`]: increment(amount / skills.length),
          }),
          {}
        )
      : {}),
  });
}

// Add endorsement
export async function addEndorsement(userId: string, endorserId: string, skill: string) {
  const db = await getDb();
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    [`endorsements.${skill}`]: arrayUnion(endorserId),
    experience: increment(XP_CONFIG.ENDORSEMENT_RECEIVED),
  });
}

// Award badge
export async function awardBadge(userId: string, badgeId: keyof typeof BADGES) {
  const badge: Badge = {
    ...BADGES[badgeId],
    earnedAt: new Date(),
  };

  const db = await getDb();
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    badges: arrayUnion(badge),
    experience: increment(XP_CONFIG.BADGE_EARNED),
  });
}

// Check and award badges based on user's stats
export async function checkAndAwardBadges(userId: string, profile: UserProfile) {
  // First Trade Badge
  if (profile.experience >= XP_CONFIG.TRADE_COMPLETION && 
      !profile.badges?.some(b => b.id === 'first_trade')) {
    await awardBadge(userId, 'FIRST_TRADE');
  }

  // Skilled Trader Badge (requires trade count from separate query)
  // Implementation would go here...

  // Skill Master Badge
  const hasSkillMaster = Object.values(profile.skillLevels || {}).some(
    skill => skill.level >= 5
  );
  if (hasSkillMaster && !profile.badges?.some(b => b.id === 'skill_master')) {
    await awardBadge(userId, 'SKILL_MASTER');
  }

  // Endorsed Expert Badge
  const hasEndorsedExpert = Object.values(profile.endorsements || {}).some(
    endorsers => endorsers.length >= 10
  );
  if (hasEndorsedExpert && !profile.badges?.some(b => b.id === 'endorsed_expert')) {
    await awardBadge(userId, 'ENDORSED_EXPERT');
  }
}
