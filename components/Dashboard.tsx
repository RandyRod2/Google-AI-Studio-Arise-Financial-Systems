
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_TEAM, MOCK_TASKS, MOCK_ANNOUNCEMENTS } from '../services/mockData';
import { DollarSign, TrendingUp, Trophy, ChevronRight, MoreHorizontal, User, Settings, Plus, X, Layout, CheckSquare, Target, Eye, EyeOff, CheckCircle2, Calendar, ArrowUpRight, GripHorizontal, Maximize2, MoveLeft, MoveRight, Crown, GripVertical, ChevronLeft, Clock, ShieldCheck, Newspaper, Megaphone, Trash2, Save, AlertCircle, Edit2 } from 'lucide-react';
import { ViewState, Client, PolicyStatus, Announcement, User as UserType } from '../types';
import RevenueForecast from './RevenueForecast';

// --- Helper Functions ---

const getLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// --- Helper Components ---

const FinancialCard: React.FC<{ title: string; value: string; subtext: string; iconColor: string; trend?: string }> = ({ title, value, subtext, iconColor, trend }) => (
    <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-sm flex flex-col justify-between h-auto min-h-[160px] relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-slate-950/50 border border-white/5 ${iconColor}`}>
                    <DollarSign size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full flex items-center">
                        <TrendingUp size={12} className="mr-1" /> {trend}
                    </span>
                )}
            </div>
            <div className="mt-auto">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{value}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                <p className="text-xs text-slate-400 mt-1">{subtext}</p>
            </div>
        </div>
        {/* Decor */}
        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] bg-white`}></div>
    </div>
);

const TeamBulletin: React.FC<{ currentUser: UserType | undefined }> = ({ currentUser }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
        const saved = localStorage.getItem('arise_team_announcements');
        return saved ? JSON.parse(saved) : MOCK_ANNOUNCEMENTS;
    });

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<Announcement>>({
        title: '',
        content: '',
        priority: 'MEDIUM'
    });

    const canEdit = currentUser && ['ADMIN', 'AGENCY_OWNER', 'STAFF'].includes(currentUser.role);

    useEffect(() => {
        localStorage.setItem('arise_team_announcements', JSON.stringify(announcements));
    }, [announcements]);

    const handleAdd = () => {
        if (!formState.title || !formState.content) return;
        
        if (editingId) {
            setAnnouncements(announcements.map(a => a.id === editingId ? {
                ...a,
                title: formState.title!,
                content: formState.content!,
                priority: formState.priority as any
            } : a));
            setEditingId(null);
        } else {
            const announcement: Announcement = {
                id: `ann-${Date.now()}`,
                title: formState.title,
                content: formState.content,
                date: getLocalDateString(new Date()),
                priority: (formState.priority as any) || 'MEDIUM',
                author: currentUser?.name || 'Admin'
            };
            setAnnouncements([announcement, ...announcements]);
        }
        
        setIsAdding(false);
        setFormState({ title: '', content: '', priority: 'MEDIUM' });
    };

    const handleEdit = (ann: Announcement) => {
        setEditingId(ann.id);
        setFormState({
            title: ann.title,
            content: ann.content,
            priority: ann.priority
        });
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (!canEdit) return;
        if (confirm("Remove this announcement?")) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        }
    };

    const getPriorityColor = (p: string) => {
        switch(p) {
            case 'URGENT': return 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]';
            case 'HIGH': return 'bg-orange-500 text-white';
            case 'MEDIUM': return 'bg-indigo-500 text-white';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Megaphone size={16} className="text-indigo-400" /> Team Newsroom
                </h3>
                {canEdit && (
                    <button 
                        onClick={() => { setIsAdding(true); setEditingId(null); setFormState({title:'', content:'', priority:'MEDIUM'}); }}
                        className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                        title="Post Announcement"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isAdding && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 animate-in slide-in-from-top duration-300 mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">{editingId ? 'Edit Bulletin' : 'New Bulletin'}</h4>
                            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                        </div>
                        <div className="space-y-3">
                            <input 
                                placeholder="Announcement Title"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={formState.title}
                                onChange={e => setFormState({...formState, title: e.target.value})}
                            />
                            <textarea 
                                placeholder="Description..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none h-20"
                                value={formState.content}
                                onChange={e => setFormState({...formState, content: e.target.value})}
                            />
                            <div className="flex justify-between items-center gap-2">
                                <select 
                                    className="bg-slate-900 border border-slate-700 text-xs rounded p-1.5 text-slate-300 outline-none"
                                    value={formState.priority}
                                    onChange={e => setFormState({...formState, priority: e.target.value as any})}
                                >
                                    <option value="MEDIUM">Normal Priority</option>
                                    <option value="HIGH">High Priority</option>
                                    <option value="URGENT">URGENT</option>
                                </select>
                                <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500 flex items-center gap-1 shadow-lg shadow-indigo-900/20">
                                    <Save size={12} /> {editingId ? 'Update' : 'Post Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {announcements.map((ann) => (
                    <div key={ann.id} className="bg-slate-950/40 p-4 rounded-xl border border-white/5 group relative hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${getPriorityColor(ann.priority)}`}>
                                {ann.priority}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">{ann.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mb-1">{ann.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{ann.content}</p>
                        <div className="mt-3 flex justify-between items-center">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{ann.author}</p>
                            {canEdit && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(ann)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-indigo-400 transition-all">
                                        <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(ann.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {announcements.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 py-10">
                        <Newspaper size={32} className="mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">No News Posted</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface MiniLeaderboardProps {
    onNavigate?: (view: ViewState) => void;
}

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ onNavigate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return d;
        });
    };

    const dateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const dateEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const now = new Date();
    const isCurrentMonth = dateStart.getMonth() === now.getMonth() && dateStart.getFullYear() === now.getFullYear();
    
    const label = isCurrentMonth ? 'This Month' : dateStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dateRange = `${dateStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${dateEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const sortedTeam = MOCK_TEAM.map(m => ({
        ...m,
        displayProduction: Math.round(m.production / 12)
    })).sort((a, b) => b.displayProduction - a.displayProduction);

    const topThree = sortedTeam.slice(0, 3);
    const rest = sortedTeam.slice(3, 8); 

    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5 shrink-0">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" /> Leaderboard
                    </h3>
                    <div className="flex gap-1">
                         <button 
                            onClick={() => onNavigate?.('LEADERBOARD')}
                            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="Expand View"
                        >
                            <Maximize2 size={14} />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center justify-between bg-slate-950/50 border border-white/5 rounded-lg p-1.5 shadow-inner">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                            <Calendar size={10} className="text-indigo-500" /> {label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                            {dateRange}
                        </span>
                    </div>

                    <button 
                        onClick={handleNextMonth}
                        className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="flex justify-center items-end gap-4 mb-6 mt-2">
                    <div className="flex flex-col items-center">
                        <div className="relative mb-2">
                            <div className="w-12 h-12 rounded-full border-2 border-slate-600 p-0.5">
                                <img src={topThree[1].avatarUrl} alt="" className="w-full h-full rounded-full object-cover grayscale-[0.2]" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-slate-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">2</div>
                        </div>
                        <p className="text-xs font-bold text-slate-300 truncate max-w-[60px]">{topThree[1].name.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-500">${(topThree[1].displayProduction/1000).toFixed(1)}k</p>
                    </div>

                    <div className="flex flex-col items-center -mt-4">
                        <Crown size={20} className="text-yellow-500 mb-1 animate-bounce" />
                        <div className="relative mb-2">
                            <div className="w-16 h-16 rounded-full border-2 border-yellow-500 p-0.5 shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-yellow-500/10">
                                <img src={topThree[0].avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <div className="absolute -bottom-2 -right-1 bg-yellow-500 text-black text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-sm">1</div>
                        </div>
                        <p className="text-sm font-bold text-white truncate max-w-[80px]">{topThree[0].name.split(' ')[0]}</p>
                        <p className="text-xs font-bold text-indigo-400">${(topThree[0].displayProduction/1000).toFixed(1)}k</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="relative mb-2">
                            <div className="w-12 h-12 rounded-full border-2 border-orange-700 p-0.5">
                                <img src={topThree[2].avatarUrl} alt="" className="w-full h-full rounded-full object-cover grayscale-[0.4]" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-orange-700 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">3</div>
                        </div>
                        <p className="text-xs font-bold text-slate-300 truncate max-w-[60px]">{topThree[2].name.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-500">${(topThree[2].displayProduction/1000).toFixed(1)}k</p>
                    </div>
                </div>

                <div className="space-y-2">
                    {rest.map((agent, index) => (
                        <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-4 text-center">{index + 4}</span>
                                <img src={agent.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-800" />
                                <span className="text-xs font-bold text-slate-300">{agent.name}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-400">${agent.displayProduction.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface SalesVolumeWidgetProps {
    clients: Client[];
}

const SalesVolumeWidget: React.FC<SalesVolumeWidgetProps> = ({ clients }) => {
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');

    const data = useMemo(() => {
        const result = [];
        const today = new Date();
        
        let daysToGenerate = 30;

        if (timeRange === '7D') daysToGenerate = 7;
        if (timeRange === '30D') daysToGenerate = 30;
        if (timeRange === '90D') daysToGenerate = 90;
        if (timeRange === 'YTD') {
            const start = new Date(today.getFullYear(), 0, 1);
            const diff = Math.abs(today.getTime() - start.getTime());
            daysToGenerate = Math.ceil(diff / (1000 * 3600 * 24)) + 1;
        }
        
        const allPolicies = clients.flatMap(c => c.policies);
        let total = 0;

        for (let i = daysToGenerate - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = getLocalDateString(d); 
            const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dailyTotal = allPolicies
                .filter(p => {
                    const pDateStr = p.submittedDate || p.startDate; 
                    return pDateStr === dateKey && ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status);
                })
                .reduce((sum, p) => sum + p.premium, 0);

            total += dailyTotal;
            result.push({ name: displayStr, value: dailyTotal });
        }

        return { chartData: result, total, days: daysToGenerate };
    }, [timeRange, clients]);

    return (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm animate-fade-in h-full flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-white">Sales Volume</h3>
                    <p className="text-xs text-slate-400">Track performance over time.</p>
                </div>
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-slate-950/50 border border-white/10 text-xs rounded-lg px-2 py-1 outline-none text-slate-300 font-medium cursor-pointer hover:bg-slate-800"
                >
                    <option value="7D">7 Days</option>
                    <option value="30D">30 Days</option>
                    <option value="90D">90 Days</option>
                    <option value="YTD">YTD</option>
                </select>
            </div>
            
            <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ user?: UserType; onNavigate: (view: ViewState) => void; clients: Client[] }> = ({ user, onNavigate, clients }) => {
    
    const stats = useMemo(() => {
        const allPolicies = clients.flatMap(c => c.policies);
        const activePolicies = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE);
        const currentYearPremium = activePolicies.reduce((sum, p) => sum + p.premium, 0);
        const familiesProtected = activePolicies.length;

        return {
            premium: currentYearPremium,
            families: familiesProtected,
            pending: allPolicies.filter(p => p.status === PolicyStatus.PENDING).length
        };
    }, [clients]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name.split(' ')[0] || 'Agent'}</h2>
                    <p className="text-slate-400 text-sm">Here is what's happening with your agency today.</p>
                </div>
                <div className="flex gap-3">
                     <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 flex items-center gap-4 px-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">System Status</span>
                            <span className="text-xs font-bold text-green-400 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> Operational</span>
                        </div>
                        <div className="w-px h-6 bg-white/5"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Live Queue</span>
                            <span className="text-xs font-bold text-white">4 New Leads</span>
                        </div>
                     </div>
                </div>
            </div>

            {/* Top Row: Revenue Horizon */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <RevenueForecast clients={clients} />
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinancialCard 
                    title="Settled Premium" 
                    value={`$${(stats.premium / 1000).toFixed(1)}k`} 
                    subtext="Actualized YTD" 
                    iconColor="text-indigo-400"
                    trend="+12%"
                />
                <FinancialCard 
                    title="Families Protected" 
                    value={stats.families.toString()} 
                    subtext="Active Policies" 
                    iconColor="text-emerald-400"
                    trend="+5"
                />
                <FinancialCard 
                    title="Pending Business" 
                    value={stats.pending.toString()} 
                    subtext="Underwriting Queue" 
                    iconColor="text-amber-400"
                />
                <FinancialCard 
                    title="Active Trials" 
                    value="12" 
                    subtext="Recruits in Licensing" 
                    iconColor="text-blue-400"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                        <SalesVolumeWidget clients={clients} />
                        <TeamBulletin currentUser={user} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm h-full flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Daily Tasks</h3>
                                    <p className="text-xs text-slate-400">Your prioritized workflow.</p>
                                </div>
                                <button onClick={() => onNavigate('TASKS')} className="text-xs text-indigo-400 font-bold hover:underline">View All</button>
                            </div>
                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {MOCK_TASKS.slice(0, 4).map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-lg border border-white/5 group hover:border-indigo-500/30 transition-all">
                                        <div className={`p-2 rounded ${task.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            <CheckSquare size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{task.title}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Due {task.dueDate}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                                    <Target size={16} className="text-indigo-400" /> Recent Activity
                                </h3>
                                <button onClick={() => onNavigate('ACTIVITY_FEED')} className="text-xs text-indigo-400 font-bold hover:underline">Full Feed</button>
                            </div>
                            <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                                {[1, 2, 3, 4].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-300"><span className="text-white font-bold">New Policy</span> created for James Richardson</p>
                                            <p className="text-[10px] text-slate-500 uppercase mt-0.5">2 hours ago</p>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-400">$1,200</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-full">
                    <MiniLeaderboard onNavigate={onNavigate} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
