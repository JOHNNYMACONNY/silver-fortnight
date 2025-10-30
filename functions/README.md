# TradeYa Firebase Cloud Functions

This directory contains the Firebase Cloud Functions for TradeYa, including scheduled jobs for trade reminders, auto-completion, and challenge management.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Available Functions](#available-functions)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### First Time Setup

```bash
# Install dependencies (will automatically build TypeScript)
cd functions
npm install

# The postinstall script automatically runs 'npm run build'
# You'll see: lib/index.js and lib/challengesScheduler.js generated
```

### Local Development

```bash
# From project root
npm run functions:serve

# Or from functions directory
npm run serve
```

This will:
1. Build TypeScript → JavaScript
2. Start Firebase emulators
3. Watch for changes

---

## 💻 Development Workflow

### Available Scripts

**From project root:**
```bash
npm run functions:build        # Build with full npm ci
npm run functions:build:fast   # Build with cached dependencies
npm run functions:deploy       # Deploy to Firebase
npm run functions:serve        # Run local emulators
npm run functions:logs         # View production logs
```

**From functions/ directory:**
```bash
npm run build              # Compile TypeScript
npm run build:watch        # Watch mode for development
npm run clean              # Remove compiled files
npm run deploy             # Clean, build, and deploy
npm run serve              # Local Firebase emulators
```

### Making Changes

1. **Edit source files** in `src/`
   - `src/index.ts` - Main function exports
   - `src/challengesScheduler.ts` - Challenge scheduling logic

2. **TypeScript compiles to** `lib/`
   - `lib/index.js`
   - `lib/challengesScheduler.js`
   - These files are **gitignored** (never commit them!)

3. **Test locally:**
   ```bash
   npm run serve
   ```

4. **Deploy to production:**
   ```bash
   npm run deploy
   ```

---

## 🚀 Deployment

### Standard Deployment

```bash
# From project root
npm run functions:deploy

# Or from functions directory
npm run deploy
```

This runs: `clean → build → firebase deploy --only functions`

### What Happens During Deployment

1. ✅ Removes old compiled files (`npm run clean`)
2. ✅ Compiles TypeScript → JavaScript (`npm run build`)
3. ✅ Uploads `lib/` directory to Firebase
4. ✅ Registers scheduled functions

### CI/CD Deployment

GitHub Actions / CI systems should:

```bash
cd functions
npm ci --ignore-scripts  # Install without running postinstall
npm run build            # Explicit build
firebase deploy --only functions
```

Or use the root-level scripts:
```bash
npm run functions:build:fast  # Optimized for CI
npm run functions:deploy
```

---

## 📦 Available Functions

### Trade Management

#### `checkPendingConfirmations`
- **Schedule**: Every 24 hours
- **Purpose**: Sends reminders for pending trade confirmations
- **Reminder Schedule**:
  - Day 3: First reminder
  - Day 7: Second reminder
  - Day 10: Final reminder

#### `autoCompletePendingTrades`
- **Schedule**: Every 24 hours
- **Purpose**: Auto-completes trades after 14 days without confirmation
- **Action**: Marks trade as completed and notifies both users

### Challenge Management

#### `activateChallenges`
- **Schedule**: Every 1 hour
- **Purpose**: Activates scheduled challenges that have reached their start date

#### `completeChallenges`
- **Schedule**: Every 1 hour
- **Purpose**: Completes expired challenges past their deadline

#### `scheduleWeeklyChallenges`
- **Schedule**: Every Monday at 00:00
- **Purpose**: Creates recurring weekly challenges

---

## 📁 Project Structure

```
functions/
├── src/                          # TypeScript source files
│   ├── index.ts                  # Main entry point
│   ├── challengesScheduler.ts    # Challenge scheduling logic
│   └── __tests__/                # Test files
│       └── challengesScheduler.test.ts
│
├── lib/                          # Compiled JavaScript (gitignored)
│   ├── index.js                  # Generated from src/index.ts
│   └── challengesScheduler.js    # Generated from src/challengesScheduler.ts
│
├── .gitignore                    # Ignores lib/ and build artifacts
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

### Important Notes

- ✅ **`src/`** is tracked in Git
- ❌ **`lib/`** is **NOT** tracked in Git (auto-generated)
- ⚙️ **`lib/`** is automatically built on `npm install` via `postinstall` hook

---

## 🔧 Troubleshooting

### "Cannot find module './challengesScheduler'"

**Problem**: The compiled JavaScript files are missing.

**Solution**:
```bash
cd functions
npm run build
```

### "Functions not updating after code changes"

**Problem**: TypeScript wasn't recompiled.

**Solution**:
```bash
# Option 1: Manual rebuild
npm run build

# Option 2: Watch mode (auto-rebuilds on save)
npm run build:watch
```

### "Fresh clone won't deploy"

**Problem**: `lib/` directory is empty after cloning.

**Solution**: This is expected! Run:
```bash
npm install  # Automatically builds via postinstall
```

### "Deployment fails with missing files"

**Problem**: Trying to deploy without building first.

**Solution**: Always use the deploy script:
```bash
npm run deploy  # Includes automatic build
```

---

## 🎯 Best Practices

### ✅ DO

- ✅ Edit source files in `src/`
- ✅ Use `npm run deploy` for production deployments
- ✅ Test locally with `npm run serve` before deploying
- ✅ Let `postinstall` handle builds automatically
- ✅ Commit changes to `src/` only

### ❌ DON'T

- ❌ Edit files in `lib/` directly (they get overwritten)
- ❌ Commit `lib/` directory to Git
- ❌ Deploy without running build first
- ❌ Use `firebase deploy` directly (use npm scripts)

---

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [TypeScript for Cloud Functions](https://firebase.google.com/docs/functions/typescript)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Firebase Functions logs: `npm run logs`
3. Test locally first: `npm run serve`
4. Check the [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated**: October 30, 2025

