import React, { useState } from 'react';
import { LayoutDashboard, Building2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackofficeSidebarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    onLogout: () => void;
    onMobileClose?: () => void;
}

export const BackofficeSidebar: React.FC<BackofficeSidebarProps> = ({ activeTab, onNavigate, onLogout, onMobileClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
        { id: 'clinics', icon: Building2, label: 'Clinics' },
    ];

    const handleNavigate = (id: string) => {
        onNavigate(id);
        if (onMobileClose) onMobileClose();
    };

    return (
        <aside className={cn(
            "h-screen bg-surface-900 text-white transition-all duration-300 z-50 flex flex-col border-r border-surface-800",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Header */}
            <div className={cn(
                "flex items-center gap-3 transition-all duration-300",
                isCollapsed ? "p-4 justify-center" : "p-6"
            )}>
                <div className="bg-primary-500 p-2 rounded-xl shrink-0">
                    <LayoutDashboard size={24} className="text-white" />
                </div>
                <div className={cn("overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                    <span className="font-bold text-xl tracking-tight whitespace-nowrap">Backoffice</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        title={isCollapsed ? item.label : ''}
                        className={cn(
                            "w-full flex items-center rounded-xl transition-all duration-200 group relative",
                            activeTab === item.id
                                ? "bg-primary-600 text-white shadow-lg shadow-primary-900/20"
                                : "text-surface-400 hover:bg-surface-800 hover:text-white",
                            isCollapsed ? "justify-center p-3" : "justify-start gap-3 p-3"
                        )}
                    >
                        <item.icon size={20} className={cn("shrink-0", activeTab === item.id ? 'animate-bounce-subtle' : '')} />

                        <span className={cn(
                            "font-medium transition-all duration-300 whitespace-nowrap",
                            isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                        )}>
                            {item.label}
                        </span>

                        {!isCollapsed && activeTab === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-surface-800 space-y-2">
                <button
                    onClick={onLogout}
                    title="Logout"
                    className={cn(
                        "w-full flex items-center rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors group",
                        isCollapsed ? "justify-center p-3" : "gap-3 p-3"
                    )}
                >
                    <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                    <span className={cn(
                        "font-medium transition-all duration-300 whitespace-nowrap",
                        isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                    )}>
                        Logout
                    </span>
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex w-full items-center justify-center p-2 text-surface-500 hover:text-white hover:bg-surface-800 rounded-lg transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
        </aside>
    );
};
