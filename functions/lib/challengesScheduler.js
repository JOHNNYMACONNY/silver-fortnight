"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRecurringChallenges = exports.completeExpiredChallenges = exports.activateScheduledChallenges = void 0;
const admin = require("firebase-admin");
const db = admin.firestore();
const activateScheduledChallenges = async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        const snap = await db.collection('challenges')
            .where('status', '==', 'upcoming')
            .where('startDate', '<=', now)
            .get();
        let activated = 0;
        const batch = db.batch();
        snap.forEach(docSnap => {
            batch.update(docSnap.ref, { status: 'active', lastUpdatedAt: now });
            activated += 1;
        });
        if (activated > 0)
            await batch.commit();
        return { activated, error: null };
    }
    catch (e) {
        return { activated: 0, error: (e === null || e === void 0 ? void 0 : e.message) || 'Failed to activate scheduled challenges' };
    }
};
exports.activateScheduledChallenges = activateScheduledChallenges;
const completeExpiredChallenges = async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        const snap = await db.collection('challenges')
            .where('status', '==', 'active')
            .where('endDate', '<=', now)
            .get();
        let completed = 0;
        const batch = db.batch();
        snap.forEach(docSnap => {
            batch.update(docSnap.ref, { status: 'completed', lastUpdatedAt: now });
            completed += 1;
        });
        if (completed > 0)
            await batch.commit();
        return { completed, error: null };
    }
    catch (e) {
        return { completed: 0, error: (e === null || e === void 0 ? void 0 : e.message) || 'Failed to complete expired challenges' };
    }
};
exports.completeExpiredChallenges = completeExpiredChallenges;
const scheduleRecurringChallenges = async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        const aWeek = 7 * 24 * 60 * 60 * 1000;
        const templates = await db.collection('challengeTemplates')
            .where('recurrence', 'in', ['daily', 'weekly'])
            .limit(20)
            .get();
        let scheduled = 0;
        const batch = db.batch();
        templates.forEach(t => {
            const data = t.data();
            const nextStart = data.recurrence === 'daily'
                ? admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000)
                : admin.firestore.Timestamp.fromMillis(now.toMillis() + aWeek);
            const nextEnd = data.recurrence === 'daily'
                ? admin.firestore.Timestamp.fromMillis(nextStart.toMillis() + 24 * 60 * 60 * 1000)
                : admin.firestore.Timestamp.fromMillis(nextStart.toMillis() + aWeek);
            const ref = db.collection('challenges').doc();
            batch.set(ref, {
                title: data.title,
                description: data.description,
                category: data.category,
                difficulty: data.difficulty,
                rewards: data.rewards,
                status: 'upcoming',
                startDate: nextStart,
                endDate: nextEnd,
                createdBy: 'system',
                templateId: t.id,
                isPersonalized: false,
                createdAt: now,
            });
            scheduled += 1;
        });
        if (scheduled > 0)
            await batch.commit();
        return { scheduled, error: null };
    }
    catch (e) {
        return { scheduled: 0, error: (e === null || e === void 0 ? void 0 : e.message) || 'Failed to schedule recurring challenges' };
    }
};
exports.scheduleRecurringChallenges = scheduleRecurringChallenges;
//# sourceMappingURL=challengesScheduler.js.map