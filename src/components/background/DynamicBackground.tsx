import React, { Suspense, lazy } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface DynamicBackgroundProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  className?: string;
}

const WebGLCanvas = lazy(() => import('./WebGLCanvas'));

const StaticGradientBackground: React.FC<DynamicBackgroundProps> = ({ colors, className }) => (
  <div
    className={className}
    style={{
      background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
      opacity: 0.3,
    }}
  />
);

export const DynamicBackground: React.FC<DynamicBackgroundProps> = (props) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <StaticGradientBackground {...props} />;
  }

  return (
    <Suspense fallback={<StaticGradientBackground {...props} />}>
      <WebGLCanvas {...props} />
    </Suspense>
  );
};
