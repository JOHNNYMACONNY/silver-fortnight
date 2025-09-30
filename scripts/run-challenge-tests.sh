#!/bin/bash

# Challenge System Test Execution Script
# Comprehensive test suite for the TradeYa challenge system

set -e

echo "🧪 TradeYa Challenge System - Comprehensive Test Suite"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
UNIT_TESTS_PASSED=0
INTEGRATION_TESTS_PASSED=0
E2E_TESTS_PASSED=0
ANALYTICS_TESTS_PASSED=0

echo -e "${BLUE}📋 Test Plan Overview:${NC}"
echo "1. Unit Tests - Challenge service functions"
echo "2. Integration Tests - Cross-system integration"
echo "3. E2E Tests - Complete user workflows"
echo "4. Analytics Tests - Event tracking validation"
echo ""

# Function to run tests with error handling
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local test_pattern="$3"
    
    echo -e "${YELLOW}🔄 Running $test_name...${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        return 1
    fi
}

# 1. Unit Tests
echo -e "${BLUE}🔬 Phase 1: Unit Tests${NC}"
echo "Testing individual challenge service functions..."

# Core challenge functions
if run_test_suite "Challenge Creation Tests" \
    "npm run test -- --testPathPattern='challenges.expanded.test.ts' --silent" \
    "createChallenge|joinChallenge|submitToChallenge"; then
    UNIT_TESTS_PASSED=1
fi

# Existing challenge tests
if run_test_suite "Existing Challenge Tests" \
    "npm run test -- --testPathPattern='challenges.test.ts' --silent" \
    "getUserChallenges|startChallenge|completeChallenge"; then
    ((UNIT_TESTS_PASSED++))
fi

# Challenge tier gating tests
if run_test_suite "Challenge Tier Gating Tests" \
    "npm run test -- --testPathPattern='challenges.tierGating' --silent" \
    "tierGating"; then
    ((UNIT_TESTS_PASSED++))
fi

echo -e "${BLUE}📊 Unit Tests Summary: $UNIT_TESTS_PASSED/3 test suites passed${NC}"
echo ""

# 2. Integration Tests
echo -e "${BLUE}🔗 Phase 2: Integration Tests${NC}"
echo "Testing cross-system integration and data flow..."

if run_test_suite "Challenge System Integration" \
    "npm run test -- --testPathPattern='challenges.integration.test.ts' --silent" \
    "integration"; then
    INTEGRATION_TESTS_PASSED=1
fi

# Gamification integration tests
if run_test_suite "Gamification Integration Tests" \
    "npm run test -- --testPathPattern='gamification.test.ts' --silent" \
    "gamification"; then
    ((INTEGRATION_TESTS_PASSED++))
fi

echo -e "${BLUE}📊 Integration Tests Summary: $INTEGRATION_TESTS_PASSED/2 test suites passed${NC}"
echo ""

# 3. E2E Tests (Playwright)
echo -e "${BLUE}🎭 Phase 3: End-to-End Tests${NC}"
echo "Testing complete user workflows in browser..."

# Check if Playwright is available
if command -v npx playwright &> /dev/null; then
    # Challenge completion workflow
    if run_test_suite "Challenge Completion E2E" \
        "npx playwright test challenge-completion.spec.ts --reporter=line" \
        "e2e"; then
        E2E_TESTS_PASSED=1
    fi
    
    # Challenge analytics E2E
    if run_test_suite "Challenge Analytics E2E" \
        "npx playwright test challenge-analytics.spec.ts --reporter=line" \
        "analytics"; then
        ((E2E_TESTS_PASSED++))
        ANALYTICS_TESTS_PASSED=1
    fi
    
    # Challenge recommendations E2E
    if run_test_suite "Challenge Recommendations E2E" \
        "npx playwright test challenges-recommendations.spec.ts --reporter=line" \
        "recommendations"; then
        ((E2E_TESTS_PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️  Playwright not available, skipping E2E tests${NC}"
fi

echo -e "${BLUE}📊 E2E Tests Summary: $E2E_TESTS_PASSED/3 test suites passed${NC}"
echo ""

# 4. Analytics Validation
echo -e "${BLUE}📈 Phase 4: Analytics Validation${NC}"
echo "Validating business metrics and event tracking..."

# Analytics event validation
echo "Checking analytics event definitions..."
if grep -r "challenge_view\|challenge_joined\|challenge_completed" src/services/challenges.ts > /dev/null; then
    echo -e "${GREEN}✅ Analytics events found in challenge service${NC}"
    ((ANALYTICS_TESTS_PASSED++))
else
    echo -e "${RED}❌ Analytics events missing in challenge service${NC}"
fi

# Business metrics validation
echo "Checking business metrics integration..."
if grep -r "trackBusinessMetric\|challenge_participation\|challenge_completion" src/ > /dev/null; then
    echo -e "${GREEN}✅ Business metrics integration found${NC}"
    ((ANALYTICS_TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Business metrics integration not found${NC}"
fi

echo -e "${BLUE}📊 Analytics Tests Summary: $ANALYTICS_TESTS_PASSED/3 validations passed${NC}"
echo ""

# 5. Test Coverage Analysis
echo -e "${BLUE}📋 Phase 5: Test Coverage Analysis${NC}"
echo "Analyzing test coverage for challenge system..."

# Run coverage for challenge-related files
echo "Generating coverage report for challenge system..."
npm run test -- --testPathPattern='challenges' --coverage --coverageDirectory=coverage/challenges --silent

# Check coverage thresholds
COVERAGE_FILE="coverage/challenges/coverage-summary.json"
if [ -f "$COVERAGE_FILE" ]; then
    echo -e "${GREEN}✅ Coverage report generated${NC}"
    
    # Extract coverage percentages (simplified)
    if command -v jq &> /dev/null; then
        STATEMENTS=$(jq '.total.statements.pct' "$COVERAGE_FILE" 2>/dev/null || echo "0")
        BRANCHES=$(jq '.total.branches.pct' "$COVERAGE_FILE" 2>/dev/null || echo "0")
        FUNCTIONS=$(jq '.total.functions.pct' "$COVERAGE_FILE" 2>/dev/null || echo "0")
        LINES=$(jq '.total.lines.pct' "$COVERAGE_FILE" 2>/dev/null || echo "0")
        
        echo "Coverage Summary:"
        echo "  Statements: ${STATEMENTS}%"
        echo "  Branches: ${BRANCHES}%"
        echo "  Functions: ${FUNCTIONS}%"
        echo "  Lines: ${LINES}%"
    fi
else
    echo -e "${YELLOW}⚠️  Coverage report not generated${NC}"
fi

echo ""

# 6. Final Summary
echo -e "${BLUE}🎯 FINAL TEST RESULTS${NC}"
echo "========================"

TOTAL_SCORE=0
MAX_SCORE=11

echo -e "Unit Tests:        ${UNIT_TESTS_PASSED}/3 ✅"
TOTAL_SCORE=$((TOTAL_SCORE + UNIT_TESTS_PASSED))

echo -e "Integration Tests: ${INTEGRATION_TESTS_PASSED}/2 ✅"
TOTAL_SCORE=$((TOTAL_SCORE + INTEGRATION_TESTS_PASSED))

echo -e "E2E Tests:         ${E2E_TESTS_PASSED}/3 ✅"
TOTAL_SCORE=$((TOTAL_SCORE + E2E_TESTS_PASSED))

echo -e "Analytics Tests:   ${ANALYTICS_TESTS_PASSED}/3 ✅"
TOTAL_SCORE=$((TOTAL_SCORE + ANALYTICS_TESTS_PASSED))

echo ""
echo -e "${BLUE}Overall Score: ${TOTAL_SCORE}/${MAX_SCORE}${NC}"

# Determine overall result
if [ $TOTAL_SCORE -ge 8 ]; then
    echo -e "${GREEN}🎉 EXCELLENT: Challenge system has comprehensive test coverage!${NC}"
    exit 0
elif [ $TOTAL_SCORE -ge 6 ]; then
    echo -e "${YELLOW}✅ GOOD: Challenge system has solid test coverage with room for improvement${NC}"
    exit 0
elif [ $TOTAL_SCORE -ge 4 ]; then
    echo -e "${YELLOW}⚠️  FAIR: Challenge system has basic test coverage, needs enhancement${NC}"
    exit 1
else
    echo -e "${RED}❌ POOR: Challenge system needs significant test coverage improvement${NC}"
    exit 1
fi

# Additional recommendations
echo ""
echo -e "${BLUE}📝 Recommendations:${NC}"

if [ $UNIT_TESTS_PASSED -lt 3 ]; then
    echo "- Improve unit test coverage for challenge service functions"
fi

if [ $INTEGRATION_TESTS_PASSED -lt 2 ]; then
    echo "- Add more integration tests for cross-system functionality"
fi

if [ $E2E_TESTS_PASSED -lt 2 ]; then
    echo "- Implement comprehensive E2E tests for user workflows"
fi

if [ $ANALYTICS_TESTS_PASSED -lt 2 ]; then
    echo "- Enhance analytics event tracking and validation"
fi

echo ""
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo "1. Review failed tests and fix implementation issues"
echo "2. Add missing test cases for edge scenarios"
echo "3. Implement performance testing for challenge operations"
echo "4. Set up continuous integration for automated testing"
echo "5. Add accessibility testing for challenge UI components"

echo ""
echo -e "${GREEN}✨ Challenge System Test Suite Complete!${NC}"
