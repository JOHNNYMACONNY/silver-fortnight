// src/pages/RealtimeLeaderboardPage.tsx

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { RealtimeLeaderboard } from '../components/features/RealtimeLeaderboard';
import { RealtimeStatusIndicator } from '../components/ui/RealtimeStatusIndicator';
import { LeaderboardCategory, LeaderboardPeriod } from '../types/gamification';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Award, Trophy, Users, Calendar, TrendingUp, Settings } from '../utils/icons';
import { cn } from '../utils/cn';

const RealtimeLeaderboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(LeaderboardCategory.TOTAL_XP);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.ALL_TIME);
  const [showSettings, setShowSettings] = useState(false);
  const [limit, setLimit] = useState(50);

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

  const handleUserClick = (userId: string) => {
    // Navigate to user profile
    window.location.href = `/profile/${userId}`;
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card text-card-foreground p-8 text-center">
          <Award className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4 text-text-primary">
            Join the Competition!
          </h2>
          <p className="mb-6 text-text-secondary">
            Sign in to view real-time leaderboards and compete with other TradeYa users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Live Leaderboards
              </h1>
              <p className="text-text-secondary">
                Real-time rankings and competition
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <RealtimeStatusIndicator showText={true} showStats={false} />
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Leaderboard Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Limit
                  </label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={25}>25 entries</option>
                    <option value={50}>50 entries</option>
                    <option value={100}>100 entries</option>
                    <option value={200}>200 entries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-refresh
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Enable live updates</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Category and Period Selectors */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Selector */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3 text-text-primary">Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                    selectedCategory === category.value
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {category.icon}
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-3 text-text-primary">Time Period</h3>
            <div className="flex gap-2">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={cn(
                    "flex-1 p-3 rounded-lg border transition-colors text-center",
                    selectedPeriod === period.value
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span className="text-sm font-medium">{period.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Leaderboard */}
      <Card>
        <CardBody>
          <RealtimeLeaderboard
            category={selectedCategory}
            period={selectedPeriod}
            limit={limit}
            showConnectionStatus={true}
            showLastUpdate={true}
            onUserClick={handleUserClick}
          />
        </CardBody>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">How Rankings Work</h3>
            </div>
            <p className="text-sm text-gray-600">
              Rankings are updated in real-time based on your activity and achievements. 
              Higher scores mean better rankings!
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Live Updates</h3>
            </div>
            <p className="text-sm text-gray-600">
              All leaderboards update automatically as users complete actions. 
              No need to refresh the page!
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Competition</h3>
            </div>
            <p className="text-sm text-gray-600">
              Compete with other users and climb the rankings. 
              The top performers are featured prominently!
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default RealtimeLeaderboardPage;
