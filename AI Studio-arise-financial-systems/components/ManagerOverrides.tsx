
import React from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { DollarSign, TrendingUp, Users, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ManagerOverrides: React.FC = () => {
    // Calculate total production and overrides
    const totalProduction = MOCK_TEAM.reduce((sum, member) => sum + member.production, 0);
    const totalOverrides = totalProduction * 0.15; // Assume 15% avg spread

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
            <h2 className="text-2xl font-bold text-slate-800">Overrides & Spreads</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Total Overrides (YTD)</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">${totalOverrides.toLocaleString()}</h3>
                    <div className="mt-2 text-xs text-green-600 font-bold flex items-center">
                        <TrendingUp size={14} className="mr-1" /> +12% from last year
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Avg Spread</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">15.0%</h3>
                    <div className="mt-2 text-xs text-slate-400">Target: 18%</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Writing Agents</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{MOCK_TEAM.length}</h3>
                    <div className="mt-2 text-xs text-slate-400">Active producers</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-6">Override Trend</h3>
                    <div className="h-72 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorOverride" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `$${v}`} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Area type="monotone" dataKey="override" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOverride)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-slate-700">
                        Top Contributing Agents
                    </div>
                    <div className="divide-y divide-gray-100">
                        {MOCK_TEAM.sort((a,b) => b.production - a.production).map((agent, i) => (
                            <div key={agent.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400 w-4">{i+1}</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{agent.name}</p>
                                        <p className="text-xs text-gray-500">${agent.production.toLocaleString()} Prod</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-indigo-600">+${(agent.production * 0.15).toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400">Override</p>
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
