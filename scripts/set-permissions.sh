#!/bin/bash

# Script to set proper permissions for security-related scripts and hooks
# This ensures all security scripts are executable

# Exit on error only if not in CI environment
if [ -z "$CI" ]; then
    set -e
fi

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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
            if [ -z "$CI" ]; then
                return 1
            fi
        fi
    else
        echo -e "${YELLOW}Warning: $script_name not found${NC}"
        if [ -z "$CI" ]; then
            return 1
        fi
    fi
}

# Security-related scripts to make executable
SCRIPTS=(
    "./scripts/check-security-rules.sh"
    "./scripts/deploy-security-rules.sh"
    "./scripts/security-checks.sh"
)

# Add husky pre-commit only if it exists
if [ -f ".husky/pre-commit" ]; then
    SCRIPTS+=(".husky/pre-commit")
fi

echo "Setting permissions for security scripts..."

# Make each script executable
for script in "${SCRIPTS[@]}"; do
    make_executable "$script"
done

# Only run git/husky setup if not in CI and git repo exists
if [ -z "$CI" ] && git rev-parse --git-dir > /dev/null 2>&1; then
    # Verify git hooks directory
    if [ ! -d ".git/hooks" ]; then
        mkdir -p .git/hooks
        echo "Created .git/hooks directory"
    fi

    # Initialize husky if not already done and husky is available
    if [ ! -d ".husky" ] && command -v husky > /dev/null 2>&1; then
        npx husky install
        echo "Initialized husky"
    fi

    # Ensure the pre-commit hook is properly linked
    if [ ! -f ".git/hooks/pre-commit" ] && command -v husky > /dev/null 2>&1; then
        npx husky add .husky/pre-commit "npm run pre-commit"
        echo "Added pre-commit hook"
    fi
else
    echo "Skipping git/husky setup - not in git repo or CI environment"
fi

echo -e "\n${GREEN}✨ All security script permissions have been updated${NC}"

# Additional Git configuration for security (only if git repo exists)
if [ -z "$CI" ] && git rev-parse --git-dir > /dev/null 2>&1; then
    git config core.fileMode true
    git config --global core.fileMode true
    echo -e "\n${GREEN}✓ Git file mode tracking enabled${NC}"
else
    echo "Skipping git configuration - not in git repo or CI environment"
fi

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
