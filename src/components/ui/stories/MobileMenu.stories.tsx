import MobileMenu from '../MobileMenu';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import AuthContext, { AuthContextType } from '../../../AuthContext';
import { withThemeProvider } from './providers';
import { withMemoryRouter } from './routerDecorator';

// Mock AuthProvider for Storybook
const mockAuthContextValue: AuthContextType = {
  user: {
    uid: 'storybook-user-uid',
    email: 'storybook@example.com',
    displayName: 'Storybook User',
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

const meta: Meta<typeof MobileMenu> = {
  title: 'UI/MobileMenu',
  component: MobileMenu,
  decorators: [(Story) => <MockAuthProvider><Story /></MockAuthProvider>, withMemoryRouter, withThemeProvider],
};
export default meta;

type Story = StoryObj<typeof MobileMenu>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
};
