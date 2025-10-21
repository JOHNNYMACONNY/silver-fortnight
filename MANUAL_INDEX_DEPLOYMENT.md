# Manual Firestore Index Creation

## 🎯 IMMEDIATE ACTION REQUIRED

The Firebase CLI deployment failed. Please create the required index manually:

### Step 1: Open Firebase Console

Open this URL in your browser:
<https://console.firebase.google.com/project/tradeya-45ede/firestore/indexes?tab=composite>

### Step 2: Create Composite Index

1. Click "+ Create Index" button
2. Set the following configuration:

**Collection ID:** migration-progress
**Query scope:** Collection

## ⚠️ CRITICAL: Field Name Format

**IMPORTANT**: The third field name is `__name__` with **double underscores** before and after "name". This is the Firestore document name field. Do NOT copy any markdown formatting when entering this field name.

### Step 3: Add Fields (in exact order)

Field 1:

- Field path: version
- Order: ASCENDING

Field 2:

- Field path: lastUpdate
- Order: DESCENDING

Field 3:

- Field path: `__name__`
- Order: ASCENDING

### Copy-Paste Field Names

To ensure accuracy, copy these exact field names when creating the index:

```
version
lastUpdate
__name__
```

### Step 4: Create Index

1. Click "Create Index"
2. Wait 2-5 minutes for index to build
3. Verify status shows "Enabled"

### Step 5: Verify Creation

The index should appear as:

- Collection: migration-progress
- Fields: version, lastUpdate, `__name__`
- Status: Enabled

### Step 6: Retry Migration

After the index is created and enabled:

```bash
npm run deploy:migration-fixes
```

## Troubleshooting

If you encounter issues:

1. Verify you have Firestore Admin permissions
2. Check you're in the correct project (tradeya-45ede)
3. **Ensure field names match exactly** - especially `__name__` with double underscores
4. **Do NOT copy markdown formatting** - use plain text field names only
5. Verify field order: `version` (ASC), `lastUpdate` (DESC), `__name__` (ASC)
6. Contact support if permissions are needed

## Alternative Commands

Try these Firebase CLI troubleshooting commands:

```bash
# Check CLI version
firebase --version

# Re-authenticate
firebase logout
firebase login

# Set project explicitly
firebase use tradeya-45ede

# Try deployment again
firebase deploy --only firestore:indexes --project tradeya-45ede
```
