import React from 'react';
import useGamificationIntegration from '../../hooks/useGamificationIntegration';

/**
 * Component that sets up gamification integration
 * This component doesn't render anything but sets up the necessary hooks
 */
export const GamificationIntegration: React.FC = () => {
  useGamificationIntegration();
  return null;
};

export default GamificationIntegration;
