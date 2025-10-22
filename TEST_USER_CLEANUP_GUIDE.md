# Test User Cleanup Guide

## Overview
This guide helps you identify and remove test users that were created during development and testing.

## Methods to Remove Test Users

### Method 1: Using the Admin Dashboard (Recommended)

1. **Access Admin Dashboard**
   - Navigate to `/admin` in your application
   - Make sure you're logged in as an admin user

2. **View Users**
   - Click on the "Users" tab in the admin dashboard
   - You'll see a list of all users with their details

3. **Identify Test Users**
   Look for users with:
   - Email patterns like: `test@example.com`, `demo@test.com`, `fake@email.com`
   - Display names like: "Test User", "Demo User", "Anonymous"
   - Recent creation dates (if they were created during testing)

4. **Delete Test Users**
   - Click the red "Delete" button next to any test user
   - Confirm the deletion in the popup dialog
   - The user will be permanently removed from the database

### Method 2: Using the Cleanup Script

1. **Install Dependencies**
   ```bash
   npm install firebase
   ```

2. **Set Environment Variables**
   Make sure your `.env` file has the Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Run the Cleanup Script**
   ```bash
   # Scan for test users (dry run)
   node src/scripts/cleanup-test-users.js
   
   # Actually delete test users (after reviewing the list)
   node src/scripts/cleanup-test-users.js --delete
   ```

## Test User Patterns

The system automatically identifies test users based on these patterns:

### Email Patterns
- `test*@*.com`
- `*test*@example.com`
- `demo*@*.com`
- `fake*@*.com`
- `temp*@*.com`
- `*@test.com`
- `*@demo.com`
- `*@fake.com`
- `*@temp.com`

### Display Name Patterns
- "Test User"
- "Demo User"
- "Fake User"
- "Temp User"
- "User 1", "User 2", etc.
- "Anonymous"

### ID Patterns
- User IDs containing "test" or "demo"

## Safety Measures

1. **Confirmation Required**: Both methods require confirmation before deletion
2. **Admin Protection**: You cannot delete your own admin account
3. **Backup Recommended**: Consider backing up your database before bulk deletions
4. **Review First**: Always review the list of users to be deleted before confirming

## Common Test Users to Look For

Based on the development process, look for:
- Users created during profile image testing
- Users with placeholder data
- Users with test email addresses
- Recently created users during development sessions
- Users with minimal or fake profile information

## After Cleanup

1. **Verify Deletion**: Check the user directory page to confirm test users are gone
2. **Check Related Data**: Test users may have created trades, messages, or other data
3. **Clear Cache**: Refresh the application to ensure UI updates

## Troubleshooting

### If Admin Dashboard Doesn't Load
- Check that you're logged in as an admin user
- Verify your user role in the database
- Check browser console for errors

### If Script Fails
- Verify Firebase configuration
- Check network connectivity
- Ensure you have proper permissions

### If Some Users Won't Delete
- Check if they have related data (trades, messages)
- Verify the user ID is correct
- Check Firebase security rules

## Notes

- Deletion is permanent and cannot be undone
- Related data (trades, messages, etc.) may need separate cleanup
- Consider implementing soft deletion for production use
- Regular cleanup helps maintain database performance

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Firebase permissions
3. Review the cleanup script logs
4. Check the admin dashboard functionality
