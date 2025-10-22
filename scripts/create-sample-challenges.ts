import { getSyncFirebaseDb } from '../src/firebase-config';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Challenge, ChallengeDifficulty, ChallengeStatus, ChallengeType } from '../src/types/gamification';

async function seedSampleChallenges() {
  const db = getSyncFirebaseDb();
  const samples: Array<Partial<Challenge>> = [
    {
      title: 'Tell a Story with Your Craft',
      description: 'Create something that communicates an emotional arc. Any medium welcome.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.BEGINNER,
      requirements: [],
      rewards: { xp: 150 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Choose a medium', 'Craft a beginning, middle, end', 'Share a brief reflection'],
      objectives: ['Emotional clarity', 'Coherent narrative'],
      timeEstimate: '2 hours',
      tags: ['story', 'portfolio'],
      createdBy: 'seed-script'
    },
    {
      title: 'Solve a Real Problem',
      description: 'Identify a friction in your daily life and make a prototype solution in your medium.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.INTERMEDIATE,
      requirements: [],
      rewards: { xp: 200 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Pick a problem', 'Prototype a solution', 'Document before/after'],
      objectives: ['Problem framing', 'Evidence of impact'],
      timeEstimate: '3 hours',
      tags: ['problem-solving', 'prototype'],
      createdBy: 'seed-script'
    },
    {
      title: 'Moodboard to Deliverable',
      description: 'Start with a mood/feeling and realize it into a finished output in your discipline.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.BEGINNER,
      requirements: [],
      rewards: { xp: 150 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Collect 6-12 references', 'Create', 'Explain how choices create the mood'],
      objectives: ['Mood fidelity', 'Consistency'],
      timeEstimate: '2 hours',
      tags: ['mood', 'aesthetic'],
      createdBy: 'seed-script'
    },
    {
      title: 'Express an Emotion',
      description: 'Pick a specific emotion and express it through your medium in a compact deliverable.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.BEGINNER,
      requirements: [],
      rewards: { xp: 150 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Choose an emotion', 'Create a piece that communicates it', 'Explain choices'],
      objectives: ['Clarity of emotion', 'Cohesive execution'],
      timeEstimate: '45 minutes',
      tags: ['emotion', 'expression'],
      createdBy: 'seed-script'
    },
    {
      title: 'Document a Process',
      description: 'Demonstrate how you approach a creative task and reflect on your steps.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.INTERMEDIATE,
      requirements: [],
      rewards: { xp: 200 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Choose a task', 'Document steps', 'Highlight key decisions'],
      objectives: ['Process clarity', 'Reflective insight'],
      timeEstimate: '2 hours',
      tags: ['process', 'reflection'],
      createdBy: 'seed-script'
    },
    {
      title: 'Create a Resource',
      description: 'Build something useful others can benefit from in your discipline.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.INTERMEDIATE,
      requirements: [],
      rewards: { xp: 250 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Define audience', 'Create resource', 'Explain usage'],
      objectives: ['Utility', 'Clarity'],
      timeEstimate: '3 hours',
      tags: ['resource', 'utility'],
      createdBy: 'seed-script'
    },
    {
      title: 'Capture a Moment',
      description: 'Capture and present a meaningful moment using your medium.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.BEGINNER,
      requirements: [],
      rewards: { xp: 150 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Select subject', 'Capture/present', 'Describe significance'],
      objectives: ['Significance', 'Aesthetic quality'],
      timeEstimate: '20 minutes',
      tags: ['moment', 'aesthetic'],
      createdBy: 'seed-script'
    },
    {
      title: 'Teach Something',
      description: 'Create a short educational piece that teaches a micro-skill.',
      type: ChallengeType.SOLO,
      category: 'community' as any,
      difficulty: ChallengeDifficulty.INTERMEDIATE,
      requirements: [],
      rewards: { xp: 220 },
      startDate: Timestamp.now(),
      endDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      status: ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      instructions: ['Pick a skill', 'Explain step-by-step', 'Provide quick demo/example'],
      objectives: ['Clarity', 'Learner outcome'],
      timeEstimate: '90 minutes',
      tags: ['teaching', 'education'],
      createdBy: 'seed-script'
    }
  ];

  for (const sample of samples) {
    const ref = doc(collection(db, 'challenges'));
    const challenge: Challenge = {
      id: ref.id,
      title: sample.title || '',
      description: sample.description || '',
      type: sample.type || ChallengeType.SOLO,
      // Using generic community category to be universal
      // If typed union narrows, ensure it matches `ChallengeCategory.COMMUNITY`
      // and leave as any for script convenience
      category: (sample as any).category,
      difficulty: sample.difficulty || ChallengeDifficulty.BEGINNER,
      requirements: sample.requirements || [],
      rewards: sample.rewards || { xp: 150 },
      startDate: sample.startDate || Timestamp.now(),
      endDate: sample.endDate || Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      status: sample.status || ChallengeStatus.ACTIVE,
      participantCount: 0,
      completionCount: 0,
      maxParticipants: undefined,
      instructions: sample.instructions || [],
      objectives: sample.objectives || [],
      timeEstimate: sample.timeEstimate,
      tags: sample.tags || [],
      createdBy: sample.createdBy || 'seed-script',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    await setDoc(ref, challenge);
    // eslint-disable-next-line no-console
    console.log(`Seeded challenge: ${challenge.title}`);
  }
}

seedSampleChallenges()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Sample challenges seeded');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed', err);
    process.exit(1);
  });


