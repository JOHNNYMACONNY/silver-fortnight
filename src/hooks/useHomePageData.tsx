import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchHomePageData } from "../services/homepage";
import { HomePageData } from "../types/homepage";

type HomePageDataState = {
  data: HomePageData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const HomePageDataContext = createContext<HomePageDataState | undefined>(
  undefined
);

const useProvideHomePageData = (): HomePageDataState => {
  const [data, setData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchHomePageData();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || "Unable to load home data");
        setData(null);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load home data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh: loadData,
  };
};

export const HomePageDataProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const value = useProvideHomePageData();
  return (
    <HomePageDataContext.Provider value={value}>
      {children}
    </HomePageDataContext.Provider>
  );
};

const useHomePageDataContext = () => {
  const context = useContext(HomePageDataContext);
  if (!context) {
    throw new Error(
      "useHomePageDataContext must be used within a HomePageDataProvider"
    );
  }
  return context;
};

export const useHomeStats = () => {
  const { data, loading, error, refresh } = useHomePageDataContext();
  return {
    stats: data?.stats,
    loading,
    error,
    refresh,
  };
};

export const useCollaborationHighlights = () => {
  const { data, loading, error, refresh } = useHomePageDataContext();
  const highlights = useMemo(
    () => data?.collaborationHighlights ?? [],
    [data?.collaborationHighlights]
  );

  return {
    highlights,
    loading,
    error,
    refresh,
  };
};

export const useChallengeSpotlight = () => {
  const { data, loading, error, refresh } = useHomePageDataContext();
  return {
    challenge: data?.challengeSpotlight,
    loading,
    error,
    refresh,
  };
};

export const useCommunityActivity = () => {
  const { data, loading, error, refresh } = useHomePageDataContext();
  const activity = useMemo(() => data?.activity ?? [], [data?.activity]);

  return {
    activity,
    loading,
    error,
    refresh,
  };
};

export const useHomePageData = () => useHomePageDataContext();

