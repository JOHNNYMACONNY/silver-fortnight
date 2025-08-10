// autoPatchParticipants.cjs
// Usage: node scripts/autoPatchParticipants.cjs
// Requires GOOGLE_APPLICATION_CREDENTIALS set to your service account JSON
// Attempts to automatically infer participantIds for each document missing both fields.
// Prompts only if no participant IDs can be inferred.

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

async function inferParticipantsFromFields(data, fields = ['creatorId', 'userId', 'ownerId']) {
  for (const field of fields) {
    if (typeof data[field] === 'string' && data[field].length > 0) {
      return [data[field]];
    }
    if (Array.isArray(data[field]) && data[field].length > 0) {
      return data[field];
    }
  }
  return [];
}

async function inferParticipantsFromMessages(docRef) {
  const messagesSnap = await docRef.collection('messages').get();
  const senderIds = new Set();
  messagesSnap.forEach(msgDoc => {
    const msgData = msgDoc.data();
    if (msgData.senderId) senderIds.add(msgData.senderId);
  });
  return Array.from(senderIds);
}

async function patchCollection(collectionName, inferFromMessages = false) {
  const snapshot = await db.collection(collectionName).get();
  let patched = 0, autoPatched = 0, manualPatched = 0, skipped = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasParticipantIds = Array.isArray(data.participantIds) && data.participantIds.length > 0;
    const hasParticipants = data.participants && typeof data.participants === 'object' && Object.keys(data.participants).length > 0;
    if (!hasParticipantIds && !hasParticipants) {
      let ids = await inferParticipantsFromFields(data);
      if (ids.length === 0 && inferFromMessages) {
        ids = await inferParticipantsFromMessages(doc.ref);
      }
      if (ids.length > 0) {
        await doc.ref.update({ participantIds: ids });
        patched++; autoPatched++;
        console.log(`[${collectionName}] Auto-patched ${doc.id} with participantIds:`, ids);
      } else {
        console.log(`\n[${collectionName}] Document ${doc.id} is missing both participantIds and participants and could not be auto-patched.`);
        const input = await ask('Enter comma-separated participant user IDs for this document (or leave blank to skip): ');
        const manualIds = input.split(',').map(s => s.trim()).filter(Boolean);
        if (manualIds.length > 0) {
          await doc.ref.update({ participantIds: manualIds });
          patched++; manualPatched++;
          console.log(`[${collectionName}] Manually patched ${doc.id} with participantIds:`, manualIds);
        } else {
          skipped++;
          console.log(`[${collectionName}] Skipped ${doc.id}`);
        }
      }
    }
  }
  console.log(`\n[${collectionName}] Patch complete. Total patched: ${patched} (auto: ${autoPatched}, manual: ${manualPatched}), Skipped: ${skipped}`);
}

async function main() {
  await patchCollection('trades', false);
  await patchCollection('conversations', true);
  process.exit(0);
}

main().catch(err => {
  console.error('Auto patch error:', err);
  process.exit(1);
});
