import { initializeFirebase, getSyncFirebaseDb } from '../../src/firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { recomputeUserReputation } from '../../src/services/leaderboards';

async function main() {
  await initializeFirebase();
  const db = getSyncFirebaseDb();
  const usersSnap = await getDocs(collection(db, 'users'));
  let processed = 0;
  for (const doc of usersSnap.docs) {
    const userId = doc.id;
    await recomputeUserReputation(userId);
    processed += 1;
    if (processed % 25 === 0) console.log(`Processed ${processed} users...`);
  }
  console.log(`Done. Processed ${processed} users.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

