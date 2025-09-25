# Testing Documentation

This document provides comprehensive information about the testing approach, coverage, and current status of the TradeYa application.

## Testing Strategy

TradeYa uses a comprehensive testing strategy that includes:

1. **Unit Testing**: Testing individual components and functions in isolation
2. **Integration Testing**: Testing component interactions and data flow
3. **Authentication Testing**: Comprehensive testing of authentication flows
4. **Mock Testing**: Proper mocking of external services and dependencies

## Testing Framework

- **Testing Library**: React Testing Library (@testing-library/react)
- **Test Runner**: Jest (✅ **RESOLVED**: Previously had Vitest/Jest conflicts)
- **Mocking**: Jest mocking system with comprehensive Firebase mocks
- **Assertions**: Jest assertions with Jest-DOM matchers
- **Configuration**: Enhanced Jest config with TypeScript support and module mapping

### ✅ Recent Configuration Resolution (May 2025)

**Issue Resolved**: Jest/Vitest configuration conflicts that prevented test execution

**Changes Made**:
1. **Converted Vitest syntax to Jest**: Updated `TradeConfirmationForm.test.tsx` and other affected test files
2. **Enhanced Jest configuration**: Added proper module mapping for firebase-config and import.meta support
3. **Removed conflicting config**: Eliminated `vitest.config.ts` to prevent conflicts
4. **Improved TypeScript support**: Enhanced Jest TypeScript integration and type definitions

**Key Files Updated**:
- `jest.config.ts` - Enhanced with globals and module mapping
- `src/utils/__tests__/testTypes.d.ts` - Added Jest type declarations
- Test files converted from Vitest to Jest syntax
- Firebase configuration properly mocked for Jest environment

## Current Test Coverage
### Targeted Test Runs (New Components)

Use these commands to run only the newly added tests during review:

```bash
npm test -- WeeklyXPGoal.test.tsx
npm test -- Leaderboard.circle.test.tsx
npm test -- Leaderboard.currentUserRow.test.tsx
npm test -- GamificationDashboard.breakdownPersistence.test.tsx
npm test -- ChallengesPage.featured.test.tsx
npm test -- ChallengeCard.lockHint.test.tsx
npm test -- ChallengesPage.practiceIndicator.test.tsx

# Challenge Calendar (strip + page)
npm test -- src/__tests__/ChallengeCalendarPage.render.test.tsx
npm test -- src/components/features/challenges/__tests__/ChallengeCalendar.strip.test.tsx

# Functions (Cloud Functions schedulers)
npm --prefix functions test
```


### Authentication Components

#### LoginPage Component ✅ PASSING (8/8 tests)

**File**: `/src/components/auth/__tests__/LoginPage.test.tsx`

**Test Coverage**:
1. **Form Rendering**: Verifies correct rendering of login form elements
2. **Email Validation**: Tests email format validation with invalid inputs
3. **Password Validation**: Tests minimum password length requirement (8 characters)
4. **Successful Login**: Tests complete login flow with navigation to dashboard
5. **Login Error Handling**: Tests error display for failed authentication
6. **Google Sign-in Success**: Tests successful Google authentication flow
7. **Google Sign-in Redirect**: Tests OAuth redirect handling scenarios
8. **Rate Limiting**: Implicit testing through mocked Firebase services

**Key Test Features**:
- Proper mocking of AuthContext with realistic return values
- Firebase service mocking including rate limiter
- localStorage mocking for redirect handling
- Navigation testing with react-router-dom mocks
- Toast context integration testing
- Error boundary testing for authentication failures

**Mock Configuration**:
```typescript
// AuthContext Mock
const mockAuthContext = {
  user: null,
  currentUser: null,
  loading: false,
  error: null,
  signIn: mockSignInWithEmail,
  signInWithEmail: mockSignInWithEmail,
  signInWithGoogle: mockSignInWithGoogle,
  signOut: jest.fn(),
  logout: jest.fn(),
};

// Firebase Config Mock
jest.mock('../../../firebase-config', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
  rateLimiter: {
    checkLimit: jest.fn().mockResolvedValue(true)
  }
}));
```

**Recent Fixes Applied**:

- Fixed file corruption that was causing test failures
- Enhanced mock configuration for better test reliability

#### TradeConfirmationForm Component ✅ PASSING (Jest Conversion Complete)

**File**: `/src/components/features/trades/__tests__/TradeConfirmationForm.test.tsx`

**Status**: Recently converted from Vitest to Jest syntax - all tests now passing

**Test Coverage**:

1. **Component Rendering**: Verifies form renders with all required elements
2. **Authentication Integration**: Tests AuthContext integration and user state
3. **Firebase Service Integration**: Tests trade completion and portfolio services
4. **Evidence Gallery Integration**: Tests evidence display and management
5. **Form Interactions**: Tests user input handling and validation
6. **Error Handling**: Tests error states and user feedback

**Key Conversion Changes**:

- Converted `vi.mock()` to `jest.mock()`
- Replaced `vi.mocked()` with `jest.mocked()`
- Updated all `vi.fn()` calls to `jest.fn()`
- Replaced `vi.clearAllMocks()` with `jest.clearAllMocks()`

**Mock Configuration**:

```typescript
// Updated Jest mock syntax
jest.mock('../../../../AuthContext');
jest.mock('../../../../services/firestore');
jest.mock('../../../../services/portfolio');

const mockUseAuth = jest.mocked(useAuth);
const mockConfirmTradeCompletion = jest.mocked(confirmTradeCompletion);
const mockGenerateTradePortfolioItem = jest.mocked(generateTradePortfolioItem);
```
- Corrected import paths from `../../Auth/AuthContext` to `../../AuthContext`
- Updated password validation expectation from 6 to 8 characters
- Changed navigation target expectation from `/profile` to `/dashboard`
- Fixed toast integration testing with correct parameter order
- Added proper Promise<void> handling for authentication methods

### Trade Confirmation Components

#### TradeConfirmationForm Component ✅ PASSING (Jest Conversion Complete)

**File**: `/src/components/features/trades/__tests__/TradeConfirmationForm.test.tsx`

**Status**: Recently converted from Vitest to Jest syntax - all tests now passing

**Test Coverage**:
1. **Component Rendering**: Verifies form renders with all required elements
2. **Authentication Integration**: Tests AuthContext integration and user state
3. **Firebase Service Integration**: Tests trade completion and portfolio services
4. **Evidence Gallery Integration**: Tests evidence display and management
5. **Form Interactions**: Tests user input handling and validation
6. **Error Handling**: Tests error states and user feedback

**Key Conversion Changes**:
- Converted `vi.mock()` to `jest.mock()`
- Replaced `vi.mocked()` with `jest.mocked()`
- Updated all `vi.fn()` calls to `jest.fn()`
- Replaced `vi.clearAllMocks()` with `jest.clearAllMocks()`

**Mock Configuration**:
```typescript
// Updated Jest mock syntax
jest.mock('../../../../AuthContext');
jest.mock('../../../../services/firestore');
jest.mock('../../../../services/portfolio');

const mockUseAuth = jest.mocked(useAuth);
const mockConfirmTradeCompletion = jest.mocked(confirmTradeCompletion);
const mockGenerateTradePortfolioItem = jest.mocked(generateTradePortfolioItem);
```

## Testing Best Practices

### Component Testing Guidelines

1. **Render with Providers**: Always wrap components with necessary providers (Router, Toast, Auth)
2. **Mock External Dependencies**: Mock Firebase, navigation, and other external services
3. **Test User Interactions**: Use fireEvent for user actions like clicks and form submissions
4. **Async Testing**: Use waitFor for asynchronous operations and state updates
5. **Accessibility Testing**: Include proper role and label testing

### UI Composition Regression Guards

- Button `asChild` with Radix Slot requires a single child element. We added an RTL test to prevent regressions where multiple children (e.g., icons + text siblings) cause `React.Children.only` errors in dropdown triggers.

Reference test:

```text
src/components/ui/__tests__/Button.asChild.dropdown.test.tsx
```

What it covers:
- `DropdownMenuTrigger` using `Button asChild` wrapping a `Link` opens the menu without runtime errors.
- `leftIcon`/`rightIcon` props are ignored when `asChild` is true (single-child rule). 

### Mock Management

1. **Clear Mocks**: Always clear mocks between tests using `beforeEach(() => jest.clearAllMocks())`
2. **Realistic Returns**: Mock functions should return realistic values matching production behavior
3. **Error Scenarios**: Test both success and error scenarios for all mocked functions
4. **State Consistency**: Ensure mock state remains consistent throughout test execution

### Example Test Structure

```typescript
describe('ComponentName', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ToastProvider>
          <ComponentName />
        </ToastProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any component-specific mocks
  });

  it('should render correctly', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    renderComponent();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFunction).toHaveBeenCalled();
    });
  });
});
```

## Test Environment Setup

### Required Test Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "vitest": "^0.34.6",
    "jsdom": "^22.1.0"
  }
}
```

### Vitest Configuration

The project uses Vitest with jsdom environment for React component testing:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
});
```

## Running Tests

### Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test LoginPage.test.tsx

# Run tests for specific component directory
npm run test src/components/auth/
```

### Test Output

Recent test run for LoginPage component:
```
✅ LoginPage Component Tests (7/7 passing)
  ✅ renders login form correctly
  ✅ validates email format
  ✅ validates password length
  ✅ handles successful login
  ✅ handles login error
  ✅ handles Google sign-in redirect
  ✅ integrates with security features
```

## Testing Roadmap

### Immediate Testing Priorities

1. **SignUpPage Component**: Create comprehensive test suite
2. **AuthContext Provider**: Test context state management and error handling
3. **Protected Routes**: Test route protection and authentication requirements
4. **Password Reset**: Test password reset flow and email validation

### Medium-term Testing Goals

1. **Trade Components**: Test trade creation, editing, and listing functionality
2. **Messaging System**: Test real-time messaging and conversation management
3. **Notification System**: Test notification creation and real-time updates
4. **Profile Management**: Test profile editing and image upload functionality

### Long-term Testing Goals

1. **E2E Testing**: Implement end-to-end testing with Playwright or Cypress
2. **Performance Testing**: Add performance testing for component rendering
3. **Accessibility Testing**: Comprehensive accessibility testing suite
4. **Visual Regression Testing**: Add visual testing for UI consistency

## Debugging Tests

### Common Issues and Solutions

1. **Mock Not Working**: Ensure mocks are defined before component import
2. **Async Issues**: Use waitFor for state updates and async operations
3. **Provider Missing**: Wrap components with all required providers
4. **Navigation Issues**: Mock react-router-dom properly for navigation testing

### Debugging Tools

```typescript
// Add debug output to tests
import { screen } from '@testing-library/react';

// Debug DOM structure
screen.debug();

// Debug specific element
screen.debug(screen.getByRole('button'));

// Add console logs in tests
console.log('Test state:', mockFunction.mock.calls);
```

## Test Maintenance

### Regular Maintenance Tasks

1. **Review Test Coverage**: Regularly check test coverage reports
2. **Update Mocks**: Keep mocks in sync with production code changes
3. **Refactor Tests**: Improve test readability and maintainability
4. **Performance**: Monitor test execution time and optimize slow tests

### Test Quality Metrics

- **Coverage Target**: Aim for 80%+ code coverage on critical components
- **Test Speed**: Individual tests should complete in <100ms
- **Test Reliability**: Tests should pass consistently across different environments
- **Test Readability**: Tests should be self-documenting and easy to understand

## Contributing to Tests

### Guidelines for New Tests

1. Follow the existing test structure and naming conventions
2. Include both positive and negative test cases
3. Test accessibility features and user interactions
4. Add comments for complex test logic
5. Ensure tests are isolated and don't depend on other tests

### Test Review Checklist

- [ ] Tests cover main functionality and edge cases
- [ ] Proper mocking of external dependencies
- [ ] Accessibility considerations included
- [ ] Error scenarios tested
- [ ] Tests are readable and well-documented
- [ ] Tests pass consistently
- [ ] No hardcoded values or brittle selectors