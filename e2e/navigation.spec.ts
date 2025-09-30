import { test, expect } from "./fixtures/auth";

test.describe("Navigation System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display navbar with correct elements", async ({ page }) => {
    // Check if navbar is visible
    const navbar = page.locator("nav");
    await expect(navbar).toBeVisible();

    // Check for logo/brand
    const logo = page.locator('[data-testid="navbar-logo"]');
    await expect(logo).toBeVisible();

    // Check for navigation links
    const navLinks = page.locator('[data-testid="nav-links"]');
    await expect(navLinks).toBeVisible();
  });

  test("should toggle mobile menu on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile menu button is visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();

    // Click mobile menu button
    await mobileMenuButton.click();

    // Check if mobile menu is open
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Click again to close
    await mobileMenuButton.click();
    await expect(mobileMenu).not.toBeVisible();
  });

  test("should open command palette with Cmd+K", async ({ page }) => {
    // Press Cmd+K (or Ctrl+K on non-Mac)
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    await page.keyboard.press(`${modifier}+KeyK`);

    // Check if command palette is visible
    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();

    // Check if search input is focused
    const searchInput = page.locator('[data-testid="command-palette-search"]');
    await expect(searchInput).toBeFocused();
  });

  test("should close command palette with Escape", async ({ page }) => {
    // Open command palette first
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    await page.keyboard.press(`${modifier}+KeyK`);

    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(commandPalette).not.toBeVisible();
  });

  test("should search and navigate in command palette", async ({ page }) => {
    // Open command palette
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    await page.keyboard.press(`${modifier}+KeyK`);

    const commandPalette = page.locator('[data-testid="command-palette"]');
    await expect(commandPalette).toBeVisible();

    // Type search query
    const searchInput = page.locator('[data-testid="command-palette-search"]');
    await searchInput.fill("profile");

    // Check if search results are displayed
    const searchResults = page.locator(
      '[data-testid="command-palette-results"]'
    );
    await expect(searchResults).toBeVisible();

    // Check if results contain profile-related items
    const profileResult = page.locator(
      '[data-testid="command-palette-results"] >> text=Profile'
    );
    await expect(profileResult).toBeVisible();
  });

  test("should change navbar appearance on scroll", async ({ page }) => {
    // Create a tall page to enable scrolling
    await page.addStyleTag({
      content: `
        body::after {
          content: '';
          display: block;
          height: 200vh;
        }
      `,
    });

    const navbar = page.locator("nav");

    // Check initial state (not scrolled)
    await expect(navbar).not.toHaveClass(/scrolled/);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 100));

    // Wait for scroll effect and check if navbar has scrolled class
    await page.waitForTimeout(100); // Wait for scroll throttling
    await expect(navbar).toHaveClass(/scrolled/);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    await expect(navbar).not.toHaveClass(/scrolled/);
  });

  test("should highlight active navigation link", async ({ page }) => {
    // Navigate to a specific page
    await page.goto("/profile");

    // Check if profile link is active
    const profileLink = page.locator('[data-testid="nav-link-profile"]');
    await expect(profileLink).toHaveClass(/active/);

    // Navigate to another page
    await page.goto("/trades");

    // Check if trades link is active and profile is not
    const tradesLink = page.locator('[data-testid="nav-link-trades"]');
    await expect(tradesLink).toHaveClass(/active/);
    await expect(profileLink).not.toHaveClass(/active/);
  });

  test("should be accessible with keyboard navigation", async ({ page }) => {
    // Tab through navigation elements
    await page.keyboard.press("Tab");

    // Check if first focusable element is focused
    const firstNavElement = page.locator("nav a:first-child");
    await expect(firstNavElement).toBeFocused();

    // Continue tabbing through navigation
    await page.keyboard.press("Tab");
    const secondNavElement = page.locator("nav a:nth-child(2)");
    await expect(secondNavElement).toBeFocused();
  });

  test("should maintain z-index hierarchy", async ({ page }) => {
    // Open command palette
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";

    await page.keyboard.press(`${modifier}+KeyK`);

    // Check z-index values
    const navbar = page.locator("nav");
    const commandPalette = page.locator('[data-testid="command-palette"]');

    const navbarZIndex = await navbar.evaluate(
      (el) => window.getComputedStyle(el).zIndex
    );
    const paletteZIndex = await commandPalette.evaluate(
      (el) => window.getComputedStyle(el).zIndex
    );

    // Command palette should have higher z-index than navbar
    expect(parseInt(paletteZIndex)).toBeGreaterThan(parseInt(navbarZIndex));
  });

  test("should adapt navigation items based on screen size", async ({
    page,
  }) => {
    // Test at 1200px - should show all items
    await page.setViewportSize({ width: 1200, height: 600 });
    await page.goto("/");

    const navLinks = page.locator('[data-testid="nav-links"]');
    await expect(navLinks).toBeVisible();

    // Should show all 6 navigation items
    const navItems = navLinks.locator("a");
    await expect(navItems).toHaveCount(6);

    // Check specific items are visible
    await expect(navLinks.locator('a[href="/trades"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/collaborations"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/directory"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/challenges"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/portfolio"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/leaderboard"]')).toBeVisible();

    // Test at 1000px - should hide leaderboard
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.reload();

    const navItemsMedium = navLinks.locator("a");
    await expect(navItemsMedium).toHaveCount(5);

    // Leaderboard should be hidden
    await expect(navLinks.locator('a[href="/leaderboard"]')).not.toBeVisible();

    // Other items should still be visible
    await expect(navLinks.locator('a[href="/trades"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/collaborations"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/directory"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/challenges"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/portfolio"]')).toBeVisible();

    // Test at 900px - should hide portfolio and leaderboard
    await page.setViewportSize({ width: 900, height: 600 });
    await page.reload();

    const navItemsSmall = navLinks.locator("a");
    await expect(navItemsSmall).toHaveCount(4);

    // Portfolio and leaderboard should be hidden
    await expect(navLinks.locator('a[href="/portfolio"]')).not.toBeVisible();
    await expect(navLinks.locator('a[href="/leaderboard"]')).not.toBeVisible();

    // First 4 items should still be visible
    await expect(navLinks.locator('a[href="/trades"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/collaborations"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/directory"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/challenges"]')).toBeVisible();

    // Test at 800px - should show only first 3 items
    await page.setViewportSize({ width: 800, height: 600 });
    await page.reload();

    const navItemsVerySmall = navLinks.locator("a");
    await expect(navItemsVerySmall).toHaveCount(3);

    // Only first 3 items should be visible
    await expect(navLinks.locator('a[href="/trades"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/collaborations"]')).toBeVisible();
    await expect(navLinks.locator('a[href="/directory"]')).toBeVisible();

    // Last 3 items should be hidden
    await expect(navLinks.locator('a[href="/challenges"]')).not.toBeVisible();
    await expect(navLinks.locator('a[href="/portfolio"]')).not.toBeVisible();
    await expect(navLinks.locator('a[href="/leaderboard"]')).not.toBeVisible();
  });

  test("should prevent search button overlap with navigation items", async ({
    page,
  }) => {
    // Test at various screen sizes to ensure no overlap
    const testSizes = [
      { width: 1200, height: 600, expectedItems: 6 },
      { width: 1000, height: 600, expectedItems: 5 },
      { width: 900, height: 600, expectedItems: 4 },
      { width: 800, height: 600, expectedItems: 3 },
    ];

    for (const size of testSizes) {
      await page.setViewportSize(size);
      await page.goto("/");

      const navLinks = page.locator('[data-testid="nav-links"]');
      const searchButton = page.locator(
        'button[aria-label="Open command palette"]'
      );

      // Both elements should be visible
      await expect(navLinks).toBeVisible();
      await expect(searchButton).toBeVisible();

      // Check that navigation items count matches expected
      const navItems = navLinks.locator("a");
      await expect(navItems).toHaveCount(size.expectedItems);

      // Verify no visual overlap by checking element positions
      const navLinksBox = await navLinks.boundingBox();
      const searchButtonBox = await searchButton.boundingBox();

      if (navLinksBox && searchButtonBox) {
        // Navigation should end before search button starts
        expect(navLinksBox.x + navLinksBox.width).toBeLessThanOrEqual(
          searchButtonBox.x
        );
      }
    }
  });
});
