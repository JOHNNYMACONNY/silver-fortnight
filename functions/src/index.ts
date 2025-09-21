import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  activateScheduledChallenges,
  completeExpiredChallenges,
  scheduleRecurringChallenges,
} from "./challengesScheduler";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Interface for Trade document
interface Trade {
  id?: string;
  creatorId: string;
  participantId?: string;
  title: string;
  status:
    | "open"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "pending_confirmation"
    | "pending_evidence"
    | "disputed";
  completionRequestedBy?: string;
  completionRequestedAt?: admin.firestore.Timestamp;
  completionConfirmedAt?: admin.firestore.Timestamp;
  autoCompleted?: boolean;
  autoCompletionReason?: string;
  remindersSent?: number;
  updatedAt: admin.firestore.Timestamp;
}

// Interface for Notification
interface NotificationData {
  userId: string;
  type: string;
  title: string;
  content: string;
  relatedId?: string;
  priority: "low" | "medium" | "high";
}

// Helper function to create notifications
const createNotification = async (data: NotificationData): Promise<void> => {
  try {
    await db.collection("notifications").add({
      ...data,
      createdAt: admin.firestore.Timestamp.now(),
      read: false,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Cloud Function to check for pending confirmations and send reminders
export const checkPendingConfirmations = onSchedule(
  "every 24 hours",
  async () => {
    console.log("Starting pending confirmations check...");

    try {
      const now = admin.firestore.Timestamp.now();
      const threeDaysAgo = new Date(now.toMillis() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.toMillis() - 10 * 24 * 60 * 60 * 1000);

      // Query trades with pending confirmations
      const pendingTradesSnapshot = await db
        .collection("trades")
        .where("status", "==", "pending_confirmation")
        .get();

      console.log(`Found ${pendingTradesSnapshot.docs.length} pending trades`);

      for (const tradeDoc of pendingTradesSnapshot.docs) {
        const trade = tradeDoc.data() as Trade;

        if (!trade.completionRequestedAt || !trade.completionRequestedBy) {
          continue;
        }

        const completionRequestedAt = trade.completionRequestedAt.toDate();
        const recipientId =
          trade.completionRequestedBy === trade.creatorId
            ? trade.participantId
            : trade.creatorId;

        if (!recipientId) {
          continue;
        }

        const remindersSent = trade.remindersSent || 0;

        // Determine which reminder to send
        if (completionRequestedAt <= tenDaysAgo && remindersSent < 3) {
          // Send final reminder
          await createNotification({
            userId: recipientId,
            type: "trade_confirmation",
            title: "Final Reminder: Trade Completion",
            content: `This is your final reminder to confirm completion of trade: ${trade.title}. The trade will be auto-completed in 4 days if no action is taken.`,
            relatedId: tradeDoc.id,
            priority: "high",
          });

          // Update reminders sent count
          await tradeDoc.ref.update({
            remindersSent: 3,
            updatedAt: now,
          });

          console.log(`Sent final reminder for trade ${tradeDoc.id}`);
        } else if (completionRequestedAt <= sevenDaysAgo && remindersSent < 2) {
          // Send second reminder
          await createNotification({
            userId: recipientId,
            type: "trade_confirmation",
            title: "Reminder: Trade Completion",
            content: `Please confirm completion of trade: ${trade.title}. This trade has been pending for 7 days.`,
            relatedId: tradeDoc.id,
            priority: "medium",
          });

          // Update reminders sent count
          await tradeDoc.ref.update({
            remindersSent: 2,
            updatedAt: now,
          });

          console.log(`Sent second reminder for trade ${tradeDoc.id}`);
        } else if (completionRequestedAt <= threeDaysAgo && remindersSent < 1) {
          // Send first reminder
          await createNotification({
            userId: recipientId,
            type: "trade_confirmation",
            title: "Reminder: Trade Completion",
            content: `Please confirm completion of trade: ${trade.title}. Your partner is waiting for your confirmation.`,
            relatedId: tradeDoc.id,
            priority: "low",
          });

          // Update reminders sent count
          await tradeDoc.ref.update({
            remindersSent: 1,
            updatedAt: now,
          });

          console.log(`Sent first reminder for trade ${tradeDoc.id}`);
        }
      }

      console.log("Pending confirmations check completed");
    } catch (error) {
      console.error("Error in checkPendingConfirmations:", error);
      throw error;
    }
  }
);

// Cloud Function to auto-complete pending trades
export const autoCompletePendingTrades = onSchedule(
  "every 24 hours",
  async () => {
    console.log("Starting auto-completion check...");

    try {
      const now = admin.firestore.Timestamp.now();
      const fourteenDaysAgo = new Date(
        now.toMillis() - 14 * 24 * 60 * 60 * 1000
      );

      // Query trades with pending confirmations older than 14 days
      const pendingTradesSnapshot = await db
        .collection("trades")
        .where("status", "==", "pending_confirmation")
        .where(
          "completionRequestedAt",
          "<=",
          admin.firestore.Timestamp.fromDate(fourteenDaysAgo)
        )
        .get();

      console.log(
        `Found ${pendingTradesSnapshot.docs.length} trades to auto-complete`
      );

      for (const tradeDoc of pendingTradesSnapshot.docs) {
        const trade = tradeDoc.data() as Trade;

        // Auto-complete the trade
        await tradeDoc.ref.update({
          status: "completed",
          completionConfirmedAt: now,
          autoCompleted: true,
          autoCompletionReason: "No response after 14 days",
          updatedAt: now,
        });

        // Notify both users
        const users = [trade.creatorId, trade.participantId].filter(Boolean);
        for (const userId of users) {
          await createNotification({
            userId: userId!,
            type: "trade_completion",
            title: "Trade Auto-Completed",
            content: `Trade "${trade.title}" has been automatically marked as completed due to no response after 14 days.`,
            relatedId: tradeDoc.id,
            priority: "medium",
          });
        }

        console.log(`Auto-completed trade ${tradeDoc.id}: ${trade.title}`);
      }

      console.log("Auto-completion check completed");
    } catch (error) {
      console.error("Error in autoCompletePendingTrades:", error);
      throw error;
    }
  }
);

// Challenge schedulers (MVP)
export const activateChallenges = onSchedule("every 1 hours", async () => {
  const res = await activateScheduledChallenges();
  if (res.error) throw new Error(res.error);
});

export const completeChallenges = onSchedule("every 1 hours", async () => {
  const res = await completeExpiredChallenges();
  if (res.error) throw new Error(res.error);
});

export const scheduleWeeklyChallenges = onSchedule(
  "every monday 00:00",
  async () => {
    const res = await scheduleRecurringChallenges();
    if (res.error) throw new Error(res.error);
  }
);
