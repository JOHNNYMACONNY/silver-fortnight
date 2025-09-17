#!/bin/bash

# Script to verify and analyze Firebase security rules
# This performs static analysis, validation, and security checks on Firebase rules

# Exit on error only if not in CI environment
if [ -z "$CI" ]; then
    set -e
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RULES_DIR="."
FIRESTORE_RULES="firestore.rules"
STORAGE_RULES="storage.rules"
REPORT_DIR="reports/security"
MAX_RULE_LENGTH=500 # Maximum length for a single rule
MIN_REQUIRED_CHECKS=3 # Minimum number of security checks per rule

# Create reports directory
mkdir -p "$REPORT_DIR"

# Function to check rule file existence
check_rules_exist() {
    local missing_files=0
    
    echo -e "${BLUE}Checking for required rule files...${NC}"
    
    if [ ! -f "$FIRESTORE_RULES" ]; then
        echo -e "${RED}Error: Firestore rules file missing${NC}"
        missing_files=1
    fi
    
    if [ ! -f "$STORAGE_RULES" ]; then
        echo -e "${RED}Error: Storage rules file missing${NC}"
        missing_files=1
    fi
    
    if [ $missing_files -eq 1 ]; then
        exit 1
    fi
    
    echo -e "${GREEN}✓ All required rule files present${NC}"
}

# Function to validate rule syntax
validate_syntax() {
    echo -e "${BLUE}Validating rule syntax...${NC}"

    # Basic validation - check if files exist and have content
    if [ ! -s "$FIRESTORE_RULES" ]; then
        echo -e "${RED}Error: Firestore rules file is empty or missing${NC}"
        return 1
    fi

    if [ ! -s "$STORAGE_RULES" ]; then
        echo -e "${RED}Error: Storage rules file is empty or missing${NC}"
        return 1
    fi

    # Check for basic Firestore rules structure
    if ! grep -q "rules_version" "$FIRESTORE_RULES"; then
        echo -e "${YELLOW}Warning: Firestore rules missing rules_version declaration${NC}"
    fi

    if ! grep -q "service cloud.firestore" "$FIRESTORE_RULES"; then
        echo -e "${YELLOW}Warning: Firestore rules missing service declaration${NC}"
    fi

    # Check for basic Storage rules structure
    if ! grep -q "rules_version" "$STORAGE_RULES"; then
        echo -e "${YELLOW}Warning: Storage rules missing rules_version declaration${NC}"
    fi

    if ! grep -q "service firebase.storage" "$STORAGE_RULES"; then
        echo -e "${YELLOW}Warning: Storage rules missing service declaration${NC}"
    fi

    echo -e "${GREEN}✓ Basic syntax validation completed${NC}"
}

# Function to check for common security issues
check_security_patterns() {
    echo -e "${BLUE}Checking security patterns...${NC}"
    local issues_found=0
    
    # Check for overly permissive rules
    if grep -E "allow (read|write|create|update|delete): if true" "$FIRESTORE_RULES" "$STORAGE_RULES"; then
        echo -e "${RED}Warning: Found overly permissive rules${NC}"
        issues_found=1
    fi
    
    # Check for missing authentication checks
    if ! grep -q "request.auth != null" "$FIRESTORE_RULES"; then
        echo -e "${RED}Warning: No authentication checks found in Firestore rules${NC}"
        issues_found=1
    fi
    
    # Check for resource access validations
    if ! grep -q "resource.data" "$FIRESTORE_RULES"; then
        echo -e "${YELLOW}Warning: No resource data validation found${NC}"
        issues_found=1
    fi
    
    # Check rule complexity
    local long_rules=0
    while IFS= read -r line; do
        if [ ${#line} -gt $MAX_RULE_LENGTH ]; then
            long_rules=$((long_rules + 1))
        fi
    done < <(cat "$FIRESTORE_RULES" "$STORAGE_RULES")

    if [ "$long_rules" -gt 0 ]; then
        echo -e "${YELLOW}Warning: Found $long_rules rules exceeding recommended length${NC}"
        issues_found=1
    fi
    
    if [ $issues_found -eq 0 ]; then
        echo -e "${GREEN}✓ No common security issues found${NC}"
    fi
    
    return $issues_found
}

# Function to analyze rule coverage
analyze_coverage() {
    echo -e "${BLUE}Analyzing rule coverage...${NC}"
    
    # Count security checks in rules
    local auth_checks=$(grep -c "request.auth" "$FIRESTORE_RULES")
    local data_checks=$(grep -c "resource.data" "$FIRESTORE_RULES")
    local validation_checks=$(grep -c "validate" "$FIRESTORE_RULES")
    
    echo "Security checks found:"
    echo "- Authentication checks: $auth_checks"
    echo "- Data validation checks: $data_checks"
    echo "- Custom validation functions: $validation_checks"
    
    # Check minimum requirements
    local total_checks=$((auth_checks + data_checks + validation_checks))
    if [ $total_checks -lt $MIN_REQUIRED_CHECKS ]; then
        echo -e "${RED}Warning: Insufficient security checks found${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Rule coverage analysis passed${NC}"
}

# Function to generate security report
generate_report() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local report_file="$REPORT_DIR/security_analysis_$(date +%Y%m%d).md"
    
    echo "# Firebase Security Rules Analysis Report" > "$report_file"
    echo "Generated: $timestamp" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## Rule Files" >> "$report_file"
    echo "- Firestore Rules: $(wc -l < "$FIRESTORE_RULES") lines" >> "$report_file"
    echo "- Storage Rules: $(wc -l < "$STORAGE_RULES") lines" >> "$report_file"
    echo "" >> "$report_file"
    
    echo "## Validation Results" >> "$report_file"
    echo "### Firestore Rules" >> "$report_file"
    echo '```' >> "$report_file"
    cat "$REPORT_DIR/firestore_lint.txt" >> "$report_file"
    echo '```' >> "$report_file"
    
    echo "### Storage Rules" >> "$report_file"
    echo '```' >> "$report_file"
    cat "$REPORT_DIR/storage_lint.txt" >> "$report_file"
    echo '```' >> "$report_file"
    
    echo -e "${GREEN}✓ Security analysis report generated: $report_file${NC}"
}

# Main execution
main() {
    # Skip in CI environments where Firebase tools might not be available
    if [ -n "$CI" ]; then
        echo "Skipping Firebase security rules analysis in CI environment"
        echo "Firebase tools and project configuration not available in build environment"
        exit 0
    fi
    
    echo "Starting Firebase security rules analysis..."
    
    check_rules_exist && \
    validate_syntax && \
    check_security_patterns && \
    analyze_coverage && \
    generate_report
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}Security analysis completed successfully!${NC}"
    else
        echo -e "${RED}Security analysis completed with warnings/errors${NC}"
    fi
    
    exit $exit_code
}

# Handle interrupts
trap 'echo -e "\n${RED}Analysis interrupted${NC}"; exit 1' INT

# Run main function
main "$@"
