
import React, { useState, useEffect, useRef } from 'react';
import { Recruit, TeamMember } from '../types';
import { UserPlus, Plus, X, Edit2, GripVertical, Users, Clock, UserCheck, Search, Send, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { MOCK_TEAM } from '../services/mockData';

const Recruits: React.FC = () => {
    // --- State Management ---
    const [recruits, setRecruits] = useState<Recruit[]>(() => {
        try {
            const saved = localStorage.getItem('arise_recruits');
            return saved ? JSON.parse(saved) : [
                { id: 'r1', name: 'David Wallace', source: 'LinkedIn', stage: 'Interview', dateAdded: '2024-10-01', notes: 'Strong sales background.', email: 'david.wallace@example.com' },
                { id: 'r2', name: 'Karen Filippelli', source: 'Referral', stage: 'Licensing', dateAdded: '2024-09-25', notes: 'Scheduled for exam.', email: 'karen.f@example.com' },
            ];
        } catch (e) { return []; }
    });

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) { return MOCK_TEAM; }
    });

    // Persistence
    useEffect(() => { localStorage.setItem('arise_recruits', JSON.stringify(recruits)); }, [recruits]);
    useEffect(() => { localStorage.setItem('arise_team_members', JSON.stringify(teamMembers)); }, [teamMembers]);

    // UI States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRecruit, setEditingRecruit] = useState<Recruit | null>(null);
    const [newRecruit, setNewRecruit] = useState<Partial<Recruit>>({ name: '', source: 'LinkedIn', stage: 'New', email: '', phone: '' });
    
    // Promotion Modal State
    const [promotedRecruit, setPromotedRecruit] = useState<Recruit | null>(null);
    const [isSendingLink, setIsSendingLink] = useState(false);
    const [linkSent, setLinkSent] = useState(false);

    // Drag & Drop
    const [draggedRecruitId, setDraggedRecruitId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    // Auto-Scroll Refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const autoScrollSpeed = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);

    // Filter
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecruits = recruits.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Actions ---

    const handleAddRecruit = () => {
        if (!newRecruit.name) return;
        const recruit: Recruit = {
            id: `r-${Date.now()}`,
            name: newRecruit.name,
            email: newRecruit.email,
            phone: newRecruit.phone,
            source: newRecruit.source || 'Other',
            stage: 'New',
            dateAdded: new Date().toISOString().split('T')[0],
            notes: newRecruit.notes || ''
        };
        setRecruits([...recruits, recruit]);
        setIsAddModalOpen(false);
        setNewRecruit({ name: '', source: 'LinkedIn', stage: 'New', email: '', phone: '' });
    };

    const handleUpdateRecruit = () => {
        if (!editingRecruit) return;
        setRecruits(prev => prev.map(r => r.id === editingRecruit.id ? editingRecruit : r));
        setIsEditModalOpen(false);
        setEditingRecruit(null);
    };

    const handleDeleteRecruit = (id: string) => {
        if (window.confirm("Remove this candidate from the pipeline?")) {
            setRecruits(prev => prev.filter(r => r.id !== id));
            setIsEditModalOpen(false);
        }
    };

    const handlePromoteToAgent = (recruit: Recruit) => {
        // Create new agent
        const newAgent: TeamMember = {
            id: `agent-${Date.now()}`,
            name: recruit.name,
            email: recruit.email || '',
            role: 'AGENT',
            production: 0,
            activePolicies: 0,
            avatarUrl: `https://ui-avatars.com/api/?name=${recruit.name}&background=random`,
            defaultCompLevel: 90
        };

        setTeamMembers([...teamMembers, newAgent]);
        setRecruits(recruits.filter(r => r.id !== recruit.id));
        
        // Open Success/Send Link Modal
        setPromotedRecruit(recruit);
        setLinkSent(false);
    };

    const handleSendInvite = () => {
        setIsSendingLink(true);
        // Simulate API call
        setTimeout(() => {
            setIsSendingLink(false);
            setLinkSent(true);
        }, 1500);
    };

    const closePromotionModal = () => {
        setPromotedRecruit(null);
        setLinkSent(false);
    };

    // --- Drag & Auto-Scroll Handlers ---

    const startAutoScroll = () => {
        if (animationFrameId.current) return;

        const scroll = () => {
            if (scrollContainerRef.current && autoScrollSpeed.current !== 0) {
                scrollContainerRef.current.scrollLeft += autoScrollSpeed.current;
                animationFrameId.current = requestAnimationFrame(scroll);
            } else {
                stopAutoScroll();
            }
        };
        animationFrameId.current = requestAnimationFrame(scroll);
    };

    const stopAutoScroll = () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        autoScrollSpeed.current = 0;
    };

    const handleContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        
        if (!draggedRecruitId || !scrollContainerRef.current) return;

        const { left, right } = scrollContainerRef.current.getBoundingClientRect();
        const x = e.clientX;
        const threshold = 150; 
        const maxSpeed = 15;

        if (x < left + threshold) {
            // Scroll Left
            const intensity = 1 - ((x - left) / threshold);
            autoScrollSpeed.current = -1 * maxSpeed * intensity;
            startAutoScroll();
        } else if (x > right - threshold) {
            // Scroll Right
            const intensity = 1 - ((right - x) / threshold);
            autoScrollSpeed.current = maxSpeed * intensity;
            startAutoScroll();
        } else {
            autoScrollSpeed.current = 0;
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedRecruitId(id);
        e.dataTransfer.setData('recruitId', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, stage: string) => {
        e.preventDefault();
        if (dragOverStage !== stage) setDragOverStage(stage);
    };

    const handleDrop = (e: React.DragEvent, stage: Recruit['stage']) => {
        e.preventDefault();
        stopAutoScroll();
        const id = e.dataTransfer.getData('recruitId');
        
        if (id) {
            // Just move the card, don't auto-promote on drop to allow review
            setRecruits(prev => prev.map(r => r.id === id ? { ...r, stage: stage } : r));
        }
        setDraggedRecruitId(null);
        setDragOverStage(null);
    };

    const getStageColor = (stage: string) => {
        switch(stage) {
            case 'New': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
            case 'Interview': return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
            case 'Licensing': return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
            case 'Onboarding': return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400';
            case 'Contracted': return 'border-green-500/30 bg-green-500/10 text-green-400';
            default: return 'border-white/5 bg-slate-900/30 text-slate-400';
        }
    };

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-indigo-500" /> Recruiting Pipeline
                    </h2>
                    <p className="text-sm text-slate-400">Manage candidates from outreach to contracting.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search candidates..." 
                            className="pl-10 pr-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-sm transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Candidate
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div 
                className="flex-1 overflow-x-auto min-h-0 custom-scrollbar" 
                ref={scrollContainerRef}
                onDragOver={handleContainerDragOver}
            >
                <div className="flex gap-4 h-full min-w-[1400px] pb-4">
                    {(['New', 'Interview', 'Licensing', 'Onboarding', 'Contracted'] as const).map((stage) => {
                        const isContracted = stage === 'Contracted';
                        const stageLabel = isContracted ? 'Ready to Promote' : stage;
                        const isTarget = dragOverStage === stage;
                        const items = filteredRecruits.filter(r => r.stage === stage);

                        return (
                            <div 
                                key={stage} 
                                className={`flex-1 flex flex-col rounded-xl border transition-all duration-300 h-full backdrop-blur-sm
                                    ${isTarget ? 'bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/30' : 'bg-slate-900/30 border-white/5'}
                                    ${isContracted ? 'bg-green-900/10 border-green-500/20' : ''}
                                `}
                                onDragOver={(e) => handleDragOver(e, stage)}
                                onDrop={(e) => handleDrop(e, stage)}
                            >
                                {/* Header */}
                                <div className={`p-3 rounded-t-xl border-b flex justify-between items-center font-bold text-sm uppercase tracking-wide ${getStageColor(stage)}`}>
                                    {stageLabel}
                                    <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs shadow-sm text-slate-300 border border-white/5">
                                        {items.length}
                                    </span>
                                </div>

                                {/* Drop Zone / Cards */}
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    {isContracted && items.length === 0 && (
                                        <div className="h-32 border-2 border-dashed border-green-500/30 rounded-lg flex flex-col items-center justify-center text-green-500/50 opacity-60">
                                            <UserCheck size={24} className="mb-2" />
                                            <span className="text-xs font-bold uppercase">Drop here</span>
                                        </div>
                                    )}

                                    {items.map((recruit) => (
                                        <div 
                                            key={recruit.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, recruit.id)}
                                            onClick={() => { setEditingRecruit(recruit); setIsEditModalOpen(true); }}
                                            className={`bg-slate-800/80 p-4 rounded-lg shadow-sm border border-white/10 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group relative ${draggedRecruitId === recruit.id ? 'opacity-50' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                    <GripVertical size={12} className="text-slate-500 opacity-0 group-hover:opacity-100" /> {recruit.name}
                                                </h4>
                                                <Edit2 size={12} className="text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Users size={12} /> {recruit.source}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Clock size={12} /> Added: {recruit.dateAdded}
                                                </div>
                                                {recruit.email && (
                                                    <div className="text-[10px] text-slate-500 truncate mt-1 pt-1 border-t border-white/5">
                                                        {recruit.email}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Button for Contracted Stage */}
                                            {isContracted && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handlePromoteToAgent(recruit); }}
                                                    className="mt-3 w-full py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <UserCheck size={12} /> Promote to Agent
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Promotion Success Modal */}
            {promotedRecruit && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-800 ring-1 ring-white/10">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 shadow-lg shadow-green-900/20">
                                <UserCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Promotion Successful!</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                <span className="text-white font-medium">{promotedRecruit.name}</span> has been successfully added to the active agent roster.
                            </p>
                            
                            {!linkSent ? (
                                <button 
                                    onClick={handleSendInvite}
                                    disabled={isSendingLink}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isSendingLink ? (
                                        <>Sending Link...</>
                                    ) : (
                                        <>
                                            <Send size={16} /> Send Login Link to User
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full py-3 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg font-bold text-sm flex items-center justify-center gap-2 animate-fade-in">
                                    <CheckCircle2 size={18} /> Invite Link Sent!
                                </div>
                            )}
                            
                            <button 
                                onClick={closePromotionModal}
                                className="mt-4 text-slate-500 text-xs hover:text-slate-300 font-medium"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Candidate Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-800 ring-1 ring-white/10">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-white">Add New Candidate</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={newRecruit.name} onChange={e => setNewRecruit({...newRecruit, name: e.target.value})} autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
                                    <select className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newRecruit.source} onChange={e => setNewRecruit({...newRecruit, source: e.target.value})}>
                                        <option>LinkedIn</option>
                                        <option>Referral</option>
                                        <option>Job Board</option>
                                        <option>Cold Outreach</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                    <input className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={newRecruit.phone} onChange={e => setNewRecruit({...newRecruit, phone: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                <input className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={newRecruit.email} onChange={e => setNewRecruit({...newRecruit, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                                <textarea className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                                    rows={3} value={newRecruit.notes} onChange={e => setNewRecruit({...newRecruit, notes: e.target.value})} />
                            </div>
                            <button onClick={handleAddRecruit} disabled={!newRecruit.name} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50">
                                Add Candidate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Candidate Modal */}
            {isEditModalOpen && editingRecruit && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-800 ring-1 ring-white/10">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-white">Edit Candidate</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm" value={editingRecruit.name} onChange={e => setEditingRecruit({...editingRecruit, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stage</label>
                                    <select className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm" value={editingRecruit.stage} onChange={e => setEditingRecruit({...editingRecruit, stage: e.target.value as any})}>
                                        <option>New</option>
                                        <option>Interview</option>
                                        <option>Licensing</option>
                                        <option>Onboarding</option>
                                        <option>Contracted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source</label>
                                    <input className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm" value={editingRecruit.source} onChange={e => setEditingRecruit({...editingRecruit, source: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                                <textarea className="w-full border border-slate-700 bg-slate-950 text-white rounded-lg p-2 text-sm resize-none" rows={4} value={editingRecruit.notes} onChange={e => setEditingRecruit({...editingRecruit, notes: e.target.value})} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => handleDeleteRecruit(editingRecruit.id)} className="flex-1 py-2 bg-slate-800 text-red-400 border border-slate-700 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors">
                                    Delete
                                </button>
                                <button onClick={handleUpdateRecruit} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-500 transition-colors shadow-sm">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recruits;
