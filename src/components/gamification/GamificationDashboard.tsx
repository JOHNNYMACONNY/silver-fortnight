import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../AuthContext";
import { getUserXP, getUserXPHistory } from "../../services/gamification";
import { getUserAchievements, ACHIEVEMENTS } from "../../services/achievements";
import {
  UserXP,
  XPTransaction,
  Achievement,
  UserAchievement,
} from "../../types/gamification";
import XPDisplay from "./XPDisplay";
import { WeeklyXPGoal } from "./WeeklyXPGoal";
import { XPBreakdown } from "./XPBreakdown";
import LevelBadge from "./LevelBadge";
import AchievementBadge from "./AchievementBadge";
import { StreakWidget } from "../features/StreakWidget";
import { StreakUpcomingMilestones } from "../features/StreakUpcomingMilestones";
import { markSkillPracticeDay } from "../../services/streaks";
import { useToast } from "../../contexts/ToastContext";
import { formatTransactionDate } from "./utils/transactionDates";
import { Flame, Target, Zap, Trophy, TrendingUp, ChevronRight, Activity } from "lucide-react";

interface GamificationDashboardProps {
  userId?: string;
  className?: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userId,
  className = "",
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [xpHistory, setXPHistory] = useState<XPTransaction[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "achievements" | "history"
  >("overview");
  const [showBreakdown, setShowBreakdown] = useState(false);

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
        const [xpResult, historyResult, achievementsResult] = await Promise.all(
          [
            getUserXP(targetUserId),
            getUserXPHistory(targetUserId, 10),
            getUserAchievements(targetUserId),
          ]
        );

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
        setError(err.message || "Failed to load gamification data");
      } finally {
        setLoading(false);
      }
    };

    // Load persisted XP breakdown visibility
    try {
      if (typeof window !== "undefined" && targetUserId) {
        const v = window.localStorage.getItem(
          `xp-breakdown-visible-${targetUserId}`
        );
        if (v === "1") setShowBreakdown(true);
      }
    } catch {}

    fetchGamificationData();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-32 bg-white/10 rounded-xl glassmorphic border-glass backdrop-blur-xl" />
        <div className="h-48 bg-white/10 rounded-xl glassmorphic border-glass backdrop-blur-xl" />
      </div>
    );
  }

  if (error || !userXP) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-muted-foreground">
          {error || "Gamification data unavailable"}
        </div>
      </div>
    );
  }

  const unlockedAchievementIds = new Set(
    userAchievements.map((ua) => ua.achievementId)
  );
  const recentXP = xpHistory.slice(0, 5);

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* XP Overview */}
      <XPDisplay userId={targetUserId} showProgress={true} showLevel={true} />
      {targetUserId && (
        <div className="w-full space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <WeeklyXPGoal userId={targetUserId} />
            {showBreakdown ? (
              <XPBreakdown userId={targetUserId} />
            ) : (
              <div className="glassmorphic rounded-xl p-4 flex items-center justify-between border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span>See where your XP came from</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                  onClick={() => {
                    setShowBreakdown(true);
                    try {
                      if (typeof window !== "undefined" && targetUserId)
                        window.localStorage.setItem(
                          `xp-breakdown-visible-${targetUserId}`,
                          "1"
                        );
                    } catch {}
                  }}
                >
                  <span>See breakdown</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {showBreakdown && (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  setShowBreakdown(false);
                  try {
                    if (typeof window !== "undefined" && targetUserId)
                      window.localStorage.setItem(
                        `xp-breakdown-visible-${targetUserId}`,
                        "0"
                      );
                  } catch {}
                }}
              >
                Hide breakdown
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1 glassmorphic rounded-xl p-1 border border-border/50 backdrop-blur-md">
        {[
          { id: "overview", label: "Overview" },
          { id: "achievements", label: "Achievements" },
          { id: "history", label: "XP History & Streak Details" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
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
        {activeTab === "overview" && (
          <div className="w-full space-y-6">
            {/* Streaks Summary */}
            <div className="glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Streaks
                  </h3>
                </div>
                {targetUserId && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    aria-label="View streak details"
                  >
                    <span>View details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {targetUserId && (
                  <>
                    <StreakWidget userId={targetUserId} type="login" />
                    <StreakWidget userId={targetUserId} type="challenge" />
                    <StreakWidget userId={targetUserId} type="skill_practice" />
                  </>
                )}
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Achievements
                </h3>
              </div>
              {userAchievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userAchievements.slice(0, 6).map((userAchievement) => {
                    const achievement = ACHIEVEMENTS.find(
                      (a) => a.id === userAchievement.achievementId
                    );
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
                <p className="text-sm text-muted-foreground">
                  No achievements unlocked yet. Complete trades and
                  collaborations to earn your first achievements!
                </p>
              )}
            </div>

            {/* Recent XP Activity */}
            <div className="glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Recent Activity
                </h3>
              </div>
              {recentXP.length > 0 ? (
                <div className="space-y-2">
                  {recentXP.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTransactionDate(transaction.createdAt)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <span className="text-sm font-semibold text-green-500">
                          +{transaction.amount} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent activity. Start trading or collaborating to earn XP!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                All Achievements ({userAchievements.length}/{ACHIEVEMENTS.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {activeTab === "history" && (
          <div className="w-full space-y-6">
            {/* Streak Details */}
            {targetUserId && (
              <div className="glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground">
                    Streak Details
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-3">
                    <StreakWidget userId={targetUserId} type="login" />
                    <StreakUpcomingMilestones
                      userId={targetUserId}
                      type="login"
                    />
                  </div>
                  <div className="space-y-3">
                    <StreakWidget userId={targetUserId} type="challenge" />
                    <StreakUpcomingMilestones
                      userId={targetUserId}
                      type="challenge"
                    />
                  </div>
                  <div className="space-y-3">
                    <StreakWidget userId={targetUserId} type="skill_practice" />
                    <StreakUpcomingMilestones
                      userId={targetUserId}
                      type="skill_practice"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        onClick={async () => {
                          try {
                            await markSkillPracticeDay(targetUserId);
                            addToast("success", "Logged today's practice");
                          } catch {
                            addToast("error", "Failed to log practice");
                          }
                        }}
                      >
                        Log practice today
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* XP History */}
            <div className="glassmorphic rounded-xl p-6 border border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  XP History
                </h3>
              </div>
              {xpHistory.length > 0 ? (
                <div className="space-y-2">
                  {xpHistory.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTransactionDate(transaction.createdAt, {
                            includeTime: true,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Source: {transaction.source.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3 text-right">
                        <span className="text-lg font-semibold text-green-500">
                          +{transaction.amount}
                        </span>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No XP history available.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GamificationDashboard;
