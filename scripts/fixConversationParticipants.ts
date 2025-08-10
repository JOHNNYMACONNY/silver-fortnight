// scripts/fixConversationParticipants.ts
// Script to ensure all conversation documents have a 'participants' array

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function fixConversations() {
  const conversationsRef = db.collection('conversations');
  const snapshot = await conversationsRef.get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    let participants: string[] | undefined = undefined;

    if (Array.isArray(data.participants)) {
      // Already has participants array
      continue;
    } else if (Array.isArray(data.participantIds)) {
      participants = data.participantIds;
      needsUpdate = true;
    }

    if (needsUpdate && participants) {
      await doc.ref.update({ participants });
      updatedCount++;
      console.log(`Updated conversation ${doc.id} with participants:`, participants);
    }
  }

  console.log(`Done! Updated ${updatedCount} conversation(s).`);
}

fixConversations().catch((err) => {
  console.error('Error updating conversations:', err);
  process.exit(1);
}); 