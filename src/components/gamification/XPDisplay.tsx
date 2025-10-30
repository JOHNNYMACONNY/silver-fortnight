import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getUserXP, calculateLevel } from '../../services/gamification';
import { UserXP, LevelCalculationResult } from '../../types/gamification';
import { useAuth } from '../../AuthContext';
import AnimatedXPBar from './notifications/AnimatedXPBar';
import { Flame, Check } from 'lucide-react';

interface XPDisplayProps {
  userId?: string;
  showProgress?: boolean;
  showLevel?: boolean;
  compact?: boolean;
  className?: string;
}

export const XPDisplay: React.FC<XPDisplayProps> = ({
  userId,
  showProgress = true,
  showLevel = true,
  compact = false,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || currentUser?.uid;

  useEffect(() => {
    const fetchUserXP = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { success, data, error: fetchError } = await getUserXP(targetUserId);
        
        if (success && data) {
          setUserXP(data);
          const levelCalc = calculateLevel(data.totalXP);
          setLevelInfo(levelCalc);
        } else {
          setError(fetchError || 'Failed to load XP data');
        }
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to load XP data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserXP();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${compact ? 'h-6' : 'h-12'} bg-muted rounded ${className}`} />
    );
  }

  if (error || !userXP || !levelInfo) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        {error || 'XP data unavailable'}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLevel && (
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Lv.{levelInfo.currentLevel}
            </span>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          {userXP.totalXP.toLocaleString()} XP
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showLevel && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Level {levelInfo.currentLevel}
              </h3>
              <p className="text-sm text-muted-foreground">
                {levelInfo.currentLevelTier.title}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {userXP.totalXP.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total XP
            </div>
          </div>
        </div>
      )}

      {showProgress && (
        <AnimatedXPBar
          currentXP={userXP.totalXP - levelInfo.currentLevelTier.minXP}
          maxXP={levelInfo.currentLevelTier.maxXP - levelInfo.currentLevelTier.minXP}
          level={levelInfo.currentLevel}
          showLabels={true}
          showAnimation={true}
          size="medium"
          className="mt-3"
        />
      )}

      {/* Level Benefits */}
      {showLevel && levelInfo.currentLevelTier.benefits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Level Benefits:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            {levelInfo.currentLevelTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default XPDisplay;
