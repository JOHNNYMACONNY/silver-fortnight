"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleWeeklyChallenges = exports.completeChallenges = exports.activateChallenges = exports.autoCompletePendingTrades = exports.checkPendingConfirmations = void 0;
var functions = require("firebase-functions");
var challengesScheduler_1 = require("./challengesScheduler");
var admin = require("firebase-admin");
// Use the scheduler from firebase-functions
var onSchedule = functions.scheduler.onSchedule;
// Initialize Firebase Admin
admin.initializeApp();
var db = admin.firestore();
// Helper function to create notifications
var createNotification = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db.collection("notifications").add(__assign(__assign({}, data), { createdAt: admin.firestore.Timestamp.now(), read: false }))];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Error creating notification:", error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Cloud Function to check for pending confirmations and send reminders
exports.checkPendingConfirmations = onSchedule("every 24 hours", function () { return __awaiter(void 0, void 0, void 0, function () {
    var now, threeDaysAgo, sevenDaysAgo, tenDaysAgo, pendingTradesSnapshot, _i, _a, tradeDoc, trade, completionRequestedAt, recipientId, remindersSent, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("Starting pending confirmations check...");
                _b.label = 1;
            case 1:
                _b.trys.push([1, 14, , 15]);
                now = admin.firestore.Timestamp.now();
                threeDaysAgo = new Date(now.toMillis() - 3 * 24 * 60 * 60 * 1000);
                sevenDaysAgo = new Date(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
                tenDaysAgo = new Date(now.toMillis() - 10 * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, db
                        .collection("trades")
                        .where("status", "==", "pending_confirmation")
                        .get()];
            case 2:
                pendingTradesSnapshot = _b.sent();
                console.log("Found ".concat(pendingTradesSnapshot.docs.length, " pending trades"));
                _i = 0, _a = pendingTradesSnapshot.docs;
                _b.label = 3;
            case 3:
                if (!(_i < _a.length)) return [3 /*break*/, 13];
                tradeDoc = _a[_i];
                trade = tradeDoc.data();
                if (!trade.completionRequestedAt || !trade.completionRequestedBy) {
                    return [3 /*break*/, 12];
                }
                completionRequestedAt = trade.completionRequestedAt.toDate();
                recipientId = trade.completionRequestedBy === trade.creatorId
                    ? trade.participantId
                    : trade.creatorId;
                if (!recipientId) {
                    return [3 /*break*/, 12];
                }
                remindersSent = trade.remindersSent || 0;
                if (!(completionRequestedAt <= tenDaysAgo && remindersSent < 3)) return [3 /*break*/, 6];
                // Send final reminder
                return [4 /*yield*/, createNotification({
                        userId: recipientId,
                        type: "trade_confirmation",
                        title: "Final Reminder: Trade Completion",
                        content: "This is your final reminder to confirm completion of trade: ".concat(trade.title, ". The trade will be auto-completed in 4 days if no action is taken."),
                        relatedId: tradeDoc.id,
                        priority: "high",
                    })];
            case 4:
                // Send final reminder
                _b.sent();
                // Update reminders sent count
                return [4 /*yield*/, tradeDoc.ref.update({
                        remindersSent: 3,
                        updatedAt: now,
                    })];
            case 5:
                // Update reminders sent count
                _b.sent();
                console.log("Sent final reminder for trade ".concat(tradeDoc.id));
                return [3 /*break*/, 12];
            case 6:
                if (!(completionRequestedAt <= sevenDaysAgo && remindersSent < 2)) return [3 /*break*/, 9];
                // Send second reminder
                return [4 /*yield*/, createNotification({
                        userId: recipientId,
                        type: "trade_confirmation",
                        title: "Reminder: Trade Completion",
                        content: "Please confirm completion of trade: ".concat(trade.title, ". This trade has been pending for 7 days."),
                        relatedId: tradeDoc.id,
                        priority: "medium",
                    })];
            case 7:
                // Send second reminder
                _b.sent();
                // Update reminders sent count
                return [4 /*yield*/, tradeDoc.ref.update({
                        remindersSent: 2,
                        updatedAt: now,
                    })];
            case 8:
                // Update reminders sent count
                _b.sent();
                console.log("Sent second reminder for trade ".concat(tradeDoc.id));
                return [3 /*break*/, 12];
            case 9:
                if (!(completionRequestedAt <= threeDaysAgo && remindersSent < 1)) return [3 /*break*/, 12];
                // Send first reminder
                return [4 /*yield*/, createNotification({
                        userId: recipientId,
                        type: "trade_confirmation",
                        title: "Reminder: Trade Completion",
                        content: "Please confirm completion of trade: ".concat(trade.title, ". Your partner is waiting for your confirmation."),
                        relatedId: tradeDoc.id,
                        priority: "low",
                    })];
            case 10:
                // Send first reminder
                _b.sent();
                // Update reminders sent count
                return [4 /*yield*/, tradeDoc.ref.update({
                        remindersSent: 1,
                        updatedAt: now,
                    })];
            case 11:
                // Update reminders sent count
                _b.sent();
                console.log("Sent first reminder for trade ".concat(tradeDoc.id));
                _b.label = 12;
            case 12:
                _i++;
                return [3 /*break*/, 3];
            case 13:
                console.log("Pending confirmations check completed");
                return [3 /*break*/, 15];
            case 14:
                error_2 = _b.sent();
                console.error("Error in checkPendingConfirmations:", error_2);
                throw error_2;
            case 15: return [2 /*return*/];
        }
    });
}); });
// Cloud Function to auto-complete pending trades
exports.autoCompletePendingTrades = onSchedule("every 24 hours", function () { return __awaiter(void 0, void 0, void 0, function () {
    var now, fourteenDaysAgo, pendingTradesSnapshot, _i, _a, tradeDoc, trade, users, _b, users_1, userId, error_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("Starting auto-completion check...");
                _c.label = 1;
            case 1:
                _c.trys.push([1, 11, , 12]);
                now = admin.firestore.Timestamp.now();
                fourteenDaysAgo = new Date(now.toMillis() - 14 * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, db
                        .collection("trades")
                        .where("status", "==", "pending_confirmation")
                        .where("completionRequestedAt", "<=", admin.firestore.Timestamp.fromDate(fourteenDaysAgo))
                        .get()];
            case 2:
                pendingTradesSnapshot = _c.sent();
                console.log("Found ".concat(pendingTradesSnapshot.docs.length, " trades to auto-complete"));
                _i = 0, _a = pendingTradesSnapshot.docs;
                _c.label = 3;
            case 3:
                if (!(_i < _a.length)) return [3 /*break*/, 10];
                tradeDoc = _a[_i];
                trade = tradeDoc.data();
                // Auto-complete the trade
                return [4 /*yield*/, tradeDoc.ref.update({
                        status: "completed",
                        completionConfirmedAt: now,
                        autoCompleted: true,
                        autoCompletionReason: "No response after 14 days",
                        updatedAt: now,
                    })];
            case 4:
                // Auto-complete the trade
                _c.sent();
                users = [trade.creatorId, trade.participantId].filter(Boolean);
                _b = 0, users_1 = users;
                _c.label = 5;
            case 5:
                if (!(_b < users_1.length)) return [3 /*break*/, 8];
                userId = users_1[_b];
                return [4 /*yield*/, createNotification({
                        userId: userId,
                        type: "trade_completion",
                        title: "Trade Auto-Completed",
                        content: "Trade \"".concat(trade.title, "\" has been automatically marked as completed due to no response after 14 days."),
                        relatedId: tradeDoc.id,
                        priority: "medium",
                    })];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7:
                _b++;
                return [3 /*break*/, 5];
            case 8:
                console.log("Auto-completed trade ".concat(tradeDoc.id, ": ").concat(trade.title));
                _c.label = 9;
            case 9:
                _i++;
                return [3 /*break*/, 3];
            case 10:
                console.log("Auto-completion check completed");
                return [3 /*break*/, 12];
            case 11:
                error_3 = _c.sent();
                console.error("Error in autoCompletePendingTrades:", error_3);
                throw error_3;
            case 12: return [2 /*return*/];
        }
    });
}); });
// Challenge schedulers (MVP)
exports.activateChallenges = onSchedule("every 1 hours", function () { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, challengesScheduler_1.activateScheduledChallenges)()];
            case 1:
                res = _a.sent();
                if (res.error)
                    throw new Error(res.error);
                return [2 /*return*/];
        }
    });
}); });
exports.completeChallenges = onSchedule("every 1 hours", function () { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, challengesScheduler_1.completeExpiredChallenges)()];
            case 1:
                res = _a.sent();
                if (res.error)
                    throw new Error(res.error);
                return [2 /*return*/];
        }
    });
}); });
exports.scheduleWeeklyChallenges = onSchedule("every monday 00:00", function () { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, challengesScheduler_1.scheduleRecurringChallenges)()];
            case 1:
                res = _a.sent();
                if (res.error)
                    throw new Error(res.error);
                return [2 /*return*/];
        }
    });
}); });
