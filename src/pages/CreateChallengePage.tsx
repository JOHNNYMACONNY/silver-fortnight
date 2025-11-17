import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  ChallengeCreationForm,
  ChallengeCreationData,
} from "../components/challenges/ChallengeCreationForm";
import { createChallenge } from "../services/challenges";
import { useToast } from "../contexts/ToastContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { logger } from '@utils/logging/logger';

export const CreateChallengePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: ChallengeCreationData) => {
    if (!currentUser) {
      addToast("error", "You must be signed in to create challenges");
      return;
    }

    try {
      const response = await createChallenge({
        title: data.title,
        description: data.description,
        type: data.type,
        category: data.category as any,
        difficulty: data.difficulty,
        requirements: [],
        rewards: {
          xp: data.rewards?.xp || 100,
          badges: [],
        },
        startDate: new Date() as any,
        endDate: data.endDate as any,
        status: "active" as any,
        participantCount: 0,
        completionCount: 0,
        instructions: data.instructions,
        objectives: data.objectives,
        createdBy: currentUser.uid,
        tags: data.tags,
        maxParticipants: data.maxParticipants,
        timeEstimate: data.timeEstimate,
      });

      if (response.success) {
        addToast("success", "Challenge created successfully!");
        navigate("/challenges");
      } else {
        throw new Error(response.error || "Failed to create challenge");
      }
    } catch (error) {
      logger.error('Challenge creation error:', 'PAGE', {}, error as Error);
      addToast(
        "error",
        error instanceof Error ? error.message : "Failed to create challenge"
      );
      throw error; // Re-throw so the form can handle it
    }
  };

  const handleCancel = () => {
    navigate("/challenges");
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border text-center">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Sign in Required
          </h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to create challenges.
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          to="/challenges"
          className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Challenges
        </Link>
      </div>

      <ChallengeCreationForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
};

export default CreateChallengePage;
