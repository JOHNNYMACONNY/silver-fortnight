import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { onChallengeSubmissions, getChallenge } from '../services/challenges';
import type { Challenge } from '../types/gamification';
import EvidenceGallery from '../components/evidence/EvidenceGallery';
import { EmbeddedEvidence } from '../types/evidence';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, Award, Clock, Calendar, User } from 'lucide-react';

export const ChallengeDetailPage: React.FC = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  // const navigate = useNavigate();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (challengeId) {
      fetchChallenge(challengeId);
      // Subscribe to submissions for this challenge
      const unsubscribe = onChallengeSubmissions(challengeId, (items) => {
        setSubmissions(items);
      });
      return () => unsubscribe();
    }
  }, [challengeId]);

  const fetchChallenge = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const fetchResult = await getChallenge(id);
      if (!fetchResult.success || !fetchResult.data) {
        throw new Error(fetchResult.error || 'Failed to fetch challenge');
      }
      if (fetchResult.data) {
        setChallenge(fetchResult.data as Challenge);
        // Check if user is participating (this would be implemented with actual data)
        setIsParticipating(false);
      } else {
        throw new Error('Challenge not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenge');
      addToast('error', err.message || 'Failed to fetch challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = () => {
    if (!currentUser) {
      addToast('error', 'You must be logged in to participate in challenges');
      return;
    }

    // This would be implemented with actual participation logic
    setIsParticipating(true);
    addToast('success', 'You are now participating in this challenge!');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  const normalizeDifficulty = (difficulty?: string) => {
    if (!difficulty) return 'Beginner';
    const d = difficulty.toLowerCase();
    return toTitleCase(d);
  };

  const getDifficultyClass = (difficulty: string) => {
    const d = normalizeDifficulty(difficulty);
    switch (d) {
      case 'Beginner':
        return 'bg-success/10 text-success';
      case 'Intermediate':
        return 'bg-primary/10 text-primary';
      case 'Advanced':
        return 'bg-accent/10 text-accent';
      case 'Expert':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return 'UNKNOWN';
    const s = status.toLowerCase();
    if (s === 'active' || s === 'open') return 'OPEN';
    if (s === 'in_progress') return 'IN_PROGRESS';
    if (s === 'completed') return 'COMPLETED';
    if (s === 'draft') return 'DRAFT';
    if (s === 'upcoming') return 'UPCOMING';
    if (s === 'cancelled' || s === 'canceled') return 'CANCELLED';
    return status.toUpperCase();
  };

  const getStatusClass = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case 'OPEN':
        return 'bg-success/10 text-success';
      case 'COMPLETED':
        return 'bg-muted text-muted-foreground';
      case 'DRAFT':
        return 'bg-primary/10 text-primary';
      case 'IN_PROGRESS':
        return 'bg-accent/10 text-accent';
      case 'UPCOMING':
        return 'bg-primary/10 text-primary';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 transition-colors duration-200">
          {error || 'Challenge not found'}
        </div>
        <Link
          to="/challenges"
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          to="/challenges"
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden transition-all duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex justify-between items-center transition-colors duration-200">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{challenge.title}</h1>
            <div className="flex items-center mt-2 space-x-4">
              {(
                // always show difficulty with safe default
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyClass((challenge as any).difficulty || '')}`}>
                  {normalizeDifficulty((challenge as any).difficulty)}
                </span>
              )}
              {(
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass((challenge as any).status || '')}`}>
                  {normalizeStatus((challenge as any).status)}
                </span>
              )}
            </div>
          </div>

          {normalizeStatus((challenge as any).status) === 'OPEN' && (
            <button
              onClick={handleParticipate}
              disabled={isParticipating}
              className={`px-4 py-2 rounded-md ${
                isParticipating
                  ? 'bg-success text-success-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200`}
            >
              {isParticipating ? 'Participating' : 'Participate'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Challenge details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Challenge Details</h2>
            <p className="text-muted-foreground mb-6">{challenge.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {(challenge as any).category && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Award className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Category: {(challenge as any).category}</span>
                </div>
              )}

              {((challenge as any).deadline?.toDate || (challenge as any).endDate?.toDate) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {formatDate(((challenge as any).deadline || (challenge as any).endDate).toDate())}</span>
                </div>
              )}

              {(challenge as any).createdAt && (challenge as any).createdAt.toDate && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Posted: {formatDate((challenge as any).createdAt.toDate())}</span>
                </div>
              )}

              {((challenge as any).participants || typeof (challenge as any).participantCount === 'number') && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Participants: {Array.isArray((challenge as any).participants) ? (challenge as any).participants.length : (challenge as any).participantCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rules and Requirements */}
          {(challenge as any).rules && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">Rules and Requirements</h2>
              <div className="bg-background p-4 rounded-lg transition-colors duration-200">
                <ul className="list-disc pl-5 space-y-2">
                  {Array.isArray((challenge as any).rules) ? (
                    (challenge as any).rules.map((rule: string, index: number) => (
                      <li key={index} className="text-muted-foreground">{rule}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">{(challenge as any).rules}</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Prizes */}
          {(challenge as any).prizes && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">Prizes</h2>
              <div className="bg-background p-4 rounded-lg transition-colors duration-200">
                <ul className="list-disc pl-5 space-y-2">
                  {Array.isArray((challenge as any).prizes) ? (
                    (challenge as any).prizes.map((prize: string, index: number) => (
                      <li key={index} className="text-muted-foreground">{prize}</li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">{(challenge as any).prizes}</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Submission Guidelines */}
          {(challenge as any).submissionGuidelines && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">Submission Guidelines</h2>
              <div className="bg-background p-4 rounded-lg transition-colors duration-200">
                <p className="text-muted-foreground">{(challenge as any).submissionGuidelines}</p>
              </div>
            </div>
          )}

          {/* Recent Submissions (with embedded evidence) */}
          {submissions && submissions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">Recent Submissions</h2>
              <div className="space-y-6">
                {submissions.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="bg-background p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-medium text-foreground">
                        {submission.title || 'Submission'}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {submission.submittedAt?.toDate ? new Date(submission.submittedAt.toDate()).toLocaleString() : ''}
                      </span>
                    </div>
                    {Array.isArray(submission.embeddedEvidence) && submission.embeddedEvidence.length > 0 ? (
                      <EvidenceGallery evidence={submission.embeddedEvidence as EmbeddedEvidence[]} />
                    ) : (
                      <p className="text-sm text-muted-foreground">No embedded evidence provided.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          {normalizeStatus((challenge as any).status) === 'OPEN' && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleParticipate}
                disabled={isParticipating}
                className={`px-6 py-3 rounded-md text-lg font-medium ${
                  isParticipating
                    ? 'bg-success text-success-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200`}
              >
                {isParticipating ? 'You are participating' : 'Join this Challenge'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeDetailPage;
