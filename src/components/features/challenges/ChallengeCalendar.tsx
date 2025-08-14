import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Challenge } from '../../../types/gamification';
import { getDailyChallenges, getWeeklyChallenges } from '../../../services/challenges';
import { useBusinessMetrics } from '../../../contexts/PerformanceContext';

interface ChallengeCalendarProps {
  className?: string;
}

/**
 * Minimal daily/weekly challenge strip for quick discovery.
 * Progressive disclosure: compact, no heavy chrome.
 */
export const ChallengeCalendar: React.FC<ChallengeCalendarProps> = ({ className = '' }) => {
  const [daily, setDaily] = useState<Challenge[]>([]);
  const [weekly, setWeekly] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { track } = useBusinessMetrics();
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [d, w] = await Promise.all([
          getDailyChallenges().catch(() => ({ success: true, challenges: [] } as any)),
          getWeeklyChallenges().catch(() => ({ success: true, challenges: [] } as any)),
        ]);
        if (!mounted) return;
        const dailyItems = d?.success ? (d.challenges || []) : [];
        const weeklyItems = w?.success ? (w.challenges || []) : [];
        setDaily(dailyItems);
        setWeekly(weeklyItems);
        try { track('challenge_calendar_strip_view', 1); } catch {}
        setLiveMessage(`${dailyItems.length} daily and ${weeklyItems.length} weekly challenges available`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className={`rounded-lg border border-border bg-card/50 p-3 ${className}`} aria-busy="true" aria-live="polite">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (daily.length === 0 && weekly.length === 0) return null;

  return (
    <div className={`rounded-lg border border-border bg-card/50 p-3 ${className}`} role="region" aria-label="Challenge Calendar">
      <div className="sr-only" aria-live="polite">{liveMessage}</div>
      <div className="flex items-center justify-between mb-2">
        <div id="challenge-calendar-strip-title" className="text-sm font-medium text-foreground">Challenge Calendar</div>
        <Link
          to="/challenges/calendar"
          className="text-xs text-primary hover:underline"
          aria-label="View all scheduled challenges"
          onClick={() => { try { track('challenge_calendar_view_all_click', 1); } catch {} }}
        >
          View all
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {daily.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Daily:</span>
            <div className="flex items-center gap-2">
              {daily.slice(0, 8).map((c) => (
                <Link key={c.id} to={`/challenges/${c.id}`} className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted whitespace-nowrap">
                  {c.title || 'Daily Challenge'}
                </Link>
              ))}
            </div>
          </div>
        )}
        {weekly.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Weekly:</span>
            <div className="flex items-center gap-2">
              {weekly.slice(0, 8).map((c) => (
                <Link key={c.id} to={`/challenges/${c.id}`} className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted whitespace-nowrap">
                  {c.title || 'Weekly Challenge'}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeCalendar;


