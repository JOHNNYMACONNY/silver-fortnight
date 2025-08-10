import React from 'react';
import { RenderProfiler } from '../../utils/renderProfiler';

/**
 * Higher-order component that wraps a component with the RenderProfiler
 * 
 * @param Component The component to profile
 * @param id Optional custom ID for the profiler (defaults to component's display name)
 * @returns A wrapped component with profiling
 */
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id?: string
): React.FC<P> {
  const profilerId = id || Component.displayName || Component.name || 'UnknownComponent';
  
  const ProfiledComponent: React.FC<P> = (props) => {
    return (
      <RenderProfiler id={profilerId}>
        <Component {...props} />
      </RenderProfiler>
    );
  };
  
  // Set display name for easier debugging
  ProfiledComponent.displayName = `Profiled(${profilerId})`;
  
  return ProfiledComponent;
}

/**
 * Component wrapper that profiles renders
 * 
 * Usage example:
 * 
 * ```tsx
 * <ProfiledComponent id="MyComponent">
 *   <MyComponent />
 * </ProfiledComponent>
 * ```
 */
export const ProfiledComponent: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  return (
    <RenderProfiler id={id}>
      {children}
    </RenderProfiler>
  );
};

export default ProfiledComponent;
