import React from 'react';
import useAutoResolution from '../../hooks/useAutoResolution';

/**
 * Provider component that runs auto-resolution in the background
 * This replaces the need for Firebase Cloud Functions
 */
interface AutoResolutionProviderProps {
  children: React.ReactNode;
}

export const AutoResolutionProvider: React.FC<AutoResolutionProviderProps> = ({ children }) => {
  // This hook will automatically run auto-resolution when users visit the app
  useAutoResolution();

  // This provider doesn't render anything special, just runs the hook
  return <>{children}</>;
};

export default AutoResolutionProvider;
