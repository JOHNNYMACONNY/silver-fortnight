/**
 * Setup script for Firebase Auth Emulator
 * Creates test users for automated profiling tests
 */

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';

const EMULATOR_CONFIG = {
  apiKey: 'fake-api-key-for-emulator',
  authDomain: 'localhost',
  projectId: 'demo-test-project',
  storageBucket: 'demo-test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'fake-app-id',
};

const TEST_USER = {
  email: 'test-profiling@example.com',
  password: 'TestPassword123!',
  uid: 'test-profiling-user-id',
  displayName: 'Test Profiling User',
};

async function setupEmulatorUsers() {
  console.log('🔧 Setting up Firebase Auth Emulator users...');

  // Clean up existing apps
  const existingApps = getApps();
  for (const app of existingApps) {
    await deleteApp(app);
  }

  // Initialize Firebase with emulator config
  const app = initializeApp(EMULATOR_CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Connect to emulators
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('✅ Connected to Firebase emulators');
  } catch (error) {
    console.log('⚠️  Emulator already connected or connection failed:', error);
  }

  try {
    // Try to create the test user
    console.log(`📝 Creating test user: ${TEST_USER.email}`);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER.email,
      TEST_USER.password
    );

    console.log(`✅ Test user created with UID: ${userCredential.user.uid}`);

    // Create user profile in Firestore
    const userProfileData = {
      uid: userCredential.user.uid,
      email: TEST_USER.email,
      displayName: TEST_USER.displayName,
      username: 'test-profiling-user',
      bio: 'Test user for performance profiling',
      skills: ['JavaScript', 'TypeScript', 'React', 'Firebase'],
      location: 'Test City, TC',
      website: 'https://example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followersCount: 42,
      followingCount: 24,
      collaborationsCount: 15,
      tradesCount: 8,
      reviewsCount: 12,
      averageRating: 4.5,
      completionRate: 95,
      responseTime: 2.5,
      isVerified: true,
      badges: ['early-adopter', 'top-contributor', 'verified'],
      preferences: {
        emailNotifications: true,
        pushNotifications: true,
        theme: 'light',
      },
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userProfileData);
    console.log('✅ User profile created in Firestore');

    // Create some sample collaborations
    for (let i = 1; i <= 5; i++) {
      await setDoc(doc(db, 'collaborations', `collab-${i}`), {
        id: `collab-${i}`,
        title: `Test Collaboration ${i}`,
        description: `This is test collaboration number ${i}`,
        participants: [userCredential.user.uid, `other-user-${i}`],
        status: i % 2 === 0 ? 'active' : 'completed',
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Sample collaborations created');

    // Create some sample trades
    for (let i = 1; i <= 5; i++) {
      await setDoc(doc(db, 'trades', `trade-${i}`), {
        id: `trade-${i}`,
        title: `Test Trade ${i}`,
        description: `This is test trade number ${i}`,
        offeredBy: userCredential.user.uid,
        requestedBy: `other-user-${i}`,
        status: ['pending', 'active', 'completed'][i % 3],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log('✅ Sample trades created');

    console.log('\n✅ Emulator setup complete!');
    console.log(`\n📋 Test User Credentials:`);
    console.log(`   Email: ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
    console.log(`   UID: ${userCredential.user.uid}`);

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Test user already exists, signing in to verify...');
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          TEST_USER.email,
          TEST_USER.password
        );
        console.log(`✅ Test user verified with UID: ${userCredential.user.uid}`);
      } catch (signInError) {
        console.error('❌ Failed to sign in with existing user:', signInError);
        throw signInError;
      }
    } else {
      console.error('❌ Error setting up emulator users:', error);
      throw error;
    }
  } finally {
    // Clean up
    await deleteApp(app);
  }
}

// Run setup if called directly
// ES module check instead of require.main === module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  setupEmulatorUsers()
    .then(() => {
      console.log('\n✅ Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupEmulatorUsers, TEST_USER, EMULATOR_CONFIG };

