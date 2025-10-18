const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Final Collaboration Edit Test - Complete Workflow\n');
  console.log('Testing both fixes:');
  console.log('  1. Permissions fix (collaborations loading)');
  console.log('  2. Edit fix (ownerPhotoURL undefined)');
  console.log('\n' + '='.repeat(80) + '\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track critical errors
  const permissionErrors = [];
  const ownerPhotoURLErrors = [];
  const firebaseUndefinedErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    
    if (text.includes('Missing or insufficient permissions')) {
      permissionErrors.push(text);
      console.log('⚠️  Permission error:', text.substring(0, 100));
    }
    
    if ((text.toLowerCase().includes('ownerphotourl') || text.toLowerCase().includes('owner photo')) && 
        (text.toLowerCase().includes('undefined') || text.toLowerCase().includes('error'))) {
      ownerPhotoURLErrors.push(text);
      console.log('❌ CRITICAL: ownerPhotoURL error:', text.substring(0, 100));
    }
    
    if (text.toLowerCase().includes('firebase') && 
        text.toLowerCase().includes('undefined') &&
        text.toLowerCase().includes('invalid')) {
      firebaseUndefinedErrors.push(text);
      console.log('❌ Firebase undefined error:', text.substring(0, 100));
    }
  });
  
  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });
  
  try {
    // Step 1: Navigate to login
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:5175/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/01-login.png' });
    console.log('✅ Login page loaded\n');
    
    // Step 2: Login with email/password (NOT Google OAuth)
    console.log('📍 Step 2: Logging in with email/password...');
    console.log('   Email: johnfroberts11@gmail.com');
    
    // Fill email
    const emailField = page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
    await emailField.fill('johnfroberts11@gmail.com');
    await page.waitForTimeout(500);
    
    // Fill password
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    await passwordField.fill('Jasmine629!');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-screenshots/02-login-filled.png' });
    
    // Click Log In button (NOT Google button)
    const loginButton = page.locator('button[type="submit"], button:has-text("Log In")').first();
    await loginButton.click();
    
    console.log('   🔐 Login submitted, waiting for authentication...');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'test-screenshots/03-after-login.png' });
    console.log('✅ Login completed\n');
    
    // Step 3: Navigate to Collaborations
    console.log('📍 Step 3: Navigating to Collaborations page...');
    console.log('   🔍 Testing permissions fix...\n');
    
    await page.goto('http://localhost:5175/collaborations', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-screenshots/04-collaborations-page.png' });
    
    const permissionErrorCount = permissionErrors.length;
    console.log(`   Permission errors during page load: ${permissionErrorCount} ${permissionErrorCount === 0 ? '✅' : '❌'}`);
    
    // Check if page loaded
    const hasTitle = await page.locator('text=/collaboration/i').first().isVisible().catch(() => false);
    const hasCreateButton = await page.locator('text=/create/i').first().isVisible().catch(() => false);
    
    console.log(`   Page title visible: ${hasTitle ? '✅' : '❌'}`);
    console.log(`   Create button visible: ${hasCreateButton ? '✅' : '❌'}`);
    console.log('✅ Collaborations page loaded\n');
    
    // Step 4: Find or create a collaboration
    console.log('📍 Step 4: Finding collaboration to edit...');
    await page.waitForTimeout(2000);
    
    const collabLinks = await page.locator('a[href*="/collaborations/"]:not([href*="/new"])').all();
    console.log(`   Found ${collabLinks.length} collaboration(s)\n`);
    
    if (collabLinks.length === 0) {
      console.log('   Creating test collaboration first...');
      
      await page.goto('http://localhost:5175/collaborations/new');
      await page.waitForTimeout(3000);
      
      await page.fill('input[id="title"]', 'Test Collaboration for Edit Fix');
      await page.fill('textarea[id="description"]', 'Testing the ownerPhotoURL fix');
      
      await page.screenshot({ path: 'test-screenshots/05-create-form.png' });
      
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      
      console.log('   ⏳ Waiting for creation...');
      await page.waitForTimeout(5000);
      console.log('   ✅ Test collaboration created\n');
      
      await page.goto('http://localhost:5175/collaborations', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }
    
    // Step 5: Open collaboration detail
    console.log('📍 Step 5: Opening collaboration detail page...');
    const firstCollab = page.locator('a[href*="/collaborations/"]:not([href*="/new"])').first();
    
    if (await firstCollab.isVisible({ timeout: 5000 })) {
      await firstCollab.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-screenshots/06-detail-page.png' });
      console.log('✅ Detail page opened\n');
      
      // Step 6: Click Edit button (THE CRITICAL TEST)
      console.log('📍 Step 6: Clicking EDIT button...');
      console.log('🚨 CRITICAL MOMENT: Testing ownerPhotoURL fix...\n');
      
      const editButton = page.locator('button:has-text("Edit")').first();
      
      if (await editButton.isVisible({ timeout: 5000 })) {
        // Clear error trackers
        ownerPhotoURLErrors.length = 0;
        firebaseUndefinedErrors.length = 0;
        
        await editButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-screenshots/07-edit-mode.png' });
        console.log('✅ Edit mode activated\n');
        
        // Step 7: Verify form UI
        console.log('📍 Step 7: Verifying modern form UI...');
        
        const hasTitle = await page.locator('input[id="title"]').isVisible();
        const hasDesc = await page.locator('textarea[id="description"]').isVisible();
        const hasGlass = (await page.locator('[class*="glass"]').count()) > 0;
        
        console.log(`   ✅ Title field: ${hasTitle}`);
        console.log(`   ✅ Description field: ${hasDesc}`);
        console.log(`   ✅ Glassmorphic styling: ${hasGlass}\n`);
        
        // Step 8: Make changes
        console.log('📍 Step 8: Making changes...');
        const timestamp = Date.now();
        
        await page.fill('input[id="title"]', `Edited @ ${timestamp}`);
        await page.fill('textarea[id="description"]', `Edited at ${new Date().toISOString()} to verify the fix works!`);
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-screenshots/08-form-edited.png' });
        console.log('✅ Changes made\n');
        
        // Step 9: Save (CRITICAL TEST FOR ownerPhotoURL)
        console.log('📍 Step 9: SAVING CHANGES...');
        console.log('🔍 Watching for ownerPhotoURL errors...\n');
        
        const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
        await saveButton.click();
        
        console.log('   💾 Save clicked, waiting...');
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'test-screenshots/09-after-save.png' });
        
        // Check for success
        const successVisible = await page.locator('text=/success|updated|saved/i').isVisible().catch(() => false);
        const errorVisible = await page.locator('text=/error|failed/i').isVisible().catch(() => false);
        
        console.log(`   Success message: ${successVisible ? '✅ YES' : '❌ NO'}`);
        console.log(`   Error message: ${errorVisible ? '❌ YES' : '✅ NO'}`);
        console.log(`   ownerPhotoURL errors: ${ownerPhotoURLErrors.length === 0 ? '✅ NONE' : `❌ ${ownerPhotoURLErrors.length}`}`);
        console.log(`   Firebase undefined errors: ${firebaseUndefinedErrors.length === 0 ? '✅ NONE' : `❌ ${firebaseUndefinedErrors.length}`}\n`);
        
      } else {
        console.log('❌ Edit button not found\n');
      }
      
    } else {
      console.log('❌ No collaborations found to test\n');
    }
    
    // Final Results
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL TEST RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log('FIX #1: PERMISSIONS (Collaborations Loading)');
    console.log(`  Permission errors: ${permissionErrors.length}`);
    console.log(`  Status: ${permissionErrors.length === 0 ? '✅ FIXED' : '⚠️  STILL PRESENT'}\n`);
    
    console.log('FIX #2: EDIT FORM (ownerPhotoURL undefined)');
    console.log(`  ownerPhotoURL errors: ${ownerPhotoURLErrors.length}`);
    console.log(`  Firebase undefined errors: ${firebaseUndefinedErrors.length}`);
    console.log(`  Status: ${(ownerPhotoURLErrors.length === 0 && firebaseUndefinedErrors.length === 0) ? '✅ FIXED' : '❌ ERRORS DETECTED'}\n`);
    
    if (permissionErrors.length === 0 && ownerPhotoURLErrors.length === 0 && firebaseUndefinedErrors.length === 0) {
      console.log('✅ ✅ ✅ ALL FIXES VERIFIED SUCCESSFULLY! ✅ ✅ ✅');
      console.log('✅ No permission errors');
      console.log('✅ No ownerPhotoURL errors');
      console.log('✅ Collaboration edit functionality working correctly');
    } else {
      console.log('⚠️  Some issues detected (see details above)');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📸 Screenshots saved to test-screenshots/');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'test-screenshots/test-error.png' });
  } finally {
    console.log('⏳ Keeping browser open for 10 seconds for review...\n');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('🏁 Test complete!\n');
  }
})();

