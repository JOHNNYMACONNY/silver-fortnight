import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUserXPHistory } from "../../services/gamification";
import { XPTransaction } from "../../types/gamification";
import { useBusinessMetrics } from "../../contexts/PerformanceContext";
import { useToast } from "../../contexts/ToastContext";
import { useGamificationNotifications } from "../../contexts/GamificationNotificationContext";
import { normalizeTransactionDate } from "./utils/transactionDates";
import { Target, Edit3, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface WeeklyXPGoalProps {
  userId: string;
  target?: number; // default 500 XP/week
  className?: string;
}

export const WeeklyXPGoal: React.FC<WeeklyXPGoalProps> = ({
  userId,
  target = 500,
  className,
}) => {
  const [history, setHistory] = useState<XPTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalMetPersisted, setGoalMetPersisted] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState<number>(target);
  const [tipsEnabled, setTipsEnabled] = useState<boolean>(false);
  const { track } = useBusinessMetrics();
  const { addToast } = useToast();
  const { preferences } = useGamificationNotifications();
  const prevPercentRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getUserXPHistory(userId, 200);
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

  const { weekXP, percent } = useMemo(() => {
    if (!history) return { weekXP: 0, percent: 0 };
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekTransactions = history.filter((t) => {
      const date = normalizeTransactionDate(t.createdAt);
      return date ? date >= weekAgo : false;
    });
    const weekXP = weekTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const activeTarget = Math.max(
      100,
      Math.min(5000, Number.isFinite(targetValue) ? targetValue : target)
    );
    const percent = Math.min(100, Math.round((weekXP / activeTarget) * 100));
    return { weekXP, percent };
  }, [history, targetValue, target]);
  const goalMet = percent >= 100;

  // Compute a stable week key (YYYY-WW) based on ISO-ish week number
  const weekKey = useMemo(() => {
    const d = new Date();
    // Copy date so we don't mutate
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Thursday in current week decides the year.
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      (((date as any) - (yearStart as any)) / 86400000 + 1) / 7
    );
    return `${date.getUTCFullYear()}-W${weekNo}`;
  }, []);

  // Load persisted flag for this week
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const v = window.localStorage.getItem(
          `xp-week-goal-${userId}-${weekKey}`
        );
        setGoalMetPersisted(v === "1");
      }
    } catch {}
  }, [userId, weekKey]);

  // Persist when goal first met
  useEffect(() => {
    try {
      if (goalMet && typeof window !== "undefined" && !goalMetPersisted) {
        window.localStorage.setItem(`xp-week-goal-${userId}-${weekKey}`, "1");
        setGoalMetPersisted(true);
      }
    } catch {}
  }, [goalMet, goalMetPersisted, userId, weekKey]);

  // Load user target and tips toggle from localStorage on mount/user change
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && userId) {
        const t = window.localStorage.getItem(
          `weekly-xp-goal-target-${userId}`
        );
        const parsed = t ? parseInt(t, 10) : NaN;
        if (!Number.isNaN(parsed)) {
          setTargetValue(Math.max(100, Math.min(5000, parsed)));
        } else {
          setTargetValue(target);
        }
        const tips = window.localStorage.getItem(
          `weekly-xp-goal-tips-${userId}`
        );
        setTipsEnabled(tips === "1");
      }
    } catch {
      setTargetValue(target);
      setTipsEnabled(false);
    }
  }, [userId, target]);

  // Analytics: fire once per week on crossing to >=100%
  useEffect(() => {
    try {
      const prev = prevPercentRef.current;
      prevPercentRef.current = percent;
      if (typeof window === "undefined") return;
      const analyticsKey = `xp-week-goal-analytics-${userId}-${weekKey}`;
      const fired = window.localStorage.getItem(analyticsKey) === "1";
      if (!fired && prev < 100 && percent >= 100) {
        try {
          track("weekly_goal_met", { weekKey, target: targetValue, weekXP });
        } catch {}
        window.localStorage.setItem(analyticsKey, "1");
        // Lightweight reward: toast only (respects reduced motion by avoiding animations)
        if (preferences.weeklyGoalMetToasts !== false) {
          try {
            addToast("success", "Weekly goal met! Great job.");
          } catch {}
        }
      }
    } catch {}
  }, [
    percent,
    track,
    weekKey,
    userId,
    targetValue,
    weekXP,
    addToast,
    preferences.weeklyGoalMetToasts,
  ]);

  if (loading) {
    return (
      <div
        className={
          "glassmorphic rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md p-6 " +
          (className || "")
        }
      >
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
        <div className="mt-3 h-2 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={
        "glassmorphic rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md p-6 " +
        (className || "")
      }
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-sm font-medium flex items-center gap-2">
            <span className="text-foreground">Weekly XP Goal</span>
            {(goalMet || goalMetPersisted) && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-500 px-2 py-0.5 text-[10px] font-semibold border border-emerald-500/30">
                Goal met
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Target: {Math.max(100, Math.min(5000, targetValue))}</span>
          {!editingTarget ? (
            <button
              type="button"
              className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={() => setEditingTarget(true)}
              aria-label="Edit weekly XP target"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={100}
                max={5000}
                step={50}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="h-7 w-20 rounded-lg border border-border/50 bg-muted/30 px-2 text-foreground text-xs focus:ring-2 focus:ring-primary/50 outline-hidden"
                aria-label="Weekly XP target"
              />
              <button
                type="button"
                className="p-1 text-green-500 hover:text-green-400 transition-colors"
                onClick={() => {
                  const clamped = Math.max(
                    100,
                    Math.min(5000, Number(targetValue) || target)
                  );
                  setTargetValue(clamped);
                  try {
                    if (typeof window !== "undefined")
                      window.localStorage.setItem(
                        `weekly-xp-goal-target-${userId}`,
                        String(clamped)
                      );
                  } catch {}
                  setEditingTarget(false);
                }}
                aria-label="Save target"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setEditingTarget(false);
                  // revert to persisted or prop
                  try {
                    const t =
                      typeof window !== "undefined"
                        ? window.localStorage.getItem(
                            `weekly-xp-goal-target-${userId}`
                          )
                        : null;
                    const parsed = t ? parseInt(t, 10) : NaN;
                    setTargetValue(Number.isNaN(parsed) ? target : parsed);
                  } catch {
                    setTargetValue(target);
                  }
                }}
                aria-label="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground">{weekXP} XP</div>
      <div className="mt-3 h-2.5 w-full bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-muted-foreground font-medium">
        {percent}% of weekly goal
      </div>
      {!(goalMet || goalMetPersisted) && (
        <div className="mt-4 pt-3 border-t border-border/50">
          {!tipsEnabled ? (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={() => {
                setTipsEnabled(true);
                try {
                  if (typeof window !== "undefined")
                    window.localStorage.setItem(
                      `weekly-xp-goal-tips-${userId}`,
                      "1"
                    );
                } catch {}
              }}
            >
              <ChevronDown className="w-3 h-3" />
              <span>Show tips to reach your goal</span>
            </button>
          ) : (
            <div>
              <ul className="text-xs text-muted-foreground space-y-2 mb-2">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Complete a challenge for base + bonus XP</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Log a quick practice to grow your skill streak</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Finish a trade to earn a larger XP boost</span>
                </li>
              </ul>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                onClick={() => {
                  setTipsEnabled(false);
                  try {
                    if (typeof window !== "undefined")
                      window.localStorage.setItem(
                        `weekly-xp-goal-tips-${userId}`,
                        "0"
                      );
                  } catch {}
                }}
              >
                <ChevronUp className="w-3 h-3" />
                <span>Hide tips</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyXPGoal;
