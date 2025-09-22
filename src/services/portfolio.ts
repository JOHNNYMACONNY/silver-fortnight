// src/services/portfolio.ts

import { PortfolioItem } from '../types/portfolio';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getSyncFirebaseDb } from '../firebase-config';

interface GetUserPortfolioItemsOptions {
  onlyVisible?: boolean;
  type?: 'trade' | 'collaboration';
  featured?: boolean;
  category?: string;
}

export async function getUserPortfolioItems(
  userId: string,
  options?: GetUserPortfolioItemsOptions
): Promise<PortfolioItem[]> {
  try {
    const db = getSyncFirebaseDb();
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    let q: any = query(portfolioRef);

    if (options?.onlyVisible) {
      q = query(q, where('visible', '==', true));
    }
    if (options?.type) {
      q = query(q, where('sourceType', '==', options.type));
    }
    if (options?.featured) {
      q = query(q, where('featured', '==', true));
    }
    if (options?.category) {
      q = query(q, where('category', '==', options.category));
    }

    q = query(q, orderBy('pinned', 'desc'), orderBy('completedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...(data && typeof data === 'object' ? data : {}) } as PortfolioItem;
    });
  } catch (err) {
    // Optionally log error
    return [];
  }
}

/**
 * Generate a portfolio item from a completed trade.
 * Call this when a trade is confirmed as completed.
 * @param trade - The completed trade object
 * @param userId - The user for whom to create the portfolio item
 * @param isCreator - Whether the user is the trade creator (affects skills field)
 * @param defaultVisibility - Default visibility for the new item
 * @returns Promise with success and error fields
 */
export async function generateTradePortfolioItem(
  trade: {
    id: string;
    title: string;
    description: string;
    offeredSkills: string[];
    requestedSkills: string[];
    completionConfirmedAt?: any;
    updatedAt?: any;
    completionEvidence?: any[];
    creatorId: string;
    participantId: string;
    creatorName?: string;
    participantPhotoURL?: string;
    creatorPhotoURL?: string;
  },
  userId: string,
  isCreator: boolean,
  defaultVisibility: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const portfolioItem: PortfolioItem = {
      id: '', // Firestore will generate the ID
      userId,
      sourceId: trade.id,
      sourceType: 'trade',
      title: trade.title,
      description: trade.description,
      skills: isCreator ? trade.offeredSkills : trade.requestedSkills,
      completedAt: trade.completionConfirmedAt || trade.updatedAt,
      visible: defaultVisibility,
      featured: false,
      pinned: false,
      evidence: trade.completionEvidence || [],
      collaborators: [
        {
          id: isCreator ? trade.participantId : trade.creatorId,
          name: isCreator ? trade.participantId || '' : trade.creatorName || '',
          photoURL: isCreator ? trade.participantPhotoURL : trade.creatorPhotoURL,
          role: isCreator ? 'participant' : 'creator'
        }
      ]
    };
    const db = getSyncFirebaseDb();
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    await addDoc(portfolioRef, portfolioItem);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Update portfolio item visibility
 */
export async function updatePortfolioItemVisibility(
  userId: string,
  portfolioItemId: string,
  visible: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const db = getSyncFirebaseDb();
    const itemRef = doc(db, 'users', userId, 'portfolio', portfolioItemId);
    await updateDoc(itemRef, { visible });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Update portfolio item featured status
 */
export async function updatePortfolioItemFeatured(
  userId: string,
  portfolioItemId: string,
  featured: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const db = getSyncFirebaseDb();
    const itemRef = doc(db, 'users', userId, 'portfolio', portfolioItemId);
    await updateDoc(itemRef, { featured });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Update portfolio item pinned status
 */
export async function updatePortfolioItemPinned(
  userId: string,
  portfolioItemId: string,
  pinned: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const db = getSyncFirebaseDb();
    const itemRef = doc(db, 'users', userId, 'portfolio', portfolioItemId);
    await updateDoc(itemRef, { pinned });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Update portfolio item category
 */
export async function updatePortfolioItemCategory(
  userId: string,
  portfolioItemId: string,
  category: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const db = getSyncFirebaseDb();
    const itemRef = doc(db, 'users', userId, 'portfolio', portfolioItemId);
    await updateDoc(itemRef, { category });
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Delete a portfolio item
 */
export async function deletePortfolioItem(
  userId: string,
  portfolioItemId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const db = getSyncFirebaseDb();
    const itemRef = doc(db, 'users', userId, 'portfolio', portfolioItemId);
    await deleteDoc(itemRef);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Generate a portfolio item from a completed collaboration role.
 * Call this when a collaboration role is confirmed as completed.
 * @param collaboration - The collaboration object
 * @param role - The completed role object
 * @param userId - The user for whom to create the portfolio item
 * @param defaultVisibility - Default visibility for the new item
 * @returns Promise with success and error fields
 */
export async function generateCollaborationPortfolioItem(
  collaboration: {
    id: string;
    title: string;
    description: string;
    creatorId: string;
    creatorName?: string;
    creatorPhotoURL?: string;
    participants?: string[];
  },
  role: {
    id: string;
    title: string;
    description: string;
    completionEvidence?: any[];
    completedAt?: any;
    assignedUserId?: string;
  },
  userId: string,
  defaultVisibility: boolean = true
): Promise<{ success: boolean; error: string | null }> {
  try {
    const portfolioItem: PortfolioItem = {
      id: '', // Firestore will generate the ID
      userId,
      sourceId: role.id,
      sourceType: 'collaboration',
      title: `${role.title} - ${collaboration.title}`,
      description: role.description,
      skills: [], // Could extract from role if available
      completedAt: role.completedAt,
      visible: defaultVisibility,
      featured: false,
      pinned: false,
      evidence: role.completionEvidence || [],
      collaborators: [
        {
          id: collaboration.creatorId,
          name: collaboration.creatorName || '',
          photoURL: collaboration.creatorPhotoURL,
          role: 'collaborator'
        },
        ...(collaboration.participants || []).map(participantId => ({
          id: participantId,
          name: '', // Would need to fetch participant name
          photoURL: undefined,
          role: 'collaborator' as const
        }))
      ]
    };
    
    const db = getSyncFirebaseDb();
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    await addDoc(portfolioRef, portfolioItem);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Generate a portfolio item from a completed challenge.
 * Call this when a challenge is completed.
 * @param challenge - The completed challenge object
 * @param userChallenge - The user's challenge completion data
 * @param userId - The user for whom to create the portfolio item
 * @param defaultVisibility - Default visibility for the new item
 * @returns Promise with success and error fields
 */
export async function generateChallengePortfolioItem(
  challenge: {
    id: string;
    title: string;
    description: string;
    category: string;
    tags?: string[];
    objectives?: string[];
  },
  userChallenge: {
    completedAt?: any;
    submissionData?: {
      embeddedEvidence?: any[];
    };
    submissions?: Array<{
      embeddedEvidence?: any[];
    }>;
    lastActivityAt?: any;
  },
  userId: string,
  defaultVisibility: boolean = true
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Extract skills from available data with fallbacks
    const skills = [
      challenge.category, // Primary skill source
      ...(challenge.tags || []), // Additional skills from tags
      ...(challenge.objectives || []).map(obj => 
        obj.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      ).filter(skill => skill.length > 0) // Extract keywords from objectives
    ].filter((skill, index, arr) => arr.indexOf(skill) === index); // Remove duplicates

    // Extract evidence from submission data with fallbacks
    const evidence = userChallenge.submissionData?.embeddedEvidence || 
                     userChallenge.submissions?.[0]?.embeddedEvidence || 
                     [];

    // Use completedAt with fallback
    const completedAt = userChallenge.completedAt || 
                       userChallenge.lastActivityAt || 
                       new Date();

    const portfolioItem: PortfolioItem = {
      id: '', // Firestore will generate the ID
      userId,
      sourceId: challenge.id,
      sourceType: 'challenge',
      title: challenge.title,
      description: challenge.description,
      skills,
      completedAt,
      visible: defaultVisibility,
      featured: false,
      pinned: false,
      evidence,
      collaborators: [] // Challenges are typically solo
    };
    
    const db = getSyncFirebaseDb();
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    await addDoc(portfolioRef, portfolioItem);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unknown error' };
  }
}