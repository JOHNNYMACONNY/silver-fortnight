#!/usr/bin/env tsx
/**
 * Backfill script to normalize existing challenge documents
 *
 * Modes:
 * - Default (client SDK): Uses Firebase client SDK with env-based config; requires Firestore write permissions for current user
 * - Admin mode (--admin): Uses firebase-admin with GOOGLE_APPLICATION_CREDENTIALS service account; bypasses security rules
 *
 * Normalizations:
 * - difficulty ∈ ['beginner','intermediate','advanced','expert'] (default 'beginner')
 * - status ∈ ['draft','upcoming','active','completed','archived','cancelled'] (map 'canceled' → 'cancelled')
 * - endDate: copy from deadline if missing
 * - rewards.xp: ensure number (default 0)
 *
 * Flags:
 * --admin    Use firebase-admin (requires GOOGLE_APPLICATION_CREDENTIALS)
 * --dry-run  Do not write changes; only log what would change
 */
import { initializeFirebase, getSyncFirebaseDb } from '../src/firebase-config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import type { Firestore as ClientFirestore, Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { Firestore as AdminFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';

const normalizeDifficulty = (value: any): string => {
  const v = (typeof value === 'string' ? value : '').toLowerCase();
  if (['beginner','intermediate','advanced','expert'].includes(v)) return v;
  return 'beginner';
};

const normalizeStatus = (value: any): string => {
  const v = (typeof value === 'string' ? value : '').toLowerCase();
  if (['draft','upcoming','active','completed','archived','cancelled','canceled'].includes(v)) {
    return v === 'canceled' ? 'cancelled' : v;
  }
  return 'draft';
};

async function main() {
  const args = process.argv.slice(2);
  const useAdmin = args.includes('--admin') || process.env.USE_ADMIN_BACKFILL === 'true';
  const dryRun = args.includes('--dry-run');

  let dbAdmin: AdminFirestore | null = null;
  let dbClient: ClientFirestore | null = null;

  if (useAdmin) {
    // Lazy import firebase-admin to avoid bundling when not needed
    const admin = await import('firebase-admin');
    try {
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      dbAdmin = (await import('firebase-admin/firestore')).getFirestore();
      console.log('Using firebase-admin for backfill');
    } catch (e) {
      console.error('Failed to initialize firebase-admin. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.', e);
      process.exit(1);
    }
  } else {
    await initializeFirebase();
    dbClient = getSyncFirebaseDb();
    console.log('Using client SDK for backfill');
  }

  const challengesCol = useAdmin
    ? (dbAdmin as AdminFirestore).collection('challenges')
    : (collection(dbClient as ClientFirestore, 'challenges'));

  const snap = useAdmin
    ? await (challengesCol as any).get()
    : await getDocs(challengesCol as any);

  let updated = 0;
  let examined = 0;
  for (const d of snap.docs) {
    const data: any = d.data();
    const updates: any = {};

    // difficulty
    const normalizedDifficulty = normalizeDifficulty(data.difficulty);
    if (data.difficulty !== normalizedDifficulty) updates.difficulty = normalizedDifficulty;

    // status
    const normalizedStatus = normalizeStatus(data.status);
    if (data.status !== normalizedStatus) updates.status = normalizedStatus;

    // endDate from deadline
    if (!data.endDate && data.deadline) updates.endDate = data.deadline;

    // rewards.xp
    const xp = Number(data?.rewards?.xp ?? 0);
    if (!data.rewards || typeof data.rewards.xp !== 'number' || data.rewards.xp !== xp) {
      updates.rewards = { ...(data.rewards || {}), xp };
    }

    examined++;
    if (Object.keys(updates).length > 0) {
      if (dryRun) {
        console.log(`[DRY RUN] Would update ${d.id}:`, updates);
      } else if (useAdmin) {
        await (challengesCol as any).doc(d.id).update(updates);
      } else {
        await updateDoc(doc(dbClient as ClientFirestore, 'challenges', d.id), updates);
      }
      updated++;
    }
  }

  console.log(`Backfill complete. Examined ${examined}, Updated ${updated} challenge documents.${dryRun ? ' (dry run)' : ''}`);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});


