#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Security check results
SECURITY_PASSED=true
WARNING_COUNT=0
ERROR_COUNT=0

echo "🔒 Running Security Checks..."
echo "============================="

# Function to print status
print_status() {
    if [ "$2" = "pass" ]; then
        echo -e "${GREEN}✓ $1${NC}"
    elif [ "$2" = "warn" ]; then
        echo -e "${YELLOW}⚠ $1${NC}"
        WARNING_COUNT=$((WARNING_COUNT + 1))
    else
        echo -e "${RED}✗ $1${NC}"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        SECURITY_PASSED=false
    fi
}

# Check if running in CI environment
if [ -n "$CI" ]; then
    echo "Running in CI environment"
fi

# 1. Check for security dependencies
echo -e "\n📦 Checking security dependencies..."
npm list eslint-plugin-security > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Security ESLint plugin installed" "pass"
else
    print_status "Security ESLint plugin missing" "fail"
fi

# 2. Run npm audit
echo -e "\n🔍 Running npm audit..."
npm audit --production > security-audit.txt 2>&1
AUDIT_RESULT=$?
if [ $AUDIT_RESULT -eq 0 ]; then
    print_status "No known vulnerabilities found" "pass"
elif [ $AUDIT_RESULT -eq 1 ]; then
    print_status "Low severity vulnerabilities found" "warn"
else
    print_status "High severity vulnerabilities found" "fail"
fi

# 3. Check for sensitive files
echo -e "\n📄 Checking for sensitive files..."
SENSITIVE_FILES=$(find . -type f -name "*.pem" -o -name "*.key" -o -name "*.env" 2>/dev/null)
if [ -z "$SENSITIVE_FILES" ]; then
    print_status "No sensitive files found in repository" "pass"
else
    print_status "Sensitive files found in repository" "fail"
    echo "$SENSITIVE_FILES"
fi

# 4. Run ESLint security checks
echo -e "\n🔬 Running ESLint security checks..."
npm run lint > eslint-report.txt 2>&1
if [ $? -eq 0 ]; then
    print_status "ESLint security checks passed" "pass"
else
    print_status "ESLint security checks failed" "fail"
fi

# 5. Check TypeScript configuration
echo -e "\n⚙️ Checking TypeScript configuration..."
if grep -q "strict" tsconfig.json && grep -q "noImplicitAny" tsconfig.json; then
    print_status "TypeScript strict checks enabled" "pass"
else
    print_status "TypeScript strict checks not fully enabled" "warn"
fi

# 6. Run security-focused tests
echo -e "\n🧪 Running security tests..."
npm run test:security > test-report.txt 2>&1
if [ $? -eq 0 ]; then
    print_status "Security tests passed" "pass"
else
    print_status "Security tests failed" "fail"
fi

# 7. Check for outdated dependencies
echo -e "\n📚 Checking for outdated dependencies..."
npm outdated > outdated-report.txt 2>&1
if [ -s outdated-report.txt ]; then
    print_status "Outdated dependencies found" "warn"
else
    print_status "All dependencies up to date" "pass"
fi

# 8. Verify environment configuration
echo -e "\n🔧 Verifying environment configuration..."
if [ -f .env.example ] && [ ! -f .env ]; then
    print_status "Environment file configuration correct" "pass"
else
    print_status "Environment file check failed" "warn"
fi

# 9. Check security headers configuration
echo -e "\n🛡️ Checking security headers..."
if grep -q "Strict-Transport-Security" vite.config.ts && grep -q "Content-Security-Policy" vite.config.ts; then
    print_status "Security headers configured" "pass"
else
    print_status "Security headers not fully configured" "warn"
fi

# 10. Check for security documentation
echo -e "\n📖 Checking security documentation..."
if [ -f "SECURITY.md" ] && [ -f "docs/SECURITY_IMPLEMENTATION.md" ]; then
    print_status "Security documentation exists" "pass"
else
    print_status "Security documentation incomplete" "warn"
fi

# Final Report
echo -e "\n📊 Security Check Summary"
echo "======================="
echo -e "Errors: ${RED}$ERROR_COUNT${NC}"
echo -e "Warnings: ${YELLOW}$WARNING_COUNT${NC}"

# Generate detailed report
echo -e "\nGenerating detailed report..."
cat << EOF > security-report.md
# Security Check Report
Generated on $(date)

## Summary
- Errors: $ERROR_COUNT
- Warnings: $WARNING_COUNT

## Detailed Results
### npm audit
\`\`\`
$(cat security-audit.txt)
\`\`\`

### ESLint Security Check
\`\`\`
$(cat eslint-report.txt)
\`\`\`

### Security Tests
\`\`\`
$(cat test-report.txt)
\`\`\`

### Outdated Dependencies
\`\`\`
$(cat outdated-report.txt)
\`\`\`
EOF

# Cleanup temporary files
rm security-audit.txt eslint-report.txt test-report.txt outdated-report.txt

# Exit with appropriate status code
if [ "$SECURITY_PASSED" = true ]; then
    echo -e "\n${GREEN}✅ Security checks passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Security checks failed!${NC}"
    echo "See security-report.md for details"
    exit 1
fi
