import React from 'react';

interface SyncIndicatorProps {
  synced: boolean;
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ synced, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`
        w-2 h-2 rounded-full
        ${synced ? 'bg-sync-success' : 'bg-sync-pending'}
      `} />
      <span className={`
        text-xs
        ${synced ? 'text-sync-success' : 'text-sync-pending'}
      `}>
        {synced ? '已同步' : '未同步'}
      </span>
    </div>
  );
};