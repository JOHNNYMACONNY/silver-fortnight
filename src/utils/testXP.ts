import { awardXP } from '../services/gamification';
import { XPSource } from '../types/gamification';

export const initializeTestUserXP = async (userId: string) => {
  try {
    console.log('Initializing test XP for user:', userId);
    
    // Award some initial XP to test the system
    const result = await awardXP(
      userId,
      100,
      XPSource.TRADE_COMPLETION,
      'test-trade-1',
      'Welcome bonus XP'
    );
    
    console.log('Test XP award result:', result);
    return result;
  } catch (error) {
    console.error('Error initializing test XP:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
