const admin = require('firebase-admin');

// Path to your service account key JSON file
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixCreatedAtInMessages() {
  const conversationsSnapshot = await db.collection('conversations').get();
  let fixedCount = 0;

  for (const conversationDoc of conversationsSnapshot.docs) {
    const messagesRef = conversationDoc.ref.collection('messages');
    const messagesSnapshot = await messagesRef.get();

    for (const messageDoc of messagesSnapshot.docs) {
      const data = messageDoc.data();
      const createdAt = data.createdAt;

      // Check if createdAt is missing or not a Firestore Timestamp
      if (
        !createdAt ||
        typeof createdAt !== 'object' ||
        typeof createdAt.toDate !== 'function'
      ) {
        console.log(
          `Fixing message ${messageDoc.id} in conversation ${conversationDoc.id}`
        );
        await messageDoc.ref.update({
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        fixedCount++;
      }
    }
  }

  console.log(`Fixed ${fixedCount} messages with invalid or missing createdAt.`);
}

fixCreatedAtInMessages()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error fixing messages:', err);
    process.exit(1);
  });
