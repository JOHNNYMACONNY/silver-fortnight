// backfillParticipants.js
// Usage: node backfillParticipants.js
// Requires Firebase Admin SDK credentials (set GOOGLE_APPLICATION_CREDENTIALS)

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function backfillCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  let updated = 0;
  let missing = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasParticipantIds = Array.isArray(data.participantIds) && data.participantIds.length > 0;
    const hasParticipants = data.participants && typeof data.participants === 'object' && Object.keys(data.participants).length > 0;
    if (!hasParticipantIds && hasParticipants) {
      // Backfill participantIds from participants object (if possible)
      const ids = Object.values(data.participants).filter(v => typeof v === 'string');
      if (ids.length > 0) {
        await doc.ref.update({ participantIds: ids });
        updated++;
        console.log(`[${collectionName}] Updated ${doc.id}: added participantIds from participants.`);
      } else {
        missing++;
        console.warn(`[${collectionName}] ${doc.id} has participants object but no string user IDs.`);
      }
    } else if (!hasParticipants && hasParticipantIds) {
      // Optionally backfill participants object from participantIds
      // (Uncomment if you want to do this)
      // const participantsObj = {};
      // data.participantIds.forEach((id, idx) => { participantsObj[`user${idx+1}`] = id; });
      // await doc.ref.update({ participants: participantsObj });
      // updated++;
    } else if (!hasParticipantIds && !hasParticipants) {
      missing++;
      console.warn(`[${collectionName}] ${doc.id} is missing both participantIds and participants.`);
    }
  }
  console.log(`[${collectionName}] Backfill complete. Updated: ${updated}, Missing: ${missing}`);
}

async function main() {
  await backfillCollection('trades');
  await backfillCollection('conversations');
  process.exit(0);
}

main().catch(err => {
  console.error('Backfill error:', err);
  process.exit(1);
});
