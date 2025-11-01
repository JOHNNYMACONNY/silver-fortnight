import React from "react";
import { Button } from "../../../components/ui/Button";
import TradeCard from "../../../components/features/trades/TradeCard";

interface TradesTabProps {
  // Data
  trades: any[] | null;
  tradesLoading: boolean;
  filteredTrades: any[];

  // Pagination
  tradesVisibleCount: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;

  // Filter
  tradeFilter: "all" | "yours";
  onFilterChange: (filter: "all" | "yours") => void;

  // Navigation
  onNavigate: (path: string) => void;

  // Refs
  sentinelRef: React.RefObject<HTMLDivElement>;
}

const TradesTabComponent: React.FC<TradesTabProps> = ({
  trades,
  tradesLoading,
  filteredTrades,
  tradesVisibleCount,
  onLoadMore,
  isLoadingMore,
  tradeFilter,
  onFilterChange,
  onNavigate,
  sentinelRef,
}) => {
  if (tradesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">No active trades.</p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => onNavigate("/trades")}>
            Browse trades
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          <span className="hidden sm:inline">Showing </span>
          {Math.min(tradesVisibleCount, filteredTrades.length)} of{" "}
          {filteredTrades.length}
          <span className="sm:hidden"> trades</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-sm text-muted-foreground hidden sm:inline">
            Show:
          </label>
          <select
            className="w-full sm:w-auto rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 text-foreground text-sm px-3 py-2 outline-hidden focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            value={tradeFilter}
            onChange={(e) => {
              onFilterChange(e.target.value as "all" | "yours");
            }}
          >
            <option value="all">All trades</option>
            <option value="yours">Created by me</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredTrades.slice(0, tradesVisibleCount).map((t) => (
          <TradeCard key={t.id} trade={t as any} showStatus={true} />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 mt-4">
        {filteredTrades && tradesVisibleCount < filteredTrades.length && (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            aria-busy={isLoadingMore}
            aria-controls="profile-trades-list"
            aria-label={`Load more trades. Currently showing ${tradesVisibleCount} of ${filteredTrades.length}`}
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        )}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {isLoadingMore
            ? `Loading more trades. Currently showing ${tradesVisibleCount} of ${filteredTrades.length}`
            : ""}
        </span>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onNavigate("/trades")}
          aria-label={`View all ${filteredTrades?.length || 0} trades`}
        >
          View all trades
        </Button>
      </div>
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </>
  );
};

export const TradesTab = React.memo(TradesTabComponent);
