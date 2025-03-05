"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAdminRole = exports.addAdminRole = void 0;
const functions = require("firebase-functions");
const auth_1 = require("firebase-admin/auth");
const firebase_1 = require("./firebase");
// HTTP function for adding admin role
exports.addAdminRole = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify caller is admin
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can add other admins');
    }
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }
    try {
        const auth = (0, auth_1.getAuth)();
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: true });
        // Add user to admins collection
        await firebase_1.db.collection('admins').doc(user.uid).set({
            email: user.email,
            addedBy: context.auth.uid,
            addedAt: new Date()
        });
        return { message: `Success! ${email} has been made an admin.` };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error adding admin role');
    }
});
// HTTP function for removing admin role
exports.removeAdminRole = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify caller is admin
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin)) {
        throw new functions.https.HttpsError('permission-denied', 'Only admins can remove other admins');
    }
    const { email } = data;
    if (!email) {
        throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }
    try {
        const auth = (0, auth_1.getAuth)();
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: false });
        // Remove user from admins collection
        await firebase_1.db.collection('admins').doc(user.uid).delete();
        return { message: `Success! ${email} has been removed as an admin.` };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error removing admin role');
    }
});
//# sourceMappingURL=admin.js.map