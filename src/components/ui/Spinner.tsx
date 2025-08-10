import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'primary' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-orange-500',
    white: 'border-gray-200 border-t-white',
    gray: 'border-gray-100 border-t-gray-500',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
