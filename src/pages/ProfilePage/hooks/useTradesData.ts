import { useState, useEffect, useMemo } from "react";
import { tradeService } from "../../../services/entities/TradeService";
import { isTradeOwnedByUser } from "../../../utils/tradeParticipants";

/**
 * Trade data interface
 */
export interface TradeData {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  participantId?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Return type for useTradesData hook
 */
export interface TradesDataHookReturn {
  trades: TradeData[] | null;
  tradesLoading: boolean;
  tradesVisibleCount: number;
  setTradesVisibleCount: (count: number) => void;
  tradeFilter: "all" | "yours";
  setTradeFilter: (filter: "all" | "yours") => void;
  isLoadingMoreTrades: boolean;
  setIsLoadingMoreTrades: (loading: boolean) => void;
  filteredTrades: TradeData[];
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing trades data
 * Handles lazy loading, filtering, and pagination
 *
 * @param targetUserId - The ID of the user whose trades to fetch
 * @param activeTab - The currently active tab
 * @param showToast - Toast notification function
 * @returns TradesDataHookReturn object with trades data and utilities
 *
 * @example
 * const { trades, filteredTrades, tradeFilter, setTradeFilter } =
 *   useTradesData(userId, activeTab, showToast);
 */
export const useTradesData = (
  targetUserId: string | undefined,
  activeTab: string,
  showToast: (message: string, type: "error" | "success" | "info") => void
): TradesDataHookReturn => {
  const [trades, setTrades] = useState<TradeData[] | null>(null);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesVisibleCount, setTradesVisibleCount] = useState(6);
  const [tradeFilter, setTradeFilter] = useState<"all" | "yours">("all");
  const [isLoadingMoreTrades, setIsLoadingMoreTrades] = useState(false);

  // Lazy fetch trades when tab is activated
  useEffect(() => {
    if (!targetUserId) return;
    if (activeTab === "trades" && trades === null && !tradesLoading) {
      setTradesLoading(true);
      tradeService
        .getActiveTradesForUser(targetUserId)
        .then((res) => {
          if (res.error) {
            showToast(res.error.message || "Failed to load trades", "error");
            setTrades([]);
          } else {
            setTrades((res.data as TradeData[]) || []);
          }
        })
        .catch(() => setTrades([]))
        .finally(() => setTradesLoading(false));
    }
  }, [activeTab, targetUserId, trades, tradesLoading, showToast]);

  // Filter trades based on filter setting
  const filteredTrades = useMemo(() => {
    if (!trades) return [] as TradeData[];
    if (tradeFilter === "yours") {
      if (!targetUserId) {
        return trades;
      }

      return trades.filter((trade) => isTradeOwnedByUser(trade, targetUserId));
    }
    return trades;
  }, [trades, tradeFilter, targetUserId]);

  const refetch = async () => {
    setTrades(null);
    setTradesVisibleCount(6);
  };

  return {
    trades,
    tradesLoading,
    tradesVisibleCount,
    setTradesVisibleCount,
    tradeFilter,
    setTradeFilter,
    isLoadingMoreTrades,
    setIsLoadingMoreTrades,
    filteredTrades,
    refetch,
  };
};
