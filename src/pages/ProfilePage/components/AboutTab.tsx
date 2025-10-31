import React from "react";
import { Mail, Calendar, Copy as CopyIcon } from "lucide-react";
import Box from "../../../components/layout/primitives/Box";
import Stack from "../../../components/layout/primitives/Stack";
import Grid from "../../../components/layout/primitives/Grid";
import { Button } from "../../../components/ui/Button";
import { UserProfile } from "../../../types/user";

interface AboutTabProps {
  userProfile: UserProfile;
}

export const AboutTab: React.FC<AboutTabProps> = ({ userProfile }) => {
  return (
    <Stack gap="md">
      <Grid columns={{ base: 1, md: 2 }} gap={{ base: "md", md: "lg" }}>
        <Box>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Email
          </label>
          {userProfile.email ? (
            <div className="px-4 py-3 rounded-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                <span className="truncate">{userProfile.email}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
                onClick={() =>
                  navigator.clipboard.writeText(userProfile.email || "")
                }
                aria-label="Copy email"
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="h-10 bg-muted rounded animate-pulse" />
          )}
        </Box>
        {userProfile.metadata?.creationTime && (
          <Box>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Joined
            </label>
            <p className="px-4 py-3 rounded-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>
                {new Date(
                  userProfile.metadata.creationTime
                ).toLocaleDateString()}
              </span>
            </p>
          </Box>
        )}
        {userProfile.metadata?.lastSignInTime && (
          <Box>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Last sign-in
            </label>
            <p className="px-4 py-3 rounded-xl glassmorphic border-glass backdrop-blur-xl bg-white/5 text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500 dark:text-green-400" />
              <span>
                {new Date(
                  userProfile.metadata.lastSignInTime
                ).toLocaleDateString()}
              </span>
            </p>
          </Box>
        )}
      </Grid>
    </Stack>
  );
};

