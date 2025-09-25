# Google OAuth Firebase Console Setup

## Required Steps in Firebase Console:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/tradeya-45ede/authentication/providers

2. **Enable Google Provider**:
   - Click on "Google" in the Sign-in providers list
   - Toggle "Enable" to ON
   - Add your project's support email
   - Click "Save"

3. **Add Authorized Domains**:
   - Go to Authentication → Settings → Authorized domains
   - Add: `localhost` (for development)
   - Add: `tradeya-45ede.firebaseapp.com` (for production)
   - Add: `tradeya-45ede.web.app` (for production)

4. **Verify OAuth Client**:
   - The OAuth client should be automatically created
   - If not, you may need to create one in Google Cloud Console

## Test After Setup:
- Restart your dev server
- Try Google Sign-In again
- Check browser console for any remaining errors

