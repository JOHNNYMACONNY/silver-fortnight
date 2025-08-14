### Challenges seeding and E2E runbook

This guide covers preparing Firebase, seeding `challenges`, and running the Playwright E2E for recommendations/filters.

#### Prerequisites
- Node.js 18+
- Firebase project credentials available as environment variables
- Playwright browsers installed

#### Environment variables (Vite web SDK)
Set these in your shell (or `.env.local`) before seeding/running the app:

```
export VITE_FIREBASE_API_KEY=YOUR_API_KEY
export VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
export VITE_FIREBASE_PROJECT_ID=your-project-id
export VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
export VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
export VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

Tip: verify presence quickly

```
node -e 'const k=["VITE_FIREBASE_API_KEY","VITE_FIREBASE_AUTH_DOMAIN","VITE_FIREBASE_PROJECT_ID"];console.log(JSON.stringify(Object.fromEntries(k.map(x=>[x,!!process.env[x]])),null,2))'
```

#### Firestore composite index
The active challenges subscription orders by `status ASC, endDate ASC`. Ensure this composite index exists in your project. Deploy indexes:

```
firebase deploy --only firestore:indexes --project "$VITE_FIREBASE_PROJECT_ID"
```

Reference: Firestore indexes docs (`https://firebase.google.com/docs/firestore/query-data/indexing`)

#### Seeding challenges
Seeds 24 randomized challenges with varied category, difficulty, type, and `endDate`, with rewards based on difficulty.

```
# Option A: Use a real seed user (recommended, aligns with Firestore rules)
export SEED_USER_EMAIL=you@example.com
export SEED_USER_PASSWORD=your-password
npm run seed:challenges

# Option B: Emulators (if enabled locally)
export VITE_USE_FIREBASE_EMULATORS=true
npm run seed:challenges

# Option C: Anonymous sign-in (requires Anonymous auth provider enabled)
# If anonymous sign-in is disabled, the seed will fail with PERMISSION_DENIED
npm run seed:challenges
```

Script: `scripts/seed-challenges.ts` (uses Firebase Web SDK via VITE_* env vars) and writes to `challenges/{id}`.

#### Playwright E2E
Playwright is configured to start the dev server at `http://localhost:5175` and will reuse it locally. Install browsers and run the single spec:

```
npx playwright install --with-deps
npx playwright test e2e/challenges-recommendations.spec.ts
```

Spec expectations:
- Navigates to `/challenges`, asserts “Recommended for you”
- Opens first “View Details”, attempts join if visible
- Navigates to `/challenges?type=solo`, asserts URL and at least one card via `data-testid`

#### Notes
- Vite dev server port is set to `5175` to align with Playwright config.
- App will fail to initialize Firebase if env vars are missing; set them before seeding/tests.
- Optional: to use emulators, wire emulator connections in `scripts/seed-challenges.ts` (not enabled by default). Emulator usage docs: (`https://firebase.google.com/docs/emulator-suite/connect_firestore`)


