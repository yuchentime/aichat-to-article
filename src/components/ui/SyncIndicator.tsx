import React from 'react';
import { useI18n } from '../../common/i18n/i18n';

interface SyncIndicatorProps {
  synced: boolean;
  className?: string;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ synced, className = '' }) => {
  const { t } = useI18n();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`
        w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
        ${synced
          ? 'bg-green-500 border-green-500 shadow-pulse'
          : 'bg-orange-500 border-orange-500 animate-pulse'
        }
      `} />
      <span className={`
        text-xs font-medium transition-colors duration-300
        ${synced
          ? 'text-green-600 dark:text-green-400'
          : 'text-orange-600 dark:text-orange-400'
        }
      `}>
        {synced ? t('synced'): t('not_sync') }
      </span>
    </div>
  );
};