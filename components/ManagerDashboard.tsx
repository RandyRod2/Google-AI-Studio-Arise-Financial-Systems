
import React, { useState, useEffect } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { Trophy, TrendingUp, Users, AlertCircle, X, ChevronRight, UserPlus, Phone, FileText, CheckCircle2, Clock, Plus, BarChart3, Download, Edit2, Save, Mail, GripVertical, UserCheck, Loader2, DollarSign, Calendar } from 'lucide-react';
import { UserProfile, TeamMember, Recruit, ViewState } from '../types';

interface ManagerDashboardProps {
  userProfile?: UserProfile;
  onNavigate?: (view: ViewState) => void; 
}

type TimeFrame = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YTD';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ userProfile, onNavigate }) => {
    // --- State Management ---
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTHLY');
    
    // Team Members (Agents)
    const [teamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) { return MOCK_TEAM; }
    });

    // Recruits Pipeline
    const [recruits] = useState<Recruit[]>(() => {
        try {
            const saved = localStorage.getItem('arise_recruits');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    // Modals
    const [isActiveAgentsModalOpen, setIsActiveAgentsModalOpen] = useState(false);
    
    // Filter for Active Agents
    const activeAgents = teamMembers.filter(m => m.role === 'AGENT' || m.role === 'RECRUIT');

    // --- Dynamic Calculations based on TimeFrame ---
    const getScaleFactor = (tf: TimeFrame) => {
        switch(tf) {
            case 'DAILY': return 1 / 260; // Approx working days/year
            case 'WEEKLY': return 1 / 52;
            case 'MONTHLY': return 1 / 12;
            case 'YTD': return 1;
            default: return 1;
        }
    };

    const scaleFactor = getScaleFactor(timeFrame);

    // Calculate Scaled Production
    const totalTeamProduction = Math.round(teamMembers.reduce((acc, curr) => acc + curr.production, 0) * scaleFactor);
    const totalOverrides = totalTeamProduction * 0.15; // Assume 15% avg spread
    const overrideUpfront = totalOverrides * 0.75;
    const overrideDeferred = totalOverrides * 0.25;

    // Trend simulation based on timeframe
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
            {/* Header with Global Filter */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Manager Hub</h2>
                    <p className="text-sm text-slate-400">Overview of agency performance and overrides.</p>
                </div>
                
                {/* Global Filter Control */}
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

            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-xl shadow-lg border border-slate-800 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                            Team Production ({timeFrame === 'YTD' ? 'YTD' : timeFrame.charAt(0) + timeFrame.slice(1).toLowerCase()})
                        </p>
                        <h3 className="text-3xl font-bold mt-2">${totalTeamProduction.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center text-xs text-green-400 font-medium">
                            <TrendingUp size={14} className="mr-1" /> +18% {getTrendLabel(timeFrame)}
                        </div>
                    </div>
                    {/* Decor */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 size={64} className="text-white" />
                    </div>
                </div>
                
                {/* Override Upfront */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-xs font-bold uppercase">Override Upfront (75%)</p>
                            <div className="p-1.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-2">${Math.round(overrideUpfront).toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Paid immediately</div>
                </div>

                {/* Override Deferred */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 text-xs font-bold uppercase">Override Deferred (25%)</p>
                            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                                <Clock size={16} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mt-2">${Math.round(overrideDeferred).toLocaleString()}</h3>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">Back-end earnings</div>
                </div>
                
                {/* Active Agents Card */}
                <div 
                    onClick={() => setIsActiveAgentsModalOpen(true)}
                    className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase">Active Agents</p>
                            <h3 className="text-2xl font-bold text-white mt-2">{activeAgents.length}</h3>
                        </div>
                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                            <Users size={16} />
                        </div>
                    </div>
                    <p className="text-xs text-indigo-400 mt-4 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        View Roster <ChevronRight size={14} />
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leaderboard */}
                <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-white text-lg flex items-center">
                            <Trophy className="text-yellow-500 mr-2" size={20} /> Team Leaderboard
                        </h3>
                        <button 
                            onClick={() => onNavigate?.('LEADERBOARD')}
                            className="text-sm text-indigo-400 font-medium hover:underline flex items-center gap-1 hover:text-indigo-300"
                        >
                            View Full Report <ChevronRight size={14} />
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Rank</th>
                                <th className="px-6 py-3">Agent</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Production ({timeFrame})</th>
                                <th className="px-6 py-3 text-center">Policies</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {teamMembers
                                .map(m => ({
                                    ...m, 
                                    scaledProd: Math.round(m.production * scaleFactor),
                                    scaledPolicies: Math.max(1, Math.round(m.activePolicies * scaleFactor)) // Ensure at least 1 for active agents if ratio too small
                                }))
                                .sort((a,b) => b.scaledProd - a.scaledProd)
                                .slice(0, 5)
                                .map((member, index) => {
                                    const displayName = (member.id === 't1' && userProfile) ? userProfile.name : member.name;
                                    const displayAvatar = (member.id === 't1' && userProfile?.avatarUrl) ? userProfile.avatarUrl : member.avatarUrl;
                                    
                                    return (
                                        <tr key={member.id} className={`hover:bg-slate-800/50 transition-colors ${member.id === 't1' ? 'bg-indigo-500/10' : ''}`}>
                                            <td className="px-6 py-4 font-bold text-slate-500 w-16">#{index + 1}</td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src={displayAvatar} className="w-8 h-8 rounded-full object-cover" alt={displayName} />
                                                <span className={`font-medium ${member.id === 't1' ? 'text-indigo-300' : 'text-slate-200'}`}>
                                                    {displayName} {member.id === 't1' && '(You)'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{member.role}</span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white text-right">${member.scaledProd.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-400 text-center">{member.scaledPolicies}</td>
                                        </tr>
                                    );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Team Alerts */}
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
                        <button 
                            onClick={() => onNavigate?.('RECRUITS')}
                            className="w-full py-2 bg-white text-indigo-600 font-medium rounded-lg text-sm hover:bg-indigo-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            Open Recruit Pipeline <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Agents Modal */}
            {isActiveAgentsModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl animate-fade-in flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl shrink-0">
                            <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                <Users className="text-indigo-500" size={20} /> Active Agent Roster
                            </h3>
                            <button onClick={() => setIsActiveAgentsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-0">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase sticky top-0 z-10 shadow-sm border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3">Agent</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Production (YTD)</th>
                                        <th className="px-6 py-3">Policies</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {activeAgents.map((agent) => (
                                        <tr key={agent.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src={agent.avatarUrl} className="w-9 h-9 rounded-full object-cover border border-slate-700" alt={agent.name} />
                                                <span className="font-bold text-slate-200">{agent.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                                                    {agent.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white">
                                                ${agent.production.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {agent.activePolicies}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1 text-xs text-green-400 font-bold">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeAgents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                                                No active agents found in roster.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsActiveAgentsModalOpen(false)}
                                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
