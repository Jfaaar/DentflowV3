import React from 'react';
import { cn } from '../../lib/utils';

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title, children, className }) => {
  return (
    <header 
      className={cn(
        "px-6 md:px-8 py-5 flex items-center justify-between bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 z-10 sticky top-0 transition-colors duration-300",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {children}
      </div>
    </header>
  );
};