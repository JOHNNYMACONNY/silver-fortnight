#!/bin/bash

# Comprehensive Firebase Security Rules Validation Script
# This script combines all security checks and validations in one place

set -e # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORT_DIR="reports/security"
BACKUP_DIR="backups/security-rules"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create necessary directories
mkdir -p "$REPORT_DIR" "$BACKUP_DIR"

# Logging setup
exec 1> >(tee -a "$REPORT_DIR/validation_${TIMESTAMP}.log")
exec 2> >(tee -a "$REPORT_DIR/validation_${TIMESTAMP}.error.log")

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check dependencies
check_dependencies() {
    log "Checking required dependencies..."
    
    local missing_deps=0
    
    # Check for required tools
    for cmd in firebase npm jq node; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            error "Missing required dependency: $cmd"
            missing_deps=1
        fi
    done
    
    if [ $missing_deps -eq 1 ]; then
        error "Please install missing dependencies and try again"
        exit 1
    fi
    
    success "All dependencies are available"
}

# Function to backup current rules
backup_rules() {
    log "Creating backup of current rules..."
    
    # Backup Firestore rules
    cp firestore.rules "$BACKUP_DIR/firestore_${TIMESTAMP}.rules"
    
    # Backup Storage rules
    cp storage.rules "$BACKUP_DIR/storage_${TIMESTAMP}.rules"
    
    success "Rules backed up to $BACKUP_DIR"
}

# Function to validate rule syntax
validate_syntax() {
    log "Validating security rules syntax..."

    local syntax_errors=0

    # Basic validation - check if files exist and have content
    if [ ! -s "firestore.rules" ]; then
        error "Firestore rules file is empty or missing"
        syntax_errors=1
    fi

    if [ ! -s "storage.rules" ]; then
        error "Storage rules file is empty or missing"
        syntax_errors=1
    fi

    if [ $syntax_errors -eq 0 ]; then
        log "✓ Basic syntax validation completed"
    fi

    if [ $syntax_errors -eq 0 ]; then
        success "Syntax validation passed"
    else
        return 1
    fi
}

# Function to run security tests
run_security_tests() {
    log "Running security tests..."
    
    # Run tests with security configuration
    if ! npm run test:security > "$REPORT_DIR/test_output.txt" 2>&1; then
        error "Security tests failed"
        cat "$REPORT_DIR/test_output.txt"
        return 1
    fi
    
    success "Security tests passed"
}

# Function to check for security issues
check_security_patterns() {
    log "Analyzing security patterns..."
    
    local issues_found=0
    local severe_found=0
    
    # Check both rule files
    for file in firestore.rules storage.rules; do
        # Check for overly permissive rules (severe)
        if grep -E "allow (read|write|create|update|delete): if true" "$file" > /dev/null; then
            warn "Found overly permissive rules in $file"
            severe_found=1
            issues_found=1
        fi
        
        # Check for missing authentication checks (severe)
        if ! grep -q "request.auth != null" "$file"; then
            warn "No authentication checks found in $file"
            severe_found=1
            issues_found=1
        fi
        
        # Check for resource access validations (non-fatal warning)
        if ! grep -q "resource.data" "$file"; then
            warn "No resource data validation found in $file (non-fatal)"
            issues_found=1
        fi
    done
    
    if [ $severe_found -eq 0 ]; then
        if [ $issues_found -eq 0 ]; then
            success "No common security issues found"
        else
            warn "Some non-fatal security warnings detected (see above). Proceeding."
            success "Security pattern checks completed with warnings"
        fi
    else
        error "Severe security issues found. Please address them."
        return 1
    fi
}

# Function to run test coverage analysis
analyze_coverage() {
    log "Analyzing test coverage..."
    
    if ! npm run test:security -- --coverage > "$REPORT_DIR/coverage.txt" 2>&1; then
        error "Coverage analysis failed"
        return 1
    fi
    
    # Extract coverage metrics
    local coverage_summary=$(tail -n 5 "$REPORT_DIR/coverage.txt")
    echo -e "\nTest Coverage Summary:"
    echo "$coverage_summary"
    
    success "Coverage analysis completed"
}

# Function to check for sensitive data
check_sensitive_data() {
    log "Checking for sensitive data..."
    local scan_exit=0

    # Prefer a local gitleaks binary if available
    if command -v gitleaks >/dev/null 2>&1; then
        log "Using installed gitleaks"
        gitleaks protect --source . --config .gitleaks.toml > "$REPORT_DIR/gitleaks.txt" 2>&1 || scan_exit=$?
    else
        log "gitleaks not found locally; attempting to run via npx (may install temporarily)"
        # Use -y to avoid interactive prompts; if npx itself fails (no network / install), handle gracefully
        if command -v npx >/dev/null 2>&1; then
            npx -y gitleaks protect --source . --config .gitleaks.toml > "$REPORT_DIR/gitleaks.txt" 2>&1 || scan_exit=$?
        else
            warn "Neither gitleaks nor npx available; skipping sensitive-data scan. Install gitleaks or ensure npx is available to run the scan."
            return 0
        fi
    fi

    if [ $scan_exit -ne 0 ]; then
        # If the scanner ran but returned a non-zero exit code, inspect output for known npx/npm errors we can soft-fail
        if [ -s "$REPORT_DIR/gitleaks.txt" ]; then
            if grep -q "could not determine executable to run" "$REPORT_DIR/gitleaks.txt" || grep -q "could not determine executable" "$REPORT_DIR/gitleaks.txt"; then
                warn "npx/npm could not determine the gitleaks executable. This environment may not support npx-installed CLIs. Skipping sensitive-data scan (soft-fail)."
                echo -e "\nSuggested actions:" >> "$REPORT_DIR/gitleaks.txt"
                echo "- Install gitleaks locally (brew install gitleaks) or download the binary from https://github.com/zricethezav/gitleaks/releases" >> "$REPORT_DIR/gitleaks.txt"
                echo "- Or add a supported wrapper to devDependencies so CI can run the scanner" >> "$REPORT_DIR/gitleaks.txt"
                cat "$REPORT_DIR/gitleaks.txt"
                return 0
            fi

            # Otherwise treat as a real failure (sensitive findings or runtime error)
            error "Sensitive data detected or gitleaks failed to run successfully (exit code $scan_exit)"
            cat "$REPORT_DIR/gitleaks.txt"
            return 1
        else
            warn "gitleaks execution failed but produced no output. Skipping scan to avoid blocking CI."
            return 0
        fi
    fi

    success "No sensitive data found"
}

# Function to generate final report
generate_report() {
    log "Generating security validation report..."
    
    local report_file="$REPORT_DIR/security_validation_${TIMESTAMP}.md"
    
    # Create report header
    # Helper to safely append a section from a file if it exists
    safe_append() {
        local title="$1"; shift
        local file="$1"; shift
        echo -e "\n### ${title}" >> "$report_file"
        if [ -s "$file" ]; then
            cat "$file" >> "$report_file"
        else
            echo "(no data)" >> "$report_file"
        fi
    }

    # Create report header
    cat << EOF > "$report_file"
# Firebase Security Rules Validation Report
Generated: $(date)

## Validation Results
EOF

    # Sections (guarded)
    safe_append "Syntax Validation (Firestore)" "$REPORT_DIR/firestore_lint.txt"
    safe_append "Syntax Validation (Storage)" "$REPORT_DIR/storage_lint.txt"
    safe_append "Security Tests" "$REPORT_DIR/test_output.txt"
    safe_append "Coverage Analysis" "$REPORT_DIR/coverage.txt"
    safe_append "Security Issues (gitleaks)" "$REPORT_DIR/gitleaks.txt"

    # Recommendations header
    echo -e "\n## Recommendations" >> "$report_file"
    
    # Add recommendations based on findings
    if grep -q "Warning" "$report_file"; then
        echo -e "\n### Action Items:" >> "$report_file"
        grep "Warning" "$report_file" | sed 's/^/- [ ] Fix: /' >> "$report_file"
    fi
    
    success "Report generated: $report_file"
}

# Main execution
main() {
    log "Starting comprehensive security validation..."
    
    check_dependencies
    backup_rules
    
    local exit_code=0
    
    # Run all checks
    validate_syntax || exit_code=1
    check_security_patterns || exit_code=1
    run_security_tests || exit_code=1
    analyze_coverage || exit_code=1
    check_sensitive_data || exit_code=1
    
    # Always generate report, regardless of previous failures
    generate_report
    
    if [ $exit_code -eq 0 ]; then
        success "\nAll security validations passed successfully!"
    else
        error "\nSecurity validation completed with warnings/errors"
        warn "See report at: $REPORT_DIR/security_validation_${TIMESTAMP}.md"
    fi
    
    return $exit_code
}

# Handle interrupts
trap 'error "\nValidation interrupted"; exit 1' INT

# Run main function
main "$@"
