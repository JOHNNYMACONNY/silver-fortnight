/**
 * Firebase Configuration Alias
 * 
 * This file provides a cleaner import path for Firebase services.
 * Instead of: import { firebaseAnalytics } from '@/firebase-config';
 * Use: import { analytics } from '@/config/firebase';
 */

import {
  firebaseAuth,
  firebaseDb,
  firebaseAnalytics,
  firebasePerformance,
  getSyncFirebaseAuth,
  getSyncFirebaseDb,
  getSyncFirebaseAnalytics,
  getSyncFirebasePerformance,
} from '@/firebase-config';

// Export with cleaner names
export const auth = firebaseAuth;
export const db = firebaseDb;
export const analytics = firebaseAnalytics;
export const performance = firebasePerformance;

// Export sync getters
export const getAuth = getSyncFirebaseAuth;
export const getDb = getSyncFirebaseDb;
export const getAnalytics = getSyncFirebaseAnalytics;
export const getPerformance = getSyncFirebasePerformance;

