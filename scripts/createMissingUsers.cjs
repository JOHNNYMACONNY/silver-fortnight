// createMissingUsers.cjs
// Usage: node scripts/createMissingUsers.cjs
// Requires GOOGLE_APPLICATION_CREDENTIALS set to your service account JSON
// This script will scan all Firebase Auth users and create a Firestore user document for any missing in /users/{uid}

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

async function getAllAuthUsers(nextPageToken, allUsers = []) {
  const result = await admin.auth().listUsers(1000, nextPageToken);
  allUsers.push(...result.users);
  if (result.pageToken) {
    return getAllAuthUsers(result.pageToken, allUsers);
  }
  return allUsers;
}

async function main() {
  const users = await getAllAuthUsers();
  let created = 0;
  for (const user of users) {
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      const userData = {
        name: user.displayName || user.email || user.uid,
        email: user.email || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        roles: ['user']
      };
      await userRef.set(userData, { merge: true });
      console.log(`Created user doc for: ${user.uid} (${user.email})`);
      created++;
    }
  }
  console.log(`\nDone. Created ${created} new user documents.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error creating missing users:', err);
  process.exit(1);
});
