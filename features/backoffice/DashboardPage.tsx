import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Building2, Users, Activity } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState({ totalClinics: 0, totalUsers: 0, activeSubscriptions: 0 });

    useEffect(() => {
        api.backoffice.getStats().then(setStats).catch(console.error);
    }, []);

    const cards = [
        { label: 'Total Clinics', value: stats.totalClinics, icon: Building2, color: 'bg-blue-500' },
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-green-500' },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: Activity, color: 'bg-purple-500' },
    ];

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Backoffice Dashboard</h1>
                <p className="text-surface-500">System Overview</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <Card key={idx} className="p-6 border-surface-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-surface-500 text-sm font-medium">{card.label}</p>
                                <h3 className="text-3xl font-bold text-surface-900 mt-1">{card.value}</h3>
                            </div>
                            <div className={`${card.color} p-4 rounded-xl text-white shadow-lg shadow-surface-200`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
