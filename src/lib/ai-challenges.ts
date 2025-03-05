import { HfInference } from '@huggingface/inference';
import { Challenge } from '../types';

// Skill category mapping
const skillCategoryMap: { [key: string]: string } = {
  // Audio/Music Production
  'Pro Tools': 'Audio Production',
  'Ableton': 'Music Production',
  'Logic Pro': 'Music Production',
  'FL Studio': 'Music Production',
  'Audacity': 'Audio Production',
  'Studio One': 'Audio Production',
  'Reason': 'Music Production',
  
  // Video Production
  'Adobe Premiere': 'Video Editing',
  'Final Cut Pro': 'Video Editing',
  'DaVinci Resolve': 'Video Editing',
  'After Effects': 'Motion Graphics',
  'Vegas Pro': 'Video Editing',
  
  // Graphics/Design
  'Photoshop': 'Digital Design',
  'Illustrator': 'Digital Design',
  'InDesign': 'Digital Design',
  'GIMP': 'Digital Design',
  'Figma': 'UI/UX Design',
  'Sketch': 'UI/UX Design',
  'XD': 'UI/UX Design',
  
  // 3D/Animation
  'Maya': '3D Animation',
  'Blender': '3D Animation',
  'Cinema 4D': '3D Animation',
  'Unity': 'Game Development',
  'Unreal Engine': 'Game Development',
  
  // Photography
  'Lightroom': 'Photography',
  'Capture One': 'Photography',
  'Luminar': 'Photography',
  
  // Data & Analytics
  'Excel': 'Data & Analytics',
  'Google Sheets': 'Data & Analytics',
  'Tableau': 'Data & Analytics',
  'Power BI': 'Data & Analytics',
  'Looker': 'Data & Analytics',
  'SQL': 'Data & Analytics',
  'R': 'Data & Analytics',
  'Python': 'Data & Analytics',
  'SPSS': 'Data & Analytics',
  'SAS': 'Data & Analytics',
  
  // Presentation & Communication
  'PowerPoint': 'Presentation & Communication',
  'Keynote': 'Presentation & Communication',
  'Google Slides': 'Presentation & Communication',
  'Prezi': 'Presentation & Communication',
  'Canva': 'Presentation & Communication'
};

// Get general category for a specific skill
function getSkillCategory(skill: string): string {
  // Try direct match first
  const category = skillCategoryMap[skill];
  if (category) return category;
  
  // If no direct match, check if the skill contains any category keywords
  const lowerSkill = skill.toLowerCase();
  if (lowerSkill.includes('audio') || lowerSkill.includes('sound')) return 'Audio Production';
  if (lowerSkill.includes('video') || lowerSkill.includes('film')) return 'Video Editing';
  if (lowerSkill.includes('design') || lowerSkill.includes('graphic')) return 'Digital Design';
  if (lowerSkill.includes('3d') || lowerSkill.includes('animation')) return '3D Animation';
  if (lowerSkill.includes('photo')) return 'Photography';
  if (lowerSkill.includes('game')) return 'Game Development';
  if (lowerSkill.includes('music')) return 'Music Production';
  if (lowerSkill.includes('excel') || lowerSkill.includes('data') || lowerSkill.includes('analytics') || lowerSkill.includes('sql')) return 'Data & Analytics';
  if (lowerSkill.includes('presentation') || lowerSkill.includes('powerpoint') || lowerSkill.includes('keynote') || lowerSkill.includes('speaking')) return 'Presentation & Communication';
  
  // If no category matches, return the skill itself as a general category
  return skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
}

import { 
  collection, 
  doc, 
  writeBatch,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { getDb } from './firebase';
import { showError } from './alerts';

// Initialize Hugging Face client
const API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;

// Get popular skills from user profiles
async function getPopularSkills(): Promise<string[]> {
  try {
    const db = await getDb();
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    // Count category occurrences
    const categoryCounts: { [key: string]: number } = {};
    snapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.skills && Array.isArray(userData.skills)) {
        userData.skills.forEach((skill: string) => {
          const category = getSkillCategory(skill);
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    // Sort categories by popularity
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);

    // If no categories found, return default categories
    if (sortedCategories.length === 0) {
      return [
        'Audio Production',
        'Video Editing',
        'Digital Design',
        '3D Animation',
        'Photography'
      ];
    }

    return sortedCategories;
  } catch (error) {
    console.error('Error fetching popular skills:', error);
    // Return default categories if there's an error
    return [
      'Audio Production',
      'Video Editing',
      'Digital Design',
      '3D Animation',
      'Photography'
    ];
  }
}

// Default challenge templates
function getDefaultChallenge(type: 'weekly' | 'monthly'): any {
  const categories = [
    'Audio Production',
    'Video Editing',
    'Digital Design',
    'UI/UX Design',
    'Photography',
    'Data & Analytics',
    'Presentation & Communication',
    'Music Production',
    '3D Animation',
    'Game Development'
  ];
  
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    title: `${type === 'weekly' ? 'Weekly' : 'Monthly'} ${randomCategory} Challenge`,
    description: `Showcase your ${randomCategory} expertise and collaborate with others in this ${type === 'weekly' ? 'Week' : 'Month'}'s creative challenge.`,
    requirements: [
      {
        type: 'Trades',
        count: type === 'weekly' ? 2 : 4,
        skillCategory: randomCategory
      },
      {
        type: 'Collaborations',
        count: type === 'weekly' ? 1 : 2,
        skillCategory: 'Any'
      },
      {
        type: 'Endorsements',
        count: type === 'weekly' ? 2 : 5,
        skillCategory: randomCategory
      }
    ],
    rewards: {
      xp: type === 'weekly' ? 200 : 500,
      badge: `${type === 'weekly' ? 'Weekly' : 'Monthly'}${randomCategory.replace(/\s+/g, '')}Master`
    }
  };
}

// Generate variations on the default challenge
async function generateVariation(type: 'weekly' | 'monthly', index: number): Promise<any> {
  const popularCategories = await getPopularSkills(); // Now returns categories instead of specific skills
  const categories = popularCategories.slice(0, 5); // Take top 5 most popular categories
  const types = ['Trades', 'Collaborations', 'Endorsements'];
  const category = categories[index % categories.length];
  const requirements = [];
  
  // Add main requirement
  requirements.push({
    type: types[index % types.length],
    count: type === 'weekly' ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 3,
    skillCategory: category
  });
  
  // Add collaboration requirement with 50% chance
  if (Math.random() > 0.5) {
    requirements.push({
      type: 'Collaborations',
      count: type === 'weekly' ? 1 : 2,
      skillCategory: 'Any'
    });
  }
  
  // Add endorsement requirement with 30% chance
  if (Math.random() > 0.7) {
    requirements.push({
      type: 'Endorsements',
      count: type === 'weekly' ? 2 : 4,
      skillCategory: category
    });
  }
  
  const descriptions = {
    'Audio Production': 'Master the art of sound design, mixing, and audio post-production.',
    'Music Production': 'Create and produce original music, from composition to final mix.',
    'Video Editing': 'Create compelling video content through expert editing and production.',
    'Motion Graphics': 'Combine animation and graphic design for dynamic visual content.',
    'Digital Design': 'Create stunning visual designs that communicate and inspire.',
    'UI/UX Design': 'Design intuitive and engaging user interfaces and experiences.',
    '3D Animation': 'Bring ideas to life through 3D modeling, animation, and rendering.',
    'Game Development': 'Create interactive experiences through game design and development.',
    'Photography': 'Capture and edit remarkable photos that tell powerful stories.',
    'Data & Analytics': 'Transform raw data into actionable insights through analysis and visualization.',
    'Presentation & Communication': 'Create and deliver engaging presentations that effectively communicate ideas.'
  };
  
  // Get description based on category, or generate a generic one if not in preset list
  const description = descriptions[category] || 
    `Master the art of ${category} and showcase your expertise in this field.`;
  
  return {
    title: `${type === 'weekly' ? 'Weekly' : 'Monthly'} ${category} Challenge`,
    description: `${description} This ${type === 'weekly' ? 'Week' : 'Month'}, push your ${category} skills to new heights!`,
    requirements,
    rewards: {
      xp: type === 'weekly' ? 100 + Math.floor(Math.random() * 200) : 500 + Math.floor(Math.random() * 500),
      badge: `${type === 'weekly' ? 'Weekly' : 'Monthly'}${category.replace(/\s+/g, '')}Master`
    }
  };
}

// Generate a new challenge
export async function generateChallenge(type: 'weekly' | 'monthly', useAI = false): Promise<string> {
  console.log(`Generating ${type} challenge (variation)`);
  
  try {
    // Generate a variation based on popular skills
    const variation = await generateVariation(type, Math.floor(Math.random() * 100));
    
    // Create the challenge in Firestore
    const db = await getDb();
    const docRef = await addDoc(collection(db, 'challenges'), {
      ...variation,
      type,
      status: 'pending',
      participants: [],
      completions: [],
      source: 'variation',
      startDate: serverTimestamp(),
      endDate: Timestamp.fromDate(
        type === 'weekly' 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`Challenge created successfully with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Failed to generate challenge:', error);
    await showError(
      'Challenge Generation Error',
      'Failed to generate challenge. Please try again.'
    );
    throw error;
  }
}

// Delete all existing challenges
async function deleteAllChallenges(): Promise<void> {
  console.log('Deleting all existing challenges...');
  
  try {
    const challengesQuery = query(
      collection(await getDb(), 'challenges'),
      where('status', 'in', ['pending', 'live'])
    );
    
    const snapshot = await getDocs(challengesQuery);
    const db = await getDb();
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${snapshot.size} challenges`);
  } catch (error) {
    console.error('Error deleting challenges:', error);
    throw error;
  }
}

// Generate fresh set of challenges
export async function checkAndGenerateChallenges(): Promise<void> {
  try {
    // First, delete all existing challenges
    await deleteAllChallenges();

    console.log('Generating fresh set of challenges...');
    
    // Generate exactly 10 weekly challenges
    console.log('Generating 10 weekly challenges...');
    for (let i = 0; i < 10; i++) {
      await generateChallenge('weekly');
      console.log(`Generated weekly challenge ${i + 1}/10`);
      
      // Add small delay between generations
      if (i < 9) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Generate exactly 10 monthly challenges
    console.log('Generating 10 monthly challenges...');
    for (let i = 0; i < 10; i++) {
      await generateChallenge('monthly');
      console.log(`Generated monthly challenge ${i + 1}/10`);
      
      // Add small delay between generations
      if (i < 9) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('Successfully generated all new challenges');
  } catch (error) {
    console.error('Error generating challenges:', error);
    await showError(
      'Challenge Generation Error',
      'Failed to generate challenges. Please try again later.'
    );
    throw error;
  }
}

// Initialize challenges for the first time
export async function initializeChallenges(): Promise<void> {
  console.log('Initializing challenges...');
  await checkAndGenerateChallenges();
}
