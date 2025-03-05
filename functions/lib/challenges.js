"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manuallyActivateChallenge = exports.activateChallenges = exports.archiveExpiredChallenges = exports.generateMonthlyChallenges = exports.generateWeeklyChallenges = void 0;
const functions = require("firebase-functions");
const firebase_1 = require("./firebase");
// Helper functions
function getFallbackChallenge(type) {
    return {
        title: `${type === 'weekly' ? 'Weekly' : 'Monthly'} Creative Challenge`,
        description: `Complete creative tasks and collaborate with others in this ${type} challenge.`,
        requirements: [
            {
                type: 'Trades',
                count: type === 'weekly' ? 2 : 4,
                skillCategory: 'Any'
            },
            {
                type: 'Collaborations',
                count: type === 'weekly' ? 1 : 2,
                skillCategory: 'Any'
            }
        ],
        rewards: {
            xp: type === 'weekly' ? 200 : 500,
            badge: `${type}CreativeMaster`
        }
    };
}
// Generate challenge
async function generateChallengeWithAI(type) {
    // Return fallback challenge directly since we removed Hugging Face integration
    return getFallbackChallenge(type);
}
// Scheduled function to generate challenges
exports.generateWeeklyChallenges = functions.pubsub.schedule('every monday 00:00').timeZone('UTC').onRun(async () => {
    return await (0, firebase_1.withRetry)(async () => {
        const batch = firebase_1.db.batch();
        // Archive old pending challenges
        const oldPendingSnapshot = await firebase_1.db.collection('challenges')
            .where('status', '==', 'pending')
            .where('type', '==', 'weekly')
            .get();
        oldPendingSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { status: 'archived' });
        });
        // Generate exactly 10 weekly challenges
        for (let i = 0; i < 10; i++) {
            const challenge = await generateChallengeWithAI('weekly');
            const docRef = firebase_1.db.collection('challenges').doc();
            batch.set(docRef, Object.assign(Object.assign({}, challenge), { status: 'pending', type: 'weekly', startDate: null, endDate: null, createdAt: new Date(), updatedAt: new Date() }));
        }
        await batch.commit();
        console.log('Generated weekly challenges successfully');
    });
});
exports.generateMonthlyChallenges = functions.pubsub.schedule('0 0 1 * *').timeZone('UTC').onRun(async () => {
    return await (0, firebase_1.withRetry)(async () => {
        const batch = firebase_1.db.batch();
        // Archive old pending challenges
        const oldPendingSnapshot = await firebase_1.db.collection('challenges')
            .where('status', '==', 'pending')
            .where('type', '==', 'monthly')
            .get();
        oldPendingSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { status: 'archived' });
        });
        // Generate exactly 10 monthly challenges
        for (let i = 0; i < 10; i++) {
            const challenge = await generateChallengeWithAI('monthly');
            const docRef = firebase_1.db.collection('challenges').doc();
            batch.set(docRef, Object.assign(Object.assign({}, challenge), { status: 'pending', type: 'monthly', startDate: null, endDate: null, createdAt: new Date(), updatedAt: new Date() }));
        }
        await batch.commit();
        console.log('Generated monthly challenges successfully');
    });
});
// Function to archive expired challenges
exports.archiveExpiredChallenges = functions.pubsub.schedule('every 1 hours').timeZone('UTC').onRun(async () => {
    const now = new Date();
    // Get live challenges that have passed their end date
    const expiredSnapshot = await firebase_1.db.collection('challenges')
        .where('status', '==', 'live')
        .where('endDate', '<', now)
        .get();
    if (expiredSnapshot.empty) {
        console.log('No expired challenges found');
        return null;
    }
    const batch = firebase_1.db.batch();
    let archivedCount = 0;
    expiredSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
            status: 'archived',
            updatedAt: now
        });
        archivedCount++;
    });
    await batch.commit();
    console.log(`Archived ${archivedCount} expired challenges`);
    // Trigger generation of new challenges if needed
    const liveSnapshot = await firebase_1.db.collection('challenges')
        .where('status', 'in', ['live', 'pending'])
        .get();
    if (liveSnapshot.size < 20) { // We maintain 20 total challenges (10 weekly + 10 monthly)
        // Count existing challenges by type
        const counts = { weekly: 0, monthly: 0 };
        liveSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const type = data === null || data === void 0 ? void 0 : data.type;
            if (type === 'weekly' || type === 'monthly') {
                counts[type]++;
            }
        });
        // Generate new challenges if needed
        if (counts.weekly < 10) {
            await generateChallenges(new Date(), 'weekly');
        }
        if (counts.monthly < 10) {
            await generateChallenges(new Date(), 'monthly');
        }
    }
    return null;
});
// Helper function to generate challenges
async function generateChallenges(date, type) {
    const data = { timestamp: date };
    const context = { auth: null };
    if (type === 'weekly') {
        await exports.generateWeeklyChallenges.run(data, context);
    }
    else {
        await exports.generateMonthlyChallenges.run(data, context);
    }
}
// Function to activate pending challenges
exports.activateChallenges = functions.pubsub.schedule('every 1 hours').onRun(async () => {
    const now = new Date();
    // Get pending challenges
    const pendingSnapshot = await firebase_1.db.collection('challenges')
        .where('status', '==', 'pending')
        .get();
    const batch = firebase_1.db.batch();
    let activatedCount = 0;
    pendingSnapshot.docs.forEach((doc) => {
        const challenge = doc.data();
        const startDate = new Date();
        const endDate = new Date(startDate);
        if (challenge.type === 'weekly') {
            endDate.setDate(endDate.getDate() + 7);
        }
        else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        batch.update(doc.ref, {
            status: 'live',
            startDate,
            endDate,
            updatedAt: now
        });
        activatedCount++;
    });
    if (activatedCount > 0) {
        await batch.commit();
        console.log(`Activated ${activatedCount} challenges`);
    }
});
// HTTP function for manual challenge activation
exports.manuallyActivateChallenge = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify admin status
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can manually activate challenges');
    }
    const { challengeId } = data;
    if (!challengeId) {
        throw new functions.https.HttpsError('invalid-argument', 'Challenge ID is required');
    }
    const challengeRef = firebase_1.db.collection('challenges').doc(challengeId);
    const challenge = await challengeRef.get();
    if (!challenge.exists) {
        throw new functions.https.HttpsError('not-found', 'Challenge not found');
    }
    const challengeData = challenge.data();
    if ((challengeData === null || challengeData === void 0 ? void 0 : challengeData.status) !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', 'Challenge is not in pending status');
    }
    const now = new Date();
    const endDate = new Date(now);
    if (challengeData.type === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
    }
    else {
        endDate.setMonth(endDate.getMonth() + 1);
    }
    await challengeRef.update({
        status: 'live',
        startDate: now,
        endDate,
        updatedAt: now
    });
    return { success: true };
});
//# sourceMappingURL=challenges.js.map