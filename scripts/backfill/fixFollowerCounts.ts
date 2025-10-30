import { initializeFirebase, getSyncFirebaseDb } from '../../src/firebase-config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';

interface FollowerCounts {
  [userId: string]: {
    followers: number;
    following: number;
  };
}

async function fixFollowerCounts() {
  console.log('🚀 Starting follower counts migration...\n');

  try {
    await initializeFirebase();
    const db = getSyncFirebaseDb();

    // Step 1: Get all follows from userFollows collection
    console.log('📊 Step 1: Fetching all follows from userFollows collection...');
    const followsSnapshot = await getDocs(collection(db, 'userFollows'));
    console.log(`   Found ${followsSnapshot.size} follow relationships\n`);

    // Step 2: Count followers and following for each user
    console.log('🔢 Step 2: Calculating follower/following counts...');
    const counts: FollowerCounts = {};

    followsSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const followerId = data.followerId;
      const followingId = data.followingId;

      // Skip soft-deleted follows (if any exist)
      if (data.deletedAt) {
        console.log(`   ⚠️  Skipping soft-deleted follow: ${docSnap.id}`);
        return;
      }

      // Initialize counts if not exists
      if (!counts[followerId]) {
        counts[followerId] = { followers: 0, following: 0 };
      }
      if (!counts[followingId]) {
        counts[followingId] = { followers: 0, following: 0 };
      }

      // Increment counts
      counts[followerId].following++;
      counts[followingId].followers++;
    });

    const userIds = Object.keys(counts);
    console.log(`   Calculated counts for ${userIds.length} users\n`);

    // Step 3: Update socialStats for each user
    console.log('💾 Step 3: Updating socialStats collection...');
    let updated = 0;
    let created = 0;
    let unchanged = 0;
    let errors = 0;

    for (const userId of userIds) {
      try {
        const socialStatsRef = doc(db, 'socialStats', userId);
        const socialStatsDoc = await getDoc(socialStatsRef);

        const newCounts = {
          followersCount: counts[userId].followers,
          followingCount: counts[userId].following,
          lastUpdated: Timestamp.now()
        };

        if (socialStatsDoc.exists()) {
          const currentData = socialStatsDoc.data();
          const currentFollowers = currentData?.followersCount || 0;
          const currentFollowing = currentData?.followingCount || 0;

          if (currentFollowers !== newCounts.followersCount || currentFollowing !== newCounts.followingCount) {
            await updateDoc(socialStatsRef, newCounts as any);
            updated++;
            console.log(`   ✅ Updated ${userId}: followers ${currentFollowers} → ${newCounts.followersCount}, following ${currentFollowing} → ${newCounts.followingCount}`);
          } else {
            unchanged++;
          }
        } else {
          // Create new socialStats document
          await setDoc(socialStatsRef, {
            userId,
            ...newCounts,
            leaderboardAppearances: 0,
            topRanks: {},
            reputationScore: 0,
            reputationLastComputedAt: Timestamp.now()
          } as any);
          created++;
          console.log(`   ✨ Created socialStats for ${userId}: followers ${newCounts.followersCount}, following ${newCounts.followingCount}`);
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Error updating ${userId}:`, error);
      }
    }

    // Step 4: Handle users with no follows (set to 0)
    console.log('\n📋 Step 4: Checking for users with socialStats but no follows...');
    const allSocialStatsSnapshot = await getDocs(collection(db, 'socialStats'));
    let zerosSet = 0;

    for (const docSnap of allSocialStatsSnapshot.docs) {
      const userId = docSnap.id;
      if (!counts[userId]) {
        // User has socialStats but no follows - ensure counts are 0
        const data = docSnap.data();
        if (data.followersCount !== 0 || data.followingCount !== 0) {
          await updateDoc(docSnap.ref, {
            followersCount: 0,
            followingCount: 0,
            lastUpdated: Timestamp.now()
          } as any);
          zerosSet++;
          console.log(`   🔄 Reset ${userId}: followers → 0, following → 0`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total users processed: ${userIds.length}`);
    console.log(`✨ Created: ${created}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`➖ Unchanged: ${unchanged}`);
    console.log(`🔄 Reset to zero: ${zerosSet}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(60) + '\n');

    if (errors === 0) {
      console.log('🎉 All follower counts have been successfully fixed!\n');
    } else {
      console.log(`⚠️  Migration completed with ${errors} error(s). Please review the logs above.\n`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixFollowerCounts()
  .then(() => {
    console.log('👋 Migration script finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
