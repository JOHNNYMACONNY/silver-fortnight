# Repository Setup and Configuration

## GitHub Secrets

The following secrets need to be configured in GitHub repository settings:

1. `HUGGINGFACE_API_KEY`: Your Hugging Face API key for AI integration
2. `FIREBASE_TOKEN`: Firebase deployment token

To add these secrets:
1. Go to your repository settings
2. Navigate to Secrets and Variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value

## Branch Protection Rules

Configure the following branch protection rules for `master`:

```json
{
  "branch": "master",
  "protection": {
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "test",
        "analyze",
        "verify-ai-limits"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true,
      "required_approving_review_count": 1
    },
    "restrictions": null
  }
}
```

## Environment Setup

### Staging Environment
1. Create a new Firebase project for staging
2. Configure environment variables:
   ```bash
   VITE_FIREBASE_PROJECT_ID=your-staging-project
   VITE_HUGGINGFACE_API_KEY=your-api-key
   ```

### Production Environment
1. Create a new Firebase project for production
2. Configure environment variables:
   ```bash
   VITE_FIREBASE_PROJECT_ID=your-production-project
   VITE_HUGGINGFACE_API_KEY=your-api-key
   ```

## Monitoring Alerts

Configure the following alerts in Firebase:

1. AI Rate Limit Alerts:
   - Trigger: When request count exceeds 80% of limit
   - Notification: Email to development team

2. Error Rate Alerts:
   - Trigger: When AI request error rate exceeds 5%
   - Notification: Email and Slack

3. Performance Alerts:
   - Trigger: When average response time exceeds 2000ms
   - Notification: Email to development team

## Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```bash
   cp .env.example .env.local
   # Add your development configuration
   ```

3. Run tests:
   ```bash
   npm test
   npm run test:ai-limits
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Continuous Integration

The CI/CD pipeline is configured to:
1. Run tests and linting
2. Verify AI rate limits
3. Deploy to staging for pull requests
4. Deploy to production for merged changes

Check `.github/workflows/main.yml` for detailed configuration.
