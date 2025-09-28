import React, { Suspense, lazy } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '../layout/primitives/Box';
import Stack from '../layout/primitives/Stack';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateLevel, getUserXP, setGamificationNotificationCallback } from '../../services/gamification';
import { ACHIEVEMENTS } from '../../services/achievements';
import { getUserStats as getAggregatedUserStats } from '../../services/userStats';
import { ConditionType } from '../../types/gamification';



const WebGLCanvas = lazy(() => import('./WebGLCanvas'));

export type EffectsPreset = 'ribbons' | 'aurora' | 'metaballs' | 'audio';
export type EffectsBlendMode = 'screen' | 'soft-light' | 'overlay' | 'plus-lighter';

interface ThreeHeaderOverlayProps {
  preset?: EffectsPreset;
  opacity?: number; // 0.0 - 1.0
  blendMode?: EffectsBlendMode;
  className?: string;
  speed?: number;
  complexity?: number;
  brightness?: number;
  saturation?: number;
}

const brandColors = {
  primary: '#0ea5e9', // sky-500
  secondary: '#f97316', // orange-500
  accent: '#8b5cf6', // violet-500
};

function resolvePresetColors(preset: EffectsPreset) {
  // For now presets map to the same brand colors. In future, we can tune per-preset
  // parameters (e.g., speed/complexity) by extending DynamicBackground/WebGLCanvas props.
  switch (preset) {
    case 'audio':
      return brandColors;
    case 'aurora':
      return brandColors;
    case 'metaballs':
      return brandColors;
    case 'ribbons':
    default:
      return brandColors;
  }
}

export const ThreeHeaderOverlay: React.FC<ThreeHeaderOverlayProps> = ({
  preset = 'ribbons',
  opacity = 0.1,
  blendMode = 'screen',
  className,
  speed,
  complexity,
  brightness,
  saturation,
}) => {
  const colors = resolvePresetColors(preset);

  const resolvePresetParams = (
    p: EffectsPreset
  ): { speed: number; complexity: number; brightness: number; saturation: number } => {
    switch (p) {
      case 'aurora':
        return { speed: 1.0, complexity: 3.2, brightness: 1.2, saturation: 1.15 };
      case 'metaballs':
        return { speed: 0.8, complexity: 4.2, brightness: 1.15, saturation: 1.2 };
      case 'audio':
        return { speed: 1.2, complexity: 3.8, brightness: 1.2, saturation: 1.2 };
      case 'ribbons':
      default:
        return { speed: 0.9, complexity: 4.0, brightness: 1.2, saturation: 1.2 };
    }
  };
  const defaults = resolvePresetParams(preset);
  // Player panel state
  const { user } = useAuth();
  const { showToast } = useToast();
  const [totalXP, setTotalXP] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpToNext, setXpToNext] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [lastXPGain, setLastXPGain] = useState<number | null>(null);
  const [activeToday, setActiveToday] = useState<boolean>(false);
  const [nextAchievements, setNextAchievements] = useState<Array<{ id: string; title: string; delta: number }>>([]);

  const refreshXP = useMemo(() => (
    async (uid: string) => {
      const res = await getUserXP(uid);
      if (res.success && res.data) {
        const calc = calculateLevel(res.data.totalXP);
        setTotalXP(res.data.totalXP);
        setLevel(calc.currentLevel);
        setXpToNext(calc.xpToNextLevel);
        setProgressPct(calc.progressPercentage);
        // Mark active today if lastUpdated is today
        try {
          const last = (res.data as any).lastUpdated;
          if (last && typeof last.toDate === 'function') {
            const d: Date = last.toDate();

            const now = new Date();
            const sameDay = d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth() && d.getUTCDate() === now.getUTCDate();
            setActiveToday(sameDay);
          }
        } catch {}
      }
    }
  ), []);

  useEffect(() => {
    if (!user) return;
    refreshXP(user.uid);
  }, [user, refreshXP]);

  // Compute next achievements (closest to unlock)
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const stats = await getAggregatedUserStats(user.uid);
        const candidates = ACHIEVEMENTS.map(a => {
          let minDelta = Infinity;
          for (const c of a.unlockConditions) {
            let current = 0;
            if (c.type === ConditionType.TRADE_COUNT) current = stats.tradeCount ?? 0;
            else if (c.type === ConditionType.ROLE_COUNT) current = stats.roleCount ?? 0;
            else if (c.type === ConditionType.XP_TOTAL) current = stats.totalXP ?? 0;
            else if (c.type === ConditionType.QUICK_RESPONSES) current = stats.quickResponses ?? 0;
            else if (c.type === ConditionType.EVIDENCE_COUNT) current = stats.evidenceCount ?? 0;
            const delta = Math.max(0, (c.target as number) - current);
            minDelta = Math.min(minDelta, delta);
          }
          return { id: a.id, title: a.title, delta: minDelta };
        })
          .filter(x => x.delta > 0)
          .sort((a, b) => a.delta - b.delta)
          .slice(0, 2);
        setNextAchievements(candidates);
      } catch (e) {
        // non-blocking
      }
    })();
  }, [user]);

  // Real-time gamification notifications → toasts + XP animation
  useEffect(() => {
    if (!user) return;
    const handler = (n: any) => {
      if (!n) return;
      if (n.type === 'achievement_unlock') {
        showToast(`Achievement unlocked: ${n.achievementTitle} (+${n.xpReward} XP)`, 'success');
        // Refresh suggestions after unlock
        setNextAchievements(prev => prev.filter(a => a.id !== n.achievementId));
      } else if (n.type === 'xp_gain') {
        setLastXPGain(n.amount || 0);
        setActiveToday(true);
        // optimistic update
        setTotalXP(prev => {
          const newXP = (prev || 0) + (n.amount || 0);
          const calc = calculateLevel(newXP);
          setLevel(calc.currentLevel);
          setXpToNext(calc.xpToNextLevel);
          setProgressPct(calc.progressPercentage);
          return newXP;
        });
        // clear animation value after delay
        setTimeout(() => setLastXPGain(null), 1500);
      }
    };
    setGamificationNotificationCallback(handler);
    return () => {
      // Replace with no-op to avoid leaking previous handler
      setGamificationNotificationCallback((() => {}) as any);
    };
  }, [user, showToast]);


  return (
    <>
      <div
        className={['pointer-events-none', 'w-full h-full', className || ''].join(' ')}
        aria-hidden
      >
        <div
          className="w-full h-full"
          style={{
            mixBlendMode: blendMode as React.CSSProperties['mixBlendMode'],
            opacity
          }}
        >
          <WebGLCanvas
            colors={colors}
            className="w-full h-full"
            transparent
            speed={typeof speed === 'number' ? speed : defaults.speed}
            complexity={typeof complexity === 'number' ? complexity : defaults.complexity}
            brightness={typeof brightness === 'number' ? brightness : defaults.brightness}
            saturation={typeof saturation === 'number' ? saturation : defaults.saturation}
            preset={preset}
            intensity={Math.max(0, Math.min(1, opacity / 0.3))}
          />
        </div>
      </div>

      {user && (
        <>
          <AnimatePresence>
            {lastXPGain != null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="fixed top-2 right-4 z-[60] pointer-events-none text-sm font-semibold text-primary-500 drop-shadow"
              >
                +{lastXPGain} XP
              </motion.div>
            )}
          </AnimatePresence>

          <Box className="fixed top-6 right-4 z-[50] pointer-events-auto">
            <Box className="bg-card/80 backdrop-blur rounded-xl border border-border shadow-md p-3 min-w-[220px]">
              <Stack gap="sm" className="text-foreground">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Level</span>
                  <span className="text-sm font-semibold">{level}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${Math.round(progressPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">XP to next</span>
                  <span className="font-medium">{xpToNext}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${activeToday ? 'bg-green-500/15 text-green-600 border border-green-500/30' : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'}`}>
                    {activeToday ? 'Active today' : 'At risk'}
                  </span>
                </div>

                {nextAchievements.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground mb-1">Next achievements</div>
                    <div className="space-y-1">
                      {nextAchievements.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs">
                          <span className="truncate max-w-[140px]">{a.title}</span>
                          <span className="text-muted-foreground">{a.delta} left</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </>
  );
};

export default ThreeHeaderOverlay;


