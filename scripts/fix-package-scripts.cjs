const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing package.json script duplications...');

// Read the current package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Fix the duplicate production:migration:full scripts
// Keep the first one and rename the second one
const scripts = packageJson.scripts;

// Convert to an array to find duplicates
const scriptEntries = Object.entries(scripts);
const fixedScripts = {};
const seenKeys = new Set();

for (const [key, value] of scriptEntries) {
  if (key === 'production:migration:full' && seenKeys.has(key)) {
    // This is the second occurrence, rename it
    fixedScripts['production:migration:complete'] = value;
    console.log(`✅ Renamed duplicate "${key}" to "production:migration:complete"`);
  } else {
    fixedScripts[key] = value;
    seenKeys.add(key);
  }
}

// Also add missing project name if not present
if (!packageJson.name) {
  packageJson.name = 'tradeya';
  console.log('✅ Added missing project name: tradeya');
}

// Update the package.json with fixed scripts
packageJson.scripts = fixedScripts;

// Write the corrected package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Package.json script duplications fixed successfully!');
console.log('📄 Total scripts:', Object.keys(fixedScripts).length);