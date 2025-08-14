import React, { useEffect, useState } from 'react';
import { getSyncFirebaseDb } from '../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { StreakType, UserStreak, XP_VALUES } from '../../types/gamification';
import { getStreakMilestoneThresholds } from '../../services/streakConfig';

interface StreakUpcomingMilestonesProps {
  userId: string;
  type: StreakType;
  className?: string;
}

export const StreakUpcomingMilestones: React.FC<StreakUpcomingMilestonesProps> = ({ userId, type, className }) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = getSyncFirebaseDb();
        const ref = doc(db, 'userStreaks', `${userId}_${type}`);
        const snap = await getDoc(ref);
        if (!mounted) return;
        setStreak(snap.exists() ? (snap.data() as UserStreak) : null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, type]);

  const thresholds = getStreakMilestoneThresholds();
  const current = streak?.currentStreak ?? 0;
  const upcoming = thresholds.filter((t) => t > current).slice(0, 2);
  const typeLabel = type === 'login' ? 'Login' : type === 'challenge' ? 'Challenge' : 'Skill Practice';

  if (loading) {
    return (
      <div className={"bg-muted/40 rounded-md p-3 border border-border " + (className || '')}>
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={"bg-muted/40 rounded-md p-3 border border-border " + (className || '')}>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full text-left text-sm font-medium flex items-center justify-between"
      >
        <span>{typeLabel} Upcoming Milestones</span>
        <span className="text-xs text-muted-foreground">{collapsed ? 'Show' : 'Hide'}</span>
      </button>
      {!collapsed && (
        <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-1">
          {upcoming.length === 0 ? (
            <li>All milestones reached for now.</li>
          ) : (
            upcoming.map((m) => (
              <li key={m}>Reach {m} days to earn +{XP_VALUES.CHALLENGE_STREAK_BONUS} XP</li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default StreakUpcomingMilestones;


