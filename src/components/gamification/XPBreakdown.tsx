import React, { useEffect, useMemo, useState } from 'react';
import { getUserXPHistory } from '../../services/gamification';
import { XPTransaction, XPSource } from '../../types/gamification';
import { XP_SOURCE_DISPLAY_CONFIG } from '../../types/gamificationNotifications';

interface XPBreakdownProps {
  userId: string;
  days?: number; // default 30
  className?: string;
}

export const XPBreakdown: React.FC<XPBreakdownProps> = ({ userId, days = 30, className }) => {
  const [history, setHistory] = useState<XPTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeDate = (value: XPTransaction['createdAt']): Date => {
    if (!value) return new Date(0);
    if (typeof (value as any).toDate === 'function') {
      try {
        return (value as any).toDate();
      } catch {}
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value as any);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch enough entries to cover the window
        const res = await getUserXPHistory(userId, 500);
        if (!mounted) return;
        setHistory(res.success ? (res.data || []) : []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const breakdown = useMemo(() => {
    if (!history) return [] as Array<{ source: XPSource; total: number }>;
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - days);
    const recent = history.filter((t) => normalizeDate(t.createdAt) >= cutoff);
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
      <div className={"bg-card text-card-foreground rounded-lg border border-border p-4 " + (className || '')}>
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
      <div className={"bg-card text-card-foreground rounded-lg border border-border p-4 " + (className || '')}>
        <div className="text-sm text-muted-foreground">No XP earned in the last {days} days.</div>
      </div>
    );
  }

  return (
    <div className={"bg-card text-card-foreground rounded-lg border border-border p-4 " + (className || '')}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">How you earned XP (last {days} days)</div>
      </div>
      <ul className="text-sm divide-y divide-border">
        {breakdown.map(({ source, total }) => {
          const cfg = XP_SOURCE_DISPLAY_CONFIG[source] || { displayName: source.replace(/_/g, ' '), icon: '✨', color: '' } as any;
          return (
            <li key={source} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden>{cfg.icon}</span>
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


