import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { MOCK_TEAM } from '../services/mockData';
import { Trophy, TrendingUp, Users, AlertCircle, X, ChevronRight, UserPlus, Phone, FileText, CheckCircle2, Clock, Plus, BarChart3, Download, Edit2, Save, Mail, GripVertical, UserCheck, Loader2, DollarSign, Calendar, LayoutPanelLeft, UserMinus } from 'lucide-react';
import { UserProfile, TeamMember, Recruit, ViewState, Client, Application, OverrideRecord } from '../types';

interface ManagerDashboardProps {
  userProfile?: UserProfile;
  onNavigate?: (view: ViewState) => void;
  clients: Client[];
  applications: Application[];
  recruits: Recruit[];
}

type TimeFrame = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YTD';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ userProfile, onNavigate, clients, applications, recruits }) => {
    // --- State Management ---
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTHLY');
    
    // Team Members (Agents)
    const [teamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) { return MOCK_TEAM; }
    });

    // Modals
    const [isActiveAgentsModalOpen, setIsActiveAgentsModalOpen] = useState(false);
    
    // Filter for Active Agents
    const activeAgents = teamMembers.filter(m => m.role === 'AGENT' || m.role === 'RECRUIT' || m.role === 'MANAGER');

    // --- Dynamic Calculations based on TimeFrame ---
    const getScaleFactor = (tf: TimeFrame) => {
        switch(tf) {
            case 'DAILY': return 1 / 260; 
            case 'WEEKLY': return 1 / 52;
            case 'MONTHLY': return 1 / 12;
            case 'YTD': return 1;
            default: return 1;
        }
    };

    const scaleFactor = getScaleFactor(timeFrame);

    // Calculate Real Stats from CRM data
    const realStats = useMemo(() => {
        const totalTeamAppsCount = applications.length; 
        const allPolicies = clients.flatMap(c => c.policies);
        const totalTeamProductionSum = allPolicies.reduce((acc, curr) => acc + curr.premium, 0);
        
        return {
            totalTeamApps: Math.round(totalTeamAppsCount * scaleFactor),
            totalTeamProduction: Math.round(totalTeamProductionSum * scaleFactor)
        };
    }, [clients, applications, scaleFactor]);

    const totalTeamApps = realStats.totalTeamApps;
    const totalTeamProduction = realStats.totalTeamProduction;
    
    // Real Automated Overrides Integration
    const realOverridesData = useMemo(() => {
        const stored = localStorage.getItem('arise_overrides_v1');
        const allOverrides: OverrideRecord[] = stored ? JSON.parse(stored) : [];
        // Filtering for 't1' (Randy) as the current user's overrides for dashboard demo
        const myOverrides = allOverrides.filter(o => o.managerId === 't1' || o.managerId === 'u1'); 
        
        const total = myOverrides.reduce((sum, o) => sum + o.amount, 0);
        return { total: total * scaleFactor };
    }, [scaleFactor]);

    const totalOverrides = realOverridesData.total;
    const overrideUpfront = totalOverrides * 0.75;
    const overrideDeferred = totalOverrides * 0.25;

    // Performance Chart Data - Aggregated per agent from real state
    const chartData = useMemo(() => {
        return teamMembers
            .map(m => {
                const agentClients = clients.filter(c => c.agentId === m.id || (m.id === 't1' && c.agentId === 'u1'));
                const agentClientIds = new Set(agentClients.map(c => c.id));
                const agentProd = agentClients.reduce((s, c) => s + c.policies.reduce((ps, p) => ps + p.premium, 0), 0);
                const agentAppsCount = applications.filter(app => agentClientIds.has(app.clientId)).length;

                return {
                    name: m.name.split(' ')[0],
                    production: Math.round(agentProd * scaleFactor),
                    apps: Math.round(agentAppsCount * scaleFactor)
                };
            })
            .sort((a, b) => b.production - a.production)
            .slice(0, 8);
    }, [teamMembers, clients, applications, scaleFactor]);

    const getTrendLabel = (tf: TimeFrame) => {
        switch(tf) {
            case 'DAILY': return 'vs yesterday';
            case 'WEEKLY': return 'vs last week';
            case 'MONTHLY': return 'vs last month';
            case 'YTD': return 'vs last year';
        }
    };

    return (
        <div className="animate-fade-in space-y-6 relative pb-10">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Manager Hub</h2>
                    <p className="text-sm text-slate-400">Overview of agency performance and overrides.</p>
                </div>
                
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-sm flex items-center">
                    {(['DAILY', 'WEEKLY', 'MONTHLY', 'YTD'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                timeFrame === tf 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {tf.charAt(0) + tf.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-xl shadow-lg border border-slate-800 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                            Team Production
                        </p>
                        <h3 className="text-2xl font-bold mt-1">${totalTeamProduction.toLocaleString()}</h3>
                        <div className="mt-3 flex items-center text-[10px] text-green-400 font-medium">
                            <TrendingUp size={12} className="mr-1" /> +18% {getTrendLabel(timeFrame)}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Team Apps</p>
                            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                                <FileText size={14} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-1">{totalTeamApps.toLocaleString()}</h3>
                    </div>
                </div>
                
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Upfront Overrides</p>
                            <div className="p-1.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                                <DollarSign size={14} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-1">${Math.round(overrideUpfront).toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Deferred Overrides</p>
                            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">
                                <Clock size={14} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-1">${Math.round(overrideDeferred).toLocaleString()}</h3>
                    </div>
                </div>
                
                <div onClick={() => setIsActiveAgentsModalOpen(true)} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Active Agents</p>
                            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                                <Users size={14} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-1">{activeAgents.length}</h3>
                    </div>
                </div>

                <div onClick={() => onNavigate?.('RECRUITS')} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm cursor-pointer hover:border-blue-500/50 transition-all flex flex-col justify-between">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Recruits In Pipeline</p>
                            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                                <UserMinus size={14} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-1">{recruits.length}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <BarChart3 className="text-indigo-400" size={20} /> Team Performance Breakdown
                            </h3>
                        </div>
                    </div>
                    <div className="p-6 flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 25, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`}/>
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Production']} />
                                <Bar dataKey="production" name="Production" radius={[4, 4, 0, 0]} barSize={45}>
                                    <LabelList dataKey="production" position="top" formatter={(v: number) => `$${v.toLocaleString()}`} fill="#ffffff" fontSize={11} fontWeight="bold" offset={10} />
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#4f46e5'} opacity={1 - index * 0.08} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                        <h3 className="font-bold text-white mb-4 flex items-center">
                            <AlertCircle size={18} className="mr-2 text-red-500" /> At-Risk Agents
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-red-900/10 rounded-lg border border-red-500/20">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-red-400 border border-slate-700">RH</div>
                                <div>
                                    <p className="text-sm font-medium text-red-200">Ryan Howard</p>
                                    <p className="text-xs text-red-400">Zero production for 14 days.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white">
                        <h3 className="font-bold mb-2">Recruiting Goal</h3>
                        <p className="text-indigo-100 text-sm mb-4">You are {Math.max(0, 5 - recruits.length)} recruits away from hitting your monthly target.</p>
                        <div className="w-full bg-indigo-900/50 rounded-full h-2 mb-4">
                            <div className="bg-white h-2 rounded-full transition-all duration-500" style={{width: `${Math.min(100, (recruits.length / 5) * 100)}%`}}></div>
                        </div>
                        <button onClick={() => onNavigate?.('RECRUITS')} className="w-full py-2 bg-white text-indigo-600 font-medium rounded-lg text-sm hover:bg-indigo-50 transition-all shadow-sm flex items-center justify-center gap-2">Open Recruit Pipeline <ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
