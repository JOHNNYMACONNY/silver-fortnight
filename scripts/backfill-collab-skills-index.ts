// Backfill script: populate skillsIndex for existing collaborations
// Usage: npx tsx scripts/backfill-collab-skills-index.ts --project=<firebase-project-id> [--dry]

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc, query, limit as limitQuery, startAfter } from 'firebase/firestore';

interface CollabDoc {
  id: string;
  skillsRequired?: string[];
  skillsNeeded?: string[];
  skillsIndex?: string[];
}

function getArg(name: string): string | undefined {
  const i = process.argv.findIndex(a => a.startsWith(`--${name}`));
  if (i >= 0) {
    const [_, val] = process.argv[i].split('=');
    return val || 'true';
  }
  return undefined;
}

async function main() {
  const projectId = getArg('project');
  const dryRun = !!getArg('dry');
  if (!projectId) {
    console.error('Missing --project=<firebase-project-id>');
    process.exit(1);
  }

  initializeApp({ projectId });
  const db = getFirestore();

  const col = collection(db, 'collaborations');
  let lastDoc: any = undefined;
  let updated = 0;
  let scanned = 0;

  while (true) {
    const q = lastDoc
      ? query(col, startAfter(lastDoc), limitQuery(500))
      : query(col, limitQuery(500));

    const snap = await getDocs(q);
    if (snap.empty) break;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      const data = d.data() as any as CollabDoc;
      scanned++;
      const required = Array.isArray(data.skillsRequired) ? data.skillsRequired : [];
      const needed = Array.isArray(data.skillsNeeded) ? data.skillsNeeded : [];
      const normalized = new Set<string>();
      [...required, ...needed].forEach(s => {
        const name = (s || '').toString().trim().toLowerCase();
        if (name) normalized.add(name);
      });
      const index = Array.from(normalized);
      const existing = Array.isArray(data.skillsIndex) ? data.skillsIndex : [];
      const equal = existing.length === index.length && existing.every(v => index.includes(v));
      if (!equal) {
        if (!dryRun) {
          batch.update(doc(db, 'collaborations', d.id), { skillsIndex: index });
        }
        updated++;
      }
    });

    if (!dryRun) await batch.commit();
    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < 500) break;
  }

  console.log(`Scanned ${scanned} collaborations. ${dryRun ? '(dry run) ' : ''}Updated ${updated}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


