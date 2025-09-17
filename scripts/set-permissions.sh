#!/bin/bash

# Script to set proper permissions for security-related scripts and hooks
# This ensures all security scripts are executable

# Skip in CI/deployment environments
if [ "$CI" = "true" ] || [ "$VERCEL" = "1" ] || [ "$NETLIFY" = "true" ]; then
    echo "Skipping permission setup in CI/deployment environment"
    exit 0
fi

set -e # Exit on error

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to make script executable and verify
make_executable() {
    local script_path="$1"
    local script_name=$(basename "$script_path")
    
    if [ -f "$script_path" ]; then
        chmod +x "$script_path"
        if [ -x "$script_path" ]; then
            echo -e "${GREEN}✓ Made $script_name executable${NC}"
        else
            echo -e "${RED}Error: Failed to make $script_name executable${NC}"
            return 1
        fi
    else
        echo -e "${RED}Error: $script_name not found${NC}"
        return 1
    fi
}

# Security-related scripts to make executable
SCRIPTS=(
    "./scripts/check-security-rules.sh"
    "./scripts/deploy-security-rules.sh"
    "./scripts/security-checks.sh"
    ".husky/pre-commit"
)

echo "Setting permissions for security scripts..."

# Make each script executable
for script in "${SCRIPTS[@]}"; do
    make_executable "$script"
done

# Verify git hooks directory
if [ ! -d ".git/hooks" ]; then
    mkdir -p .git/hooks
    echo "Created .git/hooks directory"
fi

# Initialize husky if not already done
if [ ! -d ".husky" ]; then
    npx husky install
    echo "Initialized husky"
fi

# Ensure the pre-commit hook is properly linked
if [ ! -f ".git/hooks/pre-commit" ]; then
    npx husky add .husky/pre-commit "npm run pre-commit"
    echo "Added pre-commit hook"
fi

echo -e "\n${GREEN}✨ All security script permissions have been updated${NC}"

# Additional Git configuration for security
git config core.fileMode true
git config --global core.fileMode true

echo -e "\n${GREEN}✓ Git file mode tracking enabled${NC}"

# Print verification status
echo -e "\nVerifying permissions:"
for script in "${SCRIPTS[@]}"; do
    if [ -x "$script" ]; then
        echo -e "${GREEN}✓ $script is executable${NC}"
    else
        echo -e "${RED}⨯ $script is not executable${NC}"
    fi
done

# Add a note about manual verification
echo -e "\nNote: You can verify script execution by running:"
echo "$ ./scripts/check-security-rules.sh --version"
