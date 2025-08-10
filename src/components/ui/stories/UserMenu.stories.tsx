import { UserMenu } from '../UserMenu';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import AuthContext, { AuthContextType } from '../../../AuthContext';

// Mock AuthProvider for Storybook
const mockAuthContextValue: AuthContextType = {
  user: {
    uid: 'storybook-user-uid',
    email: 'storybook@example.com',
    displayName: 'Storybook User',
    // ...add any other User fields your components use, or use a type assertion
  } as any,
  currentUser: {
    uid: 'storybook-user-uid',
    email: 'storybook@example.com',
    displayName: 'Storybook User',
  } as any,
  loading: false,
  error: null,
  isAdmin: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  logout: async () => {},
};

const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={mockAuthContextValue}>{children}</AuthContext.Provider>
);

const meta: Meta<typeof UserMenu> = {
  title: 'UI/UserMenu',
  component: UserMenu,
  decorators: [
    (Story) => (
      <MockAuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </ThemeProvider>
      </MockAuthProvider>
    )
  ],
};
export default meta;

type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {
  args: {},
};
