#!/bin/bash

# Deploy Firestore Security Rules
# This script helps deploy the security rules to fix the permissions issue

echo "🔧 Deploying Firestore Security Rules..."

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    echo "   Then run this script again."
    exit 1
fi

# Deploy the rules
echo "📤 Deploying security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Security rules deployed successfully!"
    echo "🔄 The messages page should now work correctly."
else
    echo "❌ Failed to deploy security rules."
    echo "💡 Try running: firebase login"
    echo "   Then run this script again."
fi