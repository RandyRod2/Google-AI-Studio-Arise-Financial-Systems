import React, { useState, useMemo } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { DollarSign, TrendingUp, Users, PieChart, Clock, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TeamMember, OverrideRecord, User } from '../types';

const ManagerOverrides: React.FC = () => {
    const [currentUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('arise_active_session_v1');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const [teamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) { return MOCK_TEAM; }
    });

    // Real Automated Overrides Data Integration
    const overridesData = useMemo(() => {
        const stored = localStorage.getItem('arise_overrides_v1');
        const allOverrides: OverrideRecord[] = stored ? JSON.parse(stored) : [];
        // Filter for current user's overrides (matching dashboard context)
        const myOverrides = allOverrides.filter(o => o.managerId === currentUser?.id || (currentUser?.role === 'ADMIN' && o.managerId === 't1'));
        
        const total = myOverrides.reduce((sum, o) => sum + o.amount, 0);
        const upfront = total * 0.75;
        const deferred = total * 0.25;

        // Group by agent for contribution list
        const agentBreakdown: Record<string, number> = {};
        myOverrides.forEach(o => {
            agentBreakdown[o.writingAgentName] = (agentBreakdown[o.writingAgentName] || 0) + o.amount;
        });

        const sortedAgents = Object.entries(agentBreakdown)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        return { 
            total, 
            upfront, 
            deferred, 
            sortedAgents, 
            history: myOverrides.sort((a,b) => b.timestamp.localeCompare(a.timestamp)) 
        };
    }, [currentUser]);

    // Simulated Trend for the chart based on total
    const chartData = [
        { month: 'Jan', override: overridesData.total * 0.4 },
        { month: 'Feb', override: overridesData.total * 0.6 },
        { month: 'Mar', override: overridesData.total * 0.5 },
        { month: 'Apr', override: overridesData.total * 0.7 },
        { month: 'May', override: overridesData.total * 0.8 },
        { month: 'Jun', override: overridesData.total * 1.0 },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-white">Overrides & Spreads</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Total Overrides (Issued)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-indigo-400">${overridesData.total.toLocaleString()}</h3>
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20"><DollarSign size={16} /></div>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Upfront (75%)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-green-400">${overridesData.upfront.toLocaleString()}</h3>
                        <div className="p-1.5 bg-green-500/10 text-green-400 rounded border border-green-500/20"><CheckCircle2 size={16} /></div>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Deferred (25%)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-blue-400">${overridesData.deferred.toLocaleString()}</h3>
                        <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20"><Clock size={16} /></div>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase">Unique Transactions</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-2xl font-bold text-white">{overridesData.history.length}</h3>
                        <div className="p-1.5 bg-slate-800 text-slate-400 rounded border border-slate-700"><FileText size={16} /></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm p-6">
                        <h3 className="font-bold text-white mb-6">Override Trend</h3>
                        <div className="h-72 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs><linearGradient id="colorOverride" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `$${v}`} />
                                    <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Override']} />
                                    <Area type="monotone" dataKey="override" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOverride)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Transaction Log */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5 font-semibold text-white">Recent Override Transactions</div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Writing Agent</th>
                                        <th className="px-6 py-3">Carrier / Product</th>
                                        <th className="px-6 py-3 text-right">Spread %</th>
                                        <th className="px-6 py-3 text-right">Override</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {overridesData.history.slice(0, 15).map((o) => (
                                        <tr key={o.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs text-slate-400">{o.timestamp.split('T')[0]}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-white">{o.writingAgentName}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-200">{o.carrier}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">{o.product}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs font-bold text-indigo-400">{o.percentage}%</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-green-400">${o.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {overridesData.history.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No override transactions processed yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-fit">
                    <div className="p-4 border-b border-white/5 bg-white/5 font-semibold text-white">Top Contributing Agents</div>
                    <div className="divide-y divide-white/5">
                        {overridesData.sortedAgents.map((agent, i) => (
                            <div key={agent.name} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-4">{i+1}</span>
                                    <div><p className="text-sm font-bold text-white">{agent.name}</p></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-indigo-400">+${agent.amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500">Total Override</p>
                                </div>
                            </div>
                        ))}
                        {overridesData.sortedAgents.length === 0 && (
                            <div className="p-8 text-center text-slate-500 italic text-sm">No production data available.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerOverrides;
