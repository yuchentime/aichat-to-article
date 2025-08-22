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
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
      ${config.bg} ${config.text} border border-current border-opacity-20
      transition-all duration-200 hover:scale-105
    `}>
      <span className="text-xs">{config.icon}</span>
      {children}
    </span>
  );
};