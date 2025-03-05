import { doc, updateDoc, arrayUnion, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getDb } from './firebase';
import { showSuccess, showError } from './alerts';
import type { Challenge } from '../types';

export async function joinChallenge(userId: string, challengeId: string) {
  try {
    const db = await getDb();
    await updateDoc(doc(db, 'challenges', challengeId), {
      participants: arrayUnion(userId),
      updatedAt: new Date()
    });
    await showSuccess('Challenge Joined', 'You have successfully joined the challenge!');
  } catch (err) {
    await showError('Join Failed', 'Unable to join the challenge. Please try again.');
    throw err;
  }
}

export async function claimChallengeRewards(userId: string, challenge: Challenge) {
  try {
    const db = await getDb();
    const userRef = doc(db, 'users', userId);
    
    // Get current user data
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data();
    
    // Calculate new XP
    const currentXp = userData.xp || 0;
    const newXp = currentXp + challenge.rewards.xp;
    
    // Calculate new level (example: every 1000 XP is a level)
    const newLevel = Math.floor(newXp / 1000);
    
    // Update user document
    await updateDoc(userRef, {
      xp: newXp,
      level: newLevel,
      [`challengeProgress.${challenge.id}.claimedRewards`]: true,
      completedChallenges: arrayUnion(challenge.id),
      updatedAt: new Date()
    });

    await showSuccess('Rewards Claimed', `You earned ${challenge.rewards.xp} XP!`);
  } catch (err) {
    await showError('Claim Failed', 'Unable to claim rewards. Please try again.');
    throw err;
  }
}

export async function regenerateChallenge(challengeId: string) {
  try {
    const db = await getDb();
    const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
    
    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found');
    }

    const challenge = challengeDoc.data() as Challenge;

    // Create a new AI task to regenerate the challenge
    await addDoc(collection(db, 'ai-tasks'), {
      type: 'regenerate-challenge',
      challengeId: challengeId,
      challengeType: challenge.type,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update the challenge to mark it as being regenerated
    await updateDoc(doc(db, 'challenges', challengeId), {
      status: 'regenerating',
      updatedAt: new Date()
    });

    await showSuccess(
      'Challenge Regeneration Started',
      'The challenge is being regenerated and will be updated soon.'
    );
  } catch (err) {
    await showError(
      'Regeneration Failed',
      'Unable to start challenge regeneration. Please try again.'
    );
    throw err;
  }
}
