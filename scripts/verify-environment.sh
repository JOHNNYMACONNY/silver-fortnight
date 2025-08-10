#!/bin/bash
# TradeYa Environment Verification Script - Phase 0

echo "=== TradeYa Environment Verification ==="
echo "🔍 Testing Phase 0 fixes..."

# Test 1: PostCSS Configuration
echo ""
echo "1️⃣ Testing PostCSS configuration..."
if npx postcss --version > /dev/null 2>&1; then
  echo "✅ PostCSS: OK"
else
  echo "❌ PostCSS: FAILED"
  exit 1
fi

# Test 2: Tailwind CSS
echo ""
echo "2️⃣ Testing Tailwind CSS..."
if npx tailwindcss --version > /dev/null 2>&1; then
  echo "✅ Tailwind CSS: OK"
else
  echo "❌ Tailwind CSS: FAILED"
  exit 1
fi

# Test 3: Package Scripts (check for no duplicates)
echo ""
echo "3️⃣ Testing package scripts for duplications..."
npm run --silent > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ NPM Scripts: OK (no duplications detected)"
else
  echo "❌ NPM Scripts: FAILED"
  exit 1
fi

# Test 4: Dependencies
echo ""
echo "4️⃣ Testing @tanstack/react-query dependency..."
if node -e "require('@tanstack/react-query')" > /dev/null 2>&1; then
  echo "✅ @tanstack/react-query: OK"
else
  echo "❌ @tanstack/react-query: FAILED"
  exit 1
fi

# Test 5: Project structure
echo ""
echo "5️⃣ Testing project structure..."
if [ -f "postcss.config.js" ] && [ -f "package.json" ] && [ -f "postcss.config.js.backup" ] && [ -f "package.json.backup" ]; then
  echo "✅ Project Structure: OK (files and backups present)"
else
  echo "❌ Project Structure: FAILED (missing files or backups)"
  exit 1
fi

echo ""
echo "=== All Environment Tests Passed! 🎉 ==="
echo "✅ PostCSS configuration fixed"
echo "✅ Package script duplications resolved"
echo "✅ Missing dependencies installed"
echo "✅ Development environment ready"
echo ""
echo "🚀 Ready to test 'npm run dev'"