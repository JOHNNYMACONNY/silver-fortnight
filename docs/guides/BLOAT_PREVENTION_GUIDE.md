# Asset Bloat Prevention Guide

**Created:** October 21, 2025  
**Purpose:** Prevent the recurrence of asset bloat, especially nested optimized directories

---

## 🎯 Problem We're Preventing

Previously, the asset optimization script created infinitely nested `optimized/optimized/optimized/...` directories up to 25+ levels deep, resulting in:
- 2,100+ duplicate files
- ~920MB wasted disk space
- Slow build times
- Repository bloat

---

## ✅ Safeguards in Place

### 1. **Fixed Asset Optimization Script**

**File:** `scripts/optimize-assets.cjs`

**Protection:**
```javascript
// Skips optimized directories during recursive search
if (entry.isDirectory() && entry.name !== 'optimized' && entry.name !== 'node_modules') {
  // Only recurse into non-optimized directories
}

// Skips files already in optimized paths
if (!fullPath.includes('/optimized/') && !fullPath.includes('\\optimized\\')) {
  images.push(fullPath);
}
```

**Impact:** Prevents the script from processing already-optimized files

---

### 2. **Automated Bloat Detection Script**

**File:** `scripts/check-asset-bloat.cjs`

**What it checks:**
- ✅ Detects nested `optimized/optimized` directories
- ✅ Finds excessive file duplicates (>10 copies)
- ✅ Monitors public directory size (alert if >50MB)
- ✅ Provides detailed reports with file paths

**How to run:**
```bash
npm run assets:check-bloat
```

**Exit codes:**
- `0` = No bloat detected ✅
- `1` = Bloat detected ❌

---

### 3. **GitHub Actions CI Check**

**File:** `.github/workflows/asset-bloat-check.yml`

**Triggers:**
- Every pull request affecting `public/**`
- Every push to main/master affecting assets
- Changes to asset optimization scripts

**Actions:**
- Runs bloat detection automatically
- Blocks merge if bloat is detected
- Posts PR comment with details

**Benefits:**
- Catches bloat before it's merged
- Team-wide protection
- Automated enforcement

---

### 4. **Enhanced .gitignore**

**Patterns added:**
```gitignore
# Test artifacts (prevent committing generated files)
/test-results
/test-screenshots
/test-videos
/playwright-report
jest_html_reporters.html
/jest-html-reporters-attach

# Temporary files
temp_*.json
undefined
fix_*.txt
package-dev-scripts.json
package-migration-scripts.json
package-production-scripts.json
```

**Impact:** Prevents accidental commits of generated/temporary files

---

## 🔧 How to Use the Prevention System

### Before Running Asset Optimization

1. **Always run the bloat check first:**
   ```bash
   npm run assets:check-bloat
   ```

2. **If bloat detected, clean it up:**
   ```bash
   # Remove nested optimized directories
   find public -type d -path '*/optimized/optimized' -exec rm -rf {} +
   
   # Or remove all optimized directories and regenerate
   npm run assets:clean
   ```

3. **Run optimization safely:**
   ```bash
   npm run assets:optimize
   ```

4. **Verify no bloat was created:**
   ```bash
   npm run assets:check-bloat
   ```

### Regular Maintenance

**Weekly Check:**
```bash
npm run assets:check-bloat
```

**Monthly Cleanup:**
```bash
# Check public directory size
du -sh public

# If >50MB, investigate:
npm run assets:check-bloat

# Clean if needed
npm run assets:clean
```

---

## 🚨 Warning Signs of Bloat

### Indicators:
1. **Build time increases** - Takes longer to build
2. **Git operations slow** - Commits/pushes are sluggish  
3. **Public directory >50MB** - Normal is 10-20MB
4. **CI failures** - Asset bloat check fails
5. **Many duplicate files** - Same file in multiple locations

### What to do:
```bash
# 1. Check for bloat
npm run assets:check-bloat

# 2. If found, review the report
# Look for nested optimized dirs and duplicate files

# 3. Clean up
rm -rf public/optimized  # If root-level optimized exists
find public -type d -name "optimized" | grep "optimized/optimized" | xargs rm -rf

# 4. Verify
npm run assets:check-bloat
```

---

## 📊 Monitoring & Alerts

### CI/CD Integration

The bloat check runs automatically in CI:
- ✅ **On every PR** affecting assets
- ✅ **On every push** to main/master
- ✅ **Blocks merges** if bloat detected

### Local Pre-commit Hook (Optional)

To run bloat check before every commit:

```bash
# Add to .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run asset bloat check if public files changed
if git diff --cached --name-only | grep -q "^public/"; then
  echo "🔍 Running asset bloat check..."
  npm run assets:check-bloat || exit 1
fi
```

---

## 🎓 Best Practices

### DO ✅
- Run `assets:check-bloat` before and after optimization
- Keep public directory under 50MB
- Review CI bloat check results in PRs
- Clean up test artifacts regularly
- Use the fixed optimization script

### DON'T ❌
- Manually create `optimized` subdirectories
- Commit test screenshots/results
- Ignore bloat check failures
- Run old/unfixed optimization scripts
- Disable the CI bloat check

---

## 📝 Configuration

### Bloat Check Thresholds

Edit `scripts/check-asset-bloat.cjs` to adjust:

```javascript
const MAX_NESTING_DEPTH = 1;      // Optimized folder depth (default: 1)
const MAX_PUBLIC_SIZE_MB = 50;     // Public size alert (default: 50MB)
const MAX_DUPLICATE_FILES = 10;    // Duplicate file limit (default: 10)
```

### GitHub Actions

Edit `.github/workflows/asset-bloat-check.yml` to change:
- Trigger paths
- Comment behavior
- Node version

---

## 🔄 Recovery Process

If bloat occurs despite safeguards:

1. **Immediate action:**
   ```bash
   npm run assets:check-bloat  # Identify the bloat
   ```

2. **Clean nested directories:**
   ```bash
   find public -type d -path '*/optimized/optimized' -exec rm -rf {} +
   ```

3. **Verify cleanup:**
   ```bash
   npm run assets:check-bloat
   du -sh public
   ```

4. **Commit cleanup:**
   ```bash
   git add public/
   git commit -m "chore: remove asset bloat"
   ```

5. **Update this guide** if new bloat patterns discovered

---

## 📈 Success Metrics

**Target State:**
- ✅ Public directory: 10-20MB
- ✅ Zero nested optimized directories
- ✅ <10 duplicate files per name
- ✅ All CI checks passing
- ✅ Fast build times (<2 min)

**Monitor:**
- Weekly bloat checks pass
- CI remains green
- Public size stable
- No new bloat patterns

---

## 🤝 Team Responsibilities

### Developers
- Run bloat check before committing asset changes
- Review CI bloat check results
- Don't disable safeguards

### Reviewers
- Check CI bloat results in PRs
- Verify public directory size in asset PRs
- Request fixes if bloat detected

### Maintainers
- Monitor bloat trends weekly
- Update thresholds if needed
- Keep this guide current

---

## 📚 Related Documentation

- [Codebase Cleanup Summary](./CODEBASE_CLEANUP_SUMMARY.md) - Original cleanup details
- [Asset Optimization Guide](./docs/ASSET_OPTIMIZATION_GUIDE.md) - How assets work
- [CI/CD Documentation](./docs/CI_AND_TESTING_STRATEGY.md) - CI setup

---

## 🆘 Getting Help

**If bloat detected:**
1. Run `npm run assets:check-bloat` for details
2. Check this guide's Recovery Process
3. Review the original cleanup summary
4. Ask the team if unsure

**Questions?**
- Review the bloat check script: `scripts/check-asset-bloat.cjs`
- Check GitHub Actions logs
- Consult this guide

---

**Last Updated:** October 21, 2025  
**Status:** Active monitoring ✅  
**Next Review:** November 21, 2025

