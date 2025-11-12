import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  getUserProfile,
  User,
  getAllTrades,
} from "../services/firestore-exports";
import PerformanceMonitor from "../components/ui/PerformanceMonitor";
import TradeCard, {
  ExtendedTrade,
} from "../components/features/trades/TradeCard";
import { motion } from "framer-motion";
import { GlassmorphicInput } from "../components/ui/GlassmorphicInput";
import { TradeListSkeleton } from "../components/ui/skeletons/TradeCardSkeleton";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
import { PlusCircle, Search, Filter, X, Target, Tag, Clock, Star, SortAsc, Grid as GridIcon, ChevronDown, ChevronUp } from "lucide-react";
import Box from "../components/layout/primitives/Box";
import Stack from "../components/layout/primitives/Stack";
import Cluster from "../components/layout/primitives/Cluster";
import Grid from "../components/layout/primitives/Grid";
import { useTradeSearch } from "../hooks/useTradeSearch";
import { getFirebaseInstances, initializeFirebase } from "../firebase-config";
import {
  collection,
  query as fsQuery,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
// HomePage patterns imports
import AnimatedHeading from "../components/ui/AnimatedHeading";
import GradientMeshBackground from "../components/ui/GradientMeshBackground";
import { BentoGrid, BentoItem } from "../components/ui/BentoGrid";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select";
import { classPatterns, animations } from "../utils/designSystem";
import { semanticClasses } from "../utils/semanticColors";
import { TopicLink } from "../components/ui/TopicLink";
import { getQuickTradeAnalytics, TradeAnalytics } from "../services/tradeAnalytics";

export const TradesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<ExtendedTrade[]>([]);
  const [tradeCreators, setTradeCreators] = useState<{ [key: string]: User }>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [showStats, setShowStats] = useState(false);
  const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    results: searchedTrades,
    loading: searchLoading,
    totalCount,
    search,
    clearSearch,
  } = useTradeSearch({
    enablePersistence: false,
    pagination: { limit: 20, orderByField: "title", orderDirection: "asc" },
    includeNonPublic: !!currentUser,
  });

  // Fetch trade creators with parallel API calls for better performance
  const fetchTradeCreators = useCallback(async (creatorIds: string[]) => {
    const creators: { [key: string]: User } = {};

    // Use Promise.allSettled for parallel execution and error resilience
    const results = await Promise.allSettled(
      creatorIds
        .filter(Boolean) // Remove falsy values
        .map(async (creatorId) => {
          const { data, error } = await getUserProfile(creatorId);
          return { creatorId, data, error };
        })
    );

    // Process results and handle individual failures gracefully
    results.forEach((result) => {
      if (result.status === 'fulfilled' && !result.value.error && result.value.data) {
        creators[result.value.creatorId] = result.value.data as User;
      }
    });

    setTradeCreators(creators);
  }, []);

  // Fetch analytics data when stats are shown
  const fetchAnalytics = async () => {
    if (analytics || analyticsLoading) return; // Don't fetch if already loaded or loading
    
    setAnalyticsLoading(true);
    try {
      const analyticsData = await getQuickTradeAnalytics();
      setAnalytics({
        totalTrades: analyticsData.activeTrades,
        completedTrades: 0,
        successRate: analyticsData.successRate,
        activeTrades: analyticsData.activeTrades,
        cancelledTrades: 0,
        inProgressTrades: 0,
        categories: {},
        averageCompletionTime: undefined
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set fallback analytics
      setAnalytics({
        totalTrades: 0,
        completedTrades: 0,
        successRate: 0,
        activeTrades: 0,
        cancelledTrades: 0,
        inProgressTrades: 0,
        categories: {},
        averageCompletionTime: undefined
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Realtime trades via onSnapshot
  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubscribe: (() => void) | null = null;
    let isSubscribed = true;
    const includeNonPublic = !!currentUser;

    (async () => {
      try {
        await initializeFirebase();
        const { db } = await getFirebaseInstances();
        if (!db || !isSubscribed) {
          return;
        }
        const tradesCol = collection(db, "trades");
        // Ultra-simplified query to avoid ANY composite index requirements
        // Just get all trades and filter client-side
        const q = fsQuery(tradesCol, limit(100));

        unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            try {
              const items = snapshot.docs
                .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
                .filter((trade) => {
                  // Client-side filtering to avoid Firebase index issues
                  if (!trade.id) return false;
                  if (trade.status !== "open") return false;
                  if (!includeNonPublic && trade.visibility !== "public") return false;
                  return true;
                }) as ExtendedTrade[];
          setTrades(items);

          // Fetch creators for the trades
          const creatorIds = items
            .map((trade) => (trade as any).creatorId)
            .filter(
              (id, index, self) => id && self.indexOf(id) === index
            ) as string[];
          if (creatorIds.length > 0) {
            await fetchTradeCreators(creatorIds);
          }
          setLoading(false);
        } catch (err: any) {
          console.error("Error processing realtime trades:", err);
          setError(err.message || "Failed to process trades");
          setLoading(false);
        }
          },
          (err) => {
            console.error("Error subscribing to trades:", err);
            setError(err.message || "Failed to subscribe to trades");
            setLoading(false);
          }
        );
      } catch (err: any) {
        console.error("Error initializing trade listener:", err);
        setError(err.message || "Failed to load trades");
        setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
      if (unsubscribe) unsubscribe();
    };
  }, [fetchTradeCreators, currentUser]);

  // Load search and filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const status = params.get("status") || "";
    const category = params.get("category") || "";
    const time = params.get("time") || "";
    const skillLevel = params.get("skillLevel") || "";
    const skills = params.getAll("skills");

    if (q) {
      setSearchTerm(q);
    }

    const loadedFilters: any = {};
    if (status) loadedFilters.status = status;
    if (category) loadedFilters.category = category;
    if (time) loadedFilters.timeCommitment = time;
    if (skillLevel) loadedFilters.skillLevel = skillLevel;
    if (skills.length > 0) loadedFilters.skills = skills;
    if (Object.keys(loadedFilters).length > 0) setFilters(loadedFilters);
  }, []);

  // Sync search and filters to URL on change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (filters.status) params.set("status", String(filters.status));
    if (filters.category) params.set("category", String(filters.category));
    if (filters.timeCommitment)
      params.set("time", String(filters.timeCommitment));
    if (filters.skillLevel)
      params.set("skillLevel", String(filters.skillLevel));
    if (Array.isArray(filters.skills) && filters.skills.length > 0) {
      filters.skills.forEach((s: string) => params.append("skills", s));
    }
    const newUrl = `${window.location.pathname}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    window.history.replaceState({}, "", newUrl);
  }, [searchTerm, filters]);

  // Handle initiate trade button click
  const handleInitiateTrade = useCallback(
    (tradeId: string) => {
      if (!currentUser) {
        addToast("error", "Please log in to initiate a trade");
        return;
      }

      if (!tradeId) {
        addToast("error", "Invalid trade ID");
        return;
      }

      navigate(`/trades/${tradeId}`);
    },
    [currentUser, navigate, addToast]
  );

  // Helper function to get skills
  const getTradeSkills = useCallback(
    (trade: ExtendedTrade, type: "offered" | "wanted") => {
      let skills: any[] = [];
      if (type === "offered") {
        skills = trade.skillsOffered || trade.offeredSkills || [];
      } else {
        skills = trade.skillsWanted || trade.requestedSkills || [];
      }

      // Extract skill names for filtering (handle both string and object formats)
      return skills.map((skill) => {
        if (typeof skill === "string") return skill;
        if (typeof skill === "object" && skill.name) return skill.name;
        return String(skill);
      });
    },
    []
  );

  // Choose backend results when searching/filters are active; apply client-only filters afterward
  const filteredTrades = useMemo(() => {
    const hasFiltersActive = Object.values(filters).some(
      (v) =>
        v !== "" &&
        v !== undefined &&
        v !== null &&
        (!Array.isArray(v) || v.length > 0)
    );
    let result: ExtendedTrade[] =
      searchTerm || hasFiltersActive
        ? (searchedTrades as unknown as ExtendedTrade[])
        : trades;

    if (filters.timeCommitment) {
      result = result.filter(
        (trade) =>
          String((trade as any).timeCommitment || "").toLowerCase() ===
          String(filters.timeCommitment).toLowerCase()
      );
    }

    if (filters.skillLevel) {
      result = result.filter(
        (trade) =>
          String((trade as any).skillLevel || "").toLowerCase() ===
          String(filters.skillLevel).toLowerCase()
      );
    }

    if (Array.isArray(filters.skills) && filters.skills.length > 0) {
      const selected = filters.skills.map((s: string) => s.toLowerCase());
      result = result.filter((trade) => {
        const offered = getTradeSkills(trade, "offered").map((s) =>
          String(s).toLowerCase()
        );
        const wanted = getTradeSkills(trade, "wanted").map((s) =>
          String(s).toLowerCase()
        );
        return selected.some(
          (s: string) => offered.includes(s) || wanted.includes(s)
        );
      });
    }

    return result;
  }, [trades, searchedTrades, searchTerm, filters, getTradeSkills]);

  // Enhanced trades with creator info
  const enhancedTrades = useMemo(() => {
    return filteredTrades
      .filter((trade) => trade.id) // Only include trades with valid IDs
      .map((trade) => {
        const creator = tradeCreators[trade.creatorId || ""];
        return {
          ...trade,
          id: trade.id!, // Assert that id exists since we filtered above
          creatorName: creator?.displayName || "Unknown User",
          creatorPhotoURL: creator?.photoURL || creator?.profilePicture,
        } as ExtendedTrade;
      });
  }, [filteredTrades, tradeCreators]);

  // Derive available skills from current trades (offered + wanted)
  const availableSkills = useMemo(() => {
    const frequencyByKey: Record<string, number> = {};
    const displayByKey: Record<string, string> = {};
    const source = trades.length > 0 ? trades : filteredTrades;
    const addSkill = (raw: unknown) => {
      const s = String(raw || "").trim();
      if (!s) return;
      const key = s.toLowerCase();
      if (!displayByKey[key]) displayByKey[key] = s;
      frequencyByKey[key] = (frequencyByKey[key] || 0) + 1;
    };
    source.forEach((trade) => {
      getTradeSkills(trade as ExtendedTrade, "offered").forEach(addSkill);
      getTradeSkills(trade as ExtendedTrade, "wanted").forEach(addSkill);
    });
    return Object.keys(frequencyByKey)
      .sort((a, b) => {
        const byFreq = (frequencyByKey[b] || 0) - (frequencyByKey[a] || 0);
        if (byFreq !== 0) return byFreq;
        return displayByKey[a].localeCompare(displayByKey[b]);
      })
      .map((k) => displayByKey[k])
      .slice(0, 50);
  }, [trades, filteredTrades, getTradeSkills]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (
        typeof value === "object" &&
        value &&
        "start" in value &&
        "end" in value
      ) {
        return value.start != null || value.end != null;
      }
      return true;
    });
  }, [filters]);

  // Debounced search when term or filters change (MVP: 300ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchTerm || hasActiveFilters) {
        search(searchTerm, filters);
      } else {
        clearSearch();
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchTerm, filters, hasActiveFilters, search, clearSearch]);

  const handleSearch = (term: string, f: { category?: string }) => {
    search(term, { ...filters, category: f.category || filters.category });
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search trades"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Escape to clear search
      if (event.key === 'Escape' && searchTerm) {
        setSearchTerm('');
        clearSearch();
      }
      
      // Ctrl/Cmd + / to toggle filters
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowFilterPanel(!showFilterPanel);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, showFilterPanel]);

  return (
    <main className={classPatterns.homepageContainer}>
      <PerformanceMonitor pageName="TradesPage" />
      <Stack gap="md">
        {/* Hero Section with HomePage-style gradient background */}
        <Box className={classPatterns.homepageHero}>
          <GradientMeshBackground 
            variant="primary" 
            intensity="medium" 
            className={classPatterns.homepageHeroContent}
          >
            <AnimatedHeading 
              as="h1" 
              animation="kinetic" 
              className={`text-display-large md:text-5xl ${semanticClasses('trades').gradientText} mb-4`}
            >
              Available Trades
            </AnimatedHeading>
            <p className="text-body-large text-muted-foreground max-w-2xl animate-fadeIn mb-6">
              Discover skill exchanges and connect with talented individuals ready to trade expertise.
            </p>
            <Cluster gap="sm" align="center">
              <Button
                onClick={() => navigate("/trades/new")}
                className="whitespace-nowrap"
                variant="glassmorphic"
                topic="trades"
              >
                <PlusCircle className="me-2 h-4 w-4" />
                Create New Trade
              </Button>
              <Badge variant="default" topic="trades" className="text-caption">
                {enhancedTrades.length} Active Trades
              </Badge>
            </Cluster>
          </GradientMeshBackground>
        </Box>

        {/* Search Section with Premium Design System Card */}
        <Card 
          variant="glass"
          className="rounded-xl p-4 md:p-6 mb-lg hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300"
          interactive={true}
          hover={true}
        >
          <CardHeader className={classPatterns.homepageCardHeader}>
            <Cluster justify="between" align="center" gap="sm">
              <Stack gap="xs">
                <CardTitle className="text-component-title text-foreground">
              Find Your Perfect Trade
                </CardTitle>
                <p className="text-body-small text-muted-foreground">
                  Use filters to narrow down your search
                </p>
              </Stack>
              <Badge variant="default" topic="trades" className="text-caption">
                {searchTerm || hasActiveFilters
                  ? totalCount
                  : enhancedTrades.length} Results
              </Badge>
            </Cluster>
          </CardHeader>
          <CardContent className={classPatterns.homepageCardContent}>
            <div className="space-y-md w-full">
              {/* Enhanced Search Input with Design System */}
              <Box className="relative w-full">
                <GlassmorphicInput
                  value={searchTerm}
                  onChange={(e) => handleSearchTermChange(e.target.value)}
                  placeholder="Search trades by skill, category, or description..."
                  variant="glass"
                  size="lg"
                  brandAccent="orange"
                  icon={<Search className="h-5 w-5" />}
                  className="pr-20 bg-white/10 backdrop-blur-xl w-full"
                />
                <Button
                  onClick={() => setShowFilterPanel(true)}
                  variant="glassmorphic"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px]"
                  topic="trades"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </Box>

              {/* Active Filters Display - Always show when filters are active */}
              {hasActiveFilters && (
                <Card variant="glass" className="p-md hover:shadow-md hover:shadow-orange-500/5 transition-all duration-200" interactive={true}>
                  <CardHeader className="pb-3">
                    <Cluster justify="between" align="center">
                      <CardTitle className="text-body-large text-primary-600 dark:text-primary-400">Active Filters</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        topic="trades"
                        onClick={() => {
                          setFilters({});
                          clearSearch();
                        }}
                        className="text-body-small min-h-[44px] min-w-[44px]"
                      >
                        Clear All
                      </Button>
                    </Cluster>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-xs">
                      {Object.entries(filters).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;
                        
                        let displayValue = '';
                        if (Array.isArray(value)) {
                          displayValue = value.join(', ');
                        } else if (typeof value === 'object' && value && 'start' in value && 'end' in value) {
                          displayValue = `${(value as any).start} - ${(value as any).end}`;
                        } else {
                          displayValue = String(value);
                        }
                        
                        return (
                          <Badge
                            key={key}
                            variant="default"
              topic="trades"
                            className="cursor-pointer"
                            onClick={() => {
                              const newFilters = { ...filters };
                              delete newFilters[key];
                              setFilters(newFilters);
                              search(searchTerm, newFilters);
                            }}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}: {displayValue}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clear Search Button */}
            {searchTerm && (
                <div className="text-right">
                  <Button
                  type="button"
                  onClick={() => setSearchTerm("")}
                    variant="ghost"
                    size="sm"
                    className="text-body-small text-primary hover:text-primary/80 underline"
                  aria-label="Clear search"
                >
                  Clear search
                  </Button>
              </div>
            )}
            </div>
          </CardContent>

          {/* Enhanced Filter Panel with Modal Component */}
        <Modal
            isOpen={showFilterPanel}
            onClose={() => setShowFilterPanel(false)}
          title="Advanced Filters"
          size="xxl"
        >
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 glassmorphic border-glass backdrop-blur-2xl bg-white/5 p-4 sm:p-6 rounded-xl max-h-[85vh] overflow-y-auto">
            <p className="glassmorphic border-glass backdrop-blur-sm bg-white/5 text-white/90 p-3 sm:p-4 rounded-xl mb-4 text-sm sm:text-base">
              Refine your search with specific criteria
            </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6 sm:gap-8 p-4 sm:p-6">
                {/* Status Filter */}
                <Card 
                  variant="glass"
                  className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                  glow="subtle"
                  glowColor="orange"
                  interactive={true}
                  hover={true}
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0" />
                      <span className="leading-tight break-words">Trade Status</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) => {
                        const newFilters = { ...filters, status: value === "all" ? undefined : value };
                        setFilters(newFilters);
                        search(searchTerm, newFilters);
                      }}
                    >
                      <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-orange-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending_evidence">Pending Evidence</SelectItem>
                        <SelectItem value="pending_confirmation">Pending Confirmation</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Category Filter */}
                <Card 
                  variant="glass"
                  className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                  glow="subtle"
                  glowColor="orange"
                  interactive={true}
                  hover={true}
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                      <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0" />
                      <span className="leading-tight break-words">Category</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) => {
                        const newFilters = { ...filters, category: value === "all" ? undefined : value };
                        setFilters(newFilters);
                        search(searchTerm, newFilters);
                      }}
                    >
                      <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-orange-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Time Commitment Filter */}
                <Card 
                  variant="glass"
                  className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                  glow="subtle"
                  glowColor="orange"
                  interactive={true}
                  hover={true}
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0" />
                      <span className="leading-tight break-words">Time Commitment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Select
                      value={filters.timeCommitment || "all"}
                      onValueChange={(value) => {
                        const newFilters = { ...filters, timeCommitment: value === "all" ? undefined : value };
                        setFilters(newFilters);
                        search(searchTerm, newFilters);
                      }}
                    >
                      <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-orange-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Select time commitment" />
                      </SelectTrigger>
                      <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                        <SelectItem value="all">Any Time</SelectItem>
                        <SelectItem value="15-min">15 minutes</SelectItem>
                        <SelectItem value="30-min">30 minutes</SelectItem>
                        <SelectItem value="1-hour">1 hour</SelectItem>
                        <SelectItem value="2-hour">2 hours</SelectItem>
                        <SelectItem value="multi-day">Multi-day</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Skill Level Filter */}
                <Card 
                  variant="glass"
                  className="p-4 sm:p-5 lg:p-6 border-glass backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                  glow="subtle"
                  glowColor="orange"
                  interactive={true}
                  hover={true}
                >
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-medium flex items-center gap-2 sm:gap-3 text-white/95">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0" />
                      <span className="leading-tight break-words">Skill Level</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Select
                      value={filters.skillLevel || "all"}
                      onValueChange={(value) => {
                        const newFilters = { ...filters, skillLevel: value === "all" ? undefined : value };
                        setFilters(newFilters);
                        search(searchTerm, newFilters);
                      }}
                    >
                      <SelectTrigger className="glassmorphic border-glass backdrop-blur-sm bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-orange-400/30 transition-all duration-200 h-10 sm:h-11 text-sm sm:text-base">
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                      <SelectContent className="glassmorphic border-glass backdrop-blur-xl bg-white/10">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Clear All Filters */}
              <div className="pt-3 sm:pt-4 lg:pt-6">
                <Button
                  variant="premium-outline"
                  topic="trades"
                  onClick={() => {
              setFilters({});
              clearSearch();
            }}
                  className="w-full glassmorphic border-glass backdrop-blur-sm bg-white/5 hover:bg-white/10 focus:ring-2 focus:ring-orange-400/30 transition-all duration-300 h-10 sm:h-11 text-sm sm:text-base min-h-[44px]"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 mr-1 sm:mr-2" />
                  <span className="break-words">Clear All Filters</span>
                </Button>
              </div>
            </div>
          </Modal>
        </Card>

        {/* Enhanced Results Display */}
        <Card variant="glass" className="p-4 mb-6">
          <Cluster justify="between" align="center">
            <Stack gap="xs">
              <h3 className="text-body-large font-medium text-foreground">
                {searchTerm || hasActiveFilters ? totalCount : enhancedTrades.length} Trades Found
              </h3>
              <p className="text-body-small text-muted-foreground">
                {searchTerm ? `Results for "${searchTerm}"` : 'All available trades'}
              </p>
            </Stack>
        <Cluster gap="sm">
          <Button variant="glassmorphic" size="sm" topic="trades" className="min-h-[44px] min-w-[44px] hover:scale-105 transition-transform duration-200">
            <SortAsc className="h-4 w-4 mr-2" />
            Sort
          </Button>
          <Button variant="glassmorphic" size="sm" topic="trades" className="min-h-[44px] min-w-[44px] hover:scale-105 transition-transform duration-200">
            <GridIcon className="h-4 w-4 mr-2" />
            View
          </Button>
        </Cluster>
          </Cluster>
        </Card>

        {/* Collapsible Stats Section */}
        <section className="mb-lg">
          <div className="mb-lg">
            <button
              onClick={() => {
                const newShowStats = !showStats;
                setShowStats(newShowStats);
                if (newShowStats) {
                  fetchAnalytics();
                }
              }}
              className="text-foreground hover:text-foreground/80 transition-all duration-200 flex items-center gap-2 group"
            >
              <AnimatedHeading as="h2" animation="slide" className="text-section-heading md:text-3xl">
                Trade Analytics
              </AnimatedHeading>
              {showStats ? (
                <ChevronUp className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              ) : (
                <ChevronDown className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>
          </div>
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg animate-in fade-in-0 slide-in-from-top-4 duration-300">
              <Card variant="glass" className="p-lg hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300" interactive={true}>
                <CardHeader>
                  <CardTitle className="text-component-title text-foreground">Active Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">{enhancedTrades.length}</div>
                  <div className="text-sm text-muted-foreground">Currently available</div>
                  {/* Simple bar chart placeholder */}
                  <div className="mt-4 flex items-end gap-1 h-16">
                    <div className="bg-primary-500/20 rounded-t w-full h-12"></div>
                    <div className="bg-primary-500/40 rounded-t w-full h-8"></div>
                    <div className="bg-primary-500/60 rounded-t w-full h-16"></div>
                    <div className="bg-primary-500/30 rounded-t w-full h-6"></div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass" className="p-lg hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300" interactive={true}>
                <CardHeader>
                  <CardTitle className="text-component-title text-purple-600 dark:text-purple-400">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {new Set(enhancedTrades.map(trade => trade.category)).size}
                  </div>
                  <div className="text-sm text-muted-foreground">Skill categories</div>
                  {/* Pie chart placeholder */}
                  <div className="mt-4 w-16 h-16 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="60 100" className="text-purple-500/60" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="40 100" strokeDashoffset="-60" className="text-purple-400" />
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass" className="p-lg hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300" interactive={true}>
                <CardHeader>
                  <CardTitle className="text-component-title text-secondary-600 dark:text-secondary-400">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400 mb-2">
                    {analyticsLoading ? (
                      <div className="animate-pulse bg-secondary-500/20 rounded h-8 w-16"></div>
                    ) : analytics ? (
                      `${Math.round(analytics.successRate)}%`
                    ) : (
                      '0%'
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Completion rate</div>
                  {/* Dynamic progress ring */}
                  <div className="mt-4 w-16 h-16 mx-auto relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary-500/20" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeDasharray={`${analytics ? (analytics.successRate * 2.51) : 0} 251`}
                        className="text-secondary-500 transition-all duration-1000 ease-out" 
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-secondary-600 dark:text-secondary-400">
                      {analyticsLoading ? (
                        <div className="animate-pulse bg-secondary-500/20 rounded h-4 w-6"></div>
                      ) : analytics ? (
                        `${Math.round(analytics.successRate)}%`
                      ) : (
                        '0%'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Featured Trades Section with HomePage-style asymmetric layout */}
        <AnimatedHeading as="h2" animation="slide" className="text-section-heading md:text-3xl text-foreground mb-6">
          Featured Trades
        </AnimatedHeading>

        {loading ? (
          <TradeListSkeleton count={5} />
        ) : error ? (
          <Card variant="glass" className="text-center p-6">
            <CardContent>
              <p className="text-destructive-foreground mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : enhancedTrades.length === 0 ? (
          <Card variant="glass" className="text-center p-6">
            <CardHeader>
              <CardTitle className="text-subsection-heading text-foreground">
                No Trades Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No trades match your search criteria. Try a different search term
                or create a new trade!
              </p>
              <Button
                onClick={() => navigate("/trades/new")}
                variant="glassmorphic"
                topic="trades"
              >
                <PlusCircle className="me-2 h-4 w-4" />
                Create New Trade
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
            {enhancedTrades.map((trade, index) => (
              <motion.div
                key={trade.id}
                className="h-full"
                {...animations.homepageCardEntrance}
                transition={{
                  ...animations.homepageCardEntrance.transition,
                  delay: index * 0.1
                }}
              >
                <TradeCard
                  trade={trade}
                  onInitiateTrade={handleInitiateTrade}
                  className="h-full"
                />
              </motion.div>
            ))}
          </Grid>
        )}

        {/* Properly Spaced Pagination - Matches App Style */}
        {enhancedTrades.length > 0 && (
          <Card 
            variant="glass" 
            className="mt-2xl glassmorphic border-glass backdrop-blur-xl bg-white/5 shadow-lg shadow-orange-500/10"
          >
            <CardContent className="p-2xl">
              <div className="flex items-center justify-between w-full">
                <Button 
                  variant="glassmorphic" 
                  size="lg"
                  topic="trades"
                  disabled
                  className="min-h-[48px] min-w-[140px] px-xl py-lg opacity-50 cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
                
                <Badge 
                  variant="default" 
                  topic="trades" 
                  className="text-component-title px-2xl py-lg glassmorphic border-glass backdrop-blur-sm bg-white/10"
                >
                  Page 1 of 1
                </Badge>
                
                <Button 
                  variant="glassmorphic" 
                  size="lg"
                  topic="trades"
                  disabled
                  className="min-h-[48px] min-w-[140px] px-xl py-lg opacity-50 cursor-not-allowed"
                >
                  Next
                  <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </Stack>
    </main>
  );
};

export default TradesPage;
