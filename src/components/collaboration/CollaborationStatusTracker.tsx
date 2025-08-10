import React from 'react';
import { CollaborationRoleData, RoleState, CollaborationStatus, CompletionRequestStatus } from '../../types/collaboration';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';
import Box from '../layout/primitives/Box';

interface CollaborationStatusTrackerProps {
  roles: CollaborationRoleData[];
  className?: string;
}

export const CollaborationStatusTracker: React.FC<CollaborationStatusTrackerProps> = ({
  roles,
  className = ''
}) => {
  // Calculate progress statistics
  const totalRoles = roles.length;
  const filledRoles = roles.filter(role => role.status === RoleState.FILLED || role.status === RoleState.COMPLETED).length;
  const completedRoles = roles.filter(role => role.status === RoleState.COMPLETED).length;
  const openRoles = roles.filter(role => role.status === RoleState.OPEN).length;
  
  // Calculate percentages
  const filledPercentage = totalRoles > 0 ? Math.round((filledRoles / totalRoles) * 100) : 0;
  const completedPercentage = totalRoles > 0 ? Math.round((completedRoles / totalRoles) * 100) : 0;
  
  // Determine overall status
  let overallStatus: CollaborationStatus;
  
  if (openRoles === totalRoles) {
    overallStatus = CollaborationStatus.RECRUITING;
  } else if (completedRoles === totalRoles) {
    overallStatus = CollaborationStatus.COMPLETED;
  } else if (filledRoles === 0 && totalRoles > 0) {
    overallStatus = CollaborationStatus.ABANDONED;
  } else {
    overallStatus = CollaborationStatus.IN_PROGRESS;
  }

  return (
    <Box className={`@container ${className}`} style={{ containerType: 'inline-size' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Collaboration Status
        </h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Status
            </span>
            <StatusBadge status={overallStatus} />
          </div>
        </div>
        <div className="space-y-4">
          {/* Roles Filled Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Roles Filled
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filledRoles}/{totalRoles}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full dark:bg-blue-500" 
                style={{ width: `${filledPercentage}%` }}
              ></div>
            </div>
          </div>
          {/* Roles Completed Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Roles Completed
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completedRoles}/{totalRoles}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-green-600 h-2.5 rounded-full dark:bg-green-500" 
                style={{ width: `${completedPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        {/* Role Status List */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 text-foreground">
            Role Status
          </h4>
          <div className="space-y-2">
            {roles.map(role => (
              <RoleStatusItem key={role.id} role={role} />
            ))}
          </div>
        </div>
      </motion.div>
    </Box>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: CollaborationStatus }> = ({ status }) => {
  let bgColor, textColor, label;
  
  switch (status) {
    case CollaborationStatus.RECRUITING:
      bgColor = 'bg-blue-100 dark:bg-blue-900/20';
      textColor = 'text-blue-800 dark:text-blue-300';
      label = 'Recruiting';
      break;
    case CollaborationStatus.IN_PROGRESS:
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-300';
      label = 'In Progress';
      break;
    case CollaborationStatus.COMPLETED:
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-300';
      label = 'Completed';
      break;
    case CollaborationStatus.ABANDONED:
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-300';
      label = 'Abandoned';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
};

// Role Status Item Component
const RoleStatusItem: React.FC<{ role: CollaborationRoleData }> = ({ role }) => {
  let icon, textColor;
  
  switch (role.status) {
    case RoleState.OPEN:
      icon = <ClockIcon className="h-4 w-4 text-blue-500" />;
      textColor = 'text-gray-700 dark:text-gray-300';
      break;
    case RoleState.FILLED:
      icon = role.completionStatus === CompletionRequestStatus.PENDING 
        ? <ClockIcon className="h-4 w-4 text-yellow-500" />
        : <ClockIcon className="h-4 w-4 text-blue-500" />;
      textColor = 'text-gray-700 dark:text-gray-300';
      break;
    case RoleState.COMPLETED:
      icon = <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      textColor = 'text-gray-700 dark:text-gray-300';
      break;
    case RoleState.ABANDONED:
      icon = <XCircleIcon className="h-4 w-4 text-red-500" />;
      textColor = 'text-gray-500 dark:text-gray-400';
      break;
  }
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        {icon}
        <span className={`ml-2 text-sm ${textColor}`}>{role.title}</span>
      </div>
      <RoleStatusBadge status={role.status} completionStatus={role.completionStatus} />
    </div>
  );
};

// Role Status Badge Component
const RoleStatusBadge: React.FC<{ 
  status: RoleState; 
  completionStatus?: CompletionRequestStatus;
}> = ({ status, completionStatus }) => {
  let bgColor, textColor, label;
  
  if (status === RoleState.OPEN) {
    bgColor = 'bg-blue-100 dark:bg-blue-900/20';
    textColor = 'text-blue-800 dark:text-blue-300';
    label = 'Open';
  } else if (status === RoleState.FILLED) {
    if (completionStatus === CompletionRequestStatus.PENDING) {
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-300';
      label = 'Pending Completion';
    } else {
      bgColor = 'bg-blue-100 dark:bg-blue-900/20';
      textColor = 'text-blue-800 dark:text-blue-300';
      label = 'In Progress';
    }
  } else if (status === RoleState.COMPLETED) {
    bgColor = 'bg-green-100 dark:bg-green-900/20';
    textColor = 'text-green-800 dark:text-green-300';
    label = 'Completed';
  } else if (status === RoleState.ABANDONED) {
    bgColor = 'bg-red-100 dark:bg-red-900/20';
    textColor = 'text-red-800 dark:text-red-300';
    label = 'Abandoned';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
};

export default CollaborationStatusTracker;
