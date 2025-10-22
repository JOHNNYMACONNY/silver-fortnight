// createUser.cjs
// Usage: node scripts/createUser.cjs <uid> <email> <name>
// Requires GOOGLE_APPLICATION_CREDENTIALS set to your service account JSON

const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const [,, uid, email, ...nameParts] = process.argv;
const name = nameParts.join(' ');

if (!uid || !email || !name) {
  console.error('Usage: node scripts/createUser.cjs <uid> <email> <name>');
  process.exit(1);
}

async function createUser() {
  const userRef = db.collection('users').doc(uid);
  const userData = {
    name,
    email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    roles: ['user']
  };
  await userRef.set(userData, { merge: true });
  console.log(`Created/updated user document for UID: ${uid}`);
  process.exit(0);
}

createUser().catch(err => {
  console.error('Error creating user:', err);
  process.exit(1);
});
