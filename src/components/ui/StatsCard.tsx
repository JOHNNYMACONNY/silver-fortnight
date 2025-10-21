import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, className }) => {
  return (
    <div className={`stats-card ${className}`}>
      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-4xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
};

export default StatsCard;
