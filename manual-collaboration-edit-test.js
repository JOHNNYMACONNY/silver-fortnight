const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Manual Collaboration Edit Test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down so we can see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Track console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('error') || text.includes('Error') || text.includes('failed') || text.includes('Failed')) {
      console.log('⚠️  Console Error:', text);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('❌ Page Error:', err.message);
  });
  
  try {
    // Step 1: Navigate to the application
    console.log('📍 Step 1: Navigating to http://localhost:5175');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-screenshots/01-homepage.png' });
    console.log('✅ Homepage loaded\n');
    
    await page.waitForTimeout(2000);
    
    // Step 2: Check if already logged in, if not, login
    console.log('📍 Step 2: Checking authentication status');
    const isLoggedIn = await page.locator('text=/logout/i').isVisible().catch(() => false) ||
                       await page.locator('text=/sign out/i').isVisible().catch(() => false) ||
                       await page.locator('text=/profile/i').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      console.log('🔐 Not logged in, attempting login...');
      
      // Try to find and click login button
      const loginButton = page.locator('text=/sign in|login/i').first();
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Navigate directly to login page
        await page.goto('http://localhost:5175/login');
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: 'test-screenshots/02-login-page.png' });
      
      // Look for Google Sign In button (common pattern)
      const googleSignIn = page.locator('text=/google|sign in with google/i').first();
      
      if (await googleSignIn.isVisible()) {
        console.log('🔍 Found Google Sign In button, clicking...');
        await googleSignIn.click();
        await page.waitForTimeout(3000);
        
        // Handle Google OAuth popup if it appears
        console.log('⏳ Waiting for OAuth flow...');
        await page.waitForTimeout(5000);
      }
      
      console.log('✅ Login flow initiated\n');
    } else {
      console.log('✅ Already logged in\n');
    }
    
    await page.waitForTimeout(2000);
    
    // Step 3: Navigate to Collaborations page
    console.log('📍 Step 3: Navigating to Collaborations page');
    await page.goto('http://localhost:5175/collaborations', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/03-collaborations-list.png' });
    console.log('✅ Collaborations page loaded\n');
    
    // Step 4: Find an existing collaboration or note if none exist
    console.log('📍 Step 4: Looking for existing collaborations');
    const collaborationCards = await page.locator('[data-testid*="collaboration"], .collaboration-card, a[href*="/collaborations/"]').count();
    
    console.log(`Found ${collaborationCards} collaboration(s)\n`);
    
    if (collaborationCards === 0) {
      console.log('⚠️  No collaborations found. Creating a test collaboration first...');
      
      // Create a test collaboration
      await page.goto('http://localhost:5175/collaborations/new');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/04-create-collaboration.png' });
      
      console.log('📝 Filling out create form...');
      await page.fill('input[name="title"], input[id="title"]', 'Test Collaboration for Edit Testing');
      await page.fill('textarea[name="description"], textarea[id="description"]', 'This is a test collaboration created to verify the edit functionality works correctly.');
      
      await page.screenshot({ path: 'test-screenshots/05-create-form-filled.png' });
      
      // Try to add a role if the UI is available
      const addRoleButton = page.locator('text=/add role/i').first();
      if (await addRoleButton.isVisible()) {
        console.log('➕ Adding a test role...');
        await addRoleButton.click();
        await page.waitForTimeout(1000);
        
        await page.fill('input[name*="role"][name*="title"], input[placeholder*="role"]', 'Test Developer');
        await page.fill('textarea[name*="role"][name*="description"]', 'A test role for verification');
        
        const saveRoleButton = page.locator('text=/save|done|add/i').first();
        if (await saveRoleButton.isVisible()) {
          await saveRoleButton.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();
      
      console.log('⏳ Waiting for collaboration to be created...');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-screenshots/06-collaboration-created.png' });
      console.log('✅ Test collaboration created\n');
    }
    
    // Step 5: Click on a collaboration to view details
    console.log('📍 Step 5: Opening collaboration detail page');
    
    // Try to find and click first collaboration
    const firstCollaboration = page.locator('a[href*="/collaborations/"]:not([href*="/new"])').first();
    await firstCollaboration.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/07-collaboration-detail.png' });
    console.log('✅ Collaboration detail page opened\n');
    
    // Step 6: Look for and click the Edit button
    console.log('📍 Step 6: Looking for Edit button');
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    
    if (await editButton.isVisible()) {
      console.log('✅ Edit button found, clicking...');
      await editButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/08-edit-mode.png' });
      console.log('✅ Edit mode activated\n');
      
      // Step 7: Verify the edit form UI
      console.log('📍 Step 7: Verifying edit form UI');
      
      // Check for glassmorphic styling
      const hasGlassmorphic = await page.locator('.glassmorphic, [class*="glass"]').count() > 0;
      console.log(`   ${hasGlassmorphic ? '✅' : '❌'} Glassmorphic styling present`);
      
      // Check for role management UI
      const hasRoleUI = await page.locator('text=/role/i').count() > 0;
      console.log(`   ${hasRoleUI ? '✅' : '❌'} Role management UI visible`);
      
      // Check for title and description fields
      const titleField = await page.locator('input[name="title"], input[id="title"]').isVisible();
      const descField = await page.locator('textarea[name="description"], textarea[id="description"]').isVisible();
      console.log(`   ${titleField ? '✅' : '❌'} Title field present`);
      console.log(`   ${descField ? '✅' : '❌'} Description field present\n`);
      
      // Step 8: Make changes to the collaboration
      console.log('📍 Step 8: Making changes to collaboration');
      
      const timestamp = new Date().toISOString();
      await page.fill('input[name="title"], input[id="title"]', `Updated Collaboration ${timestamp}`);
      await page.fill('textarea[name="description"], textarea[id="description"]', `This collaboration was updated at ${timestamp} to verify the edit fix works correctly.`);
      
      await page.screenshot({ path: 'test-screenshots/09-edit-form-modified.png' });
      console.log('✅ Changes made to form\n');
      
      // Step 9: Save the changes
      console.log('📍 Step 9: Saving changes');
      
      // Look for save/update button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
      
      // Clear previous errors
      errors.length = 0;
      
      await saveButton.click();
      console.log('💾 Save button clicked...');
      
      // Wait and check for success or errors
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-screenshots/10-after-save.png' });
      
      // Check for success toast/message
      const successMessage = await page.locator('text=/success|updated|saved/i').isVisible().catch(() => false);
      console.log(`   ${successMessage ? '✅' : '❌'} Success message displayed`);
      
      // Check for Firebase errors
      const hasFirebaseError = logs.some(log => 
        log.toLowerCase().includes('firebase') && 
        (log.toLowerCase().includes('error') || log.toLowerCase().includes('undefined'))
      );
      
      const hasOwnerPhotoURLError = logs.some(log => 
        log.toLowerCase().includes('ownerphotourl') || 
        log.toLowerCase().includes('owner photo')
      );
      
      console.log(`   ${!hasFirebaseError ? '✅' : '❌'} No Firebase errors`);
      console.log(`   ${!hasOwnerPhotoURLError ? '✅' : '❌'} No ownerPhotoURL errors\n`);
      
      // Step 10: Verify changes persisted
      console.log('📍 Step 10: Verifying changes persisted');
      await page.waitForTimeout(2000);
      
      const currentTitle = await page.locator('h1, .title').first().textContent().catch(() => '');
      const titleMatches = currentTitle.includes('Updated Collaboration');
      console.log(`   ${titleMatches ? '✅' : '❌'} Title updated: ${currentTitle.substring(0, 50)}...\n`);
      
    } else {
      console.log('❌ Edit button not found on detail page\n');
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const hasErrors = errors.length > 0;
    const hasFirebaseErrors = logs.some(log => 
      log.toLowerCase().includes('firebase') && 
      log.toLowerCase().includes('error')
    );
    const hasUndefinedErrors = logs.some(log => 
      log.toLowerCase().includes('undefined') && 
      log.toLowerCase().includes('ownerphotourl')
    );
    
    console.log(`\nPage Errors: ${errors.length}`);
    console.log(`Firebase Errors: ${hasFirebaseErrors ? 'YES ❌' : 'NO ✅'}`);
    console.log(`ownerPhotoURL undefined Errors: ${hasUndefinedErrors ? 'YES ❌' : 'NO ✅'}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }
    
    console.log('\n✅ Test completed! Screenshots saved to test-screenshots/');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'test-screenshots/error-state.png' });
  } finally {
    // Keep browser open for 5 seconds so we can see the final state
    console.log('⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('🏁 Browser closed. Test complete!\n');
  }
})();

