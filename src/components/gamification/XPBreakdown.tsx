import React, { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { getUserXPHistory } from "../../services/gamification";
import { XPTransaction, XPSource } from "../../types/gamification";
import { XP_SOURCE_DISPLAY_CONFIG } from "../../types/gamificationNotifications";
import { normalizeTransactionDate } from "./utils/transactionDates";

interface XPBreakdownProps {
  userId: string;
  days?: number; // default 30
  className?: string;
}

export const XPBreakdown: React.FC<XPBreakdownProps> = ({
  userId,
  days = 30,
  className,
}) => {
  const [history, setHistory] = useState<XPTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch enough entries to cover the window
        const res = await getUserXPHistory(userId, 500);
        if (!mounted) return;
        setHistory(res.success ? res.data || [] : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const breakdown = useMemo(() => {
    if (!history) return [] as Array<{ source: XPSource; total: number }>;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);
    const recent = history.filter((t) => {
      const date = normalizeTransactionDate(t.createdAt);
      return date ? date >= cutoff : false;
    });
    const totals = new Map<XPSource, number>();
    for (const tx of recent) {
      const sum = totals.get(tx.source as XPSource) || 0;
      totals.set(tx.source as XPSource, sum + (tx.amount || 0));
    }
    return Array.from(totals.entries())
      .map(([source, total]) => ({ source, total }))
      .sort((a, b) => b.total - a.total);
  }, [history, days]);

  if (loading) {
    return (
      <div
        className={
          "bg-card text-card-foreground rounded-lg border border-border p-4 " +
          (className || "")
        }
      >
        <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!breakdown.length) {
    return (
      <div
        className={
          "bg-card text-card-foreground rounded-lg border border-border p-4 " +
          (className || "")
        }
      >
        <div className="text-sm text-muted-foreground">
          No XP earned in the last {days} days.
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "bg-card text-card-foreground rounded-lg border border-border p-4 " +
        (className || "")
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          How you earned XP (last {days} days)
        </div>
      </div>
      <ul className="text-sm divide-y divide-border">
        {breakdown.map(({ source, total }) => {
          const cfg =
            XP_SOURCE_DISPLAY_CONFIG[source] ||
            ({
              displayName: source.replace(/_/g, " "),
              icon: Sparkles,
              color: "",
            } as any);
          return (
            <li key={source} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden>
                  <cfg.icon className="w-4 h-4" />
                </span>
                <span className="text-muted-foreground">{cfg.displayName}</span>
              </div>
              <div className="font-semibold">+{total}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default XPBreakdown;
