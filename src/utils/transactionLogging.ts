import { logger } from '@utils/logging/logger';
export interface TransactionLog {
  operation: string;
  timestamp: number;
  details: any;
  status: 'started' | 'completed' | 'failed';
  error?: string;
}

export const logTransaction = (log: TransactionLog): void => {
  const formattedLog = {
    ...log,
    formattedTimestamp: new Date(log.timestamp).toISOString(),
  };
  
  // Log to console with visual grouping and styling
  console.group(`🔄 Transaction: ${log.operation}`);
  logger.debug(`%c${log.status.toUpperCase()}`, 'UTILITY', `color: ${log.status === 'completed' ? 'green' : log.status === 'failed' ? 'red' : 'blue'}`);
  logger.debug('Timestamp:', 'UTILITY', formattedLog.formattedTimestamp);
  logger.debug('Details:', 'UTILITY', log.details);
  if (log.error) {
    logger.error('Error:', 'UTILITY', {}, log.error as Error);
  }
  console.groupEnd();
}