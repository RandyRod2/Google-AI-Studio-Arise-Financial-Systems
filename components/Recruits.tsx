import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Recruit, TeamMember, SaaSUser, User } from '../types';
import { logAuditAction } from '../services/auditService';
import { 
    UserPlus, Plus, X, Edit2, GripVertical, Users, Clock, UserCheck, 
    Search, Send, CheckCircle2, Calculator, TrendingUp, DollarSign, 
    Building2, ArrowRight, Target, Sliders, Zap, Mail, ShieldCheck,
    Copy, ExternalLink, Sparkles, UserMinus, ShieldAlert, ChevronDown, TrendingDown, Wallet, ArrowUpRight
} from 'lucide-react';
import { MOCK_TEAM, generateSaaSUsers } from '../services/mockData';
import { getAvailableCarriers, getAvailableProducts, calculateCommissionExact } from '../services/commissionService';

interface RecruitsProps {
    recruits: Recruit[];
    onUpdateRecruits: (recruits: Recruit[]) => void;
}

const Recruits: React.FC<RecruitsProps> = ({ recruits, onUpdateRecruits }) => {
    // --- State Management ---
    const [activeTab, setActiveTab] = useState<'PIPELINE' | 'ALPHA'>('PIPELINE');

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch (e) { return MOCK_TEAM; }
    });

    // --- Recruiting Alpha State ---
    const [alphaInputs, setAlphaInputs] = useState({
        carrier: '',
        product: '',
        currentLevel: 80,
        ariseLevel: 115,
        monthlyPremium: 4500
    });

    const [alphaCarriers, setAlphaCarriers] = useState<string[]>([]);
    const [alphaProducts, setAlphaProducts] = useState<string[]>([]);

    // Fetch Carriers on Mount
    useEffect(() => {
        const carriers = getAvailableCarriers();
        setAlphaCarriers(carriers);
        if (carriers.length > 0) {
            setAlphaInputs(prev => ({ ...prev, carrier: carriers[0] }));
        }
    }, []);

    // Fetch Products when Carrier Changes
    useEffect(() => {
        if (alphaInputs.carrier) {
            const products = getAvailableProducts(alphaInputs.carrier);
            setAlphaProducts(products);
            if (products.length > 0) {
                setAlphaInputs(prev => ({ ...prev, product: products[0] }));
            }
        }
    }, [alphaInputs.carrier]);

    // Persistence
    useEffect(() => { localStorage.setItem('arise_team_members', JSON.stringify(teamMembers)); }, [teamMembers]);

    // UI States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [promotionSuccess, setPromotionSuccess] = useState<{recruit: Recruit, inviteLink: string} | null>(null);
    const [editingRecruit, setEditingRecruit] = useState<Recruit | null>(null);
    const [newRecruit, setNewRecruit] = useState<Partial<Recruit>>({ name: '', source: 'LinkedIn', stage: 'New', email: '', phone: '' });
    
    const [draggedRecruitId, setDraggedRecruitId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);
    const [confirmingPromoteId, setConfirmingPromoteId] = useState<string | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const autoScrollSpeed = useRef<number>(0);
    const animationFrameId = useRef<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRecruits = recruits.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Alpha Calculations ---
    const alphaResults = useMemo(() => {
        const annualPremium = alphaInputs.monthlyPremium * 12;
        
        // Use exact registry calculations including interpolation
        const currentData = calculateCommissionExact(
            alphaInputs.carrier, 
            alphaInputs.product, 
            annualPremium, 
            alphaInputs.currentLevel
        );
        
        const ariseData = calculateCommissionExact(
            alphaInputs.carrier, 
            alphaInputs.product, 
            annualPremium, 
            alphaInputs.ariseLevel
        );

        const delta = ariseData.total - currentData.total;
        const deltaPercent = currentData.total > 0 ? ((ariseData.total / currentData.total) - 1) * 100 : 0;
        
        return { 
            delta, 
            deltaPercent, 
            currentAnnual: currentData.total, 
            ariseAnnual: ariseData.total, 
            currentAdvance: currentData.total * 0.75, 
            ariseAdvance: ariseData.total * 0.75,
            annualPremium,
            currentRate: currentData.fycRate,
            ariseRate: ariseData.fycRate
        };
    }, [alphaInputs]);

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
        onUpdateRecruits([...recruits, recruit]);
        setIsAddModalOpen(false);
        setNewRecruit({ name: '', source: 'LinkedIn', stage: 'New', email: '', phone: '' });
    };

    const handleUpdateRecruit = () => {
        if (!editingRecruit || !editingRecruit.name) return;
        onUpdateRecruits(recruits.map(r => r.id === editingRecruit.id ? editingRecruit : r));
        setIsEditModalOpen(false);
        setEditingRecruit(null);
    };

    const handleMoveToRoster = (recruit: Recruit) => {
        const newAgent: TeamMember = {
            id: `agent-${Date.now()}`,
            name: recruit.name,
            email: recruit.email || '',
            role: 'AGENT',
            production: 0,
            activePolicies: 1, 
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(recruit.name)}&background=random`,
            defaultCompLevel: 90
        };

        setTeamMembers(prev => [...prev, newAgent]);
        onUpdateRecruits(recruits.filter(r => r.id !== recruit.id));
        setConfirmingPromoteId(null);
        
        const actorRaw = localStorage.getItem('arise_active_session_v1');
        const actor: User | null = actorRaw ? JSON.parse(actorRaw) : null;
        logAuditAction(actor, 'AGENT_PROMOTED', recruit.id, `Promoted ${recruit.name} to Agent Roster. Data move completed.`, 2);
    };

    const handleSendInviteAndPromote = (recruit: Recruit) => {
        const saasUsersRaw = localStorage.getItem('arise_saas_users');
        let saasUsers: SaaSUser[] = saasUsersRaw ? JSON.parse(saasUsersRaw) : generateSaaSUsers(10);
        const existingUser = saasUsers.find(u => u.email.toLowerCase() === recruit.email?.toLowerCase());

        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const inviteLink = `https://arise-command.app/onboard?invite=${inviteCode}&email=${encodeURIComponent(recruit.email || '')}`;

        if (!existingUser && recruit.email) {
            const pendingSaaSUser: SaaSUser = {
                id: `user-${Date.now()}`,
                name: recruit.name,
                email: recruit.email,
                role: 'AGENT',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(recruit.name)}&background=random`,
                status: 'pending_invite' as any,
                plan: 'professional',
                joinDate: new Date().toISOString().split('T')[0],
                lastLogin: 'Never',
                monthlyFee: 99,
                agencyName: 'Unassigned (New Promotion)'
            };
            saasUsers.push(pendingSaaSUser);
            localStorage.setItem('arise_saas_users', JSON.stringify(saasUsers));
        }

        handleMoveToRoster(recruit);

        const actorRaw = localStorage.getItem('arise_active_session_v1');
        const actor: User | null = actorRaw ? JSON.parse(actorRaw) : null;
        logAuditAction(actor, 'AGENT_INVITE_SENT', recruit.id, `Platform invitation link generated for ${recruit.name}. Link displayed to administrator.`, 4);

        setPromotionSuccess({ recruit, inviteLink });
    };

    const handleDragStart = (e: React.DragEvent, recruitId: string) => {
        setDraggedRecruitId(recruitId);
        e.dataTransfer.setData('recruitId', recruitId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedRecruitId(null);
        setDragOverStage(null);
        stopAutoScroll();
    };

    const handleDragOver = (e: React.DragEvent, stage: string) => {
        e.preventDefault();
        if (dragOverStage !== stage) {
            setDragOverStage(stage);
        }
    };

    const handleDrop = (e: React.DragEvent, stage: Recruit['stage']) => {
        e.preventDefault();
        const recruitId = e.dataTransfer.getData('recruitId');
        
        if (recruitId) {
            onUpdateRecruits(recruits.map(r => 
                r.id === recruitId ? { ...r, stage } : r
            ));
        }
        
        handleDragEnd();
    };

    const handleContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
        if (!draggedRecruitId || !scrollContainerRef.current) return;
        const { left, right } = scrollContainerRef.current.getBoundingClientRect();
        const x = e.clientX;
        if (x < left + 150) { autoScrollSpeed.current = -15; startAutoScroll(); }
        else if (x > right - 150) { autoScrollSpeed.current = 15; startAutoScroll(); }
        else { autoScrollSpeed.current = 0; }
    };

    const startAutoScroll = () => {
        if (animationFrameId.current) return;
        const scroll = () => {
            if (scrollContainerRef.current && autoScrollSpeed.current !== 0) {
                scrollContainerRef.current.scrollLeft += autoScrollSpeed.current;
                animationFrameId.current = requestAnimationFrame(scroll);
            } else { stopAutoScroll(); }
        };
        animationFrameId.current = requestAnimationFrame(scroll);
    };

    const stopAutoScroll = () => {
        if (animationFrameId.current) { cancelAnimationFrame(animationFrameId.current); animationFrameId.current = null; }
        autoScrollSpeed.current = 0;
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
        <div className="animate-fade-in space-y-6 h-full flex flex-col relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-indigo-500" /> Recruiting Command
                    </h2>
                    <p className="text-sm text-slate-400">Drive agency growth and move recruits through the licensing lifecycle.</p>
                </div>
                
                <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 shadow-lg">
                    <button onClick={() => setActiveTab('PIPELINE')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${activeTab === 'PIPELINE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Pipeline</button>
                    <button onClick={() => setActiveTab('ALPHA')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === 'ALPHA' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Calculator size={14} /> Earnings Alpha</button>
                </div>
            </div>

            {activeTab === 'PIPELINE' ? (
                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                    <div className="flex justify-end gap-3 px-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input type="text" placeholder="Search candidates..." className="pl-10 pr-4 py-2 border border-slate-700 bg-slate-900/50 text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-medium text-sm transition-colors shadow-sm"><Plus size={16} /> Add Candidate</button>
                    </div>

                    <div className="flex-1 overflow-x-auto min-h-0 custom-scrollbar" ref={scrollContainerRef} onDragOver={handleContainerDragOver}>
                        <div className="flex gap-4 h-full min-w-[1400px] pb-4 px-4">
                            {(['New', 'Interview', 'Licensing', 'Onboarding', 'Contracted'] as const).map((stage) => {
                                const isContracted = stage === 'Contracted';
                                const items = filteredRecruits.filter(r => r.stage === stage);
                                return (
                                    <div key={stage} className={`flex-1 flex flex-col rounded-xl border transition-all duration-300 h-full backdrop-blur-sm ${dragOverStage === stage ? 'bg-indigo-500/20 border-indigo-500/50 ring-2 ring-indigo-500/30' : 'bg-slate-900/30 border-white/5'} ${isContracted ? 'bg-green-900/5 border-green-500/20' : ''}`} onDragOver={(e) => handleDragOver(e, stage)} onDrop={(e) => handleDrop(e, stage)}>
                                        <div className={`p-3 rounded-t-xl border-b flex justify-between items-center font-bold text-sm uppercase tracking-wide ${getStageColor(stage)}`}>{stage === 'Contracted' ? 'Ready for Deployment' : stage} <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs text-slate-300 border border-white/5">{items.length}</span></div>
                                        <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                            {items.map((recruit) => (
                                                <div key={recruit.id} draggable onDragStart={(e) => handleDragStart(e, recruit.id)} onDragEnd={handleDragEnd} onClick={(e) => { e.stopPropagation(); setEditingRecruit(recruit); setIsEditModalOpen(true); }} className={`bg-slate-800/80 p-4 rounded-lg shadow-sm border border-white/10 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group ${draggedRecruitId === recruit.id ? 'opacity-50' : ''}`}>
                                                    <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-white text-sm flex items-center gap-2"><GripVertical size={12} className="text-slate-500 opacity-0 group-hover:opacity-100" /> {recruit.name}</h4><Edit2 size={12} className="text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                                    <div className="space-y-1.5"><div className="flex items-center gap-2 text-xs text-slate-400"><Users size={12} /> {recruit.source}</div><div className="flex items-center gap-2 text-xs text-slate-400"><Mail size={12} /> {recruit.email || 'No Email'}</div></div>
                                                    
                                                    {isContracted && (
                                                        <div className="mt-4 pt-3 border-t border-white/5">
                                                            {confirmingPromoteId === recruit.id ? (
                                                                <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
                                                                    <p className="text-[9px] font-black text-indigo-400 uppercase text-center mb-1">Final Authorization Required</p>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleMoveToRoster(recruit); }}
                                                                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-black uppercase tracking-tighter rounded border border-white/10 flex items-center justify-center gap-1"
                                                                        >
                                                                            <UserMinus size={10} /> Promote Data Only
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleSendInviteAndPromote(recruit); }}
                                                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-tighter rounded shadow-lg flex items-center justify-center gap-1 ring-2 ring-indigo-500/20"
                                                                        >
                                                                            <Zap size={10} fill="currentColor" /> Send Arise Invite
                                                                        </button>
                                                                    </div>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); setConfirmingPromoteId(null); }}
                                                                        className="w-full py-1 text-[8px] font-bold text-slate-500 hover:text-slate-300 uppercase transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setConfirmingPromoteId(recruit.id); }} 
                                                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                                                >
                                                                    <ShieldCheck size={14} /> Promote to Agent
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col lg:flex-row gap-8 animate-fade-in pb-12 overflow-y-auto custom-scrollbar px-4">
                    {/* LEFT: INPUTS */}
                    <div className="w-full lg:w-[400px] shrink-0 space-y-6">
                        <div className="bg-slate-900 rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <Calculator size={100} />
                            </div>
                            
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <Sliders size={18} className="text-indigo-400" /> Comparison Parameters
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Carrier Selection</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <select 
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                            value={alphaInputs.carrier}
                                            onChange={e => setAlphaInputs({...alphaInputs, carrier: e.target.value})}
                                        >
                                            {alphaCarriers.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Product</label>
                                    <div className="relative">
                                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <select 
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                            value={alphaInputs.product}
                                            onChange={e => setAlphaInputs({...alphaInputs, product: e.target.value})}
                                        >
                                            {alphaProducts.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Monthly Premium Target</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={alphaInputs.monthlyPremium}
                                            onChange={e => setAlphaInputs({...alphaInputs, monthlyPremium: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Contract</span>
                                        <span className="text-sm font-black text-slate-300">{alphaInputs.currentLevel}%</span>
                                    </div>
                                    <input 
                                        type="range" min="70" max="145" step="5"
                                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-slate-500"
                                        value={alphaInputs.currentLevel}
                                        onChange={e => setAlphaInputs({...alphaInputs, currentLevel: Number(e.target.value)})}
                                    />
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Arise Platform Level</span>
                                        <span className="text-sm font-black text-indigo-400">{alphaInputs.ariseLevel}%</span>
                                    </div>
                                    <input 
                                        type="range" min="70" max="145" step="5"
                                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                        value={alphaInputs.ariseLevel}
                                        onChange={e => setAlphaInputs({...alphaInputs, ariseLevel: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-5 flex gap-4 items-center">
                            <Sparkles className="text-indigo-400 shrink-0" size={24} />
                            <p className="text-[10px] font-bold text-indigo-200 leading-relaxed uppercase tracking-wider">Use this data to demonstrate the immediate financial impact of moving their book to the Arise ecosystem.</p>
                        </div>
                    </div>

                    {/* RIGHT: RESULTS */}
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Comparison Cards */}
                            <div className="bg-slate-900 rounded-2xl border border-white/5 p-6 flex flex-col justify-between overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <TrendingDown size={100} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Current Earnings</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">${alphaResults.currentAnnual.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                        <span className="text-xs font-bold text-slate-500">/ YEAR</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Calculated at {alphaInputs.currentLevel}% Contract Level</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl border border-indigo-500/30 p-6 flex flex-col justify-between overflow-hidden relative shadow-2xl shadow-indigo-900/20">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <TrendingUp size={100} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Arise Platform Earnings</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">${alphaResults.ariseAnnual.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                        <span className="text-xs font-bold text-indigo-300">/ YEAR</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase mt-4">Calculated at {alphaInputs.ariseLevel}% Platform Base</p>
                                </div>
                            </div>
                        </div>

                        {/* Delta Analytics */}
                        <div className="bg-slate-900 rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500"></div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <div>
                                    <h4 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Annual Revenue Lift (Alpha)</h4>
                                    <div className="flex items-center gap-4">
                                        <span className="text-6xl font-black text-white tracking-tighter">+${alphaResults.delta.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                        <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-black shadow-lg shadow-emerald-900/40">
                                            +{alphaResults.deltaPercent.toFixed(1)}% LIFT
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Annual Premium Target</p>
                                    <p className="text-xl font-black text-white">${alphaResults.annualPremium.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 flex items-center gap-5">
                                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                                        <Wallet size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Immediate Advance Delta</p>
                                        <h5 className="text-2xl font-black text-indigo-400">+${(alphaResults.delta * 0.75).toLocaleString(undefined, {maximumFractionDigits: 0})}</h5>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Extra cash-in-hand per year</p>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 flex items-center gap-5">
                                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        <Target size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Cashflow Increase</p>
                                        <h5 className="text-2xl font-black text-emerald-400">+${(alphaResults.delta / 12).toLocaleString(undefined, {maximumFractionDigits: 0})}</h5>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Sustained monthly lift</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex flex-col items-center">
                                <div className="w-full flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                                    <span>Earnings Breakdown Visualization</span>
                                    <span className="text-indigo-400">Arise Dominance: +{alphaResults.deltaPercent.toFixed(0)}%</span>
                                </div>
                                <div className="w-full h-8 bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex relative group">
                                    <div 
                                        className="h-full bg-slate-700 transition-all duration-1000 ease-out flex items-center justify-center overflow-hidden" 
                                        style={{ width: `${(alphaResults.currentAnnual / alphaResults.ariseAnnual) * 100}%` }}
                                    >
                                        <span className="text-[9px] font-black text-white/40 uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Current</span>
                                    </div>
                                    <div 
                                        className="h-full bg-indigo-600 transition-all duration-1000 ease-out delay-300 flex items-center justify-center relative overflow-hidden" 
                                        style={{ width: `${(alphaResults.delta / alphaResults.ariseAnnual) * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[scroll-ticker_20s_linear_infinite]"></div>
                                        <span className="text-[9px] font-black text-white uppercase whitespace-nowrap relative z-10 drop-shadow-md">Arise Alpha</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Close Logic */}
                        <div className="bg-slate-900/40 rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row items-center gap-8 group">
                            <div className="shrink-0 p-4 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                <ArrowUpRight className="text-indigo-400" size={48} />
                            </div>
                            <div>
                                <h5 className="text-lg font-black text-white uppercase tracking-tight mb-2">The Recruitment Bridge</h5>
                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                    "Based on your current numbers with <b>{alphaInputs.carrier}</b>, you're leaving over <b>${alphaResults.delta.toLocaleString(undefined, {maximumFractionDigits: 0})}</b> a year on the table. At Arise, our 115% platform base ensures that the harder you work, the more of that production you actually keep. That's an immediate <b>${(alphaResults.delta * 0.75).toLocaleString(undefined, {maximumFractionDigits: 0})}</b> pay raise on your advances alone."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inivation Success Modal and others remain same */}
            {promotionSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-[150] p-4 bg-slate-950/95 backdrop-blur-2xl">
                    <div className="bg-slate-900 rounded-[3rem] border-4 border-indigo-500/30 shadow-[0_0_100px_rgba(99,102,241,0.2)] w-full max-w-xl overflow-hidden ring-1 ring-white/10 p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative z-10 animate-bounce">
                                <Sparkles size={48} />
                            </div>
                            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[40px] opacity-30 animate-pulse"></div>
                        </div>

                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Agent Initialized!</h3>
                        <div className="flex items-center gap-2 mb-8">
                            <span className="h-1 w-8 bg-indigo-500 rounded-full"></span>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Platform Invitation Sent</p>
                            <span className="h-1 w-8 bg-indigo-500 rounded-full"></span>
                        </div>
                        
                        <p className="text-slate-300 text-sm mb-10 leading-relaxed">
                            <b className="text-white font-black text-lg">{promotionSuccess.recruit.name}</b> has been successfully moved to the Agent Roster. <br/>
                            An automated invitation email has been dispatched to <br/>
                            <b className="text-indigo-400 font-mono tracking-tight">{promotionSuccess.recruit.email}</b>.
                        </p>
                        
                        <div className="w-full bg-slate-950/80 border border-white/5 rounded-[2rem] p-8 mb-10 text-left relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                <ShieldCheck size={120} />
                            </div>
                            
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Direct Command Activation Link</label>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 flex-1 font-mono text-[10px] text-slate-300 truncate shadow-inner">
                                    {promotionSuccess.inviteLink}
                                </div>
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(promotionSuccess.inviteLink); alert("Direct link copied to clipboard!"); }}
                                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-lg active:scale-95 group/btn"
                                    title="Copy Link"
                                >
                                    <Copy size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-4 italic font-medium">Use this link to manually activate the account if the recruit has difficulty accessing their primary email.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                            <button 
                                onClick={() => setPromotionSuccess(null)}
                                className="w-full py-5 bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-700 transition-all text-xs border border-white/5 active:scale-95"
                            >
                                Dismiss
                            </button>
                            <button 
                                onClick={() => { setPromotionSuccess(null); setActiveTab('PIPELINE'); }}
                                className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 shadow-xl transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
                            >
                                Return to Pipeline <ArrowRight size={14} />
                            </button>
                        </div>

                        <p className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-widest">Powered By Arise Financial Systems™</p>
                    </div>
                </div>
            )}

            {/* Pipeline Modals */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl"><h3 className="font-bold text-white">Add New Candidate</h3><button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button></div>
                        <div className="p-6 space-y-4">
                            <input placeholder="Name" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newRecruit.name} onChange={e => setNewRecruit({...newRecruit, name: e.target.value})} />
                            <input placeholder="Email" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newRecruit.email} onChange={e => setNewRecruit({...newRecruit, email: e.target.value})} />
                            <button onClick={handleAddRecruit} className="w-full py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 shadow-lg">Add Candidate</button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && editingRecruit && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl"><h3 className="font-bold text-white">Edit Candidate</h3><button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button></div>
                        <div className="p-6 space-y-4">
                            <input placeholder="Name" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" value={editingRecruit.name} onChange={e => setEditingRecruit({...editingRecruit, name: e.target.value})} />
                            <input placeholder="Email" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" value={editingRecruit.email} onChange={e => setEditingRecruit({...editingRecruit, email: e.target.value})} />
                            <textarea placeholder="Notes" className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 h-24" value={editingRecruit.notes} onChange={e => setEditingRecruit({...editingRecruit, notes: e.target.value})} />
                            <button onClick={handleUpdateRecruit} className="w-full py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 shadow-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recruits;