
import React, { useState, useEffect } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { Trophy, TrendingUp, Users, AlertCircle, X, ChevronRight, UserPlus, Phone, FileText, CheckCircle2, Clock, Plus, BarChart3, Download, Edit2, Save, Mail, GripVertical, UserCheck, Loader2 } from 'lucide-react';
import { UserProfile, TeamMember } from '../types';

interface ManagerDashboardProps {
  userProfile?: UserProfile;
}

interface Recruit {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    stage: 'New' | 'Interview' | 'Licensing' | 'Onboarding' | 'Contracted';
    dateAdded: string;
    notes?: string;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ userProfile }) => {
    // --- State Management with Local Storage Persistence ---
    
    // Team Members (Agents)
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) { return MOCK_TEAM; }
    });

    // Recruits Pipeline
    const [recruits, setRecruits] = useState<Recruit[]>(() => {
        try {
            const saved = localStorage.getItem('arise_recruits');
            return saved ? JSON.parse(saved) : [
                { id: 'r1', name: 'David Wallace', source: 'LinkedIn', stage: 'Interview', dateAdded: '2024-10-01', notes: 'Strong sales background. Interested in agency building.', email: 'david.wallace@example.com' },
                { id: 'r2', name: 'Karen Filippelli', source: 'Referral', stage: 'Licensing', dateAdded: '2024-09-25', notes: 'Scheduled for exam on Friday.', email: 'karen.f@example.com' },
                { id: 'r3', name: 'Danny Cordray', source: 'Cold Outreach', stage: 'New', dateAdded: '2024-10-05', notes: '', email: 'danny.c@example.com' },
                { id: 'r4', name: 'Roy Anderson', source: 'Job Board', stage: 'New', dateAdded: '2024-10-06', notes: '', email: 'roy.anderson@example.com' },
                { id: 'r5', name: 'Jan Levinson', source: 'Former Agent', stage: 'Onboarding', dateAdded: '2024-09-15', notes: 'Waiting on E&O proof.', email: 'jan.l@example.com' },
            ];
        } catch (e) { return []; }
    });

    // Save to LocalStorage on change
    useEffect(() => { localStorage.setItem('arise_team_members', JSON.stringify(teamMembers)); }, [teamMembers]);
    useEffect(() => { localStorage.setItem('arise_recruits', JSON.stringify(recruits)); }, [recruits]);

    // Modals
    const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
    const [isActiveAgentsModalOpen, setIsActiveAgentsModalOpen] = useState(false);
    const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
    
    // Edit & Add States
    const [editingRecruit, setEditingRecruit] = useState<Recruit | null>(null);
    const [isAddingRecruit, setIsAddingRecruit] = useState(false);
    const [newRecruitForm, setNewRecruitForm] = useState({ name: '', source: 'LinkedIn', email: '', phone: '' });
    
    // Promotion State
    const [promotingRecruit, setPromotingRecruit] = useState<Recruit | null>(null);
    const [promotionSuccessAgent, setPromotionSuccessAgent] = useState<TeamMember | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);

    // Drag and Drop State
    const [draggedRecruitId, setDraggedRecruitId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    // Filter for Active Agents
    const activeAgents = teamMembers.filter(m => m.role === 'AGENT' || m.role === 'RECRUIT');

    // --- Logic ---

    const handleAddRecruit = () => {
        if (!newRecruitForm.name) return;
        
        const newRecruit: Recruit = {
            id: `r-${Date.now()}`,
            name: newRecruitForm.name,
            source: newRecruitForm.source,
            email: newRecruitForm.email,
            phone: newRecruitForm.phone,
            stage: 'New',
            dateAdded: new Date().toISOString().split('T')[0],
            notes: ''
        };

        setRecruits([...recruits, newRecruit]);
        setIsAddingRecruit(false);
        setNewRecruitForm({ name: '', source: 'LinkedIn', email: '', phone: '' });
    };

    const handleSaveRecruit = () => {
        if (editingRecruit) {
            setRecruits(prev => prev.map(r => r.id === editingRecruit.id ? editingRecruit : r));
            setEditingRecruit(null);
        }
    };

    // Promote a recruit to Team Member
    const confirmPromotion = () => {
        if (!promotingRecruit) return;

        const newAgent: TeamMember = {
            id: `agent-${Date.now()}`,
            name: promotingRecruit.name,
            email: promotingRecruit.email || '',
            role: 'AGENT',
            production: 0,
            activePolicies: 0,
            avatarUrl: `https://ui-avatars.com/api/?name=${promotingRecruit.name}&background=random`
        };

        // Update state and immediately persist to ensure other components (Teams) see it if they remount
        const updatedTeam = [...teamMembers, newAgent];
        setTeamMembers(updatedTeam);
        
        const updatedRecruits = recruits.filter(r => r.id !== promotingRecruit.id);
        setRecruits(updatedRecruits);
        
        // Prepare invite state
        setInviteEmail(promotingRecruit.email || '');
        setInviteSent(false); // Reset sent state
        setPromotingRecruit(null);
        
        // Show Success Modal
        setPromotionSuccessAgent(newAgent);
    };

    const handleSendInvite = () => {
        if (!inviteEmail) return;
        
        setIsInviting(true);
        // Simulate API call
        setTimeout(() => {
            setIsInviting(false);
            setInviteSent(true);
            // Auto close after success
            setTimeout(() => {
                setPromotionSuccessAgent(null);
                setInviteSent(false);
                setInviteEmail('');
            }, 2000);
        }, 1200);
    };

    // --- Drag and Drop Handlers ---

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedRecruitId(id);
        e.dataTransfer.setData('recruitId', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, stage: string) => {
        e.preventDefault(); // Critical to allow dropping
        if (dragOverStage !== stage) {
            setDragOverStage(stage);
        }
    };

    const handleDrop = (e: React.DragEvent, stage: Recruit['stage']) => {
        e.preventDefault();
        const recruitId = e.dataTransfer.getData('recruitId');
        
        if (recruitId) {
            if (stage === 'Contracted') {
                // Special handling for promotion
                const recruit = recruits.find(r => r.id === recruitId);
                if (recruit) {
                    setPromotingRecruit(recruit);
                }
            } else {
                // Standard pipeline move
                setRecruits(prev => prev.map(r => r.id === recruitId ? { ...r, stage: stage } : r));
            }
        }
        
        setDraggedRecruitId(null);
        setDragOverStage(null);
    };

    const getStageColor = (stage: string) => {
        switch(stage) {
            case 'New': return 'text-blue-600 bg-blue-50/50 border-blue-100';
            case 'Interview': return 'text-purple-600 bg-purple-50/50 border-purple-100';
            case 'Licensing': return 'text-orange-600 bg-orange-50/50 border-orange-100';
            case 'Onboarding': return 'text-indigo-600 bg-indigo-50/50 border-indigo-100';
            case 'Contracted': return 'text-green-700 bg-green-100 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="animate-fade-in space-y-6 relative">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                    <p className="text-slate-400 text-sm font-medium">Total Team Production</p>
                    <h3 className="text-3xl font-bold mt-2">$363,000</h3>
                    <div className="mt-4 flex items-center text-xs text-green-400">
                        <TrendingUp size={14} className="mr-1" /> +18% vs last month
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-sm font-medium">Pending Overrides</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">$15,420</h3>
                </div>
                
                {/* Active Agents Card */}
                <div 
                    onClick={() => setIsActiveAgentsModalOpen(true)}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Active Agents</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeAgents.length}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <Users size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-4 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        View Roster <ChevronRight size={14} />
                    </p>
                </div>

                {/* Recruits in Pipeline Card */}
                <div 
                    onClick={() => setIsRecruitModalOpen(true)}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Recruits in Pipeline</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{recruits.length}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <UserPlus size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-4 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        View Pipeline <ChevronRight size={14} />
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leaderboard */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center">
                            <Trophy className="text-yellow-500 mr-2" size={20} /> Team Leaderboard
                        </h3>
                        <button 
                            onClick={() => setIsLeaderboardModalOpen(true)}
                            className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                        >
                            View Full Report <ChevronRight size={14} />
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Rank</th>
                                <th className="px-6 py-3">Agent</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Production</th>
                                <th className="px-6 py-3">Policies</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {teamMembers.sort((a,b) => b.production - a.production).slice(0, 5).map((member, index) => {
                                const displayName = (member.id === 't1' && userProfile) ? userProfile.name : member.name;
                                const displayAvatar = (member.id === 't1' && userProfile?.avatarUrl) ? userProfile.avatarUrl : member.avatarUrl;
                                
                                return (
                                    <tr key={member.id} className={`hover:bg-slate-50 ${member.id === 't1' ? 'bg-indigo-50/30' : ''}`}>
                                        <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img src={displayAvatar} className="w-8 h-8 rounded-full object-cover" alt={displayName} />
                                            <span className={`font-medium ${member.id === 't1' ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                {displayName} {member.id === 't1' && '(You)'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{member.role}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">${member.production.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{member.activePolicies}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Team Alerts */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <AlertCircle size={18} className="mr-2 text-red-500" /> At-Risk Agents
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-red-500">RH</div>
                                <div>
                                    <p className="text-sm font-medium text-red-900">Ryan Howard</p>
                                    <p className="text-xs text-red-700">Zero production for 14 days.</p>
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
                            onClick={() => setIsRecruitModalOpen(true)}
                            className="w-full py-2 bg-white text-indigo-600 font-medium rounded-lg text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                            Open Recruit Pipeline
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Agents Modal */}
            {isActiveAgentsModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl animate-fade-in flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Users className="text-indigo-600" size={20} /> Active Agent Roster
                            </h3>
                            <button onClick={() => setIsActiveAgentsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-0">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3">Agent</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Production</th>
                                        <th className="px-6 py-3">Policies</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeAgents.map((agent) => (
                                        <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src={agent.avatarUrl} className="w-9 h-9 rounded-full object-cover border border-gray-200" alt={agent.name} />
                                                <span className="font-bold text-slate-700">{agent.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                                    {agent.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                ${agent.production.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {agent.activePolicies}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeAgents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                                                No active agents found in roster.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsActiveAgentsModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recruit Pipeline Modal */}
            {isRecruitModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-7xl h-[85vh] flex flex-col animate-fade-in relative overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                    <UserPlus className="text-indigo-600" size={24} /> Recruiting Pipeline
                                </h3>
                                <p className="text-sm text-gray-500">Drag candidates to move them. Drop in "Active Agents" to add to roster.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsAddingRecruit(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                                >
                                    <Plus size={16} /> Add Candidate
                                </button>
                                <button onClick={() => setIsRecruitModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-x-auto p-6 bg-slate-100/80">
                            <div className="flex gap-4 h-full min-w-[1000px]">
                                {(['New', 'Interview', 'Licensing', 'Onboarding', 'Contracted'] as const).map((stage) => {
                                    const isContracted = stage === 'Contracted';
                                    const stageLabel = isContracted ? 'Active Agents' : stage;
                                    const isTarget = dragOverStage === stage;

                                    return (
                                        <div 
                                            key={stage} 
                                            className={`flex-1 flex flex-col h-full rounded-xl border transition-all duration-300
                                                ${isTarget ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 shadow-md scale-[1.01]' : 'bg-gray-50/50 border-gray-200 shadow-sm'}
                                                ${isContracted ? 'border-green-200 bg-green-50/30' : ''}
                                            `}
                                            onDragOver={(e) => handleDragOver(e, stage)}
                                            onDrop={(e) => handleDrop(e, stage)}
                                        >
                                            <div className={`p-3 border-b rounded-t-xl font-bold text-sm uppercase tracking-wide flex justify-between items-center border-b-2 ${getStageColor(stage)}`}>
                                                {stageLabel}
                                                <span className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm border border-gray-100 text-gray-500">
                                                    {recruits.filter(r => r.stage === stage).length}
                                                </span>
                                            </div>
                                            
                                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                                {recruits.filter(r => r.stage === stage).map(recruit => (
                                                    <div 
                                                        key={recruit.id} 
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, recruit.id)}
                                                        className={`bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing ${draggedRecruitId === recruit.id ? 'opacity-50' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-slate-800 flex items-center gap-1 text-sm">
                                                                <GripVertical size={12} className="text-gray-300" /> {recruit.name}
                                                            </h4>
                                                            <button 
                                                                onClick={() => setEditingRecruit(recruit)}
                                                                className="text-gray-300 hover:text-indigo-600 transition-colors p-1"
                                                                title="Edit Details"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-gray-500 space-y-1 mb-2">
                                                            <p className="flex items-center gap-1.5"><Users size={12}/> {recruit.source}</p>
                                                            <p className="flex items-center gap-1.5"><Clock size={12}/> {recruit.dateAdded}</p>
                                                        </div>
                                                        {recruit.notes && (
                                                            <div className="bg-yellow-50 p-2 rounded text-[10px] text-yellow-800 mb-2 border border-yellow-100 line-clamp-3 italic">
                                                                "{recruit.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                
                                                {/* Drop Zone Visual Cue */}
                                                {isTarget && (
                                                    <div className={`h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-sm font-medium animate-pulse ${
                                                        isContracted 
                                                            ? 'border-green-400 bg-green-50 text-green-600' 
                                                            : 'border-indigo-300 bg-indigo-50 text-indigo-400'
                                                    }`}>
                                                        {isContracted ? <UserCheck size={24} className="mb-1" /> : null}
                                                        {isContracted ? 'Drop to Promote' : 'Drop Here'}
                                                    </div>
                                                )}

                                                {recruits.filter(r => r.stage === stage).length === 0 && !isTarget && (
                                                    <div className="text-center py-8 text-gray-300 text-xs italic">
                                                        Empty Stage
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Add Recruit Overlay Form */}
                        {isAddingRecruit && (
                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10 p-4">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-slate-800">Add Candidate</h3>
                                        <button onClick={() => setIsAddingRecruit(false)} className="text-gray-400 hover:text-gray-600">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                            <input 
                                                autoFocus
                                                type="text" 
                                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                                placeholder="e.g. John Doe"
                                                value={newRecruitForm.name}
                                                onChange={(e) => setNewRecruitForm({...newRecruitForm, name: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
                                            <select 
                                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                                value={newRecruitForm.source}
                                                onChange={(e) => setNewRecruitForm({...newRecruitForm, source: e.target.value})}
                                            >
                                                <option value="LinkedIn">LinkedIn</option>
                                                <option value="Referral">Referral</option>
                                                <option value="Job Board">Job Board</option>
                                                <option value="Cold Outreach">Cold Outreach</option>
                                                <option value="Social Media">Social Media</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleAddRecruit}
                                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-2"
                                        >
                                            <UserPlus size={16} /> Add to Pipeline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit Recruit Overlay */}
                        {editingRecruit && (
                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[80vh]">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Edit2 size={16} className="text-indigo-600"/> Edit Candidate
                                        </h3>
                                        <button onClick={() => setEditingRecruit(null)} className="text-gray-400 hover:text-gray-600">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-4 overflow-y-auto">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                                    value={editingRecruit.name}
                                                    onChange={(e) => setEditingRecruit({...editingRecruit, name: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                                    value={editingRecruit.source}
                                                    onChange={(e) => setEditingRecruit({...editingRecruit, source: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                                <div className="relative">
                                                    <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-8 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                                        value={editingRecruit.email || ''}
                                                        placeholder="email@example.com"
                                                        onChange={(e) => setEditingRecruit({...editingRecruit, email: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                                <div className="relative">
                                                    <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-8 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                                        value={editingRecruit.phone || ''}
                                                        placeholder="(555) 123-4567"
                                                        onChange={(e) => setEditingRecruit({...editingRecruit, phone: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recruiting Notes</label>
                                            <textarea 
                                                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 min-h-[120px] resize-none"
                                                placeholder="Enter interview notes, licensing status, or background info..."
                                                value={editingRecruit.notes || ''}
                                                onChange={(e) => setEditingRecruit({...editingRecruit, notes: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button 
                                                onClick={() => setEditingRecruit(null)}
                                                className="flex-1 py-2.5 bg-white border border-gray-300 text-slate-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveRecruit}
                                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Promotion Confirmation Modal */}
                        {promotingRecruit && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-30 p-4">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in transform scale-100">
                                    <div className="p-6 text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                            <UserCheck size={32} className="text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Promote Candidate?</h3>
                                        <p className="text-slate-500 text-sm mb-6">
                                            Are you sure you want to promote <b>{promotingRecruit.name}</b> to an Active Agent? 
                                            This will move them from the pipeline to your official Team Roster.
                                        </p>
                                        
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setPromotingRecruit(null)}
                                                className="flex-1 py-2.5 bg-white border border-gray-200 text-slate-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={confirmPromotion}
                                                className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 text-sm flex items-center justify-center gap-2"
                                            >
                                                Confirm Promotion
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Promotion Success Modal */}
                        {promotionSuccessAgent && (
                            <div className="absolute inset-0 flex items-center justify-center z-40 p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={32} className="text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Agent Promoted!</h3>
                                    <p className="text-slate-600 text-sm mb-6">
                                        <b>{promotionSuccessAgent.name}</b> has been moved to your active roster.
                                    </p>
                                    
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 text-left">
                                        <h4 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                                            <Mail size={16} /> Platform Invitation
                                        </h4>
                                        <p className="text-xs text-indigo-800 mb-3 leading-relaxed">
                                            If this agent is not yet subscribed to ARISE, please send them an invitation to purchase their subscription.
                                        </p>
                                        
                                        {/* New Email Input Section */}
                                        <div className="mb-3">
                                            <label className="block text-xs font-bold text-indigo-800 mb-1 ml-1">Recipient Email</label>
                                            <input 
                                                type="email" 
                                                className="w-full border border-indigo-200 rounded-lg p-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                placeholder="Enter candidate email..."
                                            />
                                        </div>

                                        <button 
                                            onClick={handleSendInvite}
                                            disabled={isInviting || inviteSent || !inviteEmail}
                                            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                                                inviteSent 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {isInviting && <Loader2 className="animate-spin" size={14} />}
                                            {inviteSent ? 'Invitation Sent!' : (isInviting ? 'Sending Invite...' : 'Send Subscription Invite')}
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => setPromotionSuccessAgent(null)}
                                        className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Leaderboard Full Report Modal */}
            {isLeaderboardModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-4xl animate-fade-in flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                    <BarChart3 className="text-indigo-600" size={20} /> Team Performance Report
                                </h3>
                                <p className="text-sm text-gray-500">Detailed breakdown of production, policy counts, and trends.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-lg text-slate-500 transition-colors" title="Export CSV">
                                    <Download size={18} />
                                </button>
                                <button onClick={() => setIsLeaderboardModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-0">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0 z-10 shadow-sm border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">Rank</th>
                                        <th className="px-6 py-4">Agent</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4 text-right">Production</th>
                                        <th className="px-6 py-4 text-center">Policies</th>
                                        <th className="px-6 py-4 text-right">Avg Premium</th>
                                        <th className="px-6 py-4 text-right">Trend</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teamMembers.sort((a, b) => b.production - a.production).map((member, index) => {
                                         const displayName = (member.id === 't1' && userProfile) ? userProfile.name : member.name;
                                         const displayAvatar = (member.id === 't1' && userProfile?.avatarUrl) ? userProfile.avatarUrl : member.avatarUrl;
                                         const avgPrem = member.activePolicies > 0 ? Math.round(member.production / member.activePolicies) : 0;

                                         return (
                                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-400">#{index + 1}</td>
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <img src={displayAvatar} className="w-9 h-9 rounded-full object-cover border border-gray-200" alt={displayName} />
                                                    <span className={`font-bold ${member.id === 't1' ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        {displayName} {member.id === 't1' && '(You)'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900 text-right">
                                                    ${member.production.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-center">
                                                    {member.activePolicies}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-right">
                                                    ${avgPrem.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-green-600 text-xs font-bold flex items-center justify-end gap-1 bg-green-50 px-2 py-1 rounded-full w-fit ml-auto">
                                                        <TrendingUp size={12} /> +{Math.floor(Math.random() * 15) + 5}%
                                                    </span>
                                                </td>
                                            </tr>
                                         )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end shrink-0">
                            <button 
                                onClick={() => setIsLeaderboardModalOpen(false)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
