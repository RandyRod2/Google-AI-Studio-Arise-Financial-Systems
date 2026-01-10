
import React, { useState, useEffect } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { User, ChevronRight, TrendingUp, Settings, Save, X, Briefcase, ChevronDown, ChevronUp, Network, List, Shield, Crown, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import { UserProfile, TeamMember, Role } from '../types';
import { getAvailableCarriers } from '../services/commissionService';

interface TeamsProps {
    userProfile?: UserProfile;
    currentUser?: User | null;
}

const TreeNode: React.FC<{ member: TeamMember; allMembers: TeamMember[]; depth: number }> = ({ member, allMembers, depth }) => {
    const children = allMembers.filter(m => m.parentId === member.id);
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="flex flex-col items-center">
            <div className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${
                member.role === 'ADMIN' ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' :
                member.role === 'MANAGER' ? 'bg-slate-900 border-indigo-500/30' :
                'bg-slate-950 border-white/5'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={member.avatarUrl} className="w-10 h-10 rounded-xl border border-white/10 object-cover" alt="" />
                        {member.role === 'ADMIN' && <Crown className="absolute -top-2 -right-2 text-yellow-500 rotate-12" size={14} fill="currentColor" />}
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[100px]">{member.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">{member.role}</p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center gap-4">
                    <div className="text-left">
                        <p className="text-[8px] font-bold text-slate-600 uppercase">Production</p>
                        <p className="text-xs font-black text-indigo-400">${(member.production / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-bold text-slate-600 uppercase">Level</p>
                        <p className="text-xs font-black text-slate-300">{member.defaultCompLevel}%</p>
                    </div>
                </div>
            </div>

            {children.length > 0 && (
                <>
                    <div className="w-px h-8 bg-indigo-500/30"></div>
                    <div className="flex gap-8 relative">
                        {/* Horizontal Bridge Line */}
                        {children.length > 1 && (
                            <div className="absolute top-0 left-[25%] right-[25%] h-px bg-indigo-500/30"></div>
                        )}
                        {children.map(child => (
                            <TreeNode key={child.id} member={child} allMembers={allMembers} depth={depth + 1} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const Teams: React.FC<TeamsProps> = ({ userProfile, currentUser }) => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            let data = saved ? JSON.parse(saved) : MOCK_TEAM;
            
            // Ensure Sarah (t3) reports to Randy (t1) for tree visualization
            if (data.find((m: any) => m.id === 't3')) {
                data = data.map((m: any) => m.id === 't3' ? { ...m, parentId: 't1' } : m);
            }
            // Ensure Pam (t4) reports to Sarah (t3)
            if (data.find((m: any) => m.id === 't4')) {
                data = data.map((m: any) => m.id === 't4' ? { ...m, parentId: 't3' } : m);
            }
            return data;
        } catch (e) {
            return MOCK_TEAM;
        }
    });

    const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('TREE');
    const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);

    // Add Agent State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAgent, setNewAgent] = useState({
        name: '',
        email: '',
        role: 'AGENT' as Role,
        defaultCompLevel: '90', // Store as string for easier clearing UX
        parentId: ''
    });

    const canManageOverrides = currentUser?.role === 'ADMIN' || currentUser?.role === 'AGENCY_OWNER';

    useEffect(() => {
        setAvailableCarriers(getAvailableCarriers());
    }, []);

    const handleCompLevelChange = (id: string, newLevel: number) => {
        const updated = teamMembers.map(m => m.id === id ? { ...m, defaultCompLevel: newLevel } : m);
        setTeamMembers(updated);
        localStorage.setItem('arise_team_members', JSON.stringify(updated));
    };

    const toggleAdvanced = (member: TeamMember) => {
        if (expandedMemberId === member.id) {
            setExpandedMemberId(null);
            setEditingMember(null);
        } else {
            setExpandedMemberId(member.id);
            setEditingMember({ ...member, carrierCompLevels: member.carrierCompLevels || {} });
        }
    };

    const saveAdvancedSettings = () => {
        if (!editingMember) return;
        const updated = teamMembers.map(m => m.id === editingMember.id ? editingMember : m);
        setTeamMembers(updated);
        localStorage.setItem('arise_team_members', JSON.stringify(updated));
        setExpandedMemberId(null);
        setEditingMember(null);
    };

    const handleAddAgent = () => {
        if (!newAgent.name || !newAgent.email) return;

        const agentToAdd: TeamMember = {
            id: `t-new-${Date.now()}`,
            name: newAgent.name,
            email: newAgent.email,
            role: newAgent.role,
            production: 0,
            activePolicies: 0,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAgent.name)}&background=random`,
            defaultCompLevel: parseInt(newAgent.defaultCompLevel) || 0, // Cast to int for data storage
            parentId: newAgent.parentId || undefined
        };

        const updated = [...teamMembers, agentToAdd];
        setTeamMembers(updated);
        localStorage.setItem('arise_team_members', JSON.stringify(updated));
        
        setIsAddModalOpen(false);
        setNewAgent({ name: '', email: '', role: 'AGENT', defaultCompLevel: '90', parentId: '' });
    };

    const topLevelMembers = teamMembers.filter(m => !m.parentId);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Team Hierarchy</h2>
                    <p className="text-sm text-slate-400">Managing {teamMembers.length} active producers.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-xl shadow-sm">
                        <button 
                            onClick={() => setViewMode('LIST')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <List size={16} /> List View
                        </button>
                        <button 
                            onClick={() => setViewMode('TREE')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${viewMode === 'TREE' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Network size={16} /> Hierarchy Tree
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                    >
                        <UserPlus size={16} /> Add Agent
                    </button>
                </div>
            </div>
            
            {viewMode === 'TREE' ? (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-12 overflow-x-auto custom-scrollbar flex justify-center min-h-[600px] shadow-inner">
                    <div className="flex flex-col items-center">
                        {topLevelMembers.map(root => (
                            <TreeNode key={root.id} member={root} allMembers={teamMembers} depth={0} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Active Roster</h3>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Production:</span>
                             <span className="text-sm font-black text-white">${teamMembers.reduce((s, m) => s + m.production, 0).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                        {teamMembers.map((member) => {
                             const displayName = (member.id === 't1' && userProfile) ? userProfile.name : member.name;
                             const displayAvatar = (member.id === 't1' && userProfile?.avatarUrl) ? userProfile.avatarUrl : member.avatarUrl;
                             const isEditing = expandedMemberId === member.id;

                            return (
                                <div key={member.id} className="group transition-colors">
                                    <div className="p-4 hover:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <img src={displayAvatar} className="w-12 h-12 rounded-full border border-slate-700 object-cover bg-slate-800" alt={displayName} />
                                            <div>
                                                <h4 className="font-bold text-white">
                                                    {displayName} {member.id === 't1' && <span className="text-xs font-normal text-slate-500 ml-1">(You)</span>}
                                                </h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                                                    member.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    member.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>{member.role}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-center px-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Comp Level</span>
                                                <span className="text-sm font-black text-indigo-400">{member.defaultCompLevel}%</span>
                                            </div>
                                            <input 
                                                type="range" min="70" max="145" step="5"
                                                value={member.defaultCompLevel}
                                                onChange={(e) => handleCompLevelChange(member.id, parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>

                                        <div className="flex items-center gap-8 justify-end">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Production</p>
                                                <p className="text-sm font-black text-white">${member.production.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Policies</p>
                                                <p className="text-sm font-black text-slate-300">{member.activePolicies}</p>
                                            </div>
                                            {canManageOverrides && (
                                                <button onClick={() => toggleAdvanced(member)} className={`p-2 rounded-xl transition-all border ${isEditing ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/50'}`}>
                                                    <Settings size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && editingMember && (
                                        <div className="bg-slate-950/50 border-t border-b border-white/5 p-6 animate-in slide-in-from-top duration-300 shadow-inner">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h4 className="font-black text-white uppercase tracking-tight flex items-center gap-2"><Briefcase size={16} className="text-indigo-500" /> Carrier Overrides</h4>
                                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Configure specialized compensation contracts.</p>
                                                </div>
                                                <button onClick={() => setExpandedMemberId(null)} className="text-slate-500 hover:text-white p-2 bg-white/5 rounded-full transition-colors"><X size={18} /></button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                                {availableCarriers.map(carrier => (
                                                    <div key={carrier} className="bg-slate-900 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-200">{carrier}</span>
                                                            <span className="text-xs font-black text-indigo-400">{(editingMember.carrierCompLevels?.[carrier] || editingMember.defaultCompLevel)}%</span>
                                                        </div>
                                                        <input 
                                                            type="range" min="70" max="145" step="5"
                                                            value={editingMember.carrierCompLevels?.[carrier] || editingMember.defaultCompLevel}
                                                            onChange={(e) => {
                                                                const newLevels = { ...editingMember.carrierCompLevels, [carrier]: parseInt(e.target.value) };
                                                                setEditingMember({ ...editingMember, carrierCompLevels: newLevels });
                                                            }}
                                                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                                <button onClick={() => setExpandedMemberId(null)} className="px-5 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all">Cancel</button>
                                                <button onClick={saveAdvancedSettings} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 flex items-center gap-2 transition-all active:scale-95"><Save size={16} /> Save Configuration</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Agent Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-slate-950/90 backdrop-blur-xl">
                    <div className="bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                    <UserPlus className="text-indigo-500" /> Initialize Agent
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Register New Team Member</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Stanley Hudson"
                                        value={newAgent.name}
                                        onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <input 
                                        type="email" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="stanley@dundermifflin.com"
                                        value={newAgent.email}
                                        onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Role</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newAgent.role}
                                        onChange={e => setNewAgent({...newAgent, role: e.target.value as Role})}
                                    >
                                        <option value="AGENT">Agent</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="AGENCY_OWNER">Agency Owner</option>
                                        <option value="RECRUIT">Recruit</option>
                                        <option value="STAFF">Staff</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Comp Level (%)</label>
                                    <input 
                                        type="number"
                                        min="70"
                                        max="145"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newAgent.defaultCompLevel}
                                        onChange={e => setNewAgent({...newAgent, defaultCompLevel: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reports To (Upline)</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newAgent.parentId}
                                    onChange={e => setNewAgent({...newAgent, parentId: e.target.value})}
                                >
                                    <option value="">No Upline (Agency Root)</option>
                                    {teamMembers.filter(m => ['ADMIN', 'AGENCY_OWNER', 'MANAGER'].includes(m.role)).map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={handleAddAgent}
                                disabled={!newAgent.name || !newAgent.email}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShieldCheck size={20} /> Deploy Agent
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teams;
