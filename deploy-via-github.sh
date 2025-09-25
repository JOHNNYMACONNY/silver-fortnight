#!/bin/bash

# Deploy Firestore Rules via GitHub Actions
# This script commits the changes and pushes to trigger the GitHub Action

echo "🚀 Deploying Firestore Rules via GitHub Actions..."
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run this from your project root."
    exit 1
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  No changes to commit. Rules may already be up to date."
    echo "   If you want to force deployment, you can:"
    echo "   git commit --allow-empty -m 'Force deploy Firestore rules'"
    echo "   git push"
    exit 0
fi

echo "📝 Staging changes..."
git add firestore.rules
git add .github/workflows/deploy-firestore-rules.yml

echo "💾 Committing changes..."
git commit -m "Deploy Firestore security rules

- Deploy firestore.rules to fix permission issues
- Add GitHub Action for automatic deployment
- Fixes 'Missing or insufficient permissions' error
- Enables messages page to load conversations"

echo "📤 Pushing to GitHub..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Changes pushed to GitHub."
    echo ""
    echo "🔄 GitHub Action will now deploy the Firestore rules automatically."
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to your GitHub repository"
    echo "2. Click the 'Actions' tab"
    echo "3. Watch the 'Deploy Firestore Security Rules' workflow"
    echo "4. Wait for it to complete (usually takes 1-2 minutes)"
    echo ""
    echo "🎉 Once complete, your messages page should work!"
    echo ""
    echo "💡 If you haven't set up the FIREBASE_TOKEN secret yet:"
    echo "   Run: ./get-firebase-token.sh"
    echo "   Then add the token as a GitHub secret named FIREBASE_TOKEN"
else
    echo "❌ Failed to push to GitHub."
    echo "💡 Check your git configuration and try again."
fi