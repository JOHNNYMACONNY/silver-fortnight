#!/bin/bash
# Vercel-specific build script that handles CI environment

set -e

echo "🚀 Starting Vercel build process..."

# Skip git-dependent operations in CI
if [ "$VERCEL" = "1" ] || [ "$CI" = "true" ]; then
    echo "📦 CI environment detected, skipping git-dependent operations"
    
    # Install dependencies without running prepare script
    npm ci --ignore-scripts
    
    # Run only essential build steps
    echo "🔨 Running build process..."
    npm run build
    
    echo "✅ Vercel build completed successfully"
else
    echo "🏠 Local environment detected, running full prepare script"
    npm install
    npm run build
fi
