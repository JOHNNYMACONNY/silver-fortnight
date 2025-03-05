import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    readFileSync('./serviceAccount.json', 'utf-8')
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function seedDatabase() {
  try {
    // Sample users
    const users = [
      {
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        bio: 'Full-stack developer with 5 years of experience',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        portfolio: 'https://johndoe.dev',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
        bio: 'UI/UX designer passionate about creating beautiful interfaces',
        skills: ['UI Design', 'Figma', 'Adobe XD', 'User Research'],
        portfolio: 'https://janesmith.design',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Sample trades
    const trades = [
      {
        title: 'Web Design for Photography Portfolio',
        description: 'Looking for a professional photographer to capture product photos in exchange for creating a modern portfolio website.',
        offeredSkills: ['Web Design', 'React', 'Tailwind CSS'],
        requestedSkills: ['Photography', 'Photo Editing'],
        creatorId: 'user1',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Mobile App UI Design for Fitness Tracking App',
        description: 'Will provide personal training sessions in exchange for designing a mobile app interface.',
        offeredSkills: ['Personal Training', 'Fitness Planning'],
        requestedSkills: ['UI Design', 'Mobile App Design'],
        creatorId: 'user2',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Sample collaborations
    const collaborations = [
      {
        title: 'Community Marketplace App',
        description: 'Building a local marketplace app to connect neighborhood vendors with customers.',
        roles: [
          {
            title: 'Frontend Developer',
            skills: ['React Native', 'TypeScript'],
            filled: false,
          },
          {
            title: 'Backend Developer',
            skills: ['Node.js', 'Firebase'],
            filled: true,
            userId: 'user1',
          },
          {
            title: 'UI/UX Designer',
            skills: ['Figma', 'User Research'],
            filled: false,
          },
        ],
        creatorId: 'user1',
        status: 'recruiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Batch write users
    const usersBatch = db.batch();
    for (const user of users) {
      const userRef = db.collection('users').doc();
      usersBatch.set(userRef, user);
    }
    await usersBatch.commit();
    console.log('✅ Users seeded successfully');

    // Batch write trades
    const tradesBatch = db.batch();
    for (const trade of trades) {
      const tradeRef = db.collection('trades').doc();
      tradesBatch.set(tradeRef, trade);
    }
    await tradesBatch.commit();
    console.log('✅ Trades seeded successfully');

    // Batch write collaborations
    const collabsBatch = db.batch();
    for (const collab of collaborations) {
      const collabRef = db.collection('collaborations').doc();
      collabsBatch.set(collabRef, collab);
    }
    await collabsBatch.commit();
    console.log('✅ Collaborations seeded successfully');

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase().then(() => process.exit(0));