// autoCreateUserProfile.ts
// Place this in your frontend app (e.g., in your AuthContext or after login/signup)
// This will automatically create a Firestore user doc if missing after login/signup

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from '../firebase-config';
import { logger } from './logging/logger';

export async function autoCreateUserProfile() {
  const user = firebaseAuth.currentUser;
  if (!user) return;
  const userRef = doc(firebaseDb, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || user.email || user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
      roles: ['user']
    });
    logger.info('Created Firestore user profile', 'USER_PROFILE', { userId: user.uid });
  }
}

// Usage example (call after login/signup):
// import { autoCreateUserProfile } from './autoCreateUserProfile';
// await autoCreateUserProfile();
