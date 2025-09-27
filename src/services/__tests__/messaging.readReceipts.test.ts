import fs from "fs";
import path from "path";
import {
  initializeTestEnvironment,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
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
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });

  // Seed data with rules disabled
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Users
    await setDoc(doc(db, "users", "u1"), {
      roles: ["user"],
      displayName: "User One",
    });
    await setDoc(doc(db, "users", "u2"), {
      roles: ["user"],
      displayName: "User Two",
    });

    // Conversation
    await setDoc(doc(db, "conversations", "c1"), {
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
    await addDoc(collection(db, "conversations", "c1", "messages"), {
      conversationId: "c1",
      senderId: "u2",
      senderName: "User Two",
      content: "Hello!",
      createdAt: new Date(),
      readBy: [],
    });
    await addDoc(collection(db, "conversations", "c1", "messages"), {
      conversationId: "c1",
      senderId: "u2",
      senderName: "User Two",
      content: "Are you there?",
      createdAt: new Date(),
      readBy: [],
    });
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
      // Mock getSyncFirebaseDb to use emulator Firestore for u1
      await jest.isolateModulesAsync(async () => {
        jest.doMock("../../firebase-config", () => ({
          getSyncFirebaseDb: () =>
            testEnv.authenticatedContext("u1").firestore(),
        }));

        const { markMessagesAsRead } = await import("../chat/chatService");
        await markMessagesAsRead("c1", "u1");

        const db = testEnv.authenticatedContext("u1").firestore();
        const msgsSnap = await getDocs(
          collection(db, "conversations", "c1", "messages")
        );
        const allHaveU1 = msgsSnap.docs.every(
          (d) =>
            (d.data() as any).readBy?.includes("u1") ||
            (d.data() as any).senderId === "u1"
        );

        expect(allHaveU1).toBe(true);
      });
    },
    20000
  );
});
