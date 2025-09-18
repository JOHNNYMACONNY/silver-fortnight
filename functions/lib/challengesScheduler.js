"use strict";
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
exports.scheduleRecurringChallenges = exports.completeExpiredChallenges = exports.activateScheduledChallenges = void 0;
var admin = require("firebase-admin");
var db = admin.firestore();
var activateScheduledChallenges = function () { return __awaiter(void 0, void 0, void 0, function () {
    var now_1, snap, activated_1, batch_1, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                now_1 = admin.firestore.Timestamp.now();
                return [4 /*yield*/, db.collection('challenges')
                        .where('status', '==', 'upcoming')
                        .where('startDate', '<=', now_1)
                        .get()];
            case 1:
                snap = _a.sent();
                activated_1 = 0;
                batch_1 = db.batch();
                snap.forEach(function (docSnap) {
                    batch_1.update(docSnap.ref, { status: 'active', lastUpdatedAt: now_1 });
                    activated_1 += 1;
                });
                if (!(activated_1 > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, batch_1.commit()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/, { activated: activated_1, error: null }];
            case 4:
                e_1 = _a.sent();
                return [2 /*return*/, { activated: 0, error: (e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || 'Failed to activate scheduled challenges' }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.activateScheduledChallenges = activateScheduledChallenges;
var completeExpiredChallenges = function () { return __awaiter(void 0, void 0, void 0, function () {
    var now_2, snap, completed_1, batch_2, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                now_2 = admin.firestore.Timestamp.now();
                return [4 /*yield*/, db.collection('challenges')
                        .where('status', '==', 'active')
                        .where('endDate', '<=', now_2)
                        .get()];
            case 1:
                snap = _a.sent();
                completed_1 = 0;
                batch_2 = db.batch();
                snap.forEach(function (docSnap) {
                    batch_2.update(docSnap.ref, { status: 'completed', lastUpdatedAt: now_2 });
                    completed_1 += 1;
                });
                if (!(completed_1 > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, batch_2.commit()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/, { completed: completed_1, error: null }];
            case 4:
                e_2 = _a.sent();
                return [2 /*return*/, { completed: 0, error: (e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || 'Failed to complete expired challenges' }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.completeExpiredChallenges = completeExpiredChallenges;
var scheduleRecurringChallenges = function () { return __awaiter(void 0, void 0, void 0, function () {
    var now_3, aWeek_1, templates, scheduled_1, batch_3, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                now_3 = admin.firestore.Timestamp.now();
                aWeek_1 = 7 * 24 * 60 * 60 * 1000;
                return [4 /*yield*/, db.collection('challengeTemplates')
                        .where('recurrence', 'in', ['daily', 'weekly'])
                        .limit(20)
                        .get()];
            case 1:
                templates = _a.sent();
                scheduled_1 = 0;
                batch_3 = db.batch();
                templates.forEach(function (t) {
                    var data = t.data();
                    var nextStart = data.recurrence === 'daily'
                        ? admin.firestore.Timestamp.fromMillis(now_3.toMillis() + 24 * 60 * 60 * 1000)
                        : admin.firestore.Timestamp.fromMillis(now_3.toMillis() + aWeek_1);
                    var nextEnd = data.recurrence === 'daily'
                        ? admin.firestore.Timestamp.fromMillis(nextStart.toMillis() + 24 * 60 * 60 * 1000)
                        : admin.firestore.Timestamp.fromMillis(nextStart.toMillis() + aWeek_1);
                    var ref = db.collection('challenges').doc();
                    batch_3.set(ref, {
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
                        createdAt: now_3,
                    });
                    scheduled_1 += 1;
                });
                if (!(scheduled_1 > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, batch_3.commit()];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/, { scheduled: scheduled_1, error: null }];
            case 4:
                e_3 = _a.sent();
                return [2 /*return*/, { scheduled: 0, error: (e_3 === null || e_3 === void 0 ? void 0 : e_3.message) || 'Failed to schedule recurring challenges' }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.scheduleRecurringChallenges = scheduleRecurringChallenges;
