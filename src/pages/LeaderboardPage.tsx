import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Leaderboard } from '../components/features/Leaderboard';
import { SocialFeatures } from '../components/features/SocialFeatures';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Award, Trophy, Users, Calendar, TrendingUp } from '../utils/icons';


const LeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(LeaderboardCategory.TOTAL_XP);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);

  const categories = [
    { value: LeaderboardCategory.TOTAL_XP, label: 'Total XP', icon: <Trophy className="h-4 w-4" /> },
    { value: LeaderboardCategory.WEEKLY_XP, label: 'Weekly XP', icon: <Calendar className="h-4 w-4" /> },
    { value: LeaderboardCategory.TRADE_COUNT, label: 'Trade Count', icon: <TrendingUp className="h-4 w-4" /> },
    { value: LeaderboardCategory.COLLABORATION_RATING, label: 'Completion Rate', icon: <Award className="h-4 w-4" /> },
  ];

  const periods = [
    { value: LeaderboardPeriod.ALL_TIME, label: 'All Time' },
    { value: LeaderboardPeriod.MONTHLY, label: 'This Month' },
    { value: LeaderboardPeriod.WEEKLY, label: 'This Week' },
  ];

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card text-card-foreground p-8 text-center">
          <Award className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4 text-text-primary">
            Join the Competition!
          </h2>
          <p className="mb-6 text-text-secondary">
            Sign in to view leaderboards and compete with other TradeYa users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-text-primary">
            Leaderboards
          </h1>
        </div>
        <p className="text-lg text-text-secondary">
          Compete with other TradeYa users and climb the ranks!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Leaderboard */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-text-primary">
                  Leaderboard Rankings
                </h2>
                
                {/* Category Selector */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.value
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {category.icon}
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period Selector */}
              <div className="flex flex-wrap gap-2 mt-4">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedPeriod === period.value
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            
            <CardBody>
              <Leaderboard
                category={selectedCategory}
                period={selectedPeriod}
                limit={20}
                showCurrentUser={true}
                compact={false}
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Social Features */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">
                  Social
                </h3>
              </div>
            </CardHeader>
            <CardBody>
              <SocialFeatures 
                userId={currentUser.uid} 
                userName={currentUser.displayName || 'User'} 
              />
            </CardBody>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-text-primary">
                Quick Stats
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Your Rank</span>
                  <span className="font-semibold text-primary">
                    Loading...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Total XP</span>
                  <span className="font-semibold text-secondary">
                    Loading...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">This Week</span>
                  <span className="font-semibold text-accent">
                    Loading...
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
