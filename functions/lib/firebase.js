"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = exports.db = void 0;
const admin = require("firebase-admin");
exports.db = admin.firestore();
// Retry mechanism for Firestore operations
const withRetry = async (operation, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }
    throw lastError;
};
exports.withRetry = withRetry;
//# sourceMappingURL=firebase.js.map