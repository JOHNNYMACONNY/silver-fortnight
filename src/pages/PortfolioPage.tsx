import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Star, Calendar, Award, ExternalLink, Github, Globe, Loader2, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { PortfolioItem } from '../types/portfolio';
import { PortfolioItemComponent } from '../components/features/portfolio/PortfolioItem';
import { PortfolioCreationModal } from '../components/features/portfolio/PortfolioCreationModal';
import { StandardPageHeader } from '../components/layout/StandardPageHeader';


const PortfolioPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isManaging, setIsManaging] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Use real portfolio data instead of hardcoded values
  const {
    portfolioItems,
    portfolioItemsLoading,
    portfolioItemsError,
    stats,
    statsLoading,
    statsError,
    refreshAll
  } = usePortfolioData(currentUser?.uid || '', {
    includePrivate: true, // Show all items for own portfolio
    timeRange: 'all',
    autoRefresh: false
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <StandardPageHeader
        title={currentUser ? `${currentUser.displayName}'s Portfolio` : 'Portfolio'}
        description="Showcase your best work and skills to attract potential trading partners"
        variant="centered"
        size="lg"
        isLoading={portfolioItemsLoading}
        loadingMessage="Loading portfolio..."
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsManaging(!isManaging)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {isManaging ? 'Done Managing' : 'Manage Portfolio'}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Add Project
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass" className="p-6 text-center">
          {statsLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statsError ? (
            <div className="flex items-center justify-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Error</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary">{stats.totalProjects}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </>
          )}
        </Card>
        <Card variant="glass" className="p-6 text-center">
          {statsLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statsError ? (
            <div className="flex items-center justify-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Error</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center text-2xl font-bold text-primary">
                {stats.averageRating > 0 ? stats.averageRating : 'N/A'}
                {stats.averageRating > 0 && <Star className="h-5 w-5 ml-1 fill-current" />}
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </>
          )}
        </Card>
        <Card variant="glass" className="p-6 text-center">
          {statsLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statsError ? (
            <div className="flex items-center justify-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Error</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary">{stats.skillsCount}</div>
              <div className="text-sm text-muted-foreground">Skills</div>
            </>
          )}
        </Card>
        <Card variant="glass" className="p-6 text-center">
          {statsLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statsError ? (
            <div className="flex items-center justify-center text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">Error</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold text-primary">{stats.completedTrades}</div>
              <div className="text-sm text-muted-foreground">Completed Trades</div>
            </>
          )}
        </Card>
      </div>

      {/* Portfolio Items */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Portfolio Items</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={isManaging ? "default" : "outline"}
              size="sm"
              onClick={() => setIsManaging(!isManaging)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isManaging ? 'Exit Management' : 'Manage Portfolio'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={portfolioItemsLoading || statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(portfolioItemsLoading || statsLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Award className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>

        {/* Error State */}
        {portfolioItemsError && (
          <Card variant="glass" className="p-6 border-destructive/20 bg-destructive/5">
            <div className="flex items-center text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Error loading portfolio items</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{portfolioItemsError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={refreshAll}
            >
              Try Again
            </Button>
          </Card>
        )}

        {/* Loading State */}
        {portfolioItemsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="glass" className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Loading portfolio items...
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Portfolio Items Grid */}
        {!portfolioItemsLoading && !portfolioItemsError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <PortfolioItemComponent
                key={item.id}
                item={item}
                isOwnProfile={true}
                isManaging={isManaging}
                onChange={refreshAll}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty State for New Users */}
      {!portfolioItemsLoading && !portfolioItemsError && portfolioItems.length === 0 && (
        <Card variant="glass" className="p-12 text-center">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Build Your Portfolio
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start showcasing your work to attract better trades and collaboration opportunities
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Award className="h-4 w-4 mr-2" />
            Add Your First Project
          </Button>
        </Card>
      )}

      {/* Call to Action */}
      <Card variant="glass" className="p-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Ready to Start Trading?
        </h3>
        <p className="text-muted-foreground mb-4">
          Your portfolio showcases your skills. Now find others to trade with!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild topic="trades">
            <a href="/trades">Browse Trades</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/collaborations">Find Collaborations</a>
          </Button>
        </div>
      </Card>

      {/* Portfolio Creation Modal */}
      <PortfolioCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refreshAll}
        userId={currentUser?.uid || ''}
      />
    </div>
  );
};

export default PortfolioPage; 