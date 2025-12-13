import React, { useState } from "react";
import { useAuth } from "../../AuthContext";
import { createChallenge } from "../../services/challenges";
import {
  Challenge,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeType,
  ChallengeStatus,
} from "../../types/gamification";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Loader2, Trophy, CheckCircle, AlertCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import {
  demoSoloChallenges,
  demoTradeChallenges,
  demoCollaborationChallenges
} from "../../data/demoTierChallenges";
import { logger } from '@utils/logging/logger';

const SeedChallengesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedResults, setSeedResults] = useState<{
    success: number;
    failed: number;
  }>({ success: 0, failed: 0 });

  const categories = Object.values(ChallengeCategory);
  const difficulties = Object.values(ChallengeDifficulty);
  const types = Object.values(ChallengeType);

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const daysFromNow = (days: number): Timestamp => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return Timestamp.fromDate(d);
  };

  // Combine all demo challenges
  const sampleChallenges = [
    ...demoSoloChallenges,
    ...demoTradeChallenges,
    ...demoCollaborationChallenges
  ];

  const seedChallenges = async () => {
    if (!currentUser) {
      addToast("error", "You must be logged in to seed challenges");
      return;
    }

    setIsSeeding(true);
    setSeedProgress(0);
    setSeedResults({ success: 0, failed: 0 });

    const totalChallenges = sampleChallenges.length;

    for (let i = 0; i < totalChallenges; i++) {
      try {
        const sample = sampleChallenges[i];
        const endInDays = 7 + Math.floor(Math.random() * 14); // 7-21 days

        const challengeData: Partial<Challenge> = {
          title: sample.title,
          description: sample.description,
          category: (sample as any).category || ChallengeCategory.DEVELOPMENT, // Fallback as demo data might use strings
          difficulty: sample.difficulty as ChallengeDifficulty,
          type: sample.type as ChallengeType,
          status: ChallengeStatus.ACTIVE,
          requirements: [],
          rewards: { xp: sample.rewards?.xp || 100 },
          startDate: Timestamp.now(),
          endDate: daysFromNow(endInDays),
          coverImage: (sample as any).coverImage,
          maxParticipants:
            sample.type === ChallengeType.COLLABORATION ? 50 : 100,
          timeEstimate: (sample as any).estimatedHours ? `${(sample as any).estimatedHours} hours` : "4-8 hours",
          instructions: [
            "Read the challenge description carefully",
            "Plan your approach and timeline",
            "Submit your work before the deadline",
            "Include documentation or explanation of your process",
          ],
          objectives: [
            "Complete the main deliverable",
            "Meet quality standards",
            "Submit on time",
            "Follow best practices",
          ],
          tags: (sample as any).skills || [],
          createdBy: currentUser.uid,
        };

        const result = await createChallenge(challengeData);

        if (result.success) {
          setSeedResults((prev) => ({ ...prev, success: prev.success + 1 }));
        } else {
          setSeedResults((prev) => ({ ...prev, failed: prev.failed + 1 }));
          logger.error('Failed to create challenge:', 'PAGE', {}, result.error as Error);
        }
      } catch (error) {
        setSeedResults((prev) => ({ ...prev, failed: prev.failed + 1 }));
        logger.error('Error creating challenge:', 'PAGE', {}, error as Error);
      }

      setSeedProgress(((i + 1) / totalChallenges) * 100);

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsSeeding(false);

    if (seedResults.success > 0) {
      addToast(
        "success",
        `Successfully seeded ${seedResults.success} challenges!`
      );
    }

    if (seedResults.failed > 0) {
      addToast("error", `Failed to seed ${seedResults.failed} challenges`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Seed Sample Challenges
          </CardTitle>
          <p className="text-muted-foreground">
            Create sample challenges for testing and validation purposes.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seeding Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Success</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {seedResults.success}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {seedResults.failed}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {sampleChallenges.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {isSeeding && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Seeding Progress</span>
                <span>{Math.round(seedProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${seedProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Sample Challenges Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Sample Challenges to be Created
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleChallenges.map((challenge, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{challenge.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{(challenge as any).category || 'Development'}</Badge>
                      <Badge variant="outline">{challenge.difficulty}</Badge>
                      <Badge variant="default">{(challenge as any).rewards?.xp || 100} XP</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Seed Button */}
          <div className="flex justify-center">
            <Button
              onClick={seedChallenges}
              disabled={isSeeding}
              size="lg"
              className="min-w-48"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Challenges...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Seed Sample Challenges
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeedChallengesPage;
