import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in",
      className
    )}>
      <div className="bg-surface-100 dark:bg-surface-800 p-4 rounded-full mb-4 ring-4 ring-surface-50 dark:ring-surface-900 transition-all">
        <Icon size={32} className="text-surface-400 dark:text-surface-500" />
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xs mb-6">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};