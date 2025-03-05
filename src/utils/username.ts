import { getDb } from '../lib/firebase';
import { collection, query, where, getDocs, runTransaction, doc, Firestore } from 'firebase/firestore';

/**
 * Converts a display name to a username format
 * - Converts to lowercase
 * - Replaces special characters and spaces with hyphens
 * - Ensures starts with @ symbol
 */
export function generateUsername(displayName: string, suffix = ''): string {
  const username = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-')         // Collapse multiple hyphens
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens

  return '@' + username + suffix;
}

/**
 * Validates username format
 * Returns true if username is valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  // Must start with @, then 3-30 alphanumeric/hyphen chars
  const usernameRegex = /^@[a-z0-9-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Checks if a username is available
 * Returns true if username is available, false if taken
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const db = await getDb();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

/**
 * Generates a unique username based on display name
 * Adds numeric suffix if base username is taken
 */
export async function generateUniqueUsername(displayName: string): Promise<string> {
  const baseUsername = generateUsername(displayName);
  
  if (await isUsernameAvailable(baseUsername)) {
    return baseUsername;
  }

  let suffix = 1;
  let username: string;
  
  do {
    username = generateUsername(displayName, `-${suffix}`);
    suffix++;
  } while (!(await isUsernameAvailable(username)));

  return username;
}

export class UsernameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsernameError';
  }
}

/**
 * Updates a user's username and makes their old username available
 * Performs the update in a transaction to ensure consistency
 */
export async function updateUsername(userId: string, newUsername: string): Promise<void> {
  if (!isValidUsername(newUsername)) {
    throw new UsernameError('Invalid username format');
  }

  const isAvailable = await isUsernameAvailable(newUsername);
  if (!isAvailable) {
    throw new UsernameError('Username is already taken');
  }

  const db = await getDb();
  const userRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new UsernameError('User not found');
    }

    const userData = userDoc.data();
    const oldUsername = userData.username;

    // Update user document with new username
    transaction.update(userRef, {
      username: newUsername
    });
  });
}
