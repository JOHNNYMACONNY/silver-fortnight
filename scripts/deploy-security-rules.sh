#!/bin/bash

# Deploy Firebase Security Rules Script
# This script handles the safe deployment of Firebase security rules
# Including validation, testing, and backup procedures

set -e # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/security-rules"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_ID=$(node -e "console.log(require('./firebase.json').projectId || process.env.FIREBASE_PROJECT_ID)")

# Ensure required tools are installed
command -v firebase >/dev/null 2>&1 || { 
    echo -e "${RED}Error: firebase-tools is not installed.${NC}" 
    echo "Install with: npm install -g firebase-tools"
    exit 1
}

command -v jq >/dev/null 2>&1 || {
    echo -e "${RED}Error: jq is not installed.${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup current rules
backup_rules() {
    echo -e "${YELLOW}Backing up current security rules...${NC}"
    
    # Backup Firestore rules
    firebase firestore:get .rules --project "$PROJECT_ID" > "$BACKUP_DIR/firestore_$TIMESTAMP.rules" || {
        echo -e "${RED}Failed to backup Firestore rules${NC}"
        return 1
    }
    
    # Backup Storage rules
    firebase storage:get .rules --project "$PROJECT_ID" > "$BACKUP_DIR/storage_$TIMESTAMP.rules" || {
        echo -e "${RED}Failed to backup Storage rules${NC}"
        return 1
    }
    
    echo -e "${GREEN}Rules backed up successfully to $BACKUP_DIR${NC}"
}

# Function to validate rules syntax
validate_rules() {
    echo -e "${YELLOW}Validating security rules...${NC}"
    
    # Validate Firestore rules
    firebase firestore:rules:lint firestore.rules || {
        echo -e "${RED}Firestore rules validation failed${NC}"
        return 1
    }
    
    # Validate Storage rules
    firebase storage:rules:lint storage.rules || {
        echo -e "${RED}Storage rules validation failed${NC}"
        return 1
    }
    
    echo -e "${GREEN}Rules validation passed${NC}"
}

# Function to run security tests
run_tests() {
    echo -e "${YELLOW}Running security tests...${NC}"
    
    # Run Jest tests with security configuration
    npm run test:security || {
        echo -e "${RED}Security tests failed${NC}"
        return 1
    }
    
    echo -e "${GREEN}Security tests passed${NC}"
}

# Function to deploy rules
deploy_rules() {
    echo -e "${YELLOW}Deploying security rules...${NC}"
    
    # Deploy Firestore rules
    firebase deploy --only firestore:rules --project "$PROJECT_ID" || {
        echo -e "${RED}Failed to deploy Firestore rules${NC}"
        return 1
    }
    
    # Deploy Storage rules
    firebase deploy --only storage:rules --project "$PROJECT_ID" || {
        echo -e "${RED}Failed to deploy Storage rules${NC}"
        return 1
    }
    
    echo -e "${GREEN}Rules deployed successfully${NC}"
}

# Main deployment process
main() {
    echo "Starting security rules deployment process..."
    
    # Check if in CI environment
    if [ "$CI" = "true" ]; then
        echo "Running in CI environment..."
        firebase use "$PROJECT_ID" --token "$FIREBASE_TOKEN"
    else
        # Ensure logged in to Firebase
        firebase login:list || firebase login
    fi
    
    # Execute deployment steps
    backup_rules && \
    validate_rules && \
    run_tests && \
    deploy_rules
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Security rules deployment completed successfully!${NC}"
        exit 0
    else
        echo -e "${RED}Security rules deployment failed!${NC}"
        echo "Restoring previous rules from backup..."
        
        # Restore from backup
        firebase firestore:rules:load "$BACKUP_DIR/firestore_$TIMESTAMP.rules" --project "$PROJECT_ID"
        firebase storage:rules:load "$BACKUP_DIR/storage_$TIMESTAMP.rules" --project "$PROJECT_ID"
        
        exit 1
    fi
}

# Handle script interruption
cleanup() {
    echo -e "\n${YELLOW}Deployment interrupted. Cleaning up...${NC}"
    exit 1
}

trap cleanup INT TERM

# Execute main function
main "$@"
