import { awardXP } from '../services/gamification';
import { XPSource } from '../types/gamification';
import { logger } from '@utils/logging/logger';

export const initializeTestUserXP = async (userId: string) => {
  try {
    logger.debug('Initializing test XP for user:', 'UTILITY', userId);
    
    // Award some initial XP to test the system
    const result = await awardXP(
      userId,
      100,
      XPSource.TRADE_COMPLETION,
      'test-trade-1',
      'Welcome bonus XP'
    );
    
    logger.debug('Test XP award result:', 'UTILITY', result);
    return result;
  } catch (error) {
    logger.error('Error initializing test XP:', 'UTILITY', {}, error as Error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
