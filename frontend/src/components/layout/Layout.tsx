import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MobileMenuProvider } from './MobileMenuContext';

interface LayoutProps {
  sidebar: React.ReactElement<any>;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <MobileMenuProvider openMobileMenu={() => setIsMobileMenuOpen(true)}>
      <div className="flex h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 font-sans overflow-hidden transition-colors duration-300">
        {/* Desktop Sidebar */}
        <div className="hidden md:block h-full z-30 shadow-soft">{sidebar}</div>

        {/* Mobile Sidebar Overlay — solid scrim only; backdrop-blur on a
            full-viewport overlay is GPU-expensive and causes input lag. */}
        <div
          className={cn(
            'fixed inset-0 bg-surface-900/60 dark:bg-black/75 z-40 md:hidden transition-opacity duration-300',
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Sidebar */}
        <div
          className={cn(
            'fixed inset-y-0 start-0 z-50 w-72 bg-white dark:bg-surface-900 shadow-2xl transform transition-transform duration-300 md:hidden',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
          )}
        >
          {React.cloneElement(sidebar, { onMobileClose: () => setIsMobileMenuOpen(false) })}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 end-4 p-2 bg-surface-100 dark:bg-surface-800 rounded-full text-surface-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative animate-fade-in">
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  );
};
