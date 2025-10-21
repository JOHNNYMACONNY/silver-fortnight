import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
jest.mock('../../firebase-config', () => ({
  getSyncFirebaseDb: () => ({}),
}));
jest.mock('../../utils/imageUtils', () => ({ getProfileImageUrl: () => '', generateAvatarUrl: () => '' }));
jest.mock('../../components/features/SocialFeatures', () => ({
  UserSocialStats: () => null,
  SocialFeatures: () => null,
}));
jest.mock('../../components/ui/ProfileImage', () => ({ ProfileImage: () => null }));
jest.mock('../../components/ui/ProfileBanner', () => ({ ProfileBanner: () => null }));
jest.mock('../../AuthContext', () => ({ useAuth: () => ({ user: null, currentUser: null }) }));
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useParams: () => ({}) }));
jest.mock('../../components/layout/primitives/Box', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => React.createElement('div', props, props.children) };
});
jest.mock('../../components/layout/primitives/Stack', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => React.createElement('div', props, props.children) };
});
jest.mock('../../components/layout/primitives/Cluster', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => React.createElement('div', props, props.children) };
});
jest.mock('../../components/layout/primitives/Grid', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => React.createElement('div', props, props.children) };
});
// Import lazily to avoid early Firebase initialization in test env
jest.mock('../../services/firestore-exports', () => ({
  getUserProfile: async () => ({ data: { uid: 'u1', email: 'u1@test.com', public: true } }),
}));
const ProfilePage = require('../ProfilePage').default;

describe('ProfilePage tabs accessibility', () => {
  it('supports ArrowLeft/ArrowRight and Home/End for tab roving focus', async () => {
    render(<ProfilePage />);

    const tablist = await screen.findByRole('tablist', { name: /profile sections/i });
    const tabs = within(tablist).getAllByRole('tab');

    // Focus first tab
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();

    // ArrowRight moves focus to next
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(tabs[1]).toHaveFocus();

    // ArrowLeft moves back
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(tabs[0]).toHaveFocus();

    // End jumps to last
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(tabs[tabs.length - 1]).toHaveFocus();

    // Home jumps to first
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(tabs[0]).toHaveFocus();
  });
});

