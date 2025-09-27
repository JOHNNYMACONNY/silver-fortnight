import type {
  DocumentReference,
  DocumentData,
  Firestore,
} from "@firebase/firestore";

import type { FirebaseStorage, StorageReference } from "@firebase/storage";

import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { uploadBytes, ref } from "firebase/storage";
import { getRules } from "../__mocks__/firebaseRules.js";

// Import testing utilities using CommonJS require for Jest compatibility
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");

interface TestData extends DocumentData {
  name?: string;
  email?: string;
  creatorId?: string;
  participantIds?: string[];
  status?: "pending" | "active" | "completed" | "cancelled";
  createdAt?: Date;
  content?: string;
  timestamp?: Date;
  details?: Record<string, unknown>;
}

interface TestEnv {
  authenticatedContext: (
    uid: string,
    claims?: Record<string, any>
  ) => {
    firestore: () => Firestore;
    storage: () => FirebaseStorage;
  };
  unauthenticatedContext: () => {
    firestore: () => Firestore;
    storage: () => FirebaseStorage;
  };
  clearFirestore: () => Promise<void>;
  clearStorage: () => Promise<void>;
  cleanup: () => Promise<void>;
}

const projectId = "demo-test-project";
let testEnv: TestEnv;

describe("Firebase Security Rules", () => {
  beforeAll(async () => {
    // Default emulator ports for local testing
    const defaultFirestoreHost = "127.0.0.1";
    const defaultFirestorePort = 8080;
    const defaultStorageHost = "127.0.0.1";
    const defaultStoragePort = 9199;

    // Parse emulator host/port from environment or use defaults
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST
      ? process.env.FIRESTORE_EMULATOR_HOST.split(":")[0]
      : defaultFirestoreHost;
    const firestorePort = process.env.FIRESTORE_EMULATOR_HOST
      ? parseInt(process.env.FIRESTORE_EMULATOR_HOST.split(":")[1])
      : defaultFirestorePort;

    const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST
      ? process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":")[0]
      : defaultStorageHost;
    const storagePort = process.env.FIREBASE_STORAGE_EMULATOR_HOST
      ? parseInt(process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":")[1])
      : defaultStoragePort;

    const options = {
      projectId,
      firestore: {
        rules: getRules("firestore"),
        host: firestoreHost,
        port: firestorePort,
      },
      storage: {
        rules: getRules("storage"),
        host: storageHost,
        port: storagePort,
      },
    };

    testEnv = (await initializeTestEnvironment(options)) as TestEnv;
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  afterEach(async () => {
    await testEnv?.clearFirestore();
    await testEnv?.clearStorage();
  });

  describe("User Profiles", () => {
    it("allows users to read their own profile", async () => {
      const context = testEnv.authenticatedContext("alice");
      const db = context.firestore() as Firestore;
      const profileRef = doc(db, "users/alice") as DocumentReference<TestData>;

      await assertSucceeds(getDoc(profileRef));
    });

    it("prevents users from reading other profiles without permission", async () => {
      const context = testEnv.authenticatedContext("bob");
      const db = context.firestore() as Firestore;
      const aliceProfileRef = doc(
        db,
        "users/alice"
      ) as DocumentReference<TestData>;

      await assertFails(getDoc(aliceProfileRef));
    });

    it("allows users to update their own profile", async () => {
      const context = testEnv.authenticatedContext("alice");
      const db = context.firestore() as Firestore;
      const profileRef = doc(db, "users/alice") as DocumentReference<TestData>;

      await assertSucceeds(
        setDoc(profileRef, {
          name: "Alice Smith",
          email: "alice@example.com",
        })
      );
    });

    it("prevents users from updating other profiles", async () => {
      const context = testEnv.authenticatedContext("bob");
      const db = context.firestore() as Firestore;
      const aliceProfileRef = doc(
        db,
        "users/alice"
      ) as DocumentReference<TestData>;

      await assertFails(
        updateDoc(aliceProfileRef, {
          name: "Hacked Name",
        })
      );
    });
  });

  describe("Trade Records", () => {
    beforeEach(async () => {
      const adminContext = testEnv.authenticatedContext("admin", {
        isAdmin: true,
      });
      const db = adminContext.firestore() as Firestore;
      const tradeRef = doc(db, "trades/trade1") as DocumentReference<TestData>;

      await setDoc(tradeRef, {
        creatorId: "alice",
        participantIds: ["alice", "bob"],
        status: "pending",
        createdAt: new Date(),
        details: { description: "Test trade" },
      });
    });

    it("allows trade participants to read their trades", async () => {
      const context = testEnv.authenticatedContext("alice");
      const db = context.firestore() as Firestore;
      const tradeRef = doc(db, "trades/trade1") as DocumentReference<TestData>;

      await assertSucceeds(getDoc(tradeRef));
    });

    it("prevents non-participants from reading trades", async () => {
      const context = testEnv.authenticatedContext("charlie");
      const db = context.firestore() as Firestore;
      const tradeRef = doc(db, "trades/trade1") as DocumentReference<TestData>;

      await assertFails(getDoc(tradeRef));
    });
  });

  describe("Storage Rules", () => {
    describe("Profile Images", () => {
      it("allows users to upload their own profile image", async () => {
        const context = testEnv.authenticatedContext("alice");
        const storage = context.storage() as FirebaseStorage;
        const imageRef = ref(
          storage,
          "users/alice/profile/avatar.jpg"
        ) as StorageReference;
        const imageBuffer = Buffer.from("fake-image-content");

        await assertSucceeds(
          uploadBytes(imageRef, imageBuffer, {
            contentType: "image/jpeg",
          })
        );
      });

      it("prevents users from uploading to other profiles", async () => {
        const context = testEnv.authenticatedContext("bob");
        const storage = context.storage() as FirebaseStorage;
        const imageRef = ref(
          storage,
          "users/alice/profile/avatar.jpg"
        ) as StorageReference;
        const imageBuffer = Buffer.from("fake-image-content");

        await assertFails(
          uploadBytes(imageRef, imageBuffer, {
            contentType: "image/jpeg",
          })
        );
      });

      it("enforces file size limits", async () => {
        const context = testEnv.authenticatedContext("alice");
        const storage = context.storage() as FirebaseStorage;
        const imageRef = ref(
          storage,
          "users/alice/profile/avatar.jpg"
        ) as StorageReference;
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

        await assertFails(
          uploadBytes(imageRef, largeBuffer, {
            contentType: "image/jpeg",
          })
        );
      });
    });
  });
});
