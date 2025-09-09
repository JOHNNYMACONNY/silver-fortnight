# Firebase Security Rules Validation Report
Generated: Tue Sep  9 03:21:32 PDT 2025

## Validation Results

### Syntax Validation
No lint output produced in this run.
No lint output produced in this run.

### Security Tests

> test:security
> npm run security:test


> security:test
> jest --config jest.config.security.cjs

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/johnroberts/TradeYa Exp/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
FAIL security src/__tests__/firebase-security.test.ts
  Firebase Security Rules
    User Profiles
      ✕ allows users to read their own profile (2 ms)
      ✕ prevents users from reading other profiles without permission (1 ms)
      ✕ allows users to update their own profile (1 ms)
      ✕ prevents users from updating other profiles (2 ms)
    Trade Records
      ✕ allows trade participants to read their trades (1 ms)
      ✕ prevents non-participants from reading trades
    Storage Rules
      Profile Images
        ✕ allows users to upload their own profile image
        ✕ prevents users from uploading to other profiles
        ✕ enforces file size limits

  ● Firebase Security Rules › User Profiles › allows users to read their own profile

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      73 |   describe('User Profiles', () => {
      74 |     it('allows users to read their own profile', async () => {
    > 75 |       const context = testEnv.authenticatedContext('alice');
         |                               ^
      76 |       const db = context.firestore() as Firestore;
      77 |       const profileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      78 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:75:31)

  ● Firebase Security Rules › User Profiles › prevents users from reading other profiles without permission

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      81 |
      82 |     it('prevents users from reading other profiles without permission', async () => {
    > 83 |       const context = testEnv.authenticatedContext('bob');
         |                               ^
      84 |       const db = context.firestore() as Firestore;
      85 |       const aliceProfileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      86 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:83:31)

  ● Firebase Security Rules › User Profiles › allows users to update their own profile

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      89 |
      90 |     it('allows users to update their own profile', async () => {
    > 91 |       const context = testEnv.authenticatedContext('alice');
         |                               ^
      92 |       const db = context.firestore() as Firestore;
      93 |       const profileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      94 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:91:31)

  ● Firebase Security Rules › User Profiles › prevents users from updating other profiles

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      102 |
      103 |     it('prevents users from updating other profiles', async () => {
    > 104 |       const context = testEnv.authenticatedContext('bob');
          |                               ^
      105 |       const db = context.firestore() as Firestore;
      106 |       const aliceProfileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      107 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:104:31)

  ● Firebase Security Rules › Trade Records › allows trade participants to read their trades

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      116 |   describe('Trade Records', () => {
      117 |     beforeEach(async () => {
    > 118 |       const adminContext = testEnv.authenticatedContext('admin', { isAdmin: true });
          |                                    ^
      119 |       const db = adminContext.firestore() as Firestore;
      120 |       const tradeRef = doc(db, 'trades/trade1') as DocumentReference<TestData>;
      121 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:118:36)

  ● Firebase Security Rules › Trade Records › prevents non-participants from reading trades

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      116 |   describe('Trade Records', () => {
      117 |     beforeEach(async () => {
    > 118 |       const adminContext = testEnv.authenticatedContext('admin', { isAdmin: true });
          |                                    ^
      119 |       const db = adminContext.firestore() as Firestore;
      120 |       const tradeRef = doc(db, 'trades/trade1') as DocumentReference<TestData>;
      121 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:118:36)

  ● Firebase Security Rules › Storage Rules › Profile Images › allows users to upload their own profile image

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      149 |     describe('Profile Images', () => {
      150 |       it('allows users to upload their own profile image', async () => {
    > 151 |         const context = testEnv.authenticatedContext('alice');
          |                                 ^
      152 |         const storage = context.storage() as FirebaseStorage;
      153 |         const imageRef = ref(storage, 'users/alice/profile/avatar.jpg') as StorageReference;
      154 |         const imageBuffer = Buffer.from('fake-image-content');

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:151:33)

  ● Firebase Security Rules › Storage Rules › Profile Images › prevents users from uploading to other profiles

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      162 |
      163 |       it('prevents users from uploading to other profiles', async () => {
    > 164 |         const context = testEnv.authenticatedContext('bob');
          |                                 ^
      165 |         const storage = context.storage() as FirebaseStorage;
      166 |         const imageRef = ref(storage, 'users/alice/profile/avatar.jpg') as StorageReference;
      167 |         const imageBuffer = Buffer.from('fake-image-content');

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:164:33)

  ● Firebase Security Rules › Storage Rules › Profile Images › enforces file size limits

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      175 |
      176 |       it('enforces file size limits', async () => {
    > 177 |         const context = testEnv.authenticatedContext('alice');
          |                                 ^
      178 |         const storage = context.storage() as FirebaseStorage;
      179 |         const imageRef = ref(storage, 'users/alice/profile/avatar.jpg') as StorageReference;
      180 |         const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:177:33)

Test Suites: 1 failed, 1 total
Tests:       9 failed, 9 total
Snapshots:   0 total
Time:        1.953 s
Ran all test suites.

### Coverage Analysis

> test:security
> npm run security:test --coverage

npm warn Unknown cli config "--coverage". This will stop working in the next major version of npm.

> security:test
> jest --config jest.config.security.cjs

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /Users/johnroberts/TradeYa Exp/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
FAIL security src/__tests__/firebase-security.test.ts
  Firebase Security Rules
    User Profiles
      ✕ allows users to read their own profile (2 ms)
      ✕ prevents users from reading other profiles without permission (1 ms)
      ✕ allows users to update their own profile (1 ms)
      ✕ prevents users from updating other profiles (2 ms)
    Trade Records
      ✕ allows trade participants to read their trades (1 ms)
      ✕ prevents non-participants from reading trades
    Storage Rules
      Profile Images
        ✕ allows users to upload their own profile image (1 ms)
        ✕ prevents users from uploading to other profiles
        ✕ enforces file size limits (1 ms)

  ● Firebase Security Rules › User Profiles › allows users to read their own profile

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      73 |   describe('User Profiles', () => {
      74 |     it('allows users to read their own profile', async () => {
    > 75 |       const context = testEnv.authenticatedContext('alice');
         |                               ^
      76 |       const db = context.firestore() as Firestore;
      77 |       const profileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      78 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:75:31)

  ● Firebase Security Rules › User Profiles › prevents users from reading other profiles without permission

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      81 |
      82 |     it('prevents users from reading other profiles without permission', async () => {
    > 83 |       const context = testEnv.authenticatedContext('bob');
         |                               ^
      84 |       const db = context.firestore() as Firestore;
      85 |       const aliceProfileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      86 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:83:31)

  ● Firebase Security Rules › User Profiles › allows users to update their own profile

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      89 |
      90 |     it('allows users to update their own profile', async () => {
    > 91 |       const context = testEnv.authenticatedContext('alice');
         |                               ^
      92 |       const db = context.firestore() as Firestore;
      93 |       const profileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      94 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:91:31)

  ● Firebase Security Rules › User Profiles › prevents users from updating other profiles

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      102 |
      103 |     it('prevents users from updating other profiles', async () => {
    > 104 |       const context = testEnv.authenticatedContext('bob');
          |                               ^
      105 |       const db = context.firestore() as Firestore;
      106 |       const aliceProfileRef = doc(db, 'users/alice') as DocumentReference<TestData>;
      107 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:104:31)

  ● Firebase Security Rules › Trade Records › allows trade participants to read their trades

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      116 |   describe('Trade Records', () => {
      117 |     beforeEach(async () => {
    > 118 |       const adminContext = testEnv.authenticatedContext('admin', { isAdmin: true });
          |                                    ^
      119 |       const db = adminContext.firestore() as Firestore;
      120 |       const tradeRef = doc(db, 'trades/trade1') as DocumentReference<TestData>;
      121 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:118:36)

  ● Firebase Security Rules › Trade Records › prevents non-participants from reading trades

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      116 |   describe('Trade Records', () => {
      117 |     beforeEach(async () => {
    > 118 |       const adminContext = testEnv.authenticatedContext('admin', { isAdmin: true });
          |                                    ^
      119 |       const db = adminContext.firestore() as Firestore;
      120 |       const tradeRef = doc(db, 'trades/trade1') as DocumentReference<TestData>;
      121 |

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:118:36)

  ● Firebase Security Rules › Storage Rules › Profile Images › allows users to upload their own profile image

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      149 |     describe('Profile Images', () => {
      150 |       it('allows users to upload their own profile image', async () => {
    > 151 |         const context = testEnv.authenticatedContext('alice');
          |                                 ^
      152 |         const storage = context.storage() as FirebaseStorage;
      153 |         const imageRef = ref(storage, 'users/alice/profile/avatar.jpg') as StorageReference;
      154 |         const imageBuffer = Buffer.from('fake-image-content');

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:151:33)

  ● Firebase Security Rules › Storage Rules › Profile Images › prevents users from uploading to other profiles

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      162 |
      163 |       it('prevents users from uploading to other profiles', async () => {
    > 164 |         const context = testEnv.authenticatedContext('bob');
          |                                 ^
      165 |         const storage = context.storage() as FirebaseStorage;
      166 |         const imageRef = ref(storage, 'users/alice/profile/avatar.jpg') as StorageReference;
      167 |         const imageBuffer = Buffer.from('fake-image-content');

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:164:33)

  ● Firebase Security Rules › Storage Rules › Profile Images › enforces file size limits

    TypeError: Cannot read properties of undefined (reading 'authenticatedContext')

      175 |
      176 |       it('enforces file size limits', async () => {
    > 177 |         const context = testEnv.authenticatedContext('alice');
          |                                 ^
      178 |         const storage = context.storage() as FirebaseStorage;
      179 |         const imageRef = ref(storage, 'users/alice/profile/avatar.jpg') as StorageReference;
      180 |         const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      at Object.<anonymous> (src/__tests__/firebase-security.test.ts:177:33)

Test Suites: 1 failed, 1 total
Tests:       9 failed, 9 total
Snapshots:   0 total
Time:        1.395 s, estimated 2 s
Ran all test suites.

### Security Issues
npm error could not determine executable to run
npm error A complete log of this run can be found in: /Users/johnroberts/.npm/_logs/2025-09-09T10_21_29_033Z-debug-0.log

## Recommendations
