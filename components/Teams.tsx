import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { 
    User, ChevronRight, TrendingUp, Settings, Save, X, Briefcase, 
    ChevronDown, ChevronUp, Network, List, Shield, Crown, UserPlus, 
    Mail, ShieldCheck, Move, MousePointer2, ZoomIn, ZoomOut, Maximize,
    DollarSign, ArrowUpRight, BarChart3, GripVertical, Trash2, AlertTriangle, 
    ShieldAlert, UserMinus, MinusCircle, PlusCircle, Minus, Plus, Search, Focus
} from 'lucide-react';
import { UserProfile, TeamMember, Role } from '../types';
import { getAvailableCarriers } from '../services/commissionService';

interface TeamsProps {
    userProfile?: UserProfile;
    currentUser?: any | null;
    teamMembers: TeamMember[];
    onUpdateTeam: (members: TeamMember[]) => void;
}

// --- Analytics Helpers ---

const getTotalDownlineProduction = (memberId: string, allMembers: TeamMember[]): number => {
    const self = allMembers.find(m => m.id === memberId);
    const selfProd = self?.production || 0;
    const directReports = allMembers.filter(m => m.parentId === memberId);
    const childrenProd = directReports.reduce((sum, child) => sum + getTotalDownlineProduction(child.id, allMembers), 0);
    return selfProd + childrenProd;
};

// --- Tree Node Component ---

interface TreeNodeProps {
    member: TeamMember;
    allMembers: TeamMember[];
    agencyTotal: number;
    depth: number;
    onMoveAgent: (agentId: string, newParentId: string | undefined) => void;
    canEdit: boolean;
    scale: number;
    focusedId: string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({ member, allMembers, agencyTotal, depth, onMoveAgent, canEdit, scale, focusedId }) => {
    const children = allMembers.filter(m => m.parentId === member.id);
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const legTotal = useMemo(() => getTotalDownlineProduction(member.id, allMembers), [member.id, allMembers]);
    const contributionPercent = agencyTotal > 0 ? Math.round((legTotal / agencyTotal) * 100) : 0;

    const isFocused = focusedId === member.id;

    const handleDragStart = (e: React.DragEvent) => {
        if (!canEdit) return;
        e.dataTransfer.setData('agentId', member.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!canEdit) return;
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('agentId');
        if (draggedId !== member.id) {
            setIsDraggedOver(true);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!canEdit) return;
        e.preventDefault();
        setIsDraggedOver(false);
        const draggedId = e.dataTransfer.getData('agentId');
        if (draggedId && draggedId !== member.id) {
            onMoveAgent(draggedId, member.id);
        }
    };

    const toggleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCollapsed(!isCollapsed);
    };

    // Semantic zoom: hide details at low scales
    const showDetails = scale > 0.45;

    return (
        <div className="flex flex-col items-center select-none relative">
            {/* The Node Card */}
            <div 
                draggable={canEdit && member.role !== 'ADMIN'}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDraggedOver(false)}
                onDrop={handleDrop}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 w-64 group shadow-2xl ${
                    isFocused ? 'ring-4 ring-indigo-500 ring-offset-8 ring-offset-slate-950 scale-110 z-50' : ''
                } ${
                    isDraggedOver ? 'border-indigo-400 bg-indigo-500/20 scale-105 ring-4 ring-indigo-500/20' : 
                    member.role === 'ADMIN' ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]' :
                    member.role === 'MANAGER' ? 'bg-slate-900 border-indigo-500/30' :
                    'bg-slate-950 border-white/5'
                } ${canEdit && member.role !== 'ADMIN' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            >
                {/* Visual Analytics Layer */}
                {showDetails && (
                    <div className="absolute -top-3 -right-3 z-20 transition-opacity">
                        <div className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-tighter shadow-lg backdrop-blur-md ${
                            contributionPercent > 50 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                            contributionPercent > 20 ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' :
                            'bg-slate-800/80 border-white/10 text-slate-400'
                        }`}>
                            {contributionPercent}% Share
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img src={member.avatarUrl} className={`rounded-xl border border-white/10 object-cover shadow-inner transition-all ${showDetails ? 'w-12 h-12' : 'w-16 h-16'}`} alt="" />
                        {member.role === 'ADMIN' && <Crown className="absolute -top-3 -right-3 text-yellow-500 drop-shadow-md" size={16} fill="currentColor" />}
                        {canEdit && member.role !== 'ADMIN' && showDetails && (
                            <div className="absolute -bottom-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 rounded p-0.5 shadow-sm">
                                <GripVertical size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className={`font-black text-white uppercase tracking-tight truncate ${showDetails ? 'text-sm' : 'text-lg'}`}>{member.name}</p>
                        {showDetails && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-1.5 rounded border border-indigo-500/20">{member.role}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase">{member.defaultCompLevel}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-4 grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                        <div className="bg-slate-950/50 p-2 rounded-xl border border-white/5">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Personal</p>
                            <p className="text-xs font-black text-white">${(member.production / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10">
                            <p className="text-[8px] font-bold text-indigo-400/70 uppercase tracking-widest">Leg Volume</p>
                            <p className="text-xs font-black text-indigo-400">${(legTotal / 1000).toFixed(1)}k</p>
                        </div>
                    </div>
                )}

                {/* Collapse/Expand Toggle */}
                {children.length > 0 && (
                    <button 
                        onClick={toggleCollapse}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800 transition-all z-30 shadow-xl"
                    >
                        {isCollapsed ? <Plus size={14} /> : <Minus size={14} />}
                    </button>
                )}

                {isDraggedOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/10 rounded-2xl animate-pulse">
                        <UserPlus size={24} className="text-indigo-400" />
                    </div>
                )}
            </div>

            {/* Connecting Lines & Children */}
            {!isCollapsed && children.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Vertical Connector Down from parent */}
                    <div className="w-0.5 h-12 bg-indigo-500/20"></div>
                    
                    {/* Children row with horizontal cross-bar */}
                    <div className="flex gap-12 relative px-12">
                        {/* Horizontal Cross-bar */}
                        {children.length > 1 && (
                            <div className="absolute top-0 left-[calc(50%/children.length + 64px)] right-[calc(50%/children.length + 64px)] h-0.5 bg-indigo-500/20" 
                                style={{ 
                                    left: `calc(${100 / children.length / 2}% + 0px)`, 
                                    right: `calc(${100 / children.length / 2}% + 0px)` 
                                }}
                            ></div>
                        )}
                        
                        {children.map(child => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Vertical Connector Up to cross-bar */}
                                <div className="w-0.5 h-10 bg-indigo-500/20"></div>
                                <TreeNode 
                                    member={child} 
                                    allMembers={allMembers} 
                                    agencyTotal={agencyTotal}
                                    depth={depth + 1} 
                                    onMoveAgent={onMoveAgent}
                                    canEdit={canEdit}
                                    scale={scale}
                                    focusedId={focusedId}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Teams Component ---

const Teams: React.FC<TeamsProps> = ({ userProfile, currentUser, teamMembers, onUpdateTeam }) => {
    const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('TREE');
    const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', email: '', role: 'AGENT' as Role, defaultCompLevel: '90', parentId: '' });

    // Search States
    const [rosterSearch, setRosterSearch] = useState('');
    const [hierarchySearch, setHierarchySearch] = useState('');
    const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null);

    // Custom Danger Zone Modal State
    const [agentToDelete, setAgentToDelete] = useState<TeamMember | null>(null);

    // Infinite Canvas State
    const [scale, setScale] = useState(0.75);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [availableCarriers] = useState<string[]>(getAvailableCarriers());

    const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'AGENCY_OWNER' || currentUser?.role === 'MANAGER';
    const agencyTotal = useMemo(() => teamMembers.reduce((sum, m) => sum + m.production, 0), [teamMembers]);

    // Canvas Interaction Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
        }
    };

    const handleMouseUp = () => setIsPanning(false);

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.05 : 0.05;
            setScale(prev => Math.min(2, Math.max(0.15, prev + delta)));
        }
    };

    const handleMoveAgent = (agentId: string, newParentId: string | undefined) => {
        if (agentId === newParentId) return;

        const isChildOf = (targetId: string, potentialParentId: string): boolean => {
            const agent = teamMembers.find(m => m.id === targetId);
            if (!agent?.parentId) return false;
            if (agent.parentId === potentialParentId) return true;
            return isChildOf(agent.parentId, potentialParentId);
        };

        if (newParentId && isChildOf(newParentId, agentId)) {
            alert("Restructuring Error: Cannot move a manager into their own downline.");
            return;
        }

        const updated = teamMembers.map(m => m.id === agentId ? { ...m, parentId: newParentId } : m);
        onUpdateTeam(updated);
    };

    const handleDeleteAgent = () => {
        if (!agentToDelete) return;
        
        // Reassign downline agents to the deleted agent's upline to preserve tree integrity
        const parentId = agentToDelete.parentId;
        const updated = teamMembers
            .filter(m => m.id !== agentToDelete.id)
            .map(m => m.parentId === agentToDelete.id ? { ...m, parentId } : m);
            
        onUpdateTeam(updated);
        setAgentToDelete(null);
    };

    const handleCompLevelChange = (id: string, newLevel: number) => {
        const updated = teamMembers.map(m => m.id === id ? { ...m, defaultCompLevel: newLevel } : m);
        onUpdateTeam(updated);
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
        onUpdateTeam(updated);
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
            defaultCompLevel: parseInt(newAgent.defaultCompLevel) || 90,
            parentId: newAgent.parentId || undefined
        };
        onUpdateTeam([...teamMembers, agentToAdd]);
        setIsAddModalOpen(false);
        setNewAgent({ name: '', email: '', role: 'AGENT', defaultCompLevel: '90', parentId: '' });
    };

    const focusOnAgentInTree = (agentId: string) => {
        setFocusedAgentId(agentId);
        setHierarchySearch('');
        // Visual highlight persists for a bit
        setTimeout(() => setFocusedAgentId(null), 4000);
    };

    const rootMembers = teamMembers.filter(m => !m.parentId);
    const filteredRoster = teamMembers.filter(m => 
        m.name.toLowerCase().includes(rosterSearch.toLowerCase()) || 
        m.email.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        m.role.toLowerCase().includes(rosterSearch.toLowerCase())
    );

    const hierarchyResults = teamMembers.filter(m => 
        hierarchySearch && m.name.toLowerCase().includes(hierarchySearch.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col relative pb-20">
            {/* Header / Command Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Network className="text-indigo-500" /> Organizational Command
                    </h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Managing ${agencyTotal.toLocaleString()} In Agency Revenue Volume</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    {/* View Specific Search Implementation */}
                    {viewMode === 'TREE' ? (
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search & Focus Agent..."
                                className="w-64 bg-slate-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={hierarchySearch}
                                onChange={(e) => setHierarchySearch(e.target.value)}
                            />
                            {hierarchyResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto backdrop-blur-xl">
                                    {hierarchyResults.map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => focusOnAgentInTree(m.id)}
                                            className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-between border-b border-white/5 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={m.avatarUrl} className="w-6 h-6 rounded-full" alt="" />
                                                <span>{m.name}</span>
                                            </div>
                                            <Focus size={12} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search Roster..."
                                className="w-64 bg-slate-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={rosterSearch}
                                onChange={(e) => setRosterSearch(e.target.value)}
                            />
                        </div>
                    )}

                    {viewMode === 'TREE' && (
                        <div className="flex items-center bg-slate-900 border border-white/5 p-1 rounded-xl shadow-lg">
                            <button onClick={() => setScale(s => Math.max(0.15, s - 0.1))} className="p-2 text-slate-500 hover:text-white transition-colors"><ZoomOut size={16}/></button>
                            <span className="text-[10px] font-black text-slate-300 w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 text-slate-500 hover:text-white transition-colors"><ZoomIn size={16}/></button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button onClick={() => { setScale(0.75); setOffset({x:0, y:0}); }} className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors" title="Center View"><Maximize size={16}/></button>
                        </div>
                    )}

                    <div className="flex bg-slate-900 border border-white/5 p-1 rounded-xl shadow-lg">
                        <button 
                            onClick={() => setViewMode('LIST')}
                            className={`px-5 py-2 text-xs font-black rounded-lg flex items-center gap-2 transition-all uppercase tracking-widest ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <List size={16} /> Roster
                        </button>
                        <button 
                            onClick={() => setViewMode('TREE')}
                            className={`px-5 py-2 text-xs font-black rounded-lg flex items-center gap-2 transition-all uppercase tracking-widest ${viewMode === 'TREE' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Network size={16} /> Hierarchy
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-xl active:scale-95"
                    >
                        <UserPlus size={16} /> Deploy Agent
                    </button>
                </div>
            </div>

            {/* Tree View - Infinite Canvas Implementation */}
            {viewMode === 'TREE' ? (
                <div className="flex-1 min-h-[650px] relative overflow-hidden bg-slate-950/50 rounded-[2.5rem] border border-white/5 shadow-inner group/canvas">
                    {/* Control Hints Overlay */}
                    <div className="absolute bottom-6 left-6 z-20 flex gap-4 transition-opacity group-hover/canvas:opacity-100 opacity-40">
                        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <MousePointer2 size={12} className="text-indigo-400" /> Pan: Alt+Drag
                        </div>
                        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Move size={12} className="text-indigo-400" /> Restructure: Drag Nodes
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div 
                        ref={canvasRef}
                        className={`w-full h-full cursor-default ${isPanning ? 'cursor-grabbing' : ''}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                        {/* Centering Wrapper */}
                        <div 
                            className="absolute transition-transform duration-75 ease-out origin-center left-1/2 top-0"
                            style={{ 
                                transform: `translate(calc(0px + ${offset.x}px), calc(10% + ${offset.y}px)) scale(${scale}) translateX(-50%)`,
                                minWidth: 'max-content'
                            }}
                        >
                            <div className="flex flex-col items-center pb-64">
                                {rootMembers.map(root => (
                                    <div key={root.id} className="mb-20 last:mb-0">
                                        <TreeNode 
                                            member={root} 
                                            allMembers={teamMembers} 
                                            agencyTotal={agencyTotal}
                                            depth={0} 
                                            onMoveAgent={handleMoveAgent}
                                            canEdit={canEdit}
                                            scale={scale}
                                            focusedId={focusedAgentId}
                                        />
                                    </div>
                                ))}

                                {canEdit && (
                                    <div 
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; }}
                                        onDragLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                                        onDrop={(e) => {
                                            const draggedId = e.dataTransfer.getData('agentId');
                                            if (draggedId) handleMoveAgent(draggedId, undefined);
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                        }}
                                        className="mt-20 border-2 border-dashed border-white/5 rounded-3xl p-12 flex flex-col items-center gap-4 transition-colors"
                                    >
                                        <ArrowUpRight className="text-slate-700" size={32} />
                                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Drop to move to Agency Root</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Standard List View */
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden px-4 flex-1 flex flex-col">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Global Producer List {rosterSearch && <span className="text-indigo-400 normal-case ml-2">(Filtered: {filteredRoster.length})</span>}</h3>
                    </div>
                    <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1">
                        {filteredRoster.length === 0 ? (
                            <div className="p-20 text-center text-slate-500 italic">No agents found matching your search.</div>
                        ) : filteredRoster.map((member) => {
                             const isEditing = expandedMemberId === member.id;
                             const upline = teamMembers.find(m => m.id === member.parentId)?.name || 'Direct / Agency Root';
                             const legTotal = getTotalDownlineProduction(member.id, teamMembers);
                             const managedVolume = legTotal - member.production;

                             return (
                                <div key={member.id} className="group transition-colors">
                                    <div className="p-4 hover:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <img src={member.avatarUrl} className="w-12 h-12 rounded-full border border-slate-700 object-cover bg-slate-800" alt="" />
                                            <div>
                                                <h4 className="font-bold text-white uppercase text-sm tracking-tight">{member.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                                                        member.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                                    }`}>{member.role}</span>
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950/50 px-2 py-0.5 rounded border border-white/5">
                                                        Upline: {upline}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-center px-4 max-w-md">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comp Level</span>
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
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personal</p>
                                                    <p className="text-sm font-black text-white">${member.production.toLocaleString()}</p>
                                                </div>
                                                {managedVolume > 0 && (
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Managed</p>
                                                        <p className="text-sm font-black text-indigo-400">${managedVolume.toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleAdvanced(member)} className={`p-2 rounded-xl transition-all border ${isEditing ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-indigo-500/50'}`}>
                                                        <Settings size={18} />
                                                    </button>
                                                    {member.role !== 'ADMIN' && (
                                                        <button 
                                                            onClick={() => setAgentToDelete(member)}
                                                            className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && editingMember && (
                                        <div className="bg-slate-950/50 border-t border-b border-white/5 p-6 animate-in slide-in-from-top duration-300">
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
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setExpandedMemberId(null)} className="px-5 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-black uppercase tracking-widest">Cancel</button>
                                                <button onClick={saveAdvancedSettings} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl flex items-center gap-2 transition-all active:scale-95"><Save size={16} /> Save Configuration</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                </div>
            )}

            {/* Danger Zone: Custom Removal Modal */}
            {agentToDelete && (
                <div className="fixed inset-0 flex items-center justify-center z-150 p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-[2rem] border-2 border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.2)] w-full max-w-md overflow-hidden ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20 shadow-inner">
                                <ShieldAlert size={40} className="text-rose-500 animate-pulse" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Remove from Roster?</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed px-4">
                                You are about to remove <span className="text-white font-bold">{agentToDelete.name}</span> from the agency roster.
                                <br/>
                                <span className="text-xs text-indigo-400 font-bold uppercase mt-4 block border-t border-white/5 pt-4">
                                    Hierarchy Preservation Active:
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    Any direct reports will be automatically reassigned to their next upline manager.
                                </span>
                            </p>

                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setAgentToDelete(null)}
                                    className="flex-1 py-4 bg-slate-800 text-slate-300 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all text-xs"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteAgent}
                                    className="flex-1 py-4 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 shadow-xl transition-all text-xs flex items-center justify-center gap-2 ring-2 ring-rose-500/20"
                                >
                                    <UserMinus size={16} /> Confirm Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Agent Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-110 p-4 bg-slate-950/90 backdrop-blur-xl">
                    <div className="bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                    <UserPlus className="text-indigo-500" /> Initialize Agent
                                </h3>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Stanley Hudson" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="stanley@dundermifflin.com" value={newAgent.email} onChange={e => setNewAgent({...newAgent, email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Role</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value as Role})}>
                                        <option value="AGENT">Agent</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="AGENCY_OWNER">Agency Owner</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contract Level (%)</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={newAgent.defaultCompLevel} onChange={e => setNewAgent({...newAgent, defaultCompLevel: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign to Upline</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={newAgent.parentId} onChange={e => setNewAgent({...newAgent, parentId: e.target.value})}>
                                    <option value="">No Upline (Root)</option>
                                    {teamMembers.filter(m => m.role !== 'AGENT').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleAddAgent} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
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