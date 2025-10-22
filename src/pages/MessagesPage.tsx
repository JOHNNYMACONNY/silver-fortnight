/**
 * Messages Page
 *
 * Page for displaying and interacting with chat messages.
 */

import React from "react";
import { ChatContainer } from "../components/features/chat/ChatContainer";
import { useAuth } from "../AuthContext";
import PerformanceMonitor from "../components/ui/PerformanceMonitor";
import { MessageProvider } from "../contexts/MessageContext";
import {
  ChatErrorProvider,
  ChatErrorBoundary,
} from "../contexts/ChatErrorContext";

import { Button } from "../components/ui/Button";
// HomePage patterns imports
import AnimatedHeading from "../components/ui/AnimatedHeading";
import GradientMeshBackground from "../components/ui/GradientMeshBackground";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "../components/ui/Card";
import { classPatterns, animations } from "../utils/designSystem";
import { semanticClasses } from "../utils/semanticColors";
import Box from "../components/layout/primitives/Box";
import Stack from "../components/layout/primitives/Stack";
import Cluster from "../components/layout/primitives/Cluster";
import { motion } from "framer-motion";

export const MessagesPage: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <Box className={classPatterns.homepageContainer}>
        <PerformanceMonitor pageName="MessagesPage" />
        <Card variant="glass" className="text-center p-12">
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-border border-t-primary"></div>
            </div>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Not logged in state
  if (!currentUser) {
    return (
      <Box className={classPatterns.homepageContainer}>
        <PerformanceMonitor pageName="MessagesPage" />
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground
            variant="secondary"
            intensity="medium"
            className={classPatterns.homepageHeroContent}
          >
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <AnimatedHeading
                as="h2"
                animation="kinetic"
                className="text-2xl font-bold text-foreground mb-2"
              >
                Authentication Required
              </AnimatedHeading>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to access your messages.
              </p>
              <Button asChild>
                <a href="/login">Log In</a>
              </Button>
            </div>
          </GradientMeshBackground>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={classPatterns.homepageContainer}>
      <PerformanceMonitor pageName="MessagesPage" />
      <Stack gap="md">
        {/* Hero Section */}
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground
            variant="secondary"
            intensity="medium"
            className={classPatterns.homepageHeroContent}
          >
            <AnimatedHeading
              as="h1"
              animation="kinetic"
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              Messages
            </AnimatedHeading>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn">
              Connect and collaborate with your trading community through secure
              messaging.
            </p>
          </GradientMeshBackground>
        </Box>

        {/* Chat container with proper height calculation */}
        <Card
          variant="glass"
          className="rounded-lg shadow-sm border border-border transition-all duration-200 overflow-hidden h-[calc(100vh-16rem)]"
        >
          <ChatErrorProvider>
            <ChatErrorBoundary>
              <MessageProvider>
                <ChatContainer />
              </MessageProvider>
            </ChatErrorBoundary>
          </ChatErrorProvider>
        </Card>
      </Stack>

      {/* Removed debug performance monitor */}
    </Box>
  );
};
