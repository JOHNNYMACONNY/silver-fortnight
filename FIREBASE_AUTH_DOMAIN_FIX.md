# Firebase Auth Unauthorized Domain Fix

## 🚨 The Problem

You're getting this error when trying to sign in on your PR preview:
```
Login Error
FirebaseError: Firebase: Error (auth/unauthorized-domain).
```

## 🔍 Root Cause

Firebase Authentication only allows requests from **authorized domains**. Your PR preview URL is not in the authorized domains list in your Firebase project.

## 🔧 The Solution

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tradeya-45ede**
3. Go to **Authentication** → **Settings** → **Authorized domains**

### Step 2: Add Your PR Preview Domain

1. Click **"Add domain"**
2. Add your specific PR preview domain (e.g., `your-pr-preview.vercel.app`)
3. Click **"Done"**

### Step 3: Add Wildcard Domains (Recommended)

Add these wildcard domains to handle all future PR previews:

- `*.vercel.app`
- `*.netlify.app` 
- `*.github.io`
- `*.web.app`
- `*.firebaseapp.com`

### Step 4: Save and Test

1. Click **"Save"** in Firebase Console
2. Wait 1-2 minutes for changes to propagate
3. Visit your PR preview URL
4. Try to sign in - it should now work!

## 🎯 Quick Fix Commands

If you know your exact PR preview URL, you can add it directly:

```bash
# Example: If your PR preview is https://tradeya-pr-123.vercel.app
# Add domain: tradeya-pr-123.vercel.app

# Or add wildcard domains for all future PRs:
# *.vercel.app
# *.netlify.app
```

## 🔍 How to Find Your PR Preview Domain

### If using Vercel:
- Check your Vercel dashboard
- Look for the preview URL (usually `https://tradeya-pr-XXX.vercel.app`)
- Or check the PR comment for the preview link

### If using Netlify:
- Check your Netlify dashboard
- Look for the deploy preview URL (usually `https://tradeya-pr-XXX.netlify.app`)

### If using GitHub Pages:
- Check your repository's Pages settings
- Look for the preview URL (usually `https://username.github.io/tradeya`)

## 🚨 Important Notes

1. **Wildcard domains** (like `*.vercel.app`) work for all subdomains
2. **Exact domains** are required for specific URLs
3. **Changes take effect immediately** - no need to redeploy
4. **Test thoroughly** after adding domains

## 🧪 Alternative Solutions

### Option 1: Use Firebase Auth Emulator for Development

If you want to test locally without domain restrictions:

```bash
# Start Firebase emulators
firebase emulators:start --only auth

# Update your .env file
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Option 2: Configure Dynamic Domain Authorization

For a more flexible solution, you can configure your app to handle multiple domains:

```typescript
// In your firebase-config.ts
const isLocalhost = window.location.hostname === 'localhost';
const isPreview = window.location.hostname.includes('vercel.app') || 
                  window.location.hostname.includes('netlify.app');

if (isLocalhost || isPreview) {
  // Use emulator or handle preview domains
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## 📞 Troubleshooting

### Still getting the error?

1. **Check the exact domain** in the error message
2. **Ensure no typos** in the domain name
3. **Clear browser cache** and cookies
4. **Wait 2-3 minutes** for changes to propagate
5. **Check Firebase Console** to confirm the domain was saved

### Common mistakes:

- ❌ Adding `https://` in the domain field (should be just the domain)
- ❌ Adding trailing slashes
- ❌ Not waiting for changes to propagate
- ❌ Adding the wrong domain (check the exact URL from your PR preview)

## 🔗 Quick Links

- [Firebase Console - Authentication](https://console.firebase.google.com/project/tradeya-45ede/authentication/settings)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Authorized Domains Guide](https://firebase.google.com/docs/auth/web/domain-restrictions)

## ✅ Expected Result

After adding the domains:
- ✅ Authentication will work on PR previews
- ✅ No more `auth/unauthorized-domain` errors
- ✅ Users can sign in successfully
- ✅ All Firebase Auth features will work

---

**This fix should resolve your authentication issues on PR previews!** 🎉