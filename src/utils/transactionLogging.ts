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
  console.log(
    `%c${log.status.toUpperCase()}`,
    `color: ${log.status === 'completed' ? 'green' : log.status === 'failed' ? 'red' : 'blue'}`
  );
  console.log('Timestamp:', formattedLog.formattedTimestamp);
  console.log('Details:', log.details);
  if (log.error) {
    console.error('Error:', log.error);
  }
  console.groupEnd();
}