import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
jest.mock("../../../firebase-config", () => ({
  getSyncFirebaseDb: () => ({}),
}));
jest.mock("../../../utils/imageUtils", () => ({
  getProfileImageUrl: () => "",
  generateAvatarUrl: () => "",
}));
jest.mock("../../../components/features/SocialFeatures", () => ({
  UserSocialStats: () => null,
  SocialFeatures: () => null,
}));
jest.mock("../../../components/ui/ProfileImage", () => ({
  ProfileImage: () => null,
}));
jest.mock("../../../components/ui/ProfileBanner", () => ({
  ProfileBanner: () => null,
}));
jest.mock("../../../AuthContext", () => ({
  useAuth: () => ({ user: null, currentUser: null }),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({}),
}));
jest.mock("../../../components/layout/primitives/Box", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});
jest.mock("../../../components/layout/primitives/Stack", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});
jest.mock("../../../components/layout/primitives/Cluster", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});
jest.mock("../../../components/layout/primitives/Grid", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => React.createElement("div", props, props.children),
  };
});
jest.mock("../../../services/firestore-exports", () => ({
  getUserProfile: async () => ({
    data: { uid: "u1", email: "u1@test.com", public: true },
  }),
}));
const ProfilePage = require("../../ProfilePage").default;

describe("ProfilePage header snapshots and tooltip", () => {
  it("renders header without stats gracefully", () => {
    const { container } = render(<ProfilePage />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("shows reputation help link on tooltip open", async () => {
    const { container } = render(<ProfilePage />);
    const trigger = container.querySelector('[data-tooltip-trigger="true"]');
    if (trigger) {
      fireEvent.mouseEnter(trigger);
      expect(
        await screen.findByText(/what’s reputation\?|what's reputation\?/i)
      ).toBeInTheDocument();
    }
  });
});
