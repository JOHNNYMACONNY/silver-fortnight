const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing Permissions Fix\n');
  console.log('Verifying collaborations page loads after fix...\n');
  console.log('='.repeat(80) + '\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  let permissionErrors = 0;
  let collaborationsLoaded = false;
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Missing or insufficient permissions')) {
      permissionErrors++;
      console.log('❌ Permission error detected:', text.substring(0, 100));
    }
    if (text.includes('processing realtime collaborations') || text.includes('Collaboration')) {
      console.log('✅ Processing collaborations:', text.substring(0, 100));
    }
  });
  
  try {
    // Step 1: Go to login
    console.log('📍 Step 1: Navigating to login...');
    await page.goto('http://localhost:5175/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    console.log('✅ Login page loaded\n');
    
    // Step 2: Click Google Sign In
    console.log('📍 Step 2: Initiating Google Sign In...');
    const googleBtn = page.locator('button:has-text("Sign in with Google")').first();
    
    if (await googleBtn.isVisible({ timeout: 3000 })) {
      await googleBtn.click();
      await page.waitForTimeout(3000);
      
      // Handle OAuth
      const pages = context.pages();
      const authPage = pages.length > 1 ? pages[pages.length - 1] : page;
      const url = authPage.url();
      
      if (url.includes('accounts.google.com')) {
        console.log('🔐 Entering credentials...');
        
        const emailInput = authPage.locator('input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 5000 })) {
          await emailInput.fill('johnfroberts11@gmail.com');
          await authPage.waitForTimeout(1000);
          await authPage.locator('button:has-text("Next")').first().click();
          await authPage.waitForTimeout(3000);
        }
        
        const passwordInput = authPage.locator('input[type="password"]').first();
        if (await passwordInput.isVisible({ timeout: 5000 })) {
          await passwordInput.fill('Jasmine629!');
          await authPage.waitForTimeout(1000);
          await authPage.locator('button:has-text("Next")').first().click();
          await authPage.waitForTimeout(5000);
        }
      }
      
      console.log('✅ OAuth completed\n');
    }
    
    // Step 3: Navigate to Collaborations  
    console.log('📍 Step 3: Navigating to Collaborations page...');
    console.log('🔍 Watching for permission errors...\n');
    
    permissionErrors = 0; // Reset counter
    
    await page.goto('http://localhost:5175/collaborations', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-screenshots/permissions-fix-test.png' });
    
    // Check if collaborations loaded
    const collabCards = await page.locator('a[href*="/collaborations/"]:not([href*="/new"])').count();
    const hasCreateButton = await page.locator('button:has-text("Create"), text=/create.*collaboration/i').count() > 0;
    const hasSearchBar = await page.locator('input[placeholder*="Search"]').count() > 0;
    
    collaborationsLoaded = collabCards >= 0 && (hasCreateButton || hasSearchBar);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`Permission Errors: ${permissionErrors} ${permissionErrors === 0 ? '✅' : '❌'}`);
    console.log(`Collaborations Found: ${collabCards}`);
    console.log(`Page Elements Loaded: ${collaborationsLoaded ? '✅' : '❌'}`);
    console.log(`Create Button Present: ${hasCreateButton ? '✅' : '❌'}`);
    console.log(`Search Bar Present: ${hasSearchBar ? '✅' : '❌'}`);
    
    if (permissionErrors === 0 && collaborationsLoaded) {
      console.log('\n✅ ✅ ✅ SUCCESS! PERMISSIONS FIX VERIFIED! ✅ ✅ ✅');
      console.log('✅ No permission errors');
      console.log('✅ Collaborations page loads correctly');
      console.log('✅ Can proceed to test collaboration editing');
    } else if (permissionErrors > 0) {
      console.log('\n⚠️  Permission errors still present');
      console.log('   May need to check if collaborations have public flag set');
    } else {
      console.log('\n⚠️  Page loaded but collaborations may not be displaying');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'test-screenshots/permissions-test-error.png' });
  } finally {
    console.log('⏳ Keeping browser open for 8 seconds...\n');
    await page.waitForTimeout(8000);
    await browser.close();
    console.log('🏁 Test complete!\n');
  }
})();

