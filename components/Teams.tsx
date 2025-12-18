
import React, { useState, useEffect } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { User, ChevronRight, TrendingUp, Settings, Save, X, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile, TeamMember, Role } from '../types';
import { getAvailableCarriers } from '../services/commissionService';

interface TeamsProps {
    userProfile?: UserProfile;
    currentUserRole?: Role;
}

const Teams: React.FC<TeamsProps> = ({ userProfile, currentUserRole }) => {
    // Initialize state from local storage to catch promoted agents
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) {
            return MOCK_TEAM;
        }
    });

    const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);

    const canManageOverrides = currentUserRole === 'ADMIN' || currentUserRole === 'AGENCY_OWNER';

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

    const handleCarrierOverrideChange = (carrier: string, level: number) => {
        if (!editingMember) return;
        setEditingMember({
            ...editingMember,
            carrierCompLevels: {
                ...editingMember.carrierCompLevels,
                [carrier]: level
            }
        });
    };

    const saveAdvancedSettings = () => {
        if (!editingMember) return;
        
        const updated = teamMembers.map(m => m.id === editingMember.id ? editingMember : m);
        setTeamMembers(updated);
        localStorage.setItem('arise_team_members', JSON.stringify(updated));
        setExpandedMemberId(null);
        setEditingMember(null);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-white">Team Hierarchy & Compensation</h2>
            
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden">
                <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <div>
                         <h3 className="font-bold text-white">Direct Reports</h3>
                         <p className="text-sm text-slate-400">Managing {teamMembers.length} Agents</p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">Add Agent</button>
                </div>
                
                <div className="divide-y divide-white/5">
                    {teamMembers.map((member) => {
                         // If this is the logged-in user (assuming ID 't1'), use their profile data
                         const displayName = (member.id === 't1' && userProfile) ? userProfile.name : member.name;
                         const displayAvatar = (member.id === 't1' && userProfile?.avatarUrl) ? userProfile.avatarUrl : member.avatarUrl;
                         const isEditing = expandedMemberId === member.id;

                        return (
                            <div key={member.id} className="group transition-colors">
                                <div className="p-4 hover:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                                    {/* Profile Info */}
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <img src={displayAvatar} className="w-12 h-12 rounded-full border border-slate-700 object-cover" alt={displayName} />
                                        <div>
                                            <h4 className="font-bold text-white">
                                                {displayName} {member.id === 't1' && <span className="text-xs font-normal text-slate-500 ml-1">(You)</span>}
                                            </h4>
                                            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30">{member.role}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Comp Level Slider */}
                                    <div className="flex-1 flex flex-col justify-center px-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Comp Level</span>
                                            <span className="text-sm font-bold text-indigo-400">{member.defaultCompLevel}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="70" 
                                            max="145" 
                                            step="5"
                                            value={member.defaultCompLevel}
                                            onChange={(e) => handleCompLevelChange(member.id, parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                            <span>70%</span>
                                            <span>145%</span>
                                        </div>
                                    </div>

                                    {/* Stats & Actions */}
                                    <div className="flex items-center gap-6 justify-end">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-slate-500">Production</p>
                                            <p className="font-bold text-white">${member.production.toLocaleString()}</p>
                                        </div>
                                        
                                        {canManageOverrides && (
                                            <button 
                                                onClick={() => toggleAdvanced(member)}
                                                className={`p-2 rounded-lg transition-colors border ${isEditing ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-transparent border-white/10 text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                                title="Manage Carrier Levels"
                                            >
                                                <Settings size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Advanced Carrier Settings (Accordion) */}
                                {isEditing && editingMember && (
                                    <div className="bg-slate-950/50 border-t border-b border-white/5 p-6 animate-fade-in shadow-inner">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-white flex items-center gap-2">
                                                    <Briefcase size={16} className="text-indigo-500" /> Carrier Specific Overrides
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-1">Set different compensation levels for specific carriers. Default level is {member.defaultCompLevel}%.</p>
                                            </div>
                                            <button onClick={() => setExpandedMemberId(null)} className="text-slate-500 hover:text-white transition-colors">
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                            {availableCarriers.length === 0 ? (
                                                <p className="col-span-3 text-sm text-slate-500 italic">No carriers found in Commission Registry. Please upload a grid in Platform Admin.</p>
                                            ) : availableCarriers.map(carrier => {
                                                const currentLevel = editingMember.carrierCompLevels?.[carrier] || member.defaultCompLevel;
                                                const isOverridden = editingMember.carrierCompLevels?.[carrier] !== undefined;

                                                return (
                                                    <div key={carrier} className={`p-3 rounded-lg border flex flex-col gap-2 ${isOverridden ? 'bg-slate-900 border-indigo-500/50 shadow-sm' : 'bg-slate-900/30 border-transparent'}`}>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-bold text-slate-300 truncate pr-2" title={carrier}>{carrier}</span>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isOverridden ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                                {currentLevel}%
                                                            </span>
                                                        </div>
                                                        <input 
                                                            type="range" 
                                                            min="70" 
                                                            max="145" 
                                                            step="5"
                                                            value={currentLevel}
                                                            onChange={(e) => handleCarrierOverrideChange(carrier, parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => setExpandedMemberId(null)}
                                                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={saveAdvancedSettings}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 shadow-sm flex items-center gap-2 transition-colors"
                                            >
                                                <Save size={16} /> Save Overrides
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Teams;
