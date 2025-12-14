#!/bin/bash

# Start Firebase Emulator for Profiling Tests
# This script starts the Firebase emulator suite and sets up test users

set -e

echo "🚀 Starting Firebase Emulator for Profiling Tests..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ firebase-tools not found${NC}"
    echo "Installing firebase-tools..."
    npm install -g firebase-tools
fi

# Kill any existing emulator processes
echo "🧹 Cleaning up existing emulator processes..."
pkill -f "firebase emulators" || true
sleep 2

# Start emulators in the background
echo "🔥 Starting Firebase emulators (Auth, Firestore, Storage)..."
firebase emulators:start --only auth,firestore,storage --project demo-test-project &
EMULATOR_PID=$!

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to start..."
sleep 10

# Check if emulators are running
if ! curl -s http://localhost:9099 > /dev/null 2>&1; then
    echo -e "${RED}❌ Auth emulator failed to start${NC}"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
fi

if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${RED}❌ Firestore emulator failed to start${NC}"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Emulators started successfully${NC}"

# Setup test users
echo "👤 Setting up test users..."
npx tsx tests/profiling/setup-emulator-users.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test users created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create test users${NC}"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Firebase Emulator is ready for profiling tests!${NC}"
echo ""
echo "📋 Emulator URLs:"
echo "   Auth Emulator:      http://localhost:9099"
echo "   Firestore Emulator: http://localhost:8080"
echo "   Storage Emulator:   http://localhost:9199"
echo "   Emulator UI:        http://localhost:4000"
echo ""
echo "👤 Test User Credentials:"
echo "   Email:    test-profiling@example.com"
echo "   Password: TestPassword123!"
echo ""
echo "🎯 To run profiling tests:"
echo "   PROFILING_MODE=true USE_EMULATOR=true npx playwright test --project=profiling"
echo ""
echo "⚠️  Press Ctrl+C to stop the emulators"
echo ""

# Keep script running and forward signals to emulator
trap "echo 'Stopping emulators...'; kill $EMULATOR_PID 2>/dev/null || true; exit 0" INT TERM

# Wait for emulator process
wait $EMULATOR_PID

