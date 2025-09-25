import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { getTradeProposals, updateTradeProposalStatus, getTrade, Trade, TradeProposal } from '../../../services/firestore-exports';
import TradeProposalCard from './TradeProposalCard';
import { useToast } from '../../../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Skeleton } from '../../ui/skeletons/Skeleton';
import { EmptyState } from '../../ui/EmptyState';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const isTradeCreator = !!currentUser && !!trade && currentUser.uid === trade.creatorId;

  return (
    <Card variant="premium" tilt={true} depth="lg" glow="subtle" glowColor="blue" interactive={true} reducedHover={true}>
      <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4">
        <CardTitle className="text-xl font-semibold">Trade Proposals</CardTitle>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center justify-start sm:justify-end">
            <Select onValueChange={(value) => setSortBy(value as 'date' | 'skillMatch')} defaultValue={sortBy}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="skillMatch">Skill Match</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'accepted', 'rejected', 'all'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(status)}
                className="flex items-center min-w-0"
              >
                <span className="truncate">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <Badge variant={filter === status ? 'default' : 'outline'} className="ml-2 flex-shrink-0">
                  {counts[status]}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : error ? (
          <EmptyState
            title="Error"
            description={error}
          />
        ) : filteredProposals.length > 0 ? (
          <div className="max-h-[800px] overflow-y-auto pr-2">
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <AnimatePresence>
                {filteredProposals.map(proposal => (
                  <motion.div 
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TradeProposalCard
                      proposal={proposal}
                      onAccept={() => handleAcceptProposal(proposal.id!)}
                      onReject={() => handleRejectProposal(proposal.id!)}
                      isCreator={isTradeCreator}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          <EmptyState
            title="No Proposals"
            description={`There are no ${filter !== 'all' ? filter : ''} proposals for this trade yet.`}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TradeProposalDashboard;
