import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { getTradeProposals, updateTradeProposalStatus, getTrade, Trade, TradeProposal } from '../../../services/firestore-exports';
import TradeProposalCard from './TradeProposalCard';
import CompactProposalCard from './CompactProposalCard';
import { useToast } from '../../../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Skeleton } from '../../ui/skeletons/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { Modal } from '../../ui/Modal';

interface TradeProposalDashboardProps {
  tradeId: string;
  onProposalAccepted: () => void;
}

const TradeProposalDashboard: React.FC<TradeProposalDashboardProps> = ({
  tradeId,
  onProposalAccepted
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [proposals, setProposals] = useState<TradeProposal[]>([]);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [sortBy, setSortBy] = useState<'date' | 'skillMatch'>('date');
  const [expandedProposal, setExpandedProposal] = useState<TradeProposal | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const [proposalsResult, tradeResult] = await Promise.all([
          getTradeProposals(tradeId),
          getTrade(tradeId)
        ]);

        if (proposalsResult.error) throw new Error(proposalsResult.error as any);
        if (proposalsResult.data) setProposals(proposalsResult.data);

        if (tradeResult.error) throw new Error(tradeResult.error as any);
        if (tradeResult.data) setTrade(tradeResult.data);

      } catch (err: any) {
        setError(err.message || 'Failed to fetch trade data');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [tradeId, currentUser]);

  // Handle accept proposal
  const handleAcceptProposal = async (proposalId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await updateTradeProposalStatus(
        tradeId,
        proposalId,
        'accepted'
      );

      if (error) throw new Error(error as any); // Cast to any if error is of unknown type

      // If no error, operation was successful
      // Update local state
      setProposals(prevProposals =>
        prevProposals.map(proposal =>
          proposal.id === proposalId
            ? { ...proposal, status: 'accepted' }
            : proposal.status === 'pending'
              ? { ...proposal, status: 'rejected' }
              : proposal
        )
      );

      addToast('success', 'Proposal accepted successfully!');
      onProposalAccepted();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to accept proposal');
    }
  };

  // Handle reject proposal
  const handleRejectProposal = async (proposalId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await updateTradeProposalStatus(
        tradeId,
        proposalId,
        'rejected'
      );

      if (error) throw new Error(error as any); // Cast to any if error is of unknown type

      // If no error, operation was successful
      // Update local state
      setProposals(prevProposals =>
        prevProposals.map(proposal =>
          proposal.id === proposalId
            ? { ...proposal, status: 'rejected' }
            : proposal
        )
      );

      addToast('success', 'Proposal rejected');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reject proposal');
    }
  };

  // Sort proposals
  const sortProposals = (proposals: TradeProposal[]) => {
    if (sortBy === 'date') {
      return [...proposals].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.();
        const dateB = b.createdAt?.toDate?.();
        
        // Handle cases where createdAt might be missing or invalid
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // Sort items with no date after items with dates
        if (!dateB) return -1; // Sort items with no date after items with dates

        return dateB.getTime() - dateA.getTime(); // Newest first
      });
    } else if (sortBy === 'skillMatch') {
      return [...proposals].sort((a, b) => {
        // Calculate skill match score (number of matching skills)
        const aScore = (a.skillsOffered?.length || 0) + (a.skillsRequested?.length || 0);
        const bScore = (b.skillsOffered?.length || 0) + (b.skillsRequested?.length || 0);
        return bScore - aScore; // Higher score first
      });
    }
    return proposals;
  };

  // Filter and sort proposals
  const filteredProposals = sortProposals(
    proposals.filter(proposal => {
      if (filter === 'all') return true;
      return proposal.status === filter;
    })
  );

  // Count proposals by status
  const counts = {
    all: proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length
  };

  // Animation variants - optimized for grid layout
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Faster stagger for grid layout
        delayChildren: 0.1 // Small delay before children start animating
      }
    }
  };

  const isTradeCreator = !!currentUser && !!trade && currentUser.uid === trade.creatorId;

  return (
    <div className="w-full space-y-6">
      {/* Dashboard Header with Controls */}
      <Card variant="premium" depth="md" glow="subtle" glowColor="blue" className="backdrop-blur-lg glassmorphic bg-white/5 border-glass shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* Title and Summary */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold">Trade Proposals</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {counts.pending} pending · {counts.accepted} accepted · {counts.rejected} rejected
                </p>
              </div>
              
              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
                <Select onValueChange={(value) => setSortBy(value as 'date' | 'skillMatch')} defaultValue={sortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest First)</SelectItem>
                    <SelectItem value="skillMatch">Skill Match Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  variant="glassmorphic"
                  topic={filter === status ? 'trades' : undefined}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className={`flex items-center gap-2 transition-all duration-200 min-h-[44px] ${
                    filter === status 
                      ? 'ring-2 ring-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15' 
                      : 'bg-white/5 hover:bg-white/10 hover:ring-1 hover:ring-white/20'
                  }`}
                >
                  <span className="capitalize">{status}</span>
                  <Badge 
                    variant={filter === status ? 'secondary' : 'outline'} 
                    className="ml-1 min-w-[24px] justify-center"
                  >
                    {counts[status]}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Proposals List */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
            {[...Array(6)].map((_, i) => (
              <Card key={i} variant="glass" className="p-6 h-full glassmorphic bg-white/5 backdrop-blur-sm border-glass">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card variant="glass" className="p-8 glassmorphic bg-white/5 backdrop-blur-sm border-glass">
            <EmptyState
              title="Error Loading Proposals"
              description={error}
            />
          </Card>
        ) : filteredProposals.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <AnimatePresence mode="popLayout">
              {filteredProposals.map((proposal, index) => (
                <motion.div
                  key={proposal.id}
                  className="h-full w-full"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05, // Stagger effect
                    ease: "easeOut"
                  }}
                  layout
                >
                  <CompactProposalCard
                    proposal={proposal}
                    onAccept={() => handleAcceptProposal(proposal.id!)}
                    onReject={() => handleRejectProposal(proposal.id!)}
                    onExpand={() => setExpandedProposal(proposal)}
                    isCreator={isTradeCreator}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <Card variant="glass" className="p-12 glassmorphic bg-white/5 backdrop-blur-sm border-glass">
            <EmptyState
              title={`No ${filter !== 'all' ? filter.charAt(0).toUpperCase() + filter.slice(1) : ''} Proposals`}
              description={
                filter === 'pending'
                  ? "No pending proposals at the moment. New proposals will appear here."
                  : filter === 'accepted'
                  ? "No proposals have been accepted yet."
                  : filter === 'rejected'
                  ? "No proposals have been rejected yet."
                  : "No proposals have been submitted for this trade yet. Share your trade to get more proposals!"
              }
            />
          </Card>
        )}

        {/* Detailed Proposal Modal */}
        {expandedProposal && (
          <Modal
            isOpen={!!expandedProposal}
            onClose={() => setExpandedProposal(null)}
            title={`Proposal from ${expandedProposal.proposerName || 'Anonymous'}`}
            size="lg"
            closeOnClickOutside={true}
            closeOnEsc={true}
          >
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <TradeProposalCard
                proposal={expandedProposal}
                onAccept={() => {
                  handleAcceptProposal(expandedProposal.id!);
                  setExpandedProposal(null);
                }}
                onReject={() => {
                  handleRejectProposal(expandedProposal.id!);
                  setExpandedProposal(null);
                }}
                isCreator={isTradeCreator}
              />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default TradeProposalDashboard;
