import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import {
  getChallenges,
  joinChallenge,
  getUserChallenges,
  onActiveChallenges,
} from "../services/challenges";
import {
  Challenge,
  ChallengeFilters,
  ChallengeSortBy,
  ChallengeStatus,
  ChallengeType,
  ChallengeDifficulty,
  ChallengeCategory,
} from "../types/gamification";
import { useToast } from "../contexts/ToastContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select";
import {
  Award,
  Filter,
  Search,
  Clock,
  Calendar,
  Users,
  Trophy,
  Dumbbell,
  ArrowRight,
} from "lucide-react";
import { ChallengeCalendar } from "../components/features/challenges/ChallengeCalendar";
import { ChallengeCard } from "../components/features/challenges/ChallengeCard";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Tooltip } from "../components/ui/Tooltip";
import { cn } from "../utils/cn";
import { useBusinessMetrics } from "../contexts/PerformanceContext";
import { Button } from "../components/ui/Button";
import { markSkillPracticeDay, hasPracticedToday } from "../services/streaks";
// HomePage patterns imports
import PerformanceMonitor from "../components/ui/PerformanceMonitor";
import AnimatedHeading from "../components/ui/AnimatedHeading";
import GradientMeshBackground from "../components/ui/GradientMeshBackground";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { classPatterns, animations } from "../utils/designSystem";
import { semanticClasses } from "../utils/semanticColors";
import Box from "../components/layout/primitives/Box";
import Stack from "../components/layout/primitives/Stack";
import Cluster from "../components/layout/primitives/Cluster";
import Grid from "../components/layout/primitives/Grid";
import { motion } from "framer-motion";
import { EnhancedSearchBar } from "../components/features/search/EnhancedSearchBar";
import { logger } from '@utils/logging/logger';

export const ChallengesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { track } = useBusinessMetrics();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [practicedToday, setPracticedToday] = useState<boolean>(false);

  // Retry logic for failed requests
  const fetchWithRetry = async (
    fn: () => Promise<any>,
    retries = 3
  ): Promise<any> => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        logger.debug(`Retrying request, ${retries} attempts left...`, 'PAGE');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchWithRetry(fn, retries - 1);
      }
      throw error;
    }
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ChallengeCategory | ""
  >("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    ChallengeDifficulty | ""
  >("");
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | "">(
    ""
  );
  const [selectedType, setSelectedType] = useState<ChallengeType | "">("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "mine">("all");

  // EnhancedSearchBar state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Search handler
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedDifficulty) count++;
    if (selectedStatus) count++;
    if (selectedType) count++;
    setActiveFiltersCount(count);
  }, [selectedCategory, selectedDifficulty, selectedStatus, selectedType]);

  // Categories using the new enum
  const categories = Object.values(ChallengeCategory);
  const difficulties = Object.values(ChallengeDifficulty);
  const statuses = Object.values(ChallengeStatus);
  const types = Object.values(ChallengeType);

  useEffect(() => {
    fetchChallenges();
    if (currentUser) {
      fetchUserChallenges();
    }
    // Check practiced-today indicator (non-blocking)
    (async () => {
      if (!currentUser?.uid) return;
      try {
        const practiced = await hasPracticedToday(currentUser.uid);
        setPracticedToday(practiced);
      } catch { }
    })();

    // Subscribe to live updates of active challenges
    const unsubscribe = onActiveChallenges((live) => {
      setLiveCount(live.length);
      // Optionally merge live data into the list when filters allow only active
      // Here we keep it as a badge indicator to avoid disrupting filter logic
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Apply type filter from query param (e.g., /challenges?type=solo)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get("type");
    if (
      typeParam &&
      Object.values(ChallengeType).includes(typeParam as ChallengeType)
    ) {
      setSelectedType(typeParam as ChallengeType);
    }
  }, [location.search]);

  useEffect(() => {
    applyFilters();
  }, [
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    selectedStatus,
    selectedType,
    challenges,
    activeTab,
    userChallenges,
  ]);

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: ChallengeFilters = {
        limit: 50,
        sortBy: ChallengeSortBy.START_DATE,
        sortOrder: "desc",
      };

      const challengesResult = await fetchWithRetry(async () => {
        return await getChallenges(filters);
      });

      if (!challengesResult.success) {
        throw new Error(challengesResult.error || "Failed to fetch challenges");
      }

      setChallenges(challengesResult.challenges);
    } catch (err: any) {
      setError(err.message || "Failed to fetch challenges");
      addToast("error", err.message || "Failed to fetch challenges");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChallenges = async () => {
    if (!currentUser?.uid) return;

    try {
      const userChallengesResult = await getUserChallenges(currentUser.uid);
      if (userChallengesResult.success && userChallengesResult.challenges) {
        setUserChallenges(userChallengesResult.challenges);
      }
    } catch (err) {
      logger.error('Error fetching user challenges:', 'PAGE', {}, err as Error);
    }
  };

  const applyFilters = () => {
    let result = [...challenges];

    // Tab filter
    if (activeTab === "active") {
      result = result.filter((c) => c.status === ChallengeStatus.ACTIVE);
    } else if (activeTab === "mine") {
      const myIds = new Set(userChallenges.map((uc: any) => uc.id));
      result = result.filter((c) => myIds.has(c.id));
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (challenge: Challenge) =>
          (challenge.title && challenge.title.toLowerCase().includes(term)) ||
          (challenge.description &&
            challenge.description.toLowerCase().includes(term)) ||
          (challenge.tags &&
            challenge.tags.some((tag) => tag.toLowerCase().includes(term)))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(
        (challenge: Challenge) => challenge.category === selectedCategory
      );
    }

    // Apply difficulty filter
    if (selectedDifficulty) {
      result = result.filter(
        (challenge: Challenge) => challenge.difficulty === selectedDifficulty
      );
    }

    // Apply status filter
    if (selectedStatus) {
      result = result.filter(
        (challenge: Challenge) => challenge.status === selectedStatus
      );
    }

    // Apply type filter
    if (selectedType) {
      result = result.filter(
        (challenge: Challenge) => challenge.type === selectedType
      );
    }

    setFilteredChallenges(result);
    // Track zero-result state for analytics
    try {
      if (result.length === 0) {
        track("challenge_filters_zero_results", 1);
      }
    } catch { }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSelectedStatus("");
    setSelectedType("");
    try {
      track("challenge_filters_cleared", 1);
    } catch { }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      logger.error('Error formatting date:', 'PAGE', {}, err as Error);
      return "Invalid Date";
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!currentUser?.uid) {
      addToast("error", "Please log in to join challenges");
      return;
    }

    try {
      const result = await joinChallenge(challengeId, currentUser.uid);
      if (result.success) {
        addToast("success", "Successfully joined challenge!");
        // Track join event
        try {
          track("challenge_joins", 1);
        } catch { }
        fetchChallenges();
        fetchUserChallenges();
      } else {
        addToast("error", result.error || "Failed to join challenge");
      }
    } catch (err: any) {
      addToast("error", err.message || "Failed to join challenge");
    }
  };

  // Tier-Coded Hero Logic
  const [heroColors, setHeroColors] = useState<string[]>([]);

  useEffect(() => {
    const determineHeroColors = async () => {
      if (!currentUser?.uid) {
        // Default / Guest: Cool Blues (Neutral)
        setHeroColors(['rgba(14, 165, 233, 0.15)', 'rgba(56, 189, 248, 0.15)', 'rgba(2, 132, 199, 0.15)']);
        return;
      }

      // Check access levels (Highest wins)
      // We could use getUserThreeTierProgress but simple canAccessTier checks work if ordered correctly.
      // Order: Collaboration > Trade > Solo

      // Note: In a real app we'd fetch the progress object once to save reads, but for now:
      const { getUserThreeTierProgress } = await import("../services/threeTierProgression");
      const progress = await getUserThreeTierProgress(currentUser.uid);

      if (progress.success && progress.data) {
        const tiers = progress.data.unlockedTiers;
        if (tiers.includes('COLLABORATION')) {
          // Indigo/Rose (Complex)
          setHeroColors(['rgba(139, 92, 246, 0.2)', 'rgba(244, 63, 94, 0.15)', 'rgba(79, 70, 229, 0.2)']);
        } else if (tiers.includes('TRADE')) {
          // Amber/Orange (Energy)
          setHeroColors(['rgba(249, 115, 22, 0.2)', 'rgba(251, 146, 60, 0.15)', 'rgba(252, 211, 77, 0.2)']);
        } else {
          // Emerald/Teal (Growth)
          setHeroColors(['rgba(34, 197, 94, 0.2)', 'rgba(20, 184, 166, 0.15)', 'rgba(16, 185, 129, 0.2)']);
        }
      }
    };
    determineHeroColors();
  }, [currentUser]);

  return (
    <Box className={classPatterns.homepageContainer} role="main">
      <PerformanceMonitor pageName="ChallengesPage" />
      <Stack gap="md">
        {/* Hero Section */}
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground
            variant="custom"
            customColors={heroColors.length ? heroColors : undefined}
            intensity="medium"
            className={classPatterns.homepageHeroContent}
          >
            <div className="flex items-center gap-3 mb-4">
              <AnimatedHeading
                as="h1"
                animation="kinetic"
                className="text-4xl md:text-5xl font-bold text-foreground"
              >
                Challenges
              </AnimatedHeading>
              {liveCount !== null && (
                <Badge
                  variant="default"
                  topic="success"
                  className="text-sm animate-pulse"
                >
                  Live: {liveCount}
                </Badge>
              )}
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fadeIn mb-6">
              Participate in challenges to improve your skills and compete with
              the community.
            </p>
            <Cluster gap="sm" align="center">
              <Button
                variant="default"
                size="md"
                onClick={() => navigate("/challenges/create")}
                className="bg-primary hover:bg-primary/90"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Create Challenge
              </Button>
              <Badge variant="secondary" className="text-sm" aria-live="polite">
                {filteredChallenges.length} Challenges
              </Badge>
            </Cluster>
          </GradientMeshBackground>
        </Box>

        {/* Enhanced Search Section */}
        <Card variant="glass" className="rounded-xl p-4 md:p-6">
          <EnhancedSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
            onToggleFilters={() => setShowFilterPanel(true)}
            hasActiveFilters={activeFiltersCount > 0}
            activeFiltersCount={activeFiltersCount}
            resultsCount={filteredChallenges.length}
            isLoading={loading}
            placeholder="Search challenges by title, description, or skills..."
            topic="success"
          />
        </Card>

        {/* Tabs: All / Active / My Challenges */}
        <Cluster gap="sm" justify="start" className="border-b border-border pb-2">
          {[
            { key: "all", label: "All Challenges" },
            { key: "active", label: "Active" },
            { key: "mine", label: "My Challenges" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative",
                activeTab === tab.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </Cluster>

        {/* Daily Practice Quick Action (Simplified) */}
        {currentUser?.uid && !practicedToday && (
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-glass backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  Daily Practice
                </div>
                <div className="text-xs text-muted-foreground">
                  Log a quick practice session to keep your streak alive.
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await markSkillPracticeDay(currentUser.uid);
                  addToast("success", "Logged today's practice");
                  setPracticedToday(true);
                } catch {
                  addToast("error", "Failed to log practice");
                }
              }}
            >
              Log practice
            </Button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card text-card-foreground p-4 rounded-lg shadow-sm animate-pulse"
              >
                <div className="h-4 bg-background-tertiary rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-background-tertiary rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-background-tertiary rounded w-1/2 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-8 bg-background-tertiary rounded w-24"></div>
                  <div className="h-4 bg-background-tertiary rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-destructive text-destructive-foreground p-4 rounded-md text-center">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto h-12 w-12 text-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-text-primary">
              No challenges found
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {activeTab === "mine"
                ? "You have not joined any challenges yet."
                : activeTab === "active"
                  ? "No active challenges match your filters."
                  : "Try adjusting your filters."}
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                aria-label="Clear filters"
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && filteredChallenges.length > 0 && (
          <>
            <AnimatedHeading
              as="h2"
              animation="slide"
              className="text-2xl md:text-3xl font-semibold text-foreground mb-6"
            >
              Available Challenges
            </AnimatedHeading>
            <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
              {filteredChallenges.map((challenge, index) => {
                const isUserJoined = userChallenges.some(
                  (uc: any) => (uc.id || uc.challengeId) === challenge.id
                );
                const difficultyValue =
                  challenge.difficulty || ChallengeDifficulty.BEGINNER;
                return (
                  <motion.div
                    key={challenge.id}
                    className="h-full"
                    {...animations.homepageCardEntrance}
                    transition={{
                      ...animations.homepageCardEntrance.transition,
                      delay: index * 0.1,
                    }}
                  >
                    <ChallengeCard
                      challenge={{ ...challenge, difficulty: difficultyValue }}
                      onSelect={() => navigate(`/challenges/${challenge.id}`)}
                      footer={
                        <div className="flex items-center justify-between gap-4">
                          <Link
                            to={`/challenges/${challenge.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Details
                          </Link>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinChallenge(challenge.id);
                            }}
                            disabled={isUserJoined}
                            variant={isUserJoined ? "secondary" : "primary"}
                            size="sm"
                          >
                            {isUserJoined ? "Joined" : "Join Challenge"}
                          </Button>
                        </div>
                      }
                    />
                  </motion.div>
                );
              })}
            </Grid>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default ChallengesPage;
