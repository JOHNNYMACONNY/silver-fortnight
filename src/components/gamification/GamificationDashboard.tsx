import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../AuthContext';
import { getUserXP, getUserXPHistory } from '../../services/gamification';
import { getUserAchievements, ACHIEVEMENTS } from '../../services/achievements';
import { UserXP, XPTransaction, Achievement, UserAchievement } from '../../types/gamification';
import XPDisplay from './XPDisplay';
import LevelBadge from './LevelBadge';
import AchievementBadge from './AchievementBadge';

interface GamificationDashboardProps {
  userId?: string;
  className?: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userId,
  className = ''
}) => {
  const { currentUser } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [xpHistory, setXPHistory] = useState<XPTransaction[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'history'>('overview');

  const targetUserId = userId || currentUser?.uid;

  useEffect(() => {
    const fetchGamificationData = async () => {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all gamification data in parallel
        const [xpResult, historyResult, achievementsResult] = await Promise.all([
          getUserXP(targetUserId),
          getUserXPHistory(targetUserId, 10),
          getUserAchievements(targetUserId)
        ]);

        if (xpResult.success && xpResult.data) {
          setUserXP(xpResult.data);
        }

        if (historyResult.success && historyResult.data) {
          setXPHistory(historyResult.data);
        }

        if (achievementsResult.success && achievementsResult.data) {
          setUserAchievements(achievementsResult.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load gamification data');
      } finally {
        setLoading(false);
      }
    };

    fetchGamificationData();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  if (error || !userXP) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-muted-foreground">
          {error || 'Gamification data unavailable'}
        </div>
      </div>
    );
  }

  const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
  const recentXP = xpHistory.slice(0, 5);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* XP Overview */}
      <XPDisplay userId={targetUserId} showProgress={true} showLevel={true} />

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'achievements', label: 'Achievements' },
          { id: 'history', label: 'XP History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-card text-card-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Achievements */}
            <div className="bg-card text-card-foreground rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Recent Achievements
              </h3>
              {userAchievements.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {userAchievements.slice(0, 6).map((userAchievement) => {
                    const achievement = ACHIEVEMENTS.find(a => a.id === userAchievement.achievementId);
                    if (!achievement) return null;
                    
                    return (
                      <AchievementBadge
                        key={userAchievement.id}
                        achievement={achievement}
                        unlocked={true}
                        size="medium"
                        showTooltip={true}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No achievements unlocked yet. Complete trades and collaborations to earn your first achievements!
                </p>
              )}
            </div>

            {/* Recent XP Activity */}
            <div className="bg-card text-card-foreground rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                Recent Activity
              </h3>
              {recentXP.length > 0 ? (
                <div className="space-y-3">
                  {recentXP.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.createdAt.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          +{transaction.amount} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No recent activity. Start trading or collaborating to earn XP!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-card text-card-foreground rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              All Achievements ({userAchievements.length}/{ACHIEVEMENTS.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedAchievementIds.has(achievement.id);
                
                return (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={isUnlocked}
                    size="large"
                    showTooltip={true}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-card text-card-foreground rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              XP History
            </h3>
            {xpHistory.length > 0 ? (
              <div className="space-y-3">
                {xpHistory.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.createdAt.toDate().toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Source: {transaction.source.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        +{transaction.amount}
                      </span>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No XP history available.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GamificationDashboard;
