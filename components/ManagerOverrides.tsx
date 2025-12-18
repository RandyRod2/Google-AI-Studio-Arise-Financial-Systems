
import React, { useState } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { DollarSign, TrendingUp, Users, PieChart, Clock, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TeamMember } from '../types';

const ManagerOverrides: React.FC = () => {
    // Initialize state from local storage to ensure synchronization with Manager Dashboard & Teams page
    const [teamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) {
            return MOCK_TEAM;
        }
    });

    // Calculate total production and overrides using same logic as ManagerDashboard
    const totalProduction = teamMembers.reduce((sum, member) => sum + member.production, 0);
    const totalOverrides = totalProduction * 0.15; // Assume 15% avg spread
    const overrideUpfront = totalOverrides * 0.75;
    const overrideDeferred = totalOverrides * 0.25;

    const data = [
        { month: 'Jan', override: 4500 },
        { month: 'Feb', override: 5200 },
        { month: 'Mar', override: 4800 },
        { month: 'Apr', override: 6100 },
        { month: 'May', override: 7500 },
        { month: 'Jun', override: 8200 },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-white">Overrides & Spreads</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Team Production */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Total Team Production</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-white">${totalProduction.toLocaleString()}</h3>
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-green-400 font-bold flex items-center">
                        <TrendingUp size={12} className="mr-1" /> +18% vs last month
                    </div>
                </div>

                {/* Total Overrides */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Total Overrides (Est)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-indigo-400">${totalOverrides.toLocaleString()}</h3>
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                        Based on 15% Avg Spread
                    </div>
                </div>

                {/* Upfront Split */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Override Upfront (75%)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-green-400">${overrideUpfront.toLocaleString()}</h3>
                        <div className="p-1.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                        Paid Immediately
                    </div>
                </div>

                {/* Deferred Split */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Override Deferred (25%)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-blue-400">${overrideDeferred.toLocaleString()}</h3>
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                        Accrued Backend
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm p-6">
                    <h3 className="font-bold text-white mb-6">Override Trend</h3>
                    <div className="h-72 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorOverride" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `$${v}`} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Override']}
                                />
                                <Area type="monotone" dataKey="override" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOverride)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/5 font-semibold text-white">
                        Top Contributing Agents
                    </div>
                    <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {teamMembers.sort((a,b) => b.production - a.production).map((agent, i) => (
                            <div key={agent.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-4">{i+1}</span>
                                    <div>
                                        <p className="text-sm font-bold text-white">{agent.name}</p>
                                        <p className="text-xs text-slate-400">${agent.production.toLocaleString()} Prod</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-indigo-400">+${(agent.production * 0.15).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500">Override</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerOverrides;
