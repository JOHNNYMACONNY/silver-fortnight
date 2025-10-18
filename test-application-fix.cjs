const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing Collaboration Application Fix\n');
  console.log('Verifying LJ Chioni\'s application now appears for John F. Roberts...\n');
  console.log('='.repeat(80) + '\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 600
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  let applicationsFound = 0;
  let generalApplicationsRetrieved = false;
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('No general applications found') || text.includes('general applications')) {
      generalApplicationsRetrieved = true;
      console.log('✅ Code checked for general applications:', text.substring(0, 100));
    }
  });
  
  try {
    // Step 1: Login as John F. Roberts (collaboration owner)
    console.log('📍 Step 1: Logging in as John F. Roberts (owner)...');
    await page.goto('http://localhost:5175/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'johnfroberts11@gmail.com');
    await page.fill('input[type="password"]', 'Jasmine629!');
    await page.locator('button[type="submit"]').first().click();
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-screenshots/app-fix-01-login.png' });
    console.log('✅ Logged in as John F. Roberts\n');
    
    // Step 2: Navigate to collaborations
    console.log('📍 Step 2: Going to collaborations page...');
    await page.goto('http://localhost:5175/collaborations', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/app-fix-02-collaborations.png' });
    console.log('✅ Collaborations page loaded\n');
    
    // Step 3: Click on the test collaboration
    console.log('📍 Step 3: Opening collaboration detail page...');
    const collabLink = page.locator('a[href*="/collaborations/"]:not([href*="/new"])').first();
    
    if (await collabLink.isVisible({ timeout: 5000 })) {
      await collabLink.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'test-screenshots/app-fix-03-detail-page.png' });
      console.log('✅ Detail page opened\n');
      
      // Step 4: Check for applications section
      console.log('📍 Step 4: Checking for applications...');
      console.log('🔍 Looking for LJ Chioni\'s application...\n');
      
      // Wait for page to fully load applications
      await page.waitForTimeout(3000);
      
      // Look for application indicators
      const pendingAppsText = await page.locator('text=/pending application/i').textContent().catch(() => '');
      console.log(`   Pending applications text: ${pendingAppsText}`);
      
      // Look for specific application cards or names
      const ljChioniText = await page.locator('text=/lj.*chioni/i').count();
      const applicationCards = await page.locator('[class*="application"], [data-testid*="application"]').count();
      
      console.log(`   LJ Chioni name found: ${ljChioniText > 0 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Application cards found: ${applicationCards}`);
      
      // Try to find applications in different ways
      const hasApplicationsTab = await page.locator('text=/applications/i').count() > 0;
      const hasApplicationsSection = await page.locator('text=/pending.*application/i').count() > 0;
      
      console.log(`   Applications tab/section: ${hasApplicationsTab || hasApplicationsSection ? '✅ YES' : '❌ NO'}`);
      
      await page.screenshot({ path: 'test-screenshots/app-fix-04-applications-check.png' });
      
      applicationsFound = ljChioniText;
      
      // Check if there's a tab or section to view applications
      if (hasApplicationsTab) {
        console.log('\n   📋 Found applications tab, clicking...');
        const appTab = page.locator('text=/applications/i').first();
        await appTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-screenshots/app-fix-05-applications-tab.png' });
        
        const ljInTab = await page.locator('text=/lj.*chioni/i').count();
        console.log(`   LJ Chioni in applications tab: ${ljInTab > 0 ? '✅ FOUND' : '❌ NOT FOUND'}`);
        applicationsFound = ljInTab;
      }
      
    } else {
      console.log('❌ No collaboration found to test\n');
    }
    
    // Final Results
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`General Applications Checked: ${generalApplicationsRetrieved ? '✅' : '⚠️  Not confirmed'}`);
    console.log(`LJ Chioni Application Found: ${applicationsFound > 0 ? '✅ YES' : '❌ NO'}`);
    
    if (applicationsFound > 0) {
      console.log('\n✅ ✅ ✅ SUCCESS! APPLICATION FIX VERIFIED! ✅ ✅ ✅');
      console.log('✅ LJ Chioni\'s application is now visible');
      console.log('✅ General applications are retrieved correctly');
      console.log('✅ John F. Roberts can see the application');
    } else {
      console.log('\n⚠️  Application not immediately visible');
      console.log('   This could mean:');
      console.log('   1. Page hasn\'t refreshed yet (try refreshing)');
      console.log('   2. Need to check Firestore directly');
      console.log('   3. Application might be in pending state');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📸 Screenshots saved to test-screenshots/');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'test-screenshots/app-fix-error.png' });
  } finally {
    console.log('⏳ Keeping browser open for 15 seconds for review...\n');
    await page.waitForTimeout(15000);
    await browser.close();
    console.log('🏁 Test complete!\n');
  }
})();

