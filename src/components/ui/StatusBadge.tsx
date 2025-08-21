import React from 'react';

type StatusType = 'completed' | 'running' | 'pending' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
}

const statusConfig = {
  completed: {
    bg: 'bg-status-completed/10',
    text: 'text-status-completed',
    icon: '✅'
  },
  running: {
    bg: 'bg-status-running/10', 
    text: 'text-status-running',
    icon: '🔄'
  },
  pending: {
    bg: 'bg-status-pending/10',
    text: 'text-status-pending', 
    icon: '⏳'
  },
  error: {
    bg: 'bg-status-error/10',
    text: 'text-status-error',
    icon: '❌'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const config = statusConfig[status];
  
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${config.bg} ${config.text}
    `}>
      <span className="text-xs">{config.icon}</span>
      {children}
    </span>
  );
};