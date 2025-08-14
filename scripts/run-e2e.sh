#!/bin/sh
# E2E launcher: sources .env.e2e.local if present and runs Playwright
set -e
if [ -f ./.env.e2e.local ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' ./.env.e2e.local | xargs)
fi

# Install browsers if missing
npx playwright install --with-deps >/dev/null 2>&1 || true

# Pass through args to playwright
echo "Running Playwright with projects: ${1:-all}"
if [ -n "$1" ]; then
  npx playwright test "$@"
else
  npx playwright test
fi


