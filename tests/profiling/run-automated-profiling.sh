#!/bin/bash

# Automated Performance Profiling Script
# Runs all 7 profiling scenarios with Firebase emulator for 100% automation

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Phase 3A: Automated Performance Profiling Suite          ║${NC}"
echo -e "${BLUE}║  ProfilePage - All 7 Scenarios with Firebase Emulator     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Build production bundle
echo -e "${YELLOW}📦 Step 1/5: Building production bundle...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Start preview server in background
echo -e "${YELLOW}🌐 Step 2/5: Starting preview server...${NC}"
npm run preview &
PREVIEW_PID=$!
sleep 5

# Check if preview server is running
if ! curl -s http://localhost:4173 > /dev/null 2>&1; then
    echo -e "${RED}❌ Preview server failed to start${NC}"
    kill $PREVIEW_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Preview server running on http://localhost:4173${NC}"
echo ""

# Step 3: Start Firebase emulators
echo -e "${YELLOW}🔥 Step 3/5: Starting Firebase emulators...${NC}"
firebase emulators:start --only auth,firestore,storage --project demo-test-project > /tmp/emulator.log 2>&1 &
EMULATOR_PID=$!
sleep 10

# Check if emulators are running
if ! curl -s http://localhost:9099 > /dev/null 2>&1; then
    echo -e "${RED}❌ Firebase emulators failed to start${NC}"
    echo "Emulator logs:"
    cat /tmp/emulator.log
    kill $PREVIEW_PID 2>/dev/null || true
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Firebase emulators running${NC}"
echo ""

# Step 4: Setup test users
echo -e "${YELLOW}👤 Step 4/5: Setting up test users in emulator...${NC}"
npx tsx tests/profiling/setup-emulator-users.ts
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to setup test users${NC}"
    kill $PREVIEW_PID 2>/dev/null || true
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✅ Test users created${NC}"
echo ""

# Step 5: Run profiling tests
echo -e "${YELLOW}🧪 Step 5/5: Running automated profiling tests...${NC}"
echo ""

# Export environment variables for the test
export PROFILING_MODE=true
export USE_EMULATOR=true

# Run Playwright tests
PROFILING_MODE=true USE_EMULATOR=true npx playwright test --project=profiling --reporter=list --workers=1

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All profiling tests completed successfully!${NC}"
else
    echo -e "${RED}❌ Some profiling tests failed (exit code: $TEST_EXIT_CODE)${NC}"
fi

# Cleanup
echo ""
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
kill $PREVIEW_PID 2>/dev/null || true
kill $EMULATOR_PID 2>/dev/null || true
sleep 2

# Display results
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Profiling Results                                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -f "docs/PHASE_3A_PROFILING_DATA.json" ]; then
    echo -e "${GREEN}📊 Results saved to: docs/PHASE_3A_PROFILING_DATA.json${NC}"
    echo ""
    echo "Preview results:"
    cat docs/PHASE_3A_PROFILING_DATA.json | head -n 30
    echo "..."
else
    echo -e "${YELLOW}⚠️  Results file not found${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Next Steps                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Review profiling data: docs/PHASE_3A_PROFILING_DATA.json"
echo "2. Analyze bottlenecks: docs/PHASE_3A_PRELIMINARY_BOTTLENECK_ANALYSIS.md"
echo "3. Review optimization plan: docs/PHASE_3B_OPTIMIZATION_PLAN.md"
echo "4. Begin Phase 3B implementation"
echo ""

exit $TEST_EXIT_CODE

