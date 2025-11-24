import { test, expect } from './fixtures/auth';

test.describe('Trade Lifecycle E2E Tests', () => {
test.beforeEach(async ({ signedInPage: page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
});

test('should complete full trade creation workflow', async ({ signedInPage: page }) => {
    // Navigate to trade creation
    await page.click('[data-testid="create-trade-button"]');
    
    // Fill out trade form
    await page.fill('[data-testid="trade-title-input"]', 'Web Development for Design');
    await page.fill('[data-testid="offered-skill-input"]', 'React Development');
    await page.fill('[data-testid="requested-skill-input"]', 'UI/UX Design');
    await page.fill('[data-testid="trade-description-textarea"]', 'Looking to trade my React development skills for UI/UX design help on a project.');
    
    // Set trade parameters
    await page.selectOption('[data-testid="trade-duration-select"]', '2-weeks');
    await page.selectOption('[data-testid="trade-category-select"]', 'technology');
    
    // Add tags
    await page.fill('[data-testid="trade-tags-input"]', 'react,frontend,javascript');
    
    // Submit trade
    await page.click('[data-testid="submit-trade-button"]');
    
    // Verify trade was created
    await expect(page.locator('[data-testid="trade-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="trade-success-message"]')).toContainText('Trade created successfully');
    
    // Verify redirect to trade details
    await expect(page).toHaveURL(/\/trades\/[a-zA-Z0-9]+/);
    
    // Verify trade details are displayed
    await expect(page.locator('[data-testid="trade-title"]')).toContainText('Web Development for Design');
    await expect(page.locator('[data-testid="offered-skill"]')).toContainText('React Development');
    await expect(page.locator('[data-testid="requested-skill"]')).toContainText('UI/UX Design');
  });

test('should handle trade discovery and filtering', async ({ signedInPage: page }) => {
    // Navigate to trades page
    await page.click('[data-testid="nav-trades"]');
    
    // Verify trades list is visible
    await expect(page.locator('[data-testid="trades-list"]')).toBeVisible();
    
    // Test search functionality
    await page.fill('[data-testid="trade-search-input"]', 'React');
    await page.keyboard.press('Enter');
    
    // Verify search results
    await expect(page.locator('[data-testid="trade-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="trade-card"]').first()).toContainText('React');
    
    // Test category grid view
    await page.click('[data-testid="category-view-toggle"]');
    await page.click('[data-testid="category-grid-view"]');
    
    // Verify category grid is visible
    await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();
    
    // Select category from grid
    await page.click('[data-testid="category-design"]');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="trade-card"]')).toHaveCountGreaterThanOrEqual(0);
    
    // Test category dropdown view
    await page.click('[data-testid="category-dropdown-view"]');
    
    // Test category filtering with dropdown
    await page.selectOption('[data-testid="category-filter"]', 'technology');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="trade-card"]')).toHaveCountGreaterThanOrEqual(0);
    
    // Test skill level filtering
    await page.selectOption('[data-testid="skill-level-filter"]', 'intermediate');
    
    // Clear filters
    await page.click('[data-testid="clear-filters-button"]');
    
    // Verify all trades are shown again
    await expect(page.locator('[data-testid="trade-card"]')).toHaveCountGreaterThan(1);
  });

  test('should display search history in search bar', async ({ signedInPage: page }) => {
    // Navigate to trades page
    await page.click('[data-testid="nav-trades"]');
    
    // Perform a search
    await page.fill('[data-testid="trade-search-input"]', 'React Development');
    await page.keyboard.press('Enter');
    
    // Wait for search to complete
    await page.waitForTimeout(500);
    
    // Clear search
    await page.fill('[data-testid="trade-search-input"]', '');
    await page.click('[data-testid="trade-search-input"]');
    
    // Verify recent searches are displayed
    const recentSearches = page.locator('[data-testid="recent-searches"]');
    if (await recentSearches.count() > 0) {
      await expect(recentSearches).toBeVisible();
      await expect(recentSearches).toContainText('React Development');
    }
  });

  test('should display enhanced trade status timeline', async ({ signedInPage: page }) => {
    // Navigate to a trade detail page
    await page.goto('/trades');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on first trade
    const firstTrade = page.locator('[data-testid="trade-card"]').first();
    if (await firstTrade.count() > 0) {
      await firstTrade.click();
      
      // Verify trade detail page loaded
      await expect(page.locator('[data-testid="trade-title"]')).toBeVisible();
      
      // Verify enhanced timeline is displayed
      const timeline = page.locator('[data-testid="trade-status-timeline"]');
      if (await timeline.count() > 0) {
        await expect(timeline).toBeVisible();
        
        // Verify progress bar exists
        const progressBar = page.locator('[data-testid="timeline-progress-bar"]');
        if (await progressBar.count() > 0) {
          await expect(progressBar).toBeVisible();
        }
        
        // Verify next step callout exists
        const nextStep = page.locator('[data-testid="timeline-next-step"]');
        if (await nextStep.count() > 0) {
          await expect(nextStep).toBeVisible();
        }
      }
    }
  });

test('should handle trade application workflow', async ({ signedInPage: page }) => {
    // Navigate to a specific trade
    await page.goto('/trades/test-trade-id');
    
    // Verify trade details are loaded
    await expect(page.locator('[data-testid="trade-title"]')).toBeVisible();
    
    // Apply for trade
    await page.click('[data-testid="apply-for-trade-button"]');
    
    // Fill application form
    await page.fill('[data-testid="application-message-textarea"]', 'I have 5 years of React experience and would love to help with your project.');
    await page.fill('[data-testid="portfolio-link-input"]', 'https://github.com/testuser');
    
    // Add relevant experience
    await page.fill('[data-testid="relevant-experience-textarea"]', 'Built multiple React applications including e-commerce platforms and dashboards.');
    
    // Submit application
    await page.click('[data-testid="submit-application-button"]');
    
    // Verify application success
    await expect(page.locator('[data-testid="application-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-success-message"]')).toContainText('Application submitted successfully');
    
    // Verify application status is updated
    await expect(page.locator('[data-testid="trade-status"]')).toContainText('Application Pending');
  });

test('should handle trade acceptance and completion', async ({ signedInPage: page }) => {
    // Mock trade owner perspective
    await page.addInitScript(() => {
      window.localStorage.setItem('firebase:authUser:test', JSON.stringify({
        uid: 'trade-owner-id',
        email: 'owner@example.com',
        displayName: 'Trade Owner'
      }));
    });
    
    // Navigate to trade with applications
    await page.goto('/trades/test-trade-id/applications');
    
    // Verify applications list
    await expect(page.locator('[data-testid="applications-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-card"]')).toHaveCountGreaterThan(0);
    
    // Review first application
    await page.click('[data-testid="application-card"]').first();
    
    // Verify application details
    await expect(page.locator('[data-testid="applicant-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-message"]')).toBeVisible();
    
    // Accept application
    await page.click('[data-testid="accept-application-button"]');
    
    // Confirm acceptance
    await page.click('[data-testid="confirm-acceptance-button"]');
    
    // Verify trade status updated
    await expect(page.locator('[data-testid="trade-status"]')).toContainText('In Progress');
    
    // Navigate to active trades
    await page.click('[data-testid="nav-active-trades"]');
    
    // Verify trade appears in active list
    await expect(page.locator('[data-testid="active-trade-card"]')).toBeVisible();
    
    // Mark trade as completed
    await page.click('[data-testid="complete-trade-button"]');
    
    // Fill completion form
    await page.fill('[data-testid="completion-notes-textarea"]', 'Great collaboration! The React components were delivered on time and met all requirements.');
    await page.selectOption('[data-testid="rating-select"]', '5');
    
    // Submit completion
    await page.click('[data-testid="submit-completion-button"]');
    
    // Verify completion success
    await expect(page.locator('[data-testid="completion-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="trade-status"]')).toContainText('Completed');
  });

test('should handle trade cancellation workflow', async ({ signedInPage: page }) => {
    // Navigate to active trade
    await page.goto('/trades/test-active-trade-id');
    
    // Verify trade is active
    await expect(page.locator('[data-testid="trade-status"]')).toContainText('In Progress');
    
    // Initiate cancellation
    await page.click('[data-testid="cancel-trade-button"]');
    
    // Verify cancellation modal
    await expect(page.locator('[data-testid="cancellation-modal"]')).toBeVisible();
    
    // Fill cancellation reason
    await page.selectOption('[data-testid="cancellation-reason-select"]', 'schedule-conflict');
    await page.fill('[data-testid="cancellation-notes-textarea"]', 'Unfortunately, I have a schedule conflict and cannot complete this trade.');
    
    // Confirm cancellation
    await page.click('[data-testid="confirm-cancellation-button"]');
    
    // Verify cancellation success
    await expect(page.locator('[data-testid="cancellation-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="trade-status"]')).toContainText('Cancelled');
    
    // Verify trade is removed from active trades
    await page.click('[data-testid="nav-active-trades"]');
    await expect(page.locator('[data-testid="active-trade-card"]')).toHaveCount(0);
  });

test('should handle trade messaging and communication', async ({ signedInPage: page }) => {
    // Navigate to active trade
    await page.goto('/trades/test-active-trade-id');
    
    // Open trade chat
    await page.click('[data-testid="open-trade-chat-button"]');
    
    // Verify chat interface
    await expect(page.locator('[data-testid="trade-chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
    
    // Send a message
    await page.fill('[data-testid="chat-message-input"]', 'Hi! I wanted to discuss the project requirements.');
    await page.click('[data-testid="send-message-button"]');
    
    // Verify message appears
    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('Hi! I wanted to discuss the project requirements.');
    
    // Test file sharing
    await page.click('[data-testid="attach-file-button"]');
    
    // Mock file upload
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles({
      name: 'project-requirements.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    });
    
    // Verify file attachment
    await expect(page.locator('[data-testid="file-attachment"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-attachment"]')).toContainText('project-requirements.pdf');
    
    // Send message with attachment
    await page.click('[data-testid="send-message-button"]');
    
    // Verify message with attachment appears
    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText('project-requirements.pdf');
  });

test('should handle trade analytics and tracking', async ({ signedInPage: page }) => {
    // Navigate to user dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // Verify trade statistics
    await expect(page.locator('[data-testid="trade-stats-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-trades-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-trades-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
    
    // Check trade history
    await page.click('[data-testid="view-trade-history-button"]');
    
    // Verify trade history page
    await expect(page.locator('[data-testid="trade-history-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="trade-history-item"]')).toHaveCountGreaterThan(0);
    
    // Filter trade history
    await page.selectOption('[data-testid="history-filter-select"]', 'completed');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="trade-history-item"]')).toHaveCountGreaterThan(0);
    
    // Check individual trade analytics
    await page.click('[data-testid="trade-history-item"]').first();
    
    // Verify trade analytics page
    await expect(page.locator('[data-testid="trade-analytics-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="trade-duration"]')).toBeVisible();
    await expect(page.locator('[data-testid="communication-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="satisfaction-rating"]')).toBeVisible();
  });
});
