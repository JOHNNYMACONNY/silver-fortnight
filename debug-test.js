// Simple debug test to check if basic React testing is working
const React = require('react');
const { render, screen } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Mock everything that might cause issues
jest.mock('./src/firebase-config', () => ({
  db: { collection: jest.fn(), doc: jest.fn() },
  auth: { currentUser: null },
  analytics: null,
}));

jest.mock('./src/components/ui/ProfileImageWithUser', () => {
  return function MockProfileImageWithUser() {
    return React.createElement('div', { 'data-testid': 'profile-image-with-user' }, 'Mock Profile');
  };
});

jest.mock('./src/services/roleApplications', () => ({
  submitRoleApplication: jest.fn().mockResolvedValue({ success: true, data: {} }),
}));


// Simple test component
function TestComponent() {
  return React.createElement('div', null, 'Hello Test');
}

test('basic React rendering works', () => {
  render(React.createElement(TestComponent));
  expect(screen.getByText('Hello Test')).toBeInTheDocument();
});

console.log('Debug test file created');
