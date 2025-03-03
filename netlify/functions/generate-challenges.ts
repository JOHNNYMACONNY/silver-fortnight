import { Handler, schedule } from "@netlify/functions";
import { HfInference } from '@huggingface/inference';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface Challenge {
  title: string;
  description: string;
  type: 'weekly' | 'monthly';
  status: 'pending' | 'live' | 'archived';
  requirements: {
    type: string;
    count: number;
    skillCategory: string;
  }[];
  rewards: {
    xp: number;
    badge: string;
  };
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

async function generateChallengeWithAI(type: 'weekly' | 'monthly'): Promise<Partial<Challenge>> {
  const prompt = `Generate a creative ${type} challenge for a skill-trading platform. The challenge should encourage users to trade skills and collaborate. Format the response as JSON with these fields:
  {
    "title": "challenge title",
    "description": "challenge description",
    "requirements": [
      {"type": "string", "count": number, "skillCategory": "string"}
    ],
    "rewards": {
      "xp": number between ${type === 'weekly' ? '100-300' : '400-600'},
      "badge": "string"
    }
  }`;

  try {
    const response = await hf.textGeneration({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        return_full_text: false,
      }
    });

    const jsonStr = response.generated_text.trim();
    const generatedChallenge = JSON.parse(jsonStr);

    return {
      ...generatedChallenge,
      type,
    };
  } catch (error) {
    console.error('Error generating challenge:', error);
    // Fallback to default challenge if AI generation fails
    return {
      title: `${type === 'weekly' ? 'Weekly' : 'Monthly'} Creative Challenge`,
      description: `Complete creative tasks and collaborate with others in this ${type} challenge.`,
      requirements: [
        {
          type: 'Trades',
          count: type === 'weekly' ? 2 : 4,
          skillCategory: 'Any'
        },
        {
          type: 'Collaborations',
          count: type === 'weekly' ? 1 : 2,
          skillCategory: 'Any'
        }
      ],
      rewards: {
        xp: type === 'weekly' ? 200 : 500,
        badge: `${type}CreativeMaster`
      },
      type,
    };
  }
}

// Handler for weekly challenge generation
export const generateWeekly: Handler = schedule('@weekly', async () => {
  const batch = db.batch();
    
  // Archive old pending challenges
  const oldPendingSnapshot = await db.collection('challenges')
    .where('status', '==', 'pending')
    .where('type', '==', 'weekly')
    .get();
  
  oldPendingSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { status: 'archived' });
  });

  // Generate exactly 10 weekly challenges
  for (let i = 0; i < 10; i++) {
    const challenge = await generateChallengeWithAI('weekly');
    const docRef = db.collection('challenges').doc();
    
    batch.set(docRef, {
      ...challenge,
      status: 'pending',
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await batch.commit();
  return { statusCode: 200, body: JSON.stringify({ message: 'Weekly challenges generated successfully' }) };
});

// Handler for monthly challenge generation
export const generateMonthly: Handler = schedule('@monthly', async () => {
  const batch = db.batch();
    
  // Archive old pending challenges
  const oldPendingSnapshot = await db.collection('challenges')
    .where('status', '==', 'pending')
    .where('type', '==', 'monthly')
    .get();
  
  oldPendingSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { status: 'archived' });
  });

  // Generate exactly 10 monthly challenges
  for (let i = 0; i < 10; i++) {
    const challenge = await generateChallengeWithAI('monthly');
    const docRef = db.collection('challenges').doc();
    
    batch.set(docRef, {
      ...challenge,
      status: 'pending',
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await batch.commit();
  return { statusCode: 200, body: JSON.stringify({ message: 'Monthly challenges generated successfully' }) };
});
