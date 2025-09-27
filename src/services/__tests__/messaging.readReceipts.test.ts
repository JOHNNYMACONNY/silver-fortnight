import fs from "fs";
import path from "path";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  setDoc,
  doc,
  addDoc,
  collection,
  getDocs,
  getDoc,
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;
const projectId = "demo-tradeya-messaging";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const emulatorAvailable = !!emulatorHost;

beforeAll(async () => {
  if (!emulatorAvailable) return;
  const rules = fs.readFileSync(
    path.resolve(process.cwd(), "firestore.rules"),
    "utf8"
  );
  const mod = await import("../../types/firebase-test.cjs");
  const { initializeTestEnvironment } = "default" in mod ? mod.default : mod;
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });

  // Seed data with rules disabled
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    if (typeof (db as any).collection === "function") {
      // Use compat-style writes when RulesTestEnvironment provides a compat Firestore
      const compatDb: any = db as any;
      await compatDb
        .collection("users")
        .doc("u1")
        .set({
          roles: ["user"],
          displayName: "User One",
        });
      await compatDb
        .collection("users")
        .doc("u2")
        .set({
          roles: ["user"],
          displayName: "User Two",
        });

      await compatDb
        .collection("conversations")
        .doc("c1")
        .set({
          participantIds: ["u1", "u2"],
          participants: [
            { id: "u1", name: "User One" },
            { id: "u2", name: "User Two" },
          ],
          type: "direct",
          createdAt: new Date(),
          updatedAt: new Date(),
          schemaVersion: "v1",
        });

      await compatDb
        .collection("conversations")
        .doc("c1")
        .collection("messages")
        .add({
          conversationId: "c1",
          senderId: "u2",
          senderName: "User Two",
          content: "Hello!",
          createdAt: new Date(),
          readBy: [],
        });
      await compatDb
        .collection("conversations")
        .doc("c1")
        .collection("messages")
        .add({
          conversationId: "c1",
          senderId: "u2",
          senderName: "User Two",
          content: "Are you there?",
          createdAt: new Date(),
          readBy: [],
        });
    } else {
      // Fallback to modular helpers if db is modular
      // Users
      await setDoc(doc(db as any, "users", "u1"), {
        roles: ["user"],
        displayName: "User One",
      });
      await setDoc(doc(db as any, "users", "u2"), {
        roles: ["user"],
        displayName: "User Two",
      });

      // Conversation
      await setDoc(doc(db as any, "conversations", "c1"), {
        participantIds: ["u1", "u2"],
        participants: [
          { id: "u1", name: "User One" },
          { id: "u2", name: "User Two" },
        ],
        type: "direct",
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: "v1",
      });

      // Messages (unread by u1)
      await addDoc(collection(db as any, "conversations", "c1", "messages"), {
        conversationId: "c1",
        senderId: "u2",
        senderName: "User Two",
        content: "Hello!",
        createdAt: new Date(),
        readBy: [],
      });
      await addDoc(collection(db as any, "conversations", "c1", "messages"), {
        conversationId: "c1",
        senderId: "u2",
        senderName: "User Two",
        content: "Are you there?",
        createdAt: new Date(),
        readBy: [],
      });
    }
  });
});

afterAll(async () => {
  if (!emulatorAvailable || !testEnv) return;
  await testEnv.cleanup();
});

describe("Messaging read receipts", () => {
  const maybeIt = emulatorAvailable ? it : it.skip;

  maybeIt(
    "markMessagesAsRead adds userId to readBy for unread messages",
    async () => {
      const db = testEnv.authenticatedContext("u1").firestore();
      const { markMessagesAsRead } = await import("../chat/chatService");
      await markMessagesAsRead("c1", "u1", db);

      if (typeof (db as any).collection === "function") {
        const compatDb: any = db as any;
        const snap = await compatDb
          .collection("conversations")
          .doc("c1")
          .collection("messages")
          .get();
        const allHaveU1 = snap.docs.every((doc: any) => {
          const data = doc.data();
          return data.readBy?.includes("u1") || data.senderId === "u1";
        });
        expect(allHaveU1).toBe(true);
      } else {
        const msgsSnap = await getDocs(
          collection(db as any, "conversations", "c1", "messages")
        );
        const allHaveU1 = msgsSnap.docs.every(
          (d) =>
            (d.data() as any).readBy?.includes("u1") ||
            (d.data() as any).senderId === "u1"
        );
        expect(allHaveU1).toBe(true);
      }
    },
    20000
  );
});
