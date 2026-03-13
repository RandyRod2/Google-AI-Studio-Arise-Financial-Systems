import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_GOALS } from '../services/mockData';
import { 
    Target, TrendingUp, Edit2, X, Check, Calendar, 
    BarChart3, Plus, Trash2, RefreshCw, Zap, Rocket, 
    Trophy, Info, ArrowRight, Activity, DollarSign,
    Milestone, Flame, Sparkles, ChevronRight, Calculator,
    // Fix: Added missing Settings icon import
    Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Client, Application, PipelineStage } from '../types';

type GoalPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface Goal {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
    isAuto?: boolean;
}

interface GoalsProps {
    clients: Client[];
    applications: Application[];
}

const Goals: React.FC<GoalsProps> = ({ clients, applications }) => {
    // --- State ---
    const [allGoals, setAllGoals] = useState<Record<GoalPeriod, Goal[]>>(() => {
        const saved = localStorage.getItem('arise_goals_mission_control_v1');
        if (saved) return JSON.parse(saved);

        const monthly = MOCK_GOALS;
        const weekly = monthly.map(g => ({
            ...g, 
            id: `w-${g.id}`,
            current: Math.round(g.current / 4),
            target: Math.round(g.target / 4)
        }));
        const yearly = monthly.map(g => ({
            ...g, 
            id: `y-${g.id}`,
            current: Math.round(g.current * 12),
            target: Math.round(g.target * 12)
        }));

        return { WEEKLY: weekly, MONTHLY: monthly, YEARLY: yearly };
    });

    const [activePeriod, setActivePeriod] = useState<GoalPeriod>('MONTHLY');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({ current: '', target: '' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', target: '', current: '', unit: '$' });
    const [showRoadmapId, setShowRoadmapId] = useState<string | null>(null);

    // --- Auto-Sync & Projection Logic ---
    const syncedGoals = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const startOfThisMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const monthElapsedPercent = dayOfMonth / daysInMonth;

        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        const weekElapsedPercent = (now.getDay() + 1) / 7;

        const elapsedPercent = activePeriod === 'WEEKLY' ? weekElapsedPercent : 
                             activePeriod === 'MONTHLY' ? monthElapsedPercent : 
                             ((now.getMonth() * 30 + dayOfMonth) / 365);

        // Helper: Sum premium from applications
        const getPremiumInRange = (startDate: Date) => {
            return applications
                .filter(app => {
                    const appDate = new Date(app.submittedDate);
                    return appDate >= startDate && (app.status === 'Issued' || app.status === 'Approved' || app.status === 'Submitted');
                })
                .reduce((sum, app) => sum + app.premium, 0);
        };

        const getAppsInRange = (startDate: Date) => {
            return applications.filter(app => new Date(app.submittedDate) >= startDate).length;
        };

        const getApptsCount = () => {
            return clients.filter(c => c.pipelineStage === PipelineStage.APPOINTMENT_SET).length;
        };

        return allGoals[activePeriod].map(goal => {
            let autoValue = goal.current;
            let isAuto = false;

            const titleLower = goal.title.toLowerCase();
            const dateRef = activePeriod === 'WEEKLY' ? startOfThisWeek : 
                           activePeriod === 'MONTHLY' ? startOfThisMonth : 
                           new Date(currentYear, 0, 1);

            if (titleLower.includes('premium')) {
                autoValue = getPremiumInRange(dateRef);
                isAuto = true;
            } else if (titleLower.includes('applications')) {
                autoValue = getAppsInRange(dateRef);
                isAuto = true;
            } else if (titleLower.includes('appointments')) {
                autoValue = getApptsCount();
                isAuto = true;
            }

            // Calculate run rate (projection)
            const projection = elapsedPercent > 0 ? (autoValue / elapsedPercent) : 0;
            const isOnPace = projection >= goal.target;

            return { ...goal, current: autoValue, isAuto, projection, isOnPace, elapsedPercent };
        });
    }, [allGoals, activePeriod, applications, clients]);

    useEffect(() => {
        localStorage.setItem('arise_goals_mission_control_v1', JSON.stringify(allGoals));
    }, [allGoals]);

    const handleEditClick = (goal: Goal) => {
        setEditingId(goal.id);
        setEditValues({ current: goal.current.toString(), target: goal.target.toString() });
    };

    const handleSave = (id: string) => {
        const currentVal = parseFloat(editValues.current) || 0;
        const targetVal = parseFloat(editValues.target) || 0;
        const updatedGoals = allGoals[activePeriod].map((g) => 
            g.id === id ? { ...g, current: currentVal, target: targetVal } : g
        );
        setAllGoals(prev => ({ ...prev, [activePeriod]: updatedGoals }));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this goal?")) {
            setAllGoals(prev => ({ ...prev, [activePeriod]: prev[activePeriod].filter(g => g.id !== id) }));
        }
    };

    const handleAddGoal = () => {
        if (!newGoal.title || !newGoal.target) return;
        const goal: Goal = {
            id: `g-${Date.now()}`,
            title: newGoal.title,
            current: Number(newGoal.current) || 0,
            target: Number(newGoal.target),
            unit: newGoal.unit
        };
        setAllGoals(prev => ({ ...prev, [activePeriod]: [...prev[activePeriod], goal] }));
        setIsAddModalOpen(false);
        setNewGoal({ title: '', target: '', current: '', unit: '$' });
    };

    const numberInputClass = "w-full border border-slate-700 rounded p-1.5 text-center font-bold text-white bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none";

    // --- Mission Control Components ---

    const revenueGoal = syncedGoals.find(g => g.unit === '$');
    const activityGoals = syncedGoals.filter(g => g.unit !== '$');

    return (
        <div className="animate-fade-in space-y-8 relative pb-20">
            {/* Mission Control Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Rocket className="text-indigo-500" size={32} /> Strategic Horizon
                    </h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Personal Production & Activity Intelligence</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-1.5 rounded-xl border border-white/5 shadow-2xl flex gap-1">
                        {(['WEEKLY', 'MONTHLY', 'YEARLY'] as GoalPeriod[]).map((period) => (
                            <button
                                key={period}
                                onClick={() => setActivePeriod(period)}
                                className={`px-5 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                                    activePeriod === period ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="p-3 bg-slate-900 border border-white/5 text-indigo-400 rounded-xl hover:text-white hover:border-indigo-500 transition-all shadow-xl group"
                        title="Configure New Mission"
                    >
                        <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* HERO REVENUE GAUGE (North Star) */}
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Primary Revenue Target</h3>
                            <p className="text-2xl font-black text-white uppercase tracking-tight">{revenueGoal?.title || 'Production'}</p>
                        </div>
                        {revenueGoal && (
                            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest flex items-center gap-2 ${revenueGoal.isOnPace ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'}`}>
                                <Zap size={12} fill="currentColor" /> {revenueGoal.isOnPace ? 'ON PACE' : 'BEHIND PACE'}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-10 relative z-10">
                        {revenueGoal ? (
                            <>
                                {/* Custom SVG Semi-Circle Gauge */}
                                <div className="relative w-64 h-32">
                                    <svg viewBox="0 0 100 50" className="w-full h-full">
                                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                                        <path 
                                            d="M 10 50 A 40 40 0 0 1 90 50" 
                                            fill="none" 
                                            stroke="url(#gaugeGradient)" 
                                            strokeWidth="8" 
                                            strokeLinecap="round" 
                                            strokeDasharray={`${(Math.min(100, (revenueGoal.current / revenueGoal.target) * 100) / 100) * 126} 126`} 
                                            className="transition-all duration-1000 ease-out"
                                        />
                                        <defs>
                                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#10b981" />
                                            </linearGradient>
                                        </defs>
                                        {/* Run Rate Marker (Ghost Pointer) */}
                                        <line 
                                            x1="50" y1="50" 
                                            x2={50 + 35 * Math.cos((1 - Math.min(1.2, revenueGoal.projection / revenueGoal.target)) * Math.PI)} 
                                            y2={50 - 35 * Math.sin((1 - Math.min(1.2, revenueGoal.projection / revenueGoal.target)) * Math.PI)} 
                                            stroke="#475569" strokeWidth="1" strokeDasharray="2 2"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-end -mb-2">
                                        <span className="text-4xl font-black text-white tracking-tighter">${revenueGoal.current.toLocaleString()}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Achieved</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 w-full">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Projected EOM</p>
                                            <p className={`text-xl font-black ${revenueGoal.isOnPace ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                ${Math.round(revenueGoal.projection).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target</p>
                                            <p className="text-xl font-black text-white">${revenueGoal.target.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowRoadmapId(revenueGoal.id)}
                                        className="w-full py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Calculator size={14} /> Analyze Path to 100%
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-600 italic py-10">No revenue goal configured for this period.</div>
                        )}
                    </div>
                    
                    {/* Background Shine */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none" />
                </div>

                {/* ACTIVITY RECAP */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-2xl flex flex-col">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Activity Metrics</h3>
                    <div className="space-y-8 flex-1">
                        {activityGoals.map(goal => {
                            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                            const projPct = Math.min(100, Math.round((goal.projection / goal.target) * 100));
                            
                            return (
                                <div key={goal.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h4 className="text-xs font-black text-white uppercase tracking-tight">{goal.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{goal.current} / {goal.target} {goal.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-sm font-black ${goal.isOnPace ? 'text-indigo-400' : 'text-rose-400'}`}>{pct}%</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                        {/* Projection Ghost Bar */}
                                        <div 
                                            className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all duration-1000" 
                                            style={{ width: `${projPct}%` }}
                                        />
                                        {/* Actual Progress Bar */}
                                        <div 
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                            style={{ width: `${pct}%` }}
                                        />
                                        {/* Milestone Markers */}
                                        {[25, 50, 75].map(m => (
                                            <div key={m} className="absolute inset-y-0 w-px bg-white/5" style={{ left: `${m}%` }} />
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                        <span className="flex items-center gap-1">{goal.isOnPace ? <TrendingUp size={8} /> : <Activity size={8} />} {goal.isOnPace ? 'Ahead' : 'Increase Required'}</span>
                                        <span>Pacing: {Math.round(goal.projection)} {goal.unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {activityGoals.length === 0 && <div className="text-slate-700 italic text-center py-10 uppercase tracking-widest text-[10px]">No activity tracks set</div>}
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-8 py-3 border border-dashed border-slate-800 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest hover:border-indigo-500/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={12} /> Add Activity Goal
                    </button>
                </div>
            </div>

            {/* ROADMAP / PATH TO VICTORY DRAWER */}
            {showRoadmapId && (
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-500/30 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 shadow-lg animate-pulse">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight italic">Strategic Roadmap to 100%</h3>
                            </div>
                            {(() => {
                                const goal = syncedGoals.find(g => g.id === showRoadmapId);
                                if (!goal) return null;
                                const remaining = Math.max(0, goal.target - goal.current);
                                const avgSale = 1200; // Average across FEX/Term
                                const neededSales = Math.ceil(remaining / avgSale);
                                const satApptsNeeded = Math.ceil(neededSales / 0.33); // 33% close rate
                                const setApptsNeeded = Math.ceil(satApptsNeeded / 0.70); // 70% show rate
                                const dialsNeeded = Math.ceil(setApptsNeeded / 0.05); // 5% set rate

                                return (
                                    <div className="space-y-6">
                                        <p className="text-indigo-100 text-sm leading-relaxed max-w-xl">
                                            To secure your remaining <b className="text-white">${remaining.toLocaleString()}</b> premium, you need to execute the following sequence based on your current {activePeriod.toLowerCase()} conversion ratios:
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center">
                                                <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Apps</p>
                                                <p className="text-xl font-black">+{neededSales}</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center">
                                                <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Sat Appts</p>
                                                <p className="text-xl font-black">+{satApptsNeeded}</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center">
                                                <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Set Appts</p>
                                                <p className="text-xl font-black">+{setApptsNeeded}</p>
                                            </div>
                                            <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center">
                                                <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">Dials</p>
                                                <p className="text-xl font-black">+{dialsNeeded}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <button 
                            onClick={() => setShowRoadmapId(null)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all text-white shrink-0"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <Flame className="absolute right-[-20px] bottom-[-20px] text-white opacity-5 w-48 h-48" />
                </div>
            )}

            {/* MODALS */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md ring-1 ring-white/10 animate-fade-in overflow-hidden border border-slate-800">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2"><Target size={18} className="text-indigo-500" /> New Goal Objective</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Objective Title</label>
                                <input type="text" autoFocus className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Total Appointments" value={newGoal.title} onChange={(e) => setNewGoal({...newGoal, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Victory Target</label>
                                    <input type="number" className={numberInputClass} style={{textAlign: 'left', padding: '12px'}} placeholder="100" value={newGoal.target} onChange={(e) => setNewGoal({...newGoal, target: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Initial Current</label>
                                    <input type="number" className={numberInputClass} style={{textAlign: 'left', padding: '12px'}} placeholder="0" value={newGoal.current} onChange={(e) => setNewGoal({...newGoal, current: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Metric Unit</label>
                                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={newGoal.unit} onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}>
                                    <option value="$">Revenue ($)</option>
                                    <option value="Apps">Applications</option>
                                    <option value="Appts">Appointments</option>
                                    <option value="Dials">Dials</option>
                                    <option value="Recruits">Recruits</option>
                                </select>
                            </div>

                            {/* Manual Overrides for existing goals */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Adjust Existing Targets</p>
                                <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar">
                                    {syncedGoals.map(g => (
                                        <div key={g.id} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-white/5">
                                            <span className="text-[10px] font-bold text-slate-400 truncate w-32">{g.title}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditClick(g)} className="p-1 hover:text-indigo-400 transition-colors"><Edit2 size={12} /></button>
                                                <button onClick={() => handleDelete(g.id)} className="p-1 hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleAddGoal} 
                                className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-500 transition-all shadow-xl active:scale-95"
                            >
                                Deploy Objective
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingId && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl border border-white/10 p-8 w-full max-w-sm shadow-2xl animate-fade-in">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Fine-Tune Objective</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">New Current</label>
                                <input type="number" className={numberInputClass} style={{textAlign: 'left', padding: '12px'}} value={editValues.current} onChange={(e) => setEditValues({...editValues, current: e.target.value})} autoFocus />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">New Target</label>
                                <input type="number" className={numberInputClass} style={{textAlign: 'left', padding: '12px'}} value={editValues.target} onChange={(e) => setEditValues({...editValues, target: e.target.value})} />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all">Cancel</button>
                                <button onClick={handleSave(editingId)} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all">Update</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;