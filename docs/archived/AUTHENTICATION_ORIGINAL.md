# Authentication Documentation

This document provides comprehensive information about the authentication system in the TradeYa application.

## Authentication Methods

TradeYa supports the following authentication methods:

1. **Email/Password Authentication**: Traditional email and password-based authentication
2. **Google Authentication**: Sign in with Google account
3. **Password Reset**: Email-based password reset functionality

## Implementation Details

### Firebase Authentication

TradeYa uses Firebase Authentication for all authentication-related functionality. The implementation is located in the following files:

- `src/firebase-config.ts`: Contains Firebase initialization and authentication functions
- `src/AuthContext.tsx`: Provides authentication state and methods throughout the application

### Email/Password Authentication

Email/Password authentication is implemented with the following features:

- User registration with email validation
- Secure password storage (handled by Firebase)
- Email verification (optional)
- Password reset via email
- Duplicate account prevention by checking if an email already exists before registration
- Clear error messages when attempting to register with an existing email

### Google Authentication

Google authentication is implemented with the following features:

- Sign in with Google account using a popup
- Automatic user profile creation for new Google users
- Account linking for users who have registered with a Google email
- Proper error handling for various Google authentication scenarios
- Success notifications after successful Google sign-in
- Clear guidance when attempting to sign in with Google using an email that already exists with a different authentication method

### Authentication Context

The `AuthContext` provides authentication state and methods throughout the application:

- `currentUser`: The currently authenticated user
- `userProfile`: The user's profile data from Firestore
- `loading`: Loading state for authentication operations
- `error`: Error state for authentication operations
- `signInWithEmail`: Sign in with email and password (returns `Promise<void>`)
- `signInWithGoogle`: Sign in with Google (returns `Promise<void>`)
- `signUpWithEmail`: Sign up with email and password
- `logout`: Sign out the current user

#### Context Integration Notes

- All authentication methods return `Promise<void>` and throw errors on failure
- Components should handle errors using try/catch blocks
- Loading states are managed automatically by the context
- The context properly integrates with Firebase Authentication services

## User Profiles

When a user signs up or signs in for the first time, a user profile is created in Firestore with the following information:

- User ID (from Firebase Authentication)
- Email address
- Display name (from Google or derived from email)
- Profile picture (from Google or default)

## Account Linking and Duplicate Prevention

TradeYa supports account linking for users who have registered with a Google email and prevents duplicate accounts:

1. If a user tries to sign in with Google using an email that already exists in the system with a different authentication method, they'll be prompted to sign in with their email and password first.
2. Once signed in, they can link their Google account to their existing account.
3. The system prevents users from creating multiple accounts with the same email address by checking if an email already exists before allowing registration.
4. If a user attempts to register with an email that's already in use, they'll receive a clear error message indicating which authentication method to use.

## Security Considerations

- All authentication is handled securely by Firebase Authentication
- Passwords are never stored in the application code or database
- Authentication state is properly managed to prevent unauthorized access
- Firebase Security Rules ensure that users can only access and modify their own data
- Rate limiting implemented to prevent brute force attacks
- Security event logging for audit trails and monitoring
- Form validation includes both client-side and server-side checks
- Password requirements enforce minimum 8-character length
- Input sanitization and proper error handling prevent injection attacks

## Error Handling and User Feedback

The authentication system includes comprehensive error handling and user feedback for various scenarios:

- Invalid email or password
- Account already exists (with specific guidance on which authentication method to use)
- Weak password
- Network errors
- Google authentication errors (popup closed, popup blocked, etc.)
- Account exists with different credentials
- Success notifications for login and registration
- Visual feedback during authentication processes
- Automatic navigation after successful registration

## Usage Examples

### Sign In with Email/Password

```jsx
const { signInWithEmail } = useAuth();
await signInWithEmail(email, password);
```

### Sign In with Google

```jsx
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
```

### Sign Up with Email/Password

```jsx
const { signUpWithEmail } = useAuth();
await signUpWithEmail(email, password);
```

### Sign Out

```jsx
const { logout } = useAuth();
await logout();
```

### Access Current User

```jsx
const { currentUser, userProfile } = useAuth();
if (currentUser) {
  console.log('User is signed in:', currentUser.email);
  console.log('User profile:', userProfile);
}
```

## Protected Routes

The application uses protected routes to restrict access to certain pages:

```jsx
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};
```

## Recent Improvements and Current State

### Latest Updates (December 2024)

1. **LoginPage Component Restoration**: Fixed file corruption issues and restored full functionality
   - Resolved TypeScript compilation errors related to AuthContext integration
   - Fixed import paths from `../../Auth/AuthContext` to `../../AuthContext`
   - Added `noValidate` attribute to form to enable custom validation
   - Updated toast integration with correct parameter order: `addToast('type', 'message')`
   - Fixed authentication flow to work with `Promise<void>` returns

2. **Enhanced Validation and Security**:
   - Updated password validation from 6 to 8 characters minimum
   - Implemented rate limiting using firebase-config RateLimiter class
   - Added comprehensive security logging for authentication events
   - Improved form validation with proper error handling

3. **Navigation and User Experience**:
   - Changed navigation target from `/profile` to `/dashboard` after successful login
   - Maintained Google sign-in redirect functionality with localStorage
   - Added proper loading states for redirect handling
   - Implemented multiple login attempt tracking and warnings

4. **Test Coverage and Reliability**:
   - All 7 LoginPage component tests now pass consistently
   - Fixed test expectations to match current authentication flow
   - Added proper mocking for Firebase services and context providers
   - Verified Google sign-in redirect functionality in tests

### Previously Implemented Enhancements

1. **Duplicate Account Prevention**: System now prevents users from creating multiple accounts with the same email address
2. **Improved Error Messages**: Clear, specific error messages when attempting to register with an existing email
3. **Success Notifications**: Visual feedback for successful login and registration
4. **Google Authentication Integration**: Complete Google sign-in with account linking support

## Component Implementation Details

### LoginPage Component

The main login component (`/src/components/auth/LoginPage.tsx`) includes:

#### Key Features:
- **Form Validation**: Client-side validation with proper error messaging
- **Rate Limiting**: Integration with Firebase rate limiter to prevent abuse
- **Security Logging**: Comprehensive logging of authentication events
- **Google Integration**: Full Google sign-in with redirect handling
- **Loading States**: Proper loading indicators for all authentication operations
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### Technical Implementation:
```typescript
interface LoginFormData {
  email: string;
  password: string;
}

interface SecurityLog {
  timestamp: number;
  action: string;
  email: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
}
```

#### Validation Rules:
- Email: Must be valid email format
- Password: Minimum 8 characters
- Rate limiting: Prevents excessive login attempts
- Security logging: Tracks all authentication events

#### Test Coverage:
Comprehensive test suite covering:
- Form rendering and user interactions
- Email and password validation
- Successful login flow with navigation
- Error handling for failed authentication
- Google sign-in redirect functionality
- Rate limiting and security features

### Future Enhancement Plans

1. **Additional Authentication Methods**: Add support for more authentication providers (Facebook, Twitter, GitHub, etc.)
2. **Multi-factor Authentication**: Implement two-factor authentication for enhanced security
3. **Custom Claims**: Use Firebase custom claims for role-based access control
4. **Session Management**: Implement more advanced session management features
5. **Authentication Analytics**: Track authentication-related metrics and events
6. **Password Strength Indicators**: Visual password strength feedback
7. **Remember Me Functionality**: Optional persistent login sessions
