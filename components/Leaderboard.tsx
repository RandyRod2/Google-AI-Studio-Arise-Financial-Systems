
import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { 
    Trophy, Medal, Star, TrendingUp, Calendar, Monitor, Bell, 
    Swords, Zap, ChevronRight, Maximize2, Shield, Crown, 
    Flame, ArrowRight, Target, Sparkles, X, User, Plus, 
    Trophy as TrophyIcon, Volume2, ChevronLeft, Layout, Settings, Trash2,
    Check, History, Award, Heart, ShieldCheck, ZapIcon, Ghost, Siren,
    UserCheck, Scale, AudioLines, Stethoscope, Briefcase,
    UserPlus, Users, Train, Medal as MedalIcon, BarChart3, PieChart, Activity,
    Network, Eye, Search
} from 'lucide-react';
import { TeamMember, Duel, Badge } from '../types';

type TimeFrame = 'WEEKLY' | 'MONTHLY' | 'YTD';
type TvTab = 'PODIUM' | 'RANKINGS' | 'CHAMPIONS' | 'DUELS';

const CHAMPIONS_HISTORY = [
    { month: 'January', year: 2024, agentName: 'Randy Rodriguez', production: 142000, avatarUrl: 'https://picsum.photos/100/100?random=99' },
    { month: 'February', year: 2024, agentName: 'Dwight Schrute', production: 118000, avatarUrl: 'https://picsum.photos/100/100?random=12' },
    { month: 'March', year: 2024, agentName: 'Randy Rodriguez', production: 156000, avatarUrl: 'https://picsum.photos/100/100?random=99' },
    { month: 'April', year: 2024, agentName: 'Jim Halpert', production: 98000, avatarUrl: 'https://picsum.photos/100/100?random=13' },
    { month: 'May', year: 2024, agentName: 'Pam Beesly', production: 105000, avatarUrl: 'https://picsum.photos/100/100?random=14' },
    { month: 'June', year: 2024, agentName: 'Randy Rodriguez', production: 189000, avatarUrl: 'https://picsum.photos/100/100?random=99' },
    { month: 'July', year: 2024, agentName: 'Dwight Schrute', production: 125000, avatarUrl: 'https://picsum.photos/100/100?random=12' },
    { month: 'August', year: 2024, agentName: 'Jim Halpert', production: 112000, avatarUrl: 'https://picsum.photos/100/100?random=13' },
    { month: 'September', year: 2024, agentName: 'Randy Rodriguez', production: 167000, avatarUrl: 'https://picsum.photos/100/100?random=99' },
];

const Leaderboard: React.FC = () => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTHLY');
    const [searchTerm, setSearchTerm] = useState('');
    const [isTvMode, setIsTvMode] = useState(false);
    const [tvTab, setTvTab] = useState<TvTab>('PODIUM');
    const [tvProgress, setTvProgress] = useState(0);
    const [showChampions, setShowChampions] = useState(false);
    const [selectedAgentProfile, setSelectedAgentProfile] = useState<TeamMember | null>(null);
    const [activeWin, setActiveWin] = useState<any>(null);
    
    // --- Duels State ---
    const [duels, setDuels] = useState<Duel[]>(() => {
        const saved = localStorage.getItem('arise_duels');
        const defaultDuels: Duel[] = [
            { id: 'duel-1', category: 'AGENT', competitor1Id: 't3', competitor2Id: 't2', type: 'APPS', target: 10, current1: 7, current2: 8, status: 'ACTIVE' },
            { id: 'duel-leg-1', category: 'AGENCY', competitor1Id: 'leg_a', competitor2Id: 'leg_b', competitor1Name: 'Pinnacle Leg', competitor2Name: 'Summit Leg', type: 'PREMIUM', target: 50000, current1: 32000, current2: 28500, status: 'ACTIVE' }
        ];
        return saved ? JSON.parse(saved) : defaultDuels;
    });

    const [isDuelModalOpen, setIsDuelModalOpen] = useState(false);
    const [newDuel, setNewDuel] = useState<Partial<Duel>>({
        category: 'AGENT',
        competitor1Id: 't1',
        competitor2Id: 't2',
        competitor1Name: '',
        competitor2Name: '',
        type: 'APPS',
        target: 5,
        current1: 0,
        current2: 0,
        status: 'ACTIVE'
    });

    // Listen for global wins
    useEffect(() => {
        const handleGlobalWin = (e: any) => {
            setActiveWin(e.detail);
            setTimeout(() => setActiveWin(null), 6000);
        };
        window.addEventListener('arise-sales-win', handleGlobalWin);
        return () => window.removeEventListener('arise-sales-win', handleGlobalWin);
    }, []);

    // TV Mode Auto-Cycle
    useEffect(() => {
        let interval: any;
        let progressInterval: any;
        if (isTvMode) {
            setTvProgress(0);
            interval = setInterval(() => {
                setTvTab(current => {
                    if (current === 'PODIUM') return 'RANKINGS';
                    if (current === 'RANKINGS') return 'CHAMPIONS';
                    if (current === 'CHAMPIONS') return 'DUELS';
                    return 'PODIUM';
                });
                setTvProgress(0);
            }, 10000);
            progressInterval = setInterval(() => {
                setTvProgress(prev => Math.min(100, prev + 1));
            }, 100);
        }
        return () => { clearInterval(interval); clearInterval(progressInterval); };
    }, [isTvMode]);

    const getProduction = (baseProduction: number) => {
        switch (timeFrame) {
            case 'WEEKLY': return Math.round(baseProduction / 52);
            case 'MONTHLY': return Math.round(baseProduction / 12);
            default: return baseProduction;
        }
    };

    // --- Statistics & Search Logic ---
    const allProcessedTeam = useMemo(() => {
        return MOCK_TEAM.map(member => {
            const displayProd = getProduction(member.production);
            // Estimate families protected based on production (roughly $1500 avg premium per family)
            const displayFamilies = Math.max(1, Math.round(displayProd / 1500));
            
            return {
                ...member,
                displayProduction: displayProd,
                displayFamilies: displayFamilies,
                level: Math.floor(member.production / 10000) + 1,
            };
        }).sort((a, b) => b.displayProduction - a.displayProduction);
    }, [timeFrame]);

    const sortedTeam = useMemo(() => {
        return allProcessedTeam.filter(agent => 
            agent.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allProcessedTeam, searchTerm]);

    const agencyStats = useMemo(() => {
        const totalProd = allProcessedTeam.reduce((sum, m) => sum + m.displayProduction, 0);
        const totalFam = allProcessedTeam.reduce((sum, m) => sum + m.displayFamilies, 0);
        const activeCount = allProcessedTeam.length;
        
        return {
            totalAgencyProduction: totalProd,
            totalFamiliesProtected: totalFam,
            activeAgents: activeCount
        };
    }, [allProcessedTeam]);

    const topThree = useMemo(() => allProcessedTeam.slice(0, 3), [allProcessedTeam]);
    
    const handleCreateDuel = () => {
        const duel: Duel = {
            id: `duel-${Date.now()}`,
            category: newDuel.category || 'AGENT',
            competitor1Id: newDuel.competitor1Id || 'manual',
            competitor2Id: newDuel.competitor2Id || 'manual',
            competitor1Name: newDuel.category === 'AGENCY' ? newDuel.competitor1Name : getMemberById(newDuel.competitor1Id || 't1').name,
            competitor2Name: newDuel.category === 'AGENCY' ? newDuel.competitor2Name : getMemberById(newDuel.competitor2Id || 't2').name,
            type: newDuel.type || 'APPS',
            target: Number(newDuel.target) || 5,
            current1: 0,
            current2: 0,
            status: 'ACTIVE'
        };
        const updatedDuels = [duel, ...duels];
        setDuels(updatedDuels);
        localStorage.setItem('arise_duels', JSON.stringify(updatedDuels));
        setIsDuelModalOpen(false);
    };

    const updateDuelScore = (duelId: string, competitor: 1 | 2, increment: number) => {
        setDuels(prev => prev.map(d => {
            if (d.id !== duelId) return d;
            const updated = { ...d };
            if (competitor === 1) updated.current1 = Math.max(0, updated.current1 + increment);
            else updated.current2 = Math.max(0, updated.current2 + increment);
            if (updated.current1 >= updated.target || updated.current2 >= updated.target) updated.status = 'FINISHED';
            return updated;
        }));
    };

    const deleteDuel = (id: string) => {
        const updated = duels.filter(d => d.id !== id);
        setDuels(updated);
        localStorage.setItem('arise_duels', JSON.stringify(updated));
    };

    const getMemberById = (id: string) => MOCK_TEAM.find(m => m.id === id) || MOCK_TEAM[0];

    const openProfile = (agent: TeamMember) => {
        setSelectedAgentProfile(agent);
    };

    return (
        <div className={`animate-fade-in flex flex-col transition-all duration-700 pb-12 ${isTvMode ? 'bg-slate-950 fixed inset-0 z-50 p-0 overflow-hidden' : 'gap-8 relative'}`}>
            
            {/* TV MODE OVERLAYS */}
            {isTvMode && (
                <>
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900 z-[60]">
                        <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-100 ease-linear" style={{ width: `${tvProgress}%` }} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 z-[60] flex items-center justify-between">
                         <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 rounded-lg"><Monitor size={20} className="text-white" /></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Live Display Mode</p>
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">
                                        {tvTab === 'PODIUM' ? 'The Championship Podium' : tvTab === 'RANKINGS' ? 'Current Office Roster' : tvTab === 'CHAMPIONS' ? 'Hall of Champions' : 'The Arena: Active Duels'}
                                    </h2>
                                </div>
                            </div>
                         </div>
                         <button onClick={() => setIsTvMode(false)} className="p-3 bg-white text-slate-950 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-colors">Exit</button>
                    </div>
                </>
            )}

            {!isTvMode && (
                <div className="flex flex-col gap-6 shrink-0 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 border border-white/10 rounded-2xl">
                                <Trophy className="text-white" size={32} />
                            </div>
                            <div>
                                <h2 className="font-black tracking-tighter uppercase text-3xl text-white">Agency Leaderboard</h2>
                                <p className="text-slate-500 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                                    <Flame size={14} className="text-orange-500" /> Live Arena & Standings
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsTvMode(true)} className="p-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest"><Monitor size={18} /> TV Mode</button>
                            <div className="bg-slate-900 p-1 rounded-xl border border-white/10 shadow-sm flex">
                                {(['WEEKLY', 'MONTHLY', 'YTD'] as TimeFrame[]).map((tf) => (
                                    <button key={tf} onClick={() => setTimeFrame(tf)} className={`px-5 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-widest ${timeFrame === tf ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{tf}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Agency Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                        <div className="bg-slate-900/40 p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Agency Production</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter">${agencyStats.totalAgencyProduction.toLocaleString()}</h3>
                        </div>
                        <div className="bg-slate-900/40 p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Families Protected</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{agencyStats.totalFamiliesProtected.toLocaleString()}</h3>
                        </div>
                        <div className="bg-slate-900/40 p-6 border border-white/5 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Active Agents</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{agencyStats.activeAgents}</h3>
                        </div>
                    </div>

                    {/* Search Feature */}
                    <div className="flex justify-end mt-2">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Search agents and view their numbers..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-1 transition-all duration-700 ${isTvMode ? 'flex items-center justify-center h-[calc(100vh-80px)]' : ''}`}>
                
                {/* 1. PODIUM VIEW */}
                {((!isTvMode && !showChampions && !searchTerm) || (isTvMode && tvTab === 'PODIUM')) && (
                    <div className={`w-full flex flex-col items-center animate-in slide-in-from-right duration-700 ${isTvMode ? 'scale-125' : ''}`}>
                         <div className="flex flex-col md:flex-row justify-center items-end gap-12 mb-8 h-[400px]">
                            {/* 2nd Place */}
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => openProfile(topThree[1])}>
                                <div className="relative mb-4">
                                    <div className={`w-24 h-24 rounded-3xl border-4 border-slate-500/50 p-1 rotate-3 group-hover:rotate-0 transition-transform bg-slate-900 overflow-hidden shadow-2xl`}>
                                        <img src={topThree[1].avatarUrl} alt="" className="w-full h-full object-cover grayscale-[0.3]" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-slate-600 text-white text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl border-2 border-slate-900 shadow-xl">2</div>
                                </div>
                                <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 text-center w-48 shadow-2xl group-hover:border-indigo-500/50 transition-colors">
                                     <h3 className="font-black text-white text-sm truncate uppercase tracking-tight">{topThree[1].name}</h3>
                                     <p className="text-2xl font-black text-slate-200 mt-2">${topThree[1].displayProduction.toLocaleString()}</p>
                                </div>
                            </div>
                            {/* 1st Place */}
                            <div className="flex flex-col items-center z-10 group relative cursor-pointer" onClick={() => openProfile(topThree[0])}>
                                <Crown size={64} className="text-yellow-500 absolute -top-16 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_25px_rgba(234,179,8,0.6)]" />
                                <div className="relative mb-6">
                                    <div className={`w-40 h-40 rounded-3xl border-4 border-yellow-500 p-1 -rotate-3 group-hover:rotate-0 transition-transform bg-slate-900 overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.3)]`}>
                                        <img src={topThree[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-3 -right-3 bg-yellow-500 text-slate-950 text-xl font-black w-12 h-12 flex items-center justify-center rounded-xl border-4 border-slate-900 shadow-2xl">1</div>
                                </div>
                                <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900/80 backdrop-blur-2xl p-8 rounded-3xl border-2 border-indigo-500/30 text-center w-72 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:border-indigo-400 transition-colors">
                                     <h3 className="font-black text-white text-2xl truncate uppercase tracking-tighter">{topThree[0].name}</h3>
                                     <p className="text-5xl font-black text-white mt-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">${topThree[0].displayProduction.toLocaleString()}</p>
                                </div>
                            </div>
                            {/* 3rd Place */}
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => openProfile(topThree[2])}>
                                <div className="relative mb-4">
                                    <div className={`w-24 h-24 rounded-3xl border-4 border-orange-800/50 p-1 rotate-1 group-hover:rotate-0 transition-transform bg-slate-900 overflow-hidden shadow-2xl`}>
                                        <img src={topThree[2].avatarUrl} alt="" className="w-full h-full object-cover grayscale-[0.4]" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-orange-800 text-white text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl border-2 border-slate-900 shadow-xl">3</div>
                                </div>
                                <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 text-center w-48 shadow-2xl group-hover:border-indigo-500/50 transition-colors">
                                     <h3 className="font-black text-white text-sm truncate uppercase tracking-tight">{topThree[2].name}</h3>
                                     <p className="text-2xl font-black text-slate-200 mt-2">${topThree[2].displayProduction.toLocaleString()}</p>
                                </div>
                            </div>
                         </div>
                    </div>
                )}

                {/* 2. RANKINGS VIEW */}
                {((!isTvMode && !showChampions) || (isTvMode && tvTab === 'RANKINGS')) && (
                    <div className={`w-full max-w-6xl mx-auto px-4 animate-in slide-in-from-right duration-700 ${isTvMode ? 'scale-110' : ''}`}>
                        <div className="bg-slate-900 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-black tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-5 w-16 text-center">Pos</th>
                                        <th className="px-6 py-4">Agent Identity</th>
                                        <th className="px-6 py-4 text-center">Families</th>
                                        <th className="px-6 py-4 text-right">Production</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedTeam.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic uppercase font-black text-sm tracking-widest">No matching agents found</td>
                                        </tr>
                                    ) : (
                                        sortedTeam.map((agent, index) => (
                                            <tr key={agent.id} onClick={() => openProfile(agent)} className="hover:bg-indigo-500/5 transition-all group cursor-pointer">
                                                <td className="px-6 py-5 text-center"><span className="text-sm font-black text-slate-600">{index + 1}</span></td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <img src={agent.avatarUrl} alt={agent.name} className="w-10 h-10 rounded-xl object-cover bg-slate-800 border-2 border-white/5" />
                                                        <span className="font-black text-slate-200 uppercase tracking-tight">{agent.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm font-black text-indigo-400">{agent.displayFamilies}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-white tracking-tighter">${agent.displayProduction.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. HALL OF CHAMPIONS */}
                {((!isTvMode && showChampions) || (isTvMode && tvTab === 'CHAMPIONS')) && (
                    <div className={`w-full max-w-6xl mx-auto px-4 animate-in slide-in-from-right duration-700 ${isTvMode ? 'scale-110' : ''}`}>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {CHAMPIONS_HISTORY.map((champ, idx) => (
                                <div key={idx} className="bg-slate-900 rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                                     <div className="flex items-center gap-4 relative z-10">
                                         <img src={champ.avatarUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-yellow-500/30 shadow-xl" alt="" />
                                         <div>
                                             <p className="text-xs font-black text-slate-500 uppercase">{champ.month} {champ.year}</p>
                                             <p className="text-lg font-black text-white uppercase tracking-tight">{champ.agentName}</p>
                                             <p className="text-2xl font-black text-yellow-500">${champ.production.toLocaleString()}</p>
                                         </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. DUELS VIEW */}
                {((!isTvMode && !showChampions) || (isTvMode && tvTab === 'DUELS')) && (
                    <div className={`w-full max-w-6xl mx-auto px-4 animate-in slide-in-from-right duration-700 ${isTvMode ? 'scale-110' : 'space-y-6'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-900 rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden group col-span-2">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-rose-500 animate-pulse" />
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="font-black text-white text-2xl uppercase tracking-[0.2em] flex items-center gap-3"><Swords size={32} className="text-rose-500" /> The Arena</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase mt-1">Live Agent Head-to-Head and Inter-Agency Leg Battles</p>
                                    </div>
                                    {!isTvMode && (
                                        <button onClick={() => setIsDuelModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-xl"><Plus size={16} /> New Duel</button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {duels.map((duel) => {
                                        const finished = duel.status === 'FINISHED';
                                        const isAgency = duel.category === 'AGENCY';
                                        const p1 = !isAgency ? getMemberById(duel.competitor1Id) : null;
                                        const p2 = !isAgency ? getMemberById(duel.competitor2Id) : null;
                                        const name1 = isAgency ? duel.competitor1Name : p1?.name;
                                        const name2 = isAgency ? duel.competitor2Name : p2?.name;
                                        const p1Win = duel.current1 >= duel.target;
                                        const p2Win = duel.current2 >= duel.target;

                                        return (
                                            <div key={duel.id} className={`bg-slate-950 p-6 rounded-3xl border transition-all hover:border-indigo-500/40 relative overflow-hidden ${isAgency ? 'border-indigo-500/30 ring-1 ring-indigo-500/10' : 'border-white/5'}`}>
                                                {isAgency && (
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                                        <Network size={10} /> Leg War
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between relative z-10 mb-6">
                                                    <div className="flex flex-col items-center gap-3 w-1/3">
                                                        <div className="relative group cursor-pointer" onClick={() => p1 && openProfile(p1)}>
                                                            <div className={`w-20 h-20 rounded-2xl border-2 p-1 overflow-hidden transition-all bg-slate-900 ${p1Win ? 'border-yellow-500 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-slate-800'}`}>
                                                                {isAgency ? (
                                                                    <div className="w-full h-full flex items-center justify-center text-indigo-400"><Users size={32} /></div>
                                                                ) : (
                                                                    <img src={p1?.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="" />
                                                                )}
                                                            </div>
                                                            {p1Win && <Crown size={20} className="text-yellow-500 absolute -top-4 -left-4 -rotate-12 drop-shadow-xl" />}
                                                            {!isAgency && <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center"><Eye size={16} className="text-white shadow-sm" /></div>}
                                                        </div>
                                                        <div className="text-[10px] font-black text-white uppercase tracking-widest text-center h-8 leading-tight">{name1}</div>
                                                    </div>
                                                    <div className="flex flex-col items-center w-1/3">
                                                        <span className="text-2xl font-black text-indigo-500 italic uppercase">VS</span>
                                                        <p className="text-[8px] font-black text-slate-500 mt-2 text-center leading-tight uppercase tracking-[0.2em]">{duel.type === 'APPS' ? `Race to ${duel.target} Apps` : `Target: $${(duel.target/1000).toFixed(0)}k`}</p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-3 w-1/3">
                                                        <div className="relative group cursor-pointer" onClick={() => p2 && openProfile(p2)}>
                                                            <div className={`w-20 h-20 rounded-2xl border-2 p-1 overflow-hidden transition-all bg-slate-900 ${p2Win ? 'border-yellow-500 scale-110 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-slate-800'}`}>
                                                                {isAgency ? (
                                                                    <div className="w-full h-full flex items-center justify-center text-indigo-400"><Users size={32} /></div>
                                                                ) : (
                                                                    <img src={p2?.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="" />
                                                                )}
                                                            </div>
                                                            {p2Win && <Crown size={20} className="text-yellow-500 absolute -top-4 -right-4 rotate-12 drop-shadow-xl" />}
                                                            {!isAgency && <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center"><Eye size={16} className="text-white shadow-sm" /></div>}
                                                        </div>
                                                        <div className="text-[10px] font-black text-white uppercase tracking-widest text-center h-8 leading-tight">{name2}</div>
                                                    </div>
                                                </div>
                                                <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden border border-white/5 flex items-center justify-center">
                                                    <div className="absolute inset-0 flex">
                                                        <div className={`h-full transition-all duration-700 ${p1Win ? 'bg-yellow-500' : 'bg-indigo-600'}`} style={{ width: `${(duel.current1 / (duel.current1 + duel.current2 || 1)) * 100}%` }} />
                                                        <div className={`h-full transition-all duration-700 bg-rose-600`} style={{ width: `${(duel.current2 / (duel.current1 + duel.current2 || 1)) * 100}%` }} />
                                                    </div>
                                                    <div className="relative z-10 flex justify-between w-full px-4 text-[10px] font-black text-white uppercase tracking-widest">
                                                        <span>{duel.type === 'PREMIUM' ? `$${(duel.current1/1000).toFixed(1)}k` : duel.current1}</span>
                                                        <span>{duel.type === 'PREMIUM' ? `$${(duel.current2/1000).toFixed(1)}k` : duel.current2}</span>
                                                    </div>
                                                </div>
                                                {!isTvMode && !finished && (
                                                    <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-white/5">
                                                        <div className="flex gap-2">
                                                            <button onClick={() => updateDuelScore(duel.id, 1, duel.type === 'APPS' ? 1 : 1000)} className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-all active:scale-95"><Plus size={16}/></button>
                                                        </div>
                                                        <button onClick={() => deleteDuel(duel.id)} className="text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest">Cancel</button>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => updateDuelScore(duel.id, 2, duel.type === 'APPS' ? 1 : 1000)} className="p-2 bg-rose-600 rounded-xl text-white hover:bg-rose-500 transition-all active:scale-95"><Plus size={16}/></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Duel Configuration Modal */}
            {isDuelModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center"><h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2"><Swords size={20} className="text-rose-500" /> Arena Configuration</h3><button onClick={() => setIsDuelModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button></div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Matchup Category</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-white/5">
                                    <button onClick={() => setNewDuel({...newDuel, category: 'AGENT'})} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${newDuel.category === 'AGENT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Agent vs Agent</button>
                                    <button onClick={() => setNewDuel({...newDuel, category: 'AGENCY'})} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${newDuel.category === 'AGENCY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Leg vs Leg</button>
                                </div>
                            </div>

                            {newDuel.category === 'AGENT' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Agent 1</label><select className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-sm outline-none" value={newDuel.competitor1Id} onChange={e => setNewDuel({...newDuel, competitor1Id: e.target.value})}>{MOCK_TEAM.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Agent 2</label><select className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-sm outline-none" value={newDuel.competitor2Id} onChange={e => setNewDuel({...newDuel, competitor2Id: e.target.value})}>{MOCK_TEAM.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Agency/Leg Name 1</label><input className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-sm outline-none" placeholder="e.g. Halpert Leg" value={newDuel.competitor1Name} onChange={e => setNewDuel({...newDuel, competitor1Name: e.target.value})} /></div>
                                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Agency/Leg Name 2</label><input className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-sm outline-none" placeholder="e.g. Schrute Leg" value={newDuel.competitor2Name} onChange={e => setNewDuel({...newDuel, competitor2Name: e.target.value})} /></div>
                                </div>
                            )}

                            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Duel Metric</label><div className="grid grid-cols-2 gap-2"><button onClick={() => setNewDuel({...newDuel, type: 'APPS', target: 10})} className={`py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${newDuel.type === 'APPS' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>App Count</button><button onClick={() => setNewDuel({...newDuel, type: 'PREMIUM', target: 50000})} className={`py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${newDuel.type === 'PREMIUM' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>Premium Volume</button></div></div>
                            <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Victory Goal</label><input type="number" className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-4 text-lg font-black outline-none focus:ring-2 focus:ring-indigo-500" value={newDuel.target} onChange={e => setNewDuel({...newDuel, target: parseInt(e.target.value)})} /></div>
                            <button onClick={handleCreateDuel} className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-indigo-500 transition-all shadow-xl active:scale-95">Deploy to Arena</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {selectedAgentProfile && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden ring-1 ring-white/10 p-8 flex flex-col items-center relative my-8">
                        <button onClick={() => setSelectedAgentProfile(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"><X size={20} /></button>
                        
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-4">
                                <img src={selectedAgentProfile.avatarUrl} className="w-32 h-32 rounded-3xl object-cover border-4 border-indigo-500 shadow-2xl" alt="" />
                                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg border-2 border-slate-900">
                                    <ShieldCheck size={16} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedAgentProfile.name}</h3>
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mt-1">{selectedAgentProfile.role.replace('_', ' ')}</p>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 w-full mb-8">
                            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Production (YTD)</p>
                                <p className="text-3xl font-black text-white">${selectedAgentProfile.production.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Active Policies</p>
                                <p className="text-3xl font-black text-white">{selectedAgentProfile.activePolicies}</p>
                            </div>
                        </div>

                        {/* Badges Section */}
                        <div className="w-full mb-8">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-4">Trophy Room & Badges</h4>
                            <div className="flex flex-wrap gap-3">
                                {selectedAgentProfile.badges && selectedAgentProfile.badges.length > 0 ? (
                                    selectedAgentProfile.badges.map((badge, bIdx) => (
                                        <div key={bIdx} className="group relative">
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 bg-white/5 hover:border-${badge.color}-500/50 hover:bg-${badge.color}-500/10 transition-all cursor-help`}>
                                                <span className="text-xl">{badge.icon}</span>
                                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{badge.label}</span>
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 rounded-lg shadow-xl border border-white/10 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                                                {badge.description}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic py-4">No badges earned yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Career Metrics */}
                        <div className="w-full space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Active Career Stats</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                                    <TrendingUp size={16} className="text-indigo-400 mb-2" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Growth</p>
                                    <p className="text-xs font-black text-white">+12%</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                                    <MedalIcon size={16} className="text-yellow-500 mb-2" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Rank</p>
                                    <p className="text-xs font-black text-white">#4</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
                                    <Zap size={16} className="text-orange-500 mb-2" />
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Velocity</p>
                                    <p className="text-xs font-black text-white">High</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedAgentProfile(null)} className="mt-10 w-full py-4 bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-all border border-white/5">Close Profile</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
