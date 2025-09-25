import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { initializeFirebase, getSyncFirebaseDb } from '../../src/firebase-config';

async function backfillCollection(
  collectionName: string,
  visibilityField: string,
  defaultValue: Record<string, unknown>,
  filter?: (data: Record<string, unknown>) => boolean
) {
  const db = getSyncFirebaseDb();
  const snapshot = await getDocs(collection(db, collectionName));
  let updated = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (filter && !filter(data)) {
      skipped++;
      continue;
    }

    // Ensure 'data' is an object before checking for the field
    if (typeof data === 'object' && data !== null && visibilityField in data) {
      skipped++;
      continue;
    }

    const batch = writeBatch(db);
    const updateValue = defaultValue;
    batch.update(docSnap.ref, updateValue);
    await batch.commit();
    updated++;
  }

  console.log(`Collection ${collectionName}: updated=${updated}, skipped=${skipped}`);
}

async function main() {
  await initializeFirebase();
  const db = getSyncFirebaseDb();
  console.log('Starting visibility backfill...');

  await backfillCollection('users', 'public', { public: true });
  await backfillCollection(
    'trades',
    'visibility',
    { visibility: 'public' },
    (data) => data.status === 'active' || data.status === 'open'
  );
  await backfillCollection('collaborations', 'visibility', { visibility: 'public', public: true });

  console.log('Backfill completed.');
}

main().catch((error) => {
  console.error('Visibility backfill failed:', error);
  process.exit(1);
});
