
import React, { useState } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { User, ChevronRight, TrendingUp } from 'lucide-react';
import { UserProfile, TeamMember } from '../types';

interface TeamsProps {
    userProfile?: UserProfile;
}

const Teams: React.FC<TeamsProps> = ({ userProfile }) => {
    // Initialize state from local storage to catch promoted agents
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) {
            return MOCK_TEAM;
        }
    });

    return (
        <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Team Hierarchy</h2>
            
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                    <div>
                         <h3 className="font-bold text-slate-800">Direct Reports</h3>
                         <p className="text-sm text-gray-500">Managing {teamMembers.length} Agents</p>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Add Agent</button>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {teamMembers.map((member) => {
                         // If this is the logged-in user (assuming ID 't1'), use their profile data
                         const displayName = (member.id === 't1' && userProfile) ? userProfile.name : member.name;
                         const displayAvatar = (member.id === 't1' && userProfile?.avatarUrl) ? userProfile.avatarUrl : member.avatarUrl;

                        return (
                            <div key={member.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group cursor-pointer transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={displayAvatar} className="w-12 h-12 rounded-full border border-gray-200 object-cover" alt={displayName} />
                                    <div>
                                        <h4 className="font-bold text-slate-800">
                                            {displayName} {member.id === 't1' && <span className="text-xs font-normal text-gray-500 ml-1">(You)</span>}
                                        </h4>
                                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{member.role}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Production</p>
                                        <p className="font-bold text-slate-900">${member.production.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right hidden md:block">
                                        <p className="text-xs text-gray-500">Policies</p>
                                        <p className="font-bold text-slate-900">{member.activePolicies}</p>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-indigo-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Teams;
