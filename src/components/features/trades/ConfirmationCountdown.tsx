import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { calculateAutoCompletionDate, calculateAutoCompletionCountdown } from '../../../services/firestore-exports';

interface ConfirmationCountdownProps {
  completionRequestedAt: Timestamp | Date;
  className?: string;
}

export const ConfirmationCountdown: React.FC<ConfirmationCountdownProps> = ({ 
  completionRequestedAt, 
  className = '' 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const autoCompleteDate = calculateAutoCompletionDate(completionRequestedAt);
      const now = new Date();
      
      if (now >= autoCompleteDate) {
        setTimeRemaining('Auto-completion imminent');
        setDaysRemaining(0);
        setIsUrgent(true);
        return;
      }
      
      const diffTime = autoCompleteDate.getTime() - now.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      
      setDaysRemaining(diffDays);
      setIsUrgent(diffDays <= 3);
      
      if (diffDays > 0) {
        setTimeRemaining(`Auto-completes in ${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`);
      } else if (diffHours > 0) {
        setTimeRemaining(`Auto-completes in ${diffHours} hour${diffHours !== 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`Auto-completes in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`);
      }
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60 * 1000); // Update every minute
    
    return () => clearInterval(interval);
  }, [completionRequestedAt]);

  const getProgressPercentage = () => {
    const totalDays = 14;
    const remainingDays = Math.max(0, daysRemaining);
    return ((totalDays - remainingDays) / totalDays) * 100;
  };

  const getColorClasses = () => {
    if (daysRemaining <= 1) {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-300',
        icon: 'text-red-600 dark:text-red-400',
        progress: 'bg-red-500'
      };
    } else if (daysRemaining <= 3) {
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: 'text-yellow-600 dark:text-yellow-400',
        progress: 'bg-yellow-500'
      };
    } else {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-300',
        icon: 'text-blue-600 dark:text-blue-400',
        progress: 'bg-blue-500'
      };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div 
      className={`p-4 ${colors.bg} border ${colors.border} rounded-lg ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${colors.icon}`}>
          {isUrgent ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${colors.text}`}>
            {isUrgent ? 'Urgent: Auto-Completion Pending' : 'Auto-Completion Countdown'}
          </h4>
          <p className={`text-sm ${colors.text} mt-1`}>
            {timeRemaining}
          </p>
          <p className={`text-xs ${colors.text} mt-2 opacity-75`}>
            This trade will be automatically marked as completed if no action is taken within 14 days of the completion request.
          </p>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className={colors.text}>Progress</span>
              <span className={colors.text}>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div 
                className={`h-2 rounded-full ${colors.progress}`}
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
