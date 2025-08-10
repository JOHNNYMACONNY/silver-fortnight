// manualPatchParticipants.cjs
// Usage: node scripts/manualPatchParticipants.cjs
// Requires GOOGLE_APPLICATION_CREDENTIALS set to your service account JSON
// Prompts you to manually enter participantIds for each document missing both fields

const admin = require('firebase-admin');
const readline = require('readline');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function patchCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  let patched = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasParticipantIds = Array.isArray(data.participantIds) && data.participantIds.length > 0;
    const hasParticipants = data.participants && typeof data.participants === 'object' && Object.keys(data.participants).length > 0;
    if (!hasParticipantIds && !hasParticipants) {
      let inferredIds = [];
      if (data.createdBy && typeof data.createdBy === 'string') {
        inferredIds = [data.createdBy];
        console.log(`[${collectionName}] Document ${doc.id} - inferred participantIds from createdBy:`, inferredIds);
        await doc.ref.update({ participantIds: inferredIds });
        patched++;
        continue;
      }
      if (data.creatorId && typeof data.creatorId === 'string') {
        inferredIds = [data.creatorId];
        console.log(`[${collectionName}] Document ${doc.id} - inferred participantIds from creatorId:`, inferredIds);
        await doc.ref.update({ participantIds: inferredIds });
        patched++;
        continue;
      }
      if (data.userId && typeof data.userId === 'string') {
        inferredIds = [data.userId];
        console.log(`[${collectionName}] Document ${doc.id} - inferred participantIds from userId:`, inferredIds);
        await doc.ref.update({ participantIds: inferredIds });
        patched++;
        continue;
      }
      console.log(`\n[${collectionName}] Document ${doc.id} is missing both participantIds and participants.`);
      const input = await ask('Enter comma-separated participant user IDs for this document (or leave blank to skip): ');
      const ids = input.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        await doc.ref.update({ participantIds: ids });
        patched++;
        console.log(`[${collectionName}] Patched ${doc.id} with participantIds:`, ids);
      } else {
        console.log(`[${collectionName}] Skipped ${doc.id}`);
      }
    }
  }
  console.log(`\n[${collectionName}] Manual patch complete. Patched: ${patched}`);
}

async function patchSpecificConversation() {
  const docRef = db.collection('conversations').doc('bcB1UuJ2VHwTXsTFG71g');
  await docRef.update({
    participantIds: [
      "TozfQg0dAHe4ToLyiSnkDqe3ECj2",
      "YafYIBsrhlhLQ3C2KWaIjZDB4Ki2"
    ],
    participants: {
      creator: "TozfQg0dAHe4ToLyiSnkDqe3ECj2",
      participant: "YafYIBsrhlhLQ3C2KWaIjZDB4Ki2"
    }
  });
  console.log('Patched conversation bcB1UuJ2VHwTXsTFG71g with participantIds and participants');
}

async function main() {
  await patchCollection('trades');
  await patchCollection('conversations');
  await patchSpecificConversation();
  process.exit(0);
}

main().catch(err => {
  console.error('Manual patch error:', err);
  process.exit(1);
});
