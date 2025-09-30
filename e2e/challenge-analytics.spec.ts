import { test, expect } from "@playwright/test";

test.describe("Challenge Analytics E2E Tests", () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let analyticsEvents: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear analytics events
    analyticsEvents = [];

    // Navigate to the application
    await page.goto("/");

    // Mock authentication state for testing
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "firebase:authUser:test",
        JSON.stringify({
          uid: "test-user-analytics",
          email: "analytics@example.com",
          displayName: "Analytics Test User",
        })
      );
    });

    // Intercept analytics events
    await page.addInitScript(() => {
      // Mock analytics tracking
      window.gtag = function (
        command: string,
        eventName: string,
        parameters?: any
      ) {
        if (command === "event") {
          window.__analyticsEvents = window.__analyticsEvents || [];
          window.__analyticsEvents.push({
            event: eventName,
            parameters: parameters || {},
            timestamp: Date.now(),
          });
        }
      };

      // Mock business metrics tracking
      window.__trackBusinessMetric = function (
        metric: string,
        value: any,
        metadata?: any
      ) {
        window.__businessMetrics = window.__businessMetrics || [];
        window.__businessMetrics.push({
          metric,
          value,
          metadata: metadata || {},
          timestamp: Date.now(),
        });
      };
    });

    // Expose analytics events to test
    await page.exposeFunction("getAnalyticsEvents", () => {
      return page.evaluate(() => window.__analyticsEvents || []);
    });

    await page.exposeFunction("getBusinessMetrics", () => {
      return page.evaluate(() => window.__businessMetrics || []);
    });
  });

  test("should track challenge discovery analytics", async ({ page }) => {
    // Navigate to challenges page
    await page.goto("/challenges");

    // Wait for page to load
    await expect(page.locator('[data-testid="challenges-list"]')).toBeVisible();

    // Get initial analytics events
    const initialEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify page view event
    expect(
      initialEvents.some(
        (event) =>
          event.event === "page_view" &&
          event.parameters.page_title?.includes("Challenges")
      )
    ).toBe(true);

    // Test filter usage analytics
    await page.selectOption(
      '[data-testid="category-filter"]',
      "web-development"
    );

    // Wait for filter to apply
    await page.waitForTimeout(500);

    const filterEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify filter usage event
    expect(
      filterEvents.some(
        (event) =>
          event.event === "challenge_filters_used" &&
          event.parameters.filter_type === "category" &&
          event.parameters.filter_value === "web-development"
      )
    ).toBe(true);

    // Test search analytics
    await page.fill('[data-testid="challenge-search-input"]', "React");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(500);

    const searchEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify search event
    expect(
      searchEvents.some(
        (event) =>
          event.event === "challenge_search" &&
          event.parameters.search_query === "React"
      )
    ).toBe(true);

    // Test challenge view analytics
    const challengeCard = page
      .locator('[data-testid="challenge-card"]')
      .first();
    if ((await challengeCard.count()) > 0) {
      await challengeCard.click();

      await page.waitForTimeout(500);

      const viewEvents = await page.evaluate(
        () => window.__analyticsEvents || []
      );

      // Verify challenge view event
      expect(
        viewEvents.some(
          (event) =>
            event.event === "challenge_view" && event.parameters.challenge_id
        )
      ).toBe(true);
    }
  });

  test("should track challenge recommendation analytics", async ({ page }) => {
    // Navigate to challenges page
    await page.goto("/challenges");

    // Wait for recommendations to load
    await expect(
      page.locator('[data-testid="recommended-challenges"]')
    ).toBeVisible();

    // Get recommendation impression events
    const impressionEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify recommendation impression event
    expect(
      impressionEvents.some(
        (event) =>
          event.event === "challenge_recommendation_impressions" &&
          event.parameters.recommendation_count > 0
      )
    ).toBe(true);

    // Click on a recommended challenge
    const recommendedChallenge = page
      .locator('[data-testid="recommended-challenge-card"]')
      .first();
    if ((await recommendedChallenge.count()) > 0) {
      await recommendedChallenge.click();

      await page.waitForTimeout(500);

      const clickEvents = await page.evaluate(
        () => window.__analyticsEvents || []
      );

      // Verify recommendation click event
      expect(
        clickEvents.some(
          (event) =>
            event.event === "challenge_recommendation_click" &&
            event.parameters.challenge_id &&
            event.parameters.recommendation_position !== undefined
        )
      ).toBe(true);
    }
  });

  test("should track challenge join and progress analytics", async ({
    page,
  }) => {
    // Navigate to a specific challenge
    await page.goto("/challenges/test-challenge-id");

    // Wait for challenge details to load
    await expect(
      page.locator('[data-testid="challenge-overview"]')
    ).toBeVisible();

    // Join the challenge
    await page.click('[data-testid="join-challenge-button"]');

    // Confirm enrollment
    await page.click('[data-testid="confirm-enrollment-button"]');

    await page.waitForTimeout(1000);

    const joinEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify challenge join event
    expect(
      joinEvents.some(
        (event) =>
          event.event === "challenge_joined" &&
          event.parameters.challenge_id === "test-challenge-id" &&
          event.parameters.user_id === "test-user-analytics"
      )
    ).toBe(true);

    // Verify business metric for challenge join
    const businessMetrics = await page.evaluate(
      () => window.__businessMetrics || []
    );
    expect(
      businessMetrics.some(
        (metric) =>
          metric.metric === "challenge_participation" &&
          metric.value === 1 &&
          metric.metadata.action === "join"
      )
    ).toBe(true);

    // Test progress tracking
    await page.click('[data-testid="start-tier1-button"]');

    // Upload a file to show progress
    await page.click('[data-testid="upload-solution-button"]');

    const fileInput = page.locator('[data-testid="solution-files-input"]');
    await fileInput.setInputFiles([
      {
        name: "test-solution.js",
        mimeType: "text/javascript",
        buffer: Buffer.from('console.log("Hello World");'),
      },
    ]);

    await page.fill(
      '[data-testid="solution-description-textarea"]',
      "Initial progress submission"
    );
    await page.click('[data-testid="submit-progress-button"]');

    await page.waitForTimeout(1000);

    const progressEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify progress tracking event
    expect(
      progressEvents.some(
        (event) =>
          event.event === "challenge_progress_updated" &&
          event.parameters.challenge_id === "test-challenge-id" &&
          event.parameters.progress_percentage > 0
      )
    ).toBe(true);
  });

  test("should track challenge completion and XP award analytics", async ({
    page,
  }) => {
    // Navigate to a challenge in progress
    await page.goto("/challenges/test-challenge-id");

    // Assume challenge is already joined and in progress
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "challenge_test-challenge-id_status",
        "in_progress"
      );
    });

    // Complete the challenge
    await page.click('[data-testid="submit-final-solution-button"]');

    // Fill completion form
    await page.fill(
      '[data-testid="final-description-textarea"]',
      "Complete solution with all requirements met"
    );
    await page.fill(
      '[data-testid="demo-link-input"]',
      "https://demo.example.com"
    );

    // Submit completion
    await page.click('[data-testid="confirm-completion-button"]');

    await page.waitForTimeout(2000);

    const completionEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify challenge completion event
    expect(
      completionEvents.some(
        (event) =>
          event.event === "challenge_completed" &&
          event.parameters.challenge_id === "test-challenge-id" &&
          event.parameters.completion_time_minutes > 0
      )
    ).toBe(true);

    // Verify XP award event
    expect(
      completionEvents.some(
        (event) =>
          event.event === "xp_awarded" &&
          event.parameters.source === "challenge_completion" &&
          event.parameters.amount > 0 &&
          event.parameters.challenge_id === "test-challenge-id"
      )
    ).toBe(true);

    // Verify business metrics for completion
    const businessMetrics = await page.evaluate(
      () => window.__businessMetrics || []
    );
    expect(
      businessMetrics.some(
        (metric) =>
          metric.metric === "challenge_completion" &&
          metric.value === 1 &&
          metric.metadata.challenge_id === "test-challenge-id"
      )
    ).toBe(true);

    // Verify achievement unlock if applicable
    const achievementEvents = completionEvents.filter(
      (event) => event.event === "achievement_unlocked"
    );

    if (achievementEvents.length > 0) {
      expect(
        achievementEvents.some(
          (event) =>
            event.parameters.achievement_id &&
            event.parameters.trigger === "challenge_completion"
        )
      ).toBe(true);
    }
  });

  test("should track leaderboard and social analytics", async ({ page }) => {
    // Navigate to challenge leaderboard
    await page.goto("/challenges/test-challenge-id/leaderboard");

    // Wait for leaderboard to load
    await expect(
      page.locator('[data-testid="challenge-leaderboard"]')
    ).toBeVisible();

    const leaderboardEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify leaderboard view event
    expect(
      leaderboardEvents.some(
        (event) =>
          event.event === "leaderboard_viewed" &&
          event.parameters.leaderboard_type === "challenge" &&
          event.parameters.challenge_id === "test-challenge-id"
      )
    ).toBe(true);

    // Test community solution interaction
    await page.click('[data-testid="community-solutions-tab"]');

    // View a community solution
    const solutionCard = page.locator('[data-testid="solution-card"]').first();
    if ((await solutionCard.count()) > 0) {
      await solutionCard.click();

      await page.waitForTimeout(500);

      const solutionEvents = await page.evaluate(
        () => window.__analyticsEvents || []
      );

      // Verify solution view event
      expect(
        solutionEvents.some(
          (event) =>
            event.event === "community_solution_viewed" &&
            event.parameters.solution_id &&
            event.parameters.challenge_id === "test-challenge-id"
        )
      ).toBe(true);

      // Like the solution
      await page.click('[data-testid="like-solution-button"]');

      await page.waitForTimeout(500);

      const likeEvents = await page.evaluate(
        () => window.__analyticsEvents || []
      );

      // Verify like event
      expect(
        likeEvents.some(
          (event) =>
            event.event === "solution_liked" &&
            event.parameters.solution_id &&
            event.parameters.challenge_id === "test-challenge-id"
        )
      ).toBe(true);

      // Add a comment
      await page.fill(
        '[data-testid="comment-input"]',
        "Great solution! Very clean code."
      );
      await page.click('[data-testid="submit-comment-button"]');

      await page.waitForTimeout(500);

      const commentEvents = await page.evaluate(
        () => window.__analyticsEvents || []
      );

      // Verify comment event
      expect(
        commentEvents.some(
          (event) =>
            event.event === "solution_commented" &&
            event.parameters.solution_id &&
            event.parameters.challenge_id === "test-challenge-id"
        )
      ).toBe(true);
    }
  });

  test("should track user engagement and retention metrics", async ({
    page,
  }) => {
    // Navigate to user's challenge dashboard
    await page.goto("/challenges/my-challenges");

    // Wait for dashboard to load
    await expect(
      page.locator('[data-testid="my-challenges-dashboard"]')
    ).toBeVisible();

    const dashboardEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify dashboard view event
    expect(
      dashboardEvents.some(
        (event) =>
          event.event === "user_dashboard_viewed" &&
          event.parameters.dashboard_type === "challenges"
      )
    ).toBe(true);

    // Check different tabs for engagement tracking
    await page.click('[data-testid="active-challenges-tab"]');
    await page.waitForTimeout(300);

    await page.click('[data-testid="completed-challenges-tab"]');
    await page.waitForTimeout(300);

    await page.click('[data-testid="recommended-challenges-tab"]');
    await page.waitForTimeout(300);

    const tabEvents = await page.evaluate(() => window.__analyticsEvents || []);

    // Verify tab interaction events
    expect(
      tabEvents.some(
        (event) =>
          event.event === "dashboard_tab_clicked" &&
          event.parameters.tab_name === "active_challenges"
      )
    ).toBe(true);

    expect(
      tabEvents.some(
        (event) =>
          event.event === "dashboard_tab_clicked" &&
          event.parameters.tab_name === "completed_challenges"
      )
    ).toBe(true);

    // Test session duration tracking
    await page.waitForTimeout(5000); // Simulate 5 seconds of engagement

    const sessionEvents = await page.evaluate(
      () => window.__analyticsEvents || []
    );

    // Verify engagement time tracking
    expect(
      sessionEvents.some(
        (event) =>
          event.event === "user_engagement" &&
          event.parameters.engagement_time_seconds >= 5 &&
          event.parameters.page_type === "challenges"
      )
    ).toBe(true);
  });

  test("should validate analytics data integrity", async ({ page }) => {
    // Navigate through a complete challenge flow
    await page.goto("/challenges");

    // Discovery phase
    await page.selectOption(
      '[data-testid="category-filter"]',
      "web-development"
    );
    await page.fill('[data-testid="challenge-search-input"]', "React");
    await page.keyboard.press("Enter");

    // View challenge
    const challengeCard = page
      .locator('[data-testid="challenge-card"]')
      .first();
    if ((await challengeCard.count()) > 0) {
      await challengeCard.click();

      // Join challenge
      await page.click('[data-testid="join-challenge-button"]');
      await page.click('[data-testid="confirm-enrollment-button"]');

      await page.waitForTimeout(2000);

      // Get all analytics events
      const allEvents = await page.evaluate(
        () => window.__analyticsEvents || []
      );
      const businessMetrics = await page.evaluate(
        () => window.__businessMetrics || []
      );

      // Validate event sequence and data integrity
      const eventTypes = allEvents.map((event) => event.event);

      // Check that events follow logical sequence
      expect(eventTypes.includes("page_view")).toBe(true);
      expect(eventTypes.includes("challenge_filters_used")).toBe(true);
      expect(eventTypes.includes("challenge_search")).toBe(true);
      expect(eventTypes.includes("challenge_view")).toBe(true);
      expect(eventTypes.includes("challenge_joined")).toBe(true);

      // Validate event data structure
      allEvents.forEach((event) => {
        expect(event).toHaveProperty("event");
        expect(event).toHaveProperty("parameters");
        expect(event).toHaveProperty("timestamp");
        expect(typeof event.timestamp).toBe("number");
      });

      // Validate business metrics structure
      businessMetrics.forEach((metric) => {
        expect(metric).toHaveProperty("metric");
        expect(metric).toHaveProperty("value");
        expect(metric).toHaveProperty("metadata");
        expect(metric).toHaveProperty("timestamp");
      });

      // Validate user ID consistency across events
      const userEvents = allEvents.filter((event) => event.parameters.user_id);
      userEvents.forEach((event) => {
        expect(event.parameters.user_id).toBe("test-user-analytics");
      });

      console.log("Analytics validation complete:", {
        totalEvents: allEvents.length,
        totalMetrics: businessMetrics.length,
        eventTypes: [...new Set(eventTypes)],
      });
    }
  });
});
