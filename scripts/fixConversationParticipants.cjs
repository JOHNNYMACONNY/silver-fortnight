// scripts/fixConversationParticipants.cjs
// Script to ensure all conversation documents have both 'participantIds' (string array)
// and 'participants' (object array: { id })

const admin = require('firebase-admin');

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
    let participantIds = undefined;
    let participants = undefined;
    let needsUpdate = false;

    // Determine participantIds (array of strings)
    if (Array.isArray(data.participantIds)) {
      participantIds = data.participantIds;
    } else if (Array.isArray(data.participants) && typeof data.participants[0] === 'string') {
      participantIds = data.participants;
    }

    // Determine participants (array of objects)
    if (Array.isArray(data.participants) && typeof data.participants[0] === 'object') {
      participants = data.participants;
    } else if (Array.isArray(participantIds)) {
      participants = participantIds.map(id => ({ id }));
    }

    // Only update if needed
    if (
      (participantIds && JSON.stringify(data.participantIds) !== JSON.stringify(participantIds)) ||
      (participants && JSON.stringify(data.participants) !== JSON.stringify(participants))
    ) {
      await doc.ref.update({ participantIds, participants });
      updatedCount++;
      console.log(`Updated conversation ${doc.id} with participantIds:`, participantIds, 'and participants:', participants);
    }
  }

  console.log(`Done! Updated ${updatedCount} conversation(s).`);
}

fixConversations().catch((err) => {
  console.error('Error updating conversations:', err);
  process.exit(1);
}); 