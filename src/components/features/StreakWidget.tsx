import React, { useEffect, useState } from 'react';
import { Flame, Clock, Info } from 'lucide-react';
import { getSyncFirebaseDb } from '../../firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import { StreakType, UserStreak, XP_VALUES } from '../../types/gamification';
import { getStreakMilestoneThresholds } from '../../services/streakConfig';
import { Tooltip } from '../ui/Tooltip';

interface StreakWidgetProps {
  userId: string;
  type?: StreakType; // default 'login'
  className?: string;
}

export const StreakWidget: React.FC<StreakWidgetProps> = ({ userId, type = 'login', className }) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const db = getSyncFirebaseDb();
        const ref = doc(db, 'userStreaks', `${userId}_${type}`);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          setStreak(snap.data() as UserStreak);
        } else {
          setStreak(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId, type]);

  const nextMilestone = (() => {
    const thresholds = getStreakMilestoneThresholds();
    if (!streak) return thresholds[0];
    const future = thresholds.find((m) => m > streak.currentStreak);
    return future ?? thresholds[thresholds.length - 1];
  })();

  const daysToNext = streak ? Math.max(0, nextMilestone - streak.currentStreak) : nextMilestone;
  const thresholds = getStreakMilestoneThresholds();
  const xpBonus = XP_VALUES.CHALLENGE_STREAK_BONUS;
  const typeLabel = type === 'login' ? 'Login' : type === 'challenge' ? 'Challenge' : 'Skill Practice';
  const freezeUsedToday = (() => {
    if (!streak?.lastFreezeAt) return false;
    const last = streak.lastFreezeAt.toDate();
    const now = new Date();
    return (
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate()
    );
  })();

  if (loading) {
    return (
      <div className={"bg-card text-card-foreground rounded-lg border border-border p-4 " + (className || '')}>
        <div className="animate-pulse h-6 bg-muted rounded w-32" />
      </div>
    );
  }

  return (
    <div className={"bg-card text-card-foreground rounded-lg border border-border p-4 " + (className || '')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <span className="font-semibold">{typeLabel} Streak</span>
          <Tooltip
            content={
              <div>
                Keep a daily {typeLabel.toLowerCase()} streak to earn milestone bonuses. Thresholds: {thresholds.join(', ')} days. You have 1 freeze to cover a single-day miss.
              </div>
            }
          >
            <button aria-label="Streak info" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <Info className="w-4 h-4" />
            </button>
          </Tooltip>
          {freezeUsedToday && (
            <Tooltip content="A freeze was used today to protect your streak.">
              <span className="ml-1 inline-flex items-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] border border-amber-500/30">
                Freeze used
              </span>
            </Tooltip>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{streak?.lastActivity ? new Date(streak.lastActivity.toDate()).toLocaleDateString() : '—'}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Tooltip content={`Each consecutive day increases your ${typeLabel.toLowerCase()} streak. A single missed day is auto-frozen if available; otherwise, it resets to 1.`}>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{streak?.currentStreak ?? 0}</div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
        </Tooltip>
        <Tooltip content={`Your best ${typeLabel.toLowerCase()} streak so far.`}>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{streak?.longestStreak ?? 0}</div>
            <div className="text-xs text-muted-foreground">Longest</div>
          </div>
        </Tooltip>
        <Tooltip content={`Reach ${nextMilestone} days to earn +${xpBonus} XP bonus. Thresholds: ${thresholds.join(', ')}.`}>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{nextMilestone}</div>
            <div className="text-xs text-muted-foreground">Next Milestone</div>
          </div>
        </Tooltip>
        <div className="col-span-3 text-center text-xs text-muted-foreground mt-2">
          {daysToNext > 0 ? (
            <span>{daysToNext} day{daysToNext === 1 ? '' : 's'} to next milestone (+{xpBonus} XP)</span>
          ) : (
            <span>Milestone reached! (+{xpBonus} XP)</span>
          )}
        </div>
        {streak && (
          <div className="col-span-3 text-center text-xs text-muted-foreground">
            Freezes used: {streak.freezesUsed ?? 0} / {streak.maxFreezes ?? 1}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakWidget;


