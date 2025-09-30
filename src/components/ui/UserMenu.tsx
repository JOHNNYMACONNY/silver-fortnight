import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import {
  User,
  LogOut,
  Settings,
  Shield,
  Users,
  MessageSquare,
  Bell,
  Link as LinkIcon,
} from "../../utils/icons";
import { useAuth } from "../../AuthContext";
import { getUserProfile } from "../../services/firestore-exports";
import { getProfileImageUrl } from "../../utils/imageUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "./DropdownMenu";
import { Button } from "./Button";
import { Avatar } from "./Avatar";

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple in-memory cache for profile image URLs by userId
  // Persisted only for the session; avoids repeated Firestore lookups
  // and reduces visible image flashes when reopening the menu
  const getImageCache = (): Map<string, string | null> => {
    const globalAny = globalThis as unknown as {
      __userImageCache?: Map<string, string | null>;
    };
    if (!globalAny.__userImageCache) {
      globalAny.__userImageCache = new Map<string, string | null>();
    }
    return globalAny.__userImageCache;
  };

  // Fetch user profile data to get Cloudinary profile image (with cache)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const cache = getImageCache();
        const cached = cache.get(currentUser.uid);
        if (cached !== undefined) {
          setUserProfileImage(cached);
          setLoading(false);
          return;
        }

        const { data: profile, error } = await getUserProfile(currentUser.uid);
        let resolved: string | null = null;
        if (error) {
          console.warn("Failed to fetch user profile for UserMenu:", error);
          resolved = currentUser.photoURL;
        } else if (profile?.profilePicture) {
          resolved = getProfileImageUrl(profile.profilePicture, 32);
        } else {
          resolved = currentUser.photoURL;
        }

        cache.set(currentUser.uid, resolved);
        setUserProfileImage(resolved);
      } catch (error) {
        console.error("Error fetching user profile for UserMenu:", error);
        // Fallback to Firebase Auth photoURL
        setUserProfileImage(currentUser.photoURL);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser?.uid, currentUser?.photoURL]);

  if (!currentUser) return null;

  const menuItems = [
    {
      label: "Profile",
      icon: <User className="mr-2 h-4 w-4" />,
      to: "/profile",
    },
    {
      label: "Directory",
      icon: <Users className="mr-2 h-4 w-4" />,
      to: "/directory",
    },
    {
      label: "Dashboard",
      icon: <Settings className="mr-2 h-4 w-4" />,
      to: "/dashboard",
    },
    {
      label: "Connections",
      icon: <Users className="mr-2 h-4 w-4" />,
      to: "/connections",
    },
    {
      label: "Messages",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      to: "/messages",
    },
    {
      label: "Notifications",
      icon: <Bell className="mr-2 h-4 w-4" />,
      to: "/notifications",
    },
  ];

  if (isAdmin) {
    menuItems.push({
      label: "Admin",
      icon: <Shield className="mr-2 h-4 w-4" />,
      to: "/admin",
    });
    menuItems.push({
      label: "Evidence System",
      icon: <LinkIcon className="mr-2 h-4 w-4" />,
      to: "/evidence-demo",
    });
  }

  // Focus user menu on account-centric actions; remove redundant Directory link
  const accountMenuItems = menuItems.filter(
    (item) => item.label !== "Directory"
  );

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              // Fix: Remove fixed width, let it expand to fit content
              "relative rounded-full px-3 py-2 h-auto",
              // Ensure proper spacing and alignment
              "flex items-center gap-2",
              // Prevent text from wrapping
              "whitespace-nowrap"
            )}
            aria-label={`Open user menu for ${
              currentUser.displayName ?? "user"
            }`}
          >
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
            ) : (
              <Avatar
                src={userProfileImage}
                alt={currentUser.displayName ?? "User"}
                fallback={
                  currentUser.displayName?.charAt(0)?.toUpperCase() ?? "U"
                }
                className="h-8 w-8 flex-shrink-0"
              />
            )}
            <span
              className="hidden sm:inline-block text-sm font-medium max-w-24 truncate"
              title={currentUser.displayName ?? undefined}
            >
              {currentUser.displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn(
            "w-64",
            // Glassmorphic surface aligned with navbar
            "bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md navbar-gradient-border",
            // Enhanced shadow to match mobile menu aesthetic
            "shadow-glass-lg",
            // Accessibility: respect reduced motion
            "motion-reduce:animate-none motion-reduce:transition-none"
          )}
          align="end"
        >
          {/* Account header */}
          <div className="px-2 py-2 flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : (
              <Avatar
                src={userProfileImage}
                alt={currentUser.displayName ?? "User"}
                fallback={
                  currentUser.displayName?.charAt(0)?.toUpperCase() ?? "U"
                }
                className="h-9 w-9"
              />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {currentUser.displayName}
              </div>
              {currentUser.email && (
                <div className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </div>
              )}
            </div>
            <Button asChild variant="outline" size="sm" className="ml-auto">
              <Link to="/profile">View</Link>
            </Button>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {accountMenuItems.map((item, index) => (
              <DropdownMenuItem key={index} asChild>
                <Link to={item.to} className="w-full flex items-center">
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          {/* Quick utility actions */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              try {
                const origin =
                  typeof window !== "undefined" ? window.location.origin : "";
                const profileUrl = `${origin}/profile`;
                void navigator.clipboard.writeText(profileUrl);
              } catch (e) {
                // noop
              }
            }}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            <span>Copy profile link</span>
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
