import * as functions from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { db } from './firebase';

// HTTP function for adding admin role
export const addAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can add other admins'
    );
  }

  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email is required'
    );
  }

  try {
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: true });

    // Add user to admins collection
    await db.collection('admins').doc(user.uid).set({
      email: user.email,
      addedBy: context.auth.uid,
      addedAt: new Date()
    });

    return { message: `Success! ${email} has been made an admin.` };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Error adding admin role'
    );
  }
});

// HTTP function for removing admin role
export const removeAdminRole = functions.https.onCall(async (data, context) => {
  // Verify caller is admin
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can remove other admins'
    );
  }

  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email is required'
    );
  }

  try {
    const auth = getAuth();
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: false });

    // Remove user from admins collection
    await db.collection('admins').doc(user.uid).delete();

    return { message: `Success! ${email} has been removed as an admin.` };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Error removing admin role'
    );
  }
});
