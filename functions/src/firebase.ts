import * as admin from 'firebase-admin';

export const db = admin.firestore();

// Retry mechanism for Firestore operations
export const withRetry = async (operation: () => Promise<any>, maxRetries = 3): Promise<any> => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError;
};
