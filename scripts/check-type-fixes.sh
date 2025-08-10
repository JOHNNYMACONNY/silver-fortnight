#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Checking TypeScript Integration Fixes Progress..."
echo

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo -e "${RED}❌ TypeScript is not installed. Please run: npm install -g typescript${NC}"
    exit 1
fi

# Run TypeScript compiler in strict mode
echo "Running type checking..."
if npm run type-check; then
    echo -e "${GREEN}✅ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    echo "See docs/TYPE_SYSTEM_FIXES.md for guidance on fixing type errors"
fi
echo

# Check specific files for type errors
echo "Checking key components..."

FILES_TO_CHECK=(
    "src/components/features/trades/TradeSkillDisplay.tsx"
    "src/components/features/trades/TradeCard.tsx"
    "src/components/features/trades/TradeCompletionForm.tsx"
    "src/components/features/trades/TradeConfirmationForm.tsx"
    "src/components/features/trades/TradeProposalForm.tsx"
    "src/components/features/trades/TradeProposalDashboard.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -n "Checking $file... "
        if tsc "$file" --noEmit --esModuleInterop --jsx react; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ $file not found${NC}"
    fi
done
echo

# Check evidence interface alignment
echo "Checking evidence interface alignment..."
if grep -q "embedUrl" src/services/firestore.ts && grep -q "embedService" src/services/firestore.ts; then
    echo -e "${GREEN}✅ EmbeddedEvidence interface updated in firestore.ts${NC}"
else
    echo -e "${RED}❌ EmbeddedEvidence interface needs updating in firestore.ts${NC}"
fi
echo

# Check ServiceResult usage
echo "Checking ServiceResult patterns..."
if ! grep -r "success:" src/components/; then
    echo -e "${GREEN}✅ No legacy 'success' property usage found${NC}"
else
    echo -e "${RED}❌ Legacy 'success' property still in use. Please update to use error checking${NC}"
fi
echo

# Run tests
echo "Running related tests..."
if npm test -- --findRelatedTests \
    src/components/features/trades/__tests__/TradeSkillDisplay.test.tsx \
    src/services/__tests__/firestore.test.ts; then
    echo -e "${GREEN}✅ All related tests passing${NC}"
else
    echo -e "${RED}❌ Some tests are failing${NC}"
fi
echo

# Final summary
echo "Summary of Progress:"
echo "==================="
echo "1. Check docs/TYPE_SYSTEM_FIXES.md for implementation details"
echo "2. Run 'npm run type-check' regularly while making changes"
echo "3. Update tests as you implement fixes"
echo "4. Create small, focused commits for each category of fixes"
echo
echo "For detailed guidance on fixing specific issues, see:"
echo "docs/TYPE_SYSTEM_FIXES.md"
