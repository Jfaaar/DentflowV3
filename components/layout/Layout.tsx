import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LayoutProps {
  sidebar: React.ReactElement<any>;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full z-30 shadow-soft">
        {sidebar}
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={cn(
        "fixed inset-0 bg-surface-900/50 dark:bg-black/70 z-40 md:hidden transition-opacity duration-300 backdrop-blur-sm",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsMobileMenuOpen(false)} />

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-surface-900 shadow-2xl transform transition-transform duration-300 md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {React.cloneElement(sidebar, { onMobileClose: () => setIsMobileMenuOpen(false) })}
        <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-500"
        >
            <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative animate-fade-in">
        {/* Mobile Header Trigger */}
        <div className="md:hidden p-4 bg-white/80 dark:bg-surface-900/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 flex items-center justify-between sticky top-0 z-20">
            <div className="font-bold text-lg flex items-center gap-2 text-surface-900 dark:text-white">
                 <span className="bg-primary-600 text-white p-1 rounded-md text-sm">DF</span> DentFlow
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
                <Menu size={24} />
            </button>
        </div>

        {children}
      </main>
    </div>
  );
};