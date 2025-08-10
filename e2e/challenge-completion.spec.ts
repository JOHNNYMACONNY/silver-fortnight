import { test, expect } from '@playwright/test';

test.describe('Challenge Completion E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Mock authentication state for testing
    await page.addInitScript(() => {
      window.localStorage.setItem('firebase:authUser:test', JSON.stringify({
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User'
      }));
    });
  });

  test('should create and configure skill challenges', async ({ page }) => {
    // Navigate to challenges section
    await page.click('[data-testid="nav-challenges"]');
    
    // Create new challenge
    await page.click('[data-testid="create-challenge-button"]');
    
    // Fill challenge details
    await page.fill('[data-testid="challenge-title-input"]', 'React Component Library Challenge');
    await page.fill('[data-testid="challenge-description-textarea"]', 'Build a comprehensive React component library with TypeScript support');
    
    // Set challenge parameters
    await page.selectOption('[data-testid="challenge-category-select"]', 'frontend-development');
    await page.selectOption('[data-testid="difficulty-level-select"]', 'intermediate');
    await page.selectOption('[data-testid="estimated-duration-select"]', '2-weeks');
    
    // Configure three-tier progression
    await page.click('[data-testid="configure-tiers-button"]');
    
    // Tier 1 - Foundation
    await page.fill('[data-testid="tier1-title-input"]', 'Foundation Components');
    await page.fill('[data-testid="tier1-description-textarea"]', 'Create basic components: Button, Input, Card');
    await page.fill('[data-testid="tier1-requirements-textarea"]', '- Implement Button with variants\n- Create Input with validation\n- Build Card component');
    await page.selectOption('[data-testid="tier1-points-select"]', '100');
    
    // Tier 2 - Advanced
    await page.fill('[data-testid="tier2-title-input"]', 'Advanced Components');
    await page.fill('[data-testid="tier2-description-textarea"]', 'Build complex components with state management');
    await page.fill('[data-testid="tier2-requirements-textarea"]', '- Implement DataTable with sorting\n- Create Modal with animations\n- Build Form with validation');
    await page.selectOption('[data-testid="tier2-points-select"]', '200');
    
    // Tier 3 - Mastery
    await page.fill('[data-testid="tier3-title-input"]', 'Component Ecosystem');
    await page.fill('[data-testid="tier3-description-textarea"]', 'Create a complete component ecosystem with documentation');
    await page.fill('[data-testid="tier3-requirements-textarea"]', '- Build Storybook documentation\n- Implement theme system\n- Create comprehensive tests');
    await page.selectOption('[data-testid="tier3-points-select"]', '300');
    
    // Set challenge resources
    await page.fill('[data-testid="resources-textarea"]', 'React Documentation: https://react.dev\nTypeScript Handbook: https://typescriptlang.org\nStorybook Guide: https://storybook.js.org');
    
    // Configure evaluation criteria
    await page.fill('[data-testid="evaluation-criteria-textarea"]', '- Code quality and TypeScript usage\n- Component reusability\n- Documentation completeness\n- Test coverage');
    
    // Submit challenge
    await page.click('[data-testid="submit-challenge-button"]');
    
    // Verify challenge creation
    await expect(page.locator('[data-testid="challenge-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-success-message"]')).toContainText('Challenge created successfully');
    
    // Verify redirect to challenge details
    await expect(page).toHaveURL(/\/challenges\/[a-zA-Z0-9]+/);
    
    // Verify challenge details
    await expect(page.locator('[data-testid="challenge-title"]')).toContainText('React Component Library Challenge');
    await expect(page.locator('[data-testid="challenge-status"]')).toContainText('Active');
  });

  test('should handle challenge discovery and enrollment', async ({ page }) => {
    // Navigate to challenges page
    await page.click('[data-testid="nav-challenges"]');
    
    // Verify challenges list
    await expect(page.locator('[data-testid="challenges-list"]')).toBeVisible();
    
    // Filter challenges by category
    await page.selectOption('[data-testid="category-filter"]', 'frontend-development');
    
    // Filter by difficulty
    await page.selectOption('[data-testid="difficulty-filter"]', 'intermediate');
    
    // Search for specific challenge
    await page.fill('[data-testid="challenge-search-input"]', 'React Component');
    await page.keyboard.press('Enter');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="challenge-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="challenge-card"]').first()).toContainText('React Component');
    
    // View challenge details
    await page.click('[data-testid="challenge-card"]').first();
    
    // Verify challenge details page
    await expect(page.locator('[data-testid="challenge-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-progression"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-requirements"]')).toBeVisible();
    
    // Enroll in challenge
    await page.click('[data-testid="enroll-challenge-button"]');
    
    // Verify enrollment confirmation
    await expect(page.locator('[data-testid="enrollment-modal"]')).toBeVisible();
    await page.click('[data-testid="confirm-enrollment-button"]');
    
    // Verify enrollment success
    await expect(page.locator('[data-testid="enrollment-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-status"]')).toContainText('Enrolled');
    
    // Verify challenge appears in active challenges
    await page.click('[data-testid="nav-my-challenges"]');
    await expect(page.locator('[data-testid="active-challenge-card"]')).toHaveCountGreaterThan(0);
  });

  test('should handle tier 1 completion workflow', async ({ page }) => {
    // Navigate to enrolled challenge
    await page.goto('/challenges/test-challenge-id');
    
    // Verify challenge enrollment
    await expect(page.locator('[data-testid="challenge-status"]')).toContainText('Enrolled');
    
    // Start Tier 1
    await page.click('[data-testid="start-tier1-button"]');
    
    // Verify tier 1 workspace
    await expect(page.locator('[data-testid="tier1-workspace"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier1-requirements"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-tracker"]')).toBeVisible();
    
    // Upload solution files
    await page.click('[data-testid="upload-solution-button"]');
    
    // Mock file uploads
    const fileInput = page.locator('[data-testid="solution-files-input"]');
    await fileInput.setInputFiles([
      {
        name: 'Button.tsx',
        mimeType: 'text/typescript',
        buffer: Buffer.from('export const Button = ({ children, variant = "primary" }) => { return <button className={variant}>{children}</button>; };')
      },
      {
        name: 'Input.tsx',
        mimeType: 'text/typescript',
        buffer: Buffer.from('export const Input = ({ type = "text", placeholder, onChange }) => { return <input type={type} placeholder={placeholder} onChange={onChange} />; };')
      },
      {
        name: 'Card.tsx',
        mimeType: 'text/typescript',
        buffer: Buffer.from('export const Card = ({ children, title }) => { return <div className="card"><h3>{title}</h3>{children}</div>; };')
      }
    ]);
    
    // Add solution description
    await page.fill('[data-testid="solution-description-textarea"]', 'Implemented three foundation components with TypeScript support:\n- Button with primary/secondary variants\n- Input with placeholder and change handling\n- Card with title and content slots');
    
    // Add demo link
    await page.fill('[data-testid="demo-link-input"]', 'https://codesandbox.io/s/foundation-components-demo');
    
    // Submit tier 1 solution
    await page.click('[data-testid="submit-tier1-solution-button"]');
    
    // Verify submission success
    await expect(page.locator('[data-testid="submission-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier1-status"]')).toContainText('Under Review');
    
    // Mock automatic evaluation (in real app, this would be async)
    await page.addInitScript(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tier-evaluation-complete', {
          detail: { tier: 1, status: 'passed', score: 85, feedback: 'Great implementation of foundation components!' }
        }));
      }, 2000);
    });
    
    // Wait for evaluation
    await page.waitForTimeout(3000);
    
    // Verify tier 1 completion
    await expect(page.locator('[data-testid="tier1-status"]')).toContainText('Completed');
    await expect(page.locator('[data-testid="tier1-score"]')).toContainText('85');
    await expect(page.locator('[data-testid="tier2-unlock-button"]')).toBeVisible();
  });

  test('should handle tier 2 progression and advanced challenges', async ({ page }) => {
    // Navigate to challenge with tier 1 completed
    await page.goto('/challenges/test-challenge-id');
    
    // Verify tier 1 is completed
    await expect(page.locator('[data-testid="tier1-status"]')).toContainText('Completed');
    
    // Unlock and start tier 2
    await page.click('[data-testid="tier2-unlock-button"]');
    await page.click('[data-testid="start-tier2-button"]');
    
    // Verify tier 2 workspace
    await expect(page.locator('[data-testid="tier2-workspace"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier2-requirements"]')).toBeVisible();
    
    // Check advanced requirements
    await expect(page.locator('[data-testid="tier2-requirements"]')).toContainText('DataTable with sorting');
    await expect(page.locator('[data-testid="tier2-requirements"]')).toContainText('Modal with animations');
    await expect(page.locator('[data-testid="tier2-requirements"]')).toContainText('Form with validation');
    
    // Upload advanced solution
    await page.click('[data-testid="upload-solution-button"]');
    
    const fileInput = page.locator('[data-testid="solution-files-input"]');
    await fileInput.setInputFiles([
      {
        name: 'DataTable.tsx',
        mimeType: 'text/typescript',
        buffer: Buffer.from('export const DataTable = ({ data, columns, sortable = true }) => { /* Advanced DataTable implementation */ };')
      },
      {
        name: 'Modal.tsx',
        mimeType: 'text/typescript',
        buffer: Buffer.from('export const Modal = ({ isOpen, onClose, children }) => { /* Modal with framer-motion animations */ };')
      },
      {
        name: 'Form.tsx',
        mimeType: 'text/typescript',
        buffer: Buffer.from('export const Form = ({ schema, onSubmit }) => { /* Form with validation using react-hook-form */ };')
      }
    ]);
    
    // Add comprehensive solution description
    await page.fill('[data-testid="solution-description-textarea"]', 'Advanced components implementation:\n- DataTable with sorting, filtering, and pagination\n- Modal with smooth animations using framer-motion\n- Form with comprehensive validation and error handling');
    
    // Add live demo
    await page.fill('[data-testid="demo-link-input"]', 'https://codesandbox.io/s/advanced-components-demo');
    
    // Submit tier 2 solution
    await page.click('[data-testid="submit-tier2-solution-button"]');
    
    // Verify submission
    await expect(page.locator('[data-testid="submission-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier2-status"]')).toContainText('Under Review');
    
    // Mock peer review process
    await page.addInitScript(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('peer-review-complete', {
          detail: { 
            tier: 2, 
            status: 'passed', 
            score: 92, 
            feedback: 'Excellent implementation with great attention to UX details!',
            reviewerComments: [
              'Love the smooth animations in the Modal component',
              'DataTable sorting is very intuitive',
              'Form validation provides clear user feedback'
            ]
          }
        }));
      }, 3000);
    });
    
    // Wait for peer review
    await page.waitForTimeout(4000);
    
    // Verify tier 2 completion
    await expect(page.locator('[data-testid="tier2-status"]')).toContainText('Completed');
    await expect(page.locator('[data-testid="tier2-score"]')).toContainText('92');
    await expect(page.locator('[data-testid="tier3-unlock-button"]')).toBeVisible();
    
    // Check peer review feedback
    await page.click('[data-testid="view-feedback-button"]');
    await expect(page.locator('[data-testid="peer-review-comments"]')).toBeVisible();
    await expect(page.locator('[data-testid="peer-review-comments"]')).toContainText('smooth animations');
  });

  test('should handle tier 3 mastery and challenge completion', async ({ page }) => {
    // Navigate to challenge with tier 2 completed
    await page.goto('/challenges/test-challenge-id');
    
    // Verify tier 2 is completed
    await expect(page.locator('[data-testid="tier2-status"]')).toContainText('Completed');
    
    // Unlock and start tier 3
    await page.click('[data-testid="tier3-unlock-button"]');
    await page.click('[data-testid="start-tier3-button"]');
    
    // Verify tier 3 workspace
    await expect(page.locator('[data-testid="tier3-workspace"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier3-requirements"]')).toBeVisible();
    
    // Check mastery requirements
    await expect(page.locator('[data-testid="tier3-requirements"]')).toContainText('Storybook documentation');
    await expect(page.locator('[data-testid="tier3-requirements"]')).toContainText('theme system');
    await expect(page.locator('[data-testid="tier3-requirements"]')).toContainText('comprehensive tests');
    
    // Upload complete ecosystem
    await page.click('[data-testid="upload-solution-button"]');
    
    const fileInput = page.locator('[data-testid="solution-files-input"]');
    await fileInput.setInputFiles([
      {
        name: 'component-library.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from('Mock zip file containing complete component library')
      }
    ]);
    
    // Add comprehensive documentation
    await page.fill('[data-testid="solution-description-textarea"]', 'Complete component ecosystem:\n- 15+ components with full TypeScript support\n- Comprehensive Storybook documentation\n- Theme system with dark/light modes\n- 95% test coverage with Jest and Testing Library\n- NPM package ready for distribution');
    
    // Add multiple demo links
    await page.fill('[data-testid="storybook-link-input"]', 'https://storybook.component-library.com');
    await page.fill('[data-testid="npm-package-link-input"]', 'https://npmjs.com/package/my-component-library');
    await page.fill('[data-testid="github-repo-link-input"]', 'https://github.com/user/component-library');
    
    // Submit tier 3 solution
    await page.click('[data-testid="submit-tier3-solution-button"]');
    
    // Verify submission
    await expect(page.locator('[data-testid="submission-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier3-status"]')).toContainText('Under Expert Review');
    
    // Mock expert review process
    await page.addInitScript(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('expert-review-complete', {
          detail: { 
            tier: 3, 
            status: 'passed', 
            score: 96, 
            feedback: 'Outstanding work! This is a production-ready component library.',
            expertComments: [
              'Excellent TypeScript implementation',
              'Comprehensive documentation and examples',
              'Great attention to accessibility',
              'Professional-grade testing strategy'
            ],
            badge: 'Component Library Master'
          }
        }));
      }, 5000);
    });
    
    // Wait for expert review
    await page.waitForTimeout(6000);
    
    // Verify tier 3 completion and challenge completion
    await expect(page.locator('[data-testid="tier3-status"]')).toContainText('Completed');
    await expect(page.locator('[data-testid="tier3-score"]')).toContainText('96');
    await expect(page.locator('[data-testid="challenge-status"]')).toContainText('Completed');
    
    // Verify badge earned
    await expect(page.locator('[data-testid="challenge-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="challenge-badge"]')).toContainText('Component Library Master');
    
    // Check final score calculation
    const totalScore = (85 + 92 + 96) / 3; // Average of all tiers
    await expect(page.locator('[data-testid="final-score"]')).toContainText(Math.round(totalScore).toString());
    
    // Verify challenge appears in completed challenges
    await page.click('[data-testid="nav-my-challenges"]');
    await page.click('[data-testid="completed-challenges-tab"]');
    await expect(page.locator('[data-testid="completed-challenge-card"]')).toHaveCountGreaterThan(0);
    await expect(page.locator('[data-testid="completed-challenge-card"]').first()).toContainText('React Component Library Challenge');
  });

  test('should handle challenge leaderboard and community features', async ({ page }) => {
    // Navigate to challenge leaderboard
    await page.goto('/challenges/test-challenge-id/leaderboard');
    
    // Verify leaderboard interface
    await expect(page.locator('[data-testid="challenge-leaderboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    
    // Check leaderboard entries
    await expect(page.locator('[data-testid="leaderboard-entry"]')).toHaveCountGreaterThan(0);
    
    // Verify current user position
    await expect(page.locator('[data-testid="user-position"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-score"]')).toBeVisible();
    
    // Filter leaderboard by tier
    await page.selectOption('[data-testid="tier-filter"]', 'tier3');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="leaderboard-entry"]')).toHaveCountGreaterThan(0);
    
    // View community solutions
    await page.click('[data-testid="community-solutions-tab"]');
    
    // Verify community solutions interface
    await expect(page.locator('[data-testid="community-solutions"]')).toBeVisible();
    await expect(page.locator('[data-testid="solution-card"]')).toHaveCountGreaterThan(0);
    
    // View a community solution
    await page.click('[data-testid="solution-card"]').first();
    
    // Verify solution details
    await expect(page.locator('[data-testid="solution-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="solution-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="solution-demo"]')).toBeVisible();
    
    // Like a solution
    await page.click('[data-testid="like-solution-button"]');
    
    // Verify like registered
    await expect(page.locator('[data-testid="like-count"]')).toContainText('1');
    
    // Add comment to solution
    await page.fill('[data-testid="comment-input"]', 'Great implementation! Love the clean code structure.');
    await page.click('[data-testid="submit-comment-button"]');
    
    // Verify comment added
    await expect(page.locator('[data-testid="solution-comment"]')).toHaveCountGreaterThan(0);
    await expect(page.locator('[data-testid="solution-comment"]').last()).toContainText('Great implementation');
  });
});
