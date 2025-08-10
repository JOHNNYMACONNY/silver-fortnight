#!/bin/bash

# Set error handling
set -e

echo "🧪 Starting Role Management System Tests..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Run the role management tests
echo "📋 Running role management flow tests..."
node -r ts-node/register src/utils/runRoleTests.ts

# Check the exit status
if [ $? -eq 0 ]; then
  echo "✅ All tests completed successfully"
  exit 0
else
  echo "❌ Tests failed"
  exit 1
fi