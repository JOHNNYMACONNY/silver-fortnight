import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDailyChallenges, getWeeklyChallenges } from '../services/challenges';
import { Challenge } from '../types/gamification';
import { useBusinessMetrics } from '../contexts/PerformanceContext';

const ChallengeCalendarPage: React.FC = () => {
  const [daily, setDaily] = useState<Challenge[]>([]);
  const [weekly, setWeekly] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { track } = useBusinessMetrics();
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [d, w] = await Promise.all([
          getDailyChallenges().catch(() => ({ success: true, challenges: [] } as any)),
          getWeeklyChallenges().catch(() => ({ success: true, challenges: [] } as any)),
        ]);
        if (!mounted) return;
        const dailyItems = d?.success ? (d.challenges || []) : [];
        const weeklyItems = w?.success ? (w.challenges || []) : [];
        setDaily(dailyItems);
        setWeekly(weeklyItems);
        try { track('challenge_calendar_page_view', 1); } catch {}
        const dCount = dailyItems.length;
        const wCount = weeklyItems.length;
        setLiveMessage(`${dCount} daily and ${wCount} weekly challenges available`);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load calendar');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fmt = (ts: any) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Challenge Calendar</h1>
        <Link to="/challenges" className="text-sm text-primary hover:underline">Back to Challenges</Link>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Daily challenges reset daily; Weekly challenges run Monday–Sunday.</p>

      {loading && (
        <div className="space-y-6" aria-busy="true" aria-live="polite">
          <section>
            <h2 className="text-lg font-semibold mb-2">Daily</h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card/50">
              {[0,1,2].map((i) => (
                <li key={`d-skel-${i}`} className="p-3 flex items-center justify-between animate-pulse">
                  <div className="space-y-1">
                    <div className="h-4 w-40 bg-muted rounded" />
                    <div className="h-3 w-56 bg-muted/70 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-muted/70 rounded" />
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Weekly</h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-card/50">
              {[0,1,2].map((i) => (
                <li key={`w-skel-${i}`} className="p-3 flex items-center justify-between animate-pulse">
                  <div className="space-y-1">
                    <div className="h-4 w-44 bg-muted rounded" />
                    <div className="h-3 w-60 bg-muted/70 rounded" />
                  </div>
                  <div className="h-3 w-14 bg-muted/70 rounded" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="sr-only" aria-live="polite">{liveMessage}</div>
          {daily.length === 0 && weekly.length === 0 && (
            <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
              <div className="text-sm text-muted-foreground mb-3">No scheduled challenges right now.</div>
              <Link to="/challenges" className="inline-block text-sm text-primary hover:underline">Explore all challenges</Link>
            </div>
          )}
          <section>
            <h2 className="text-lg font-semibold mb-2">Daily</h2>
            {daily.length === 0 ? (
              <div className="text-sm text-muted-foreground">No daily challenges.</div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card/50">
                {daily.map((c) => (
                  <li key={c.id} className="p-3 flex items-center justify-between">
                    <div>
                      <Link to={`/challenges/${c.id}`} className="text-sm font-medium text-primary hover:underline">
                        {c.title || 'Daily Challenge'}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {(c as any).startDate ? `Starts ${fmt((c as any).startDate)}` : ''}
                        {(c as any).endDate ? ` • Ends ${fmt((c as any).endDate)}` : ''}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(c.rewards && typeof c.rewards.xp === 'number') ? `${c.rewards.xp} XP` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Weekly</h2>
            {weekly.length === 0 ? (
              <div className="text-sm text-muted-foreground">No weekly challenges.</div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card/50">
                {weekly.map((c) => (
                  <li key={c.id} className="p-3 flex items-center justify-between">
                    <div>
                      <Link to={`/challenges/${c.id}`} className="text-sm font-medium text-primary hover:underline">
                        {c.title || 'Weekly Challenge'}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {(c as any).startDate ? `Starts ${fmt((c as any).startDate)}` : ''}
                        {(c as any).endDate ? ` • Ends ${fmt((c as any).endDate)}` : ''}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(c.rewards && typeof c.rewards.xp === 'number') ? `${c.rewards.xp} XP` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ChallengeCalendarPage;


