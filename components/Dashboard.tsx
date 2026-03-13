
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_TEAM, MOCK_TASKS, MOCK_ANNOUNCEMENTS } from '../services/mockData';
import { 
  DollarSign, TrendingUp, Trophy, ChevronRight, MoreHorizontal, Plus, X, 
  Layout, CheckSquare, Target, Eye, EyeOff, Maximize2, Minimize2, 
  Calendar, Crown, ChevronLeft, Clock, Newspaper, Megaphone, Trash2, Save, Edit2, Activity, CheckCircle2,
  Settings, GripVertical, ShoppingBag, BarChart3, PanelRightClose, Move, ChevronDown, LineChart
} from 'lucide-react';
import { ViewState, Client, PolicyStatus, Announcement, User as UserType, TeamMember } from '../types';
import RevenueForecast from './RevenueForecast';

// --- Customization Types ---
interface WidgetConfig {
    id: string;
    title: string;
    visible: boolean;
    size: 'small' | 'medium' | 'large' | 'full';
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
    { id: 'revenue-forecast', title: 'Revenue Horizon', visible: true, size: 'full' },
    { id: 'settled-premium', title: 'Settled Premium', visible: true, size: 'small' },
    { id: 'families-protected', title: 'Families Protected', visible: true, size: 'small' },
    { id: 'pending-business', title: 'Pending Business', visible: true, size: 'small' },
    { id: 'sales-volume', title: 'Sales Volume Chart', visible: true, size: 'medium' },
    { id: 'team-newsroom', title: 'Team Newsroom', visible: true, size: 'medium' },
    { id: 'daily-tasks', title: 'Daily Tasks', visible: true, size: 'medium' },
    { id: 'recent-sales', title: 'Recent Sales', visible: true, size: 'medium' },
    { id: 'live-leaderboard', title: 'Live Leaderboard', visible: true, size: 'medium' },
];

// --- Helper Functions ---
const getLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// --- Helper Components ---
const FinancialCard: React.FC<{ title: string; value: string; subtext: string; iconColor: string; trend?: string; isEditMode?: boolean; onHide?: () => void }> = ({ title, value, subtext, iconColor, trend, isEditMode, onHide }) => (
    <div className={`bg-slate-900/60 backdrop-blur-md p-5 rounded-xl border shadow-sm flex flex-col justify-between h-full min-h-[160px] relative overflow-hidden group transition-all ${isEditMode ? 'border-dashed border-indigo-500/50' : 'border-white/5 hover:border-indigo-500/30'}`}>
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg bg-slate-950/50 border border-white/5 ${iconColor}`}>
                    <DollarSign size={20} />
                </div>
                {trend && !isEditMode && (
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
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] bg-white"></div>
    </div>
);

const TeamBulletin: React.FC<{ currentUser: UserType | undefined }> = ({ currentUser }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
        const saved = localStorage.getItem('arise_team_announcements');
        return saved ? JSON.parse(saved) : MOCK_ANNOUNCEMENTS;
    });

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState<Partial<Announcement>>({ title: '', content: '', priority: 'MEDIUM' });

    const canEdit = currentUser && ['ADMIN', 'AGENCY_OWNER', 'STAFF'].includes(currentUser.role);

    useEffect(() => {
        localStorage.setItem('arise_team_announcements', JSON.stringify(announcements));
    }, [announcements]);

    const handleAdd = () => {
        if (!formState.title || !formState.content) return;
        if (editingId) {
            setAnnouncements(announcements.map(a => a.id === editingId ? { ...a, title: formState.title!, content: formState.content!, priority: formState.priority as any } : a));
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
        setFormState({ title: ann.title, content: ann.content, priority: ann.priority });
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (!canEdit) return;
        if (confirm("Remove this announcement?")) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        }
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 uppercase tracking-widest text-[10px]">
                    <Megaphone size={14} className="text-indigo-400" /> Team Newsroom
                </h3>
                {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setIsAdding(true); setEditingId(null); setFormState({title:'', content:'', priority:'MEDIUM'}); }} className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"><Plus size={14} /></button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isAdding && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 mb-4 animate-in slide-in-from-top duration-300">
                        <input placeholder="Title" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white mb-2 outline-none focus:ring-1 focus:ring-indigo-500" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} />
                        <textarea placeholder="Content" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white h-20 mb-2 outline-none focus:ring-1 focus:ring-indigo-500" value={formState.content} onChange={e => setFormState({...formState, content: e.target.value})} />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="text-xs text-slate-500 font-bold px-3">Cancel</button>
                            <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg">Save</button>
                        </div>
                    </div>
                )}
                {announcements.map((ann) => (
                    <div key={ann.id} className="bg-slate-950/40 p-4 rounded-xl border border-white/5 group relative transition-colors hover:border-white/10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500 text-white">{ann.priority}</span>
                            <span className="text-[10px] text-slate-600 font-bold">{ann.date}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200 mb-1">{ann.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{ann.content}</p>
                        {canEdit && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(ann)} className="p-1 text-slate-500 hover:text-indigo-400"><Edit2 size={12} /></button>
                                <button onClick={() => handleDelete(ann.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

interface MiniLeaderboardProps {
    onNavigate?: (view: ViewState) => void;
    clients: Client[];
    teamMembers: TeamMember[];
}

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ onNavigate, clients, teamMembers }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return d;
        });
    };

    const startOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const now = new Date();
    const isCurrentMonth = startOfPeriod.getMonth() === now.getMonth() && startOfPeriod.getFullYear() === now.getFullYear();
    
    const label = isCurrentMonth ? 'This Month' : startOfPeriod.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // --- Stats Aggregation Logic ---
    const sortedTeam = useMemo(() => {
        return teamMembers.map(member => {
            const agentClients = clients.filter(c => c.agentId === member.id || (member.id === 't1' && c.agentId === 'u1'));
            const displayProd = agentClients.reduce((sum, client) => {
                return sum + client.policies
                    .filter(p => {
                        const pDateStr = p.submittedDate || p.startDate;
                        if (!pDateStr) return false;
                        const [y, m, d] = pDateStr.split('-').map(Number);
                        const pDate = new Date(y, m - 1, d);
                        return pDate >= startOfPeriod && pDate <= endOfPeriod && (p.status === PolicyStatus.ACTIVE || p.status === PolicyStatus.APPROVED);
                    })
                    .reduce((pSum, p) => pSum + p.premium, 0);
            }, 0);
            return { ...member, displayProduction: displayProd };
        }).sort((a, b) => b.displayProduction - a.displayProduction);
    }, [clients, teamMembers, startOfPeriod, endOfPeriod]);

    const displayList = sortedTeam.slice(0, 10);

    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-white/5 bg-white/5 shrink-0 flex justify-between items-center">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 tracking-widest uppercase text-[10px]">
                    <Trophy size={14} className="text-yellow-500" /> Live Leaderboard
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="p-1 text-slate-500 hover:text-white transition-colors"><ChevronLeft size={14} /></button>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                    <button onClick={handleNextMonth} className="p-1 text-slate-500 hover:text-white transition-colors"><ChevronRight size={14} /></button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {displayList.map((agent, index) => (
                    <div key={agent.id} className="flex items-center gap-3 group/item">
                        <span className={`text-[10px] font-black w-4 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-600' : 'text-slate-600'}`}>
                            {index + 1}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0">
                            <img src={agent.avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate uppercase tracking-tight">{agent.name}</p>
                        </div>
                        <span className="text-xs font-black text-white">
                            ${(agent.displayProduction / 1000).toFixed(1)}k
                        </span>
                    </div>
                ))}
                {displayList.length === 0 && (
                    <p className="text-[10px] text-slate-600 italic text-center py-8 uppercase tracking-widest">No Activity Recorded</p>
                )}
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); onNavigate?.('LEADERBOARD'); }}
                className="p-3 bg-white/5 border-t border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-indigo-600/20 transition-all text-center"
            >
                View Full Standings
            </button>
        </div>
    );
};

const Dashboard: React.FC<{ user?: UserType; onNavigate: (view: ViewState) => void; clients: Client[]; teamMembers: TeamMember[] }> = ({ user, onNavigate, clients, teamMembers }) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isVisibilityPanelOpen, setIsVisibilityPanelOpen] = useState(false);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
    const [salesVolumeTimeFrame, setSalesVolumeTimeFrame] = useState<'7' | '30'>('30');

    const [layout, setLayout] = useState<WidgetConfig[]>(() => {
        const saved = localStorage.getItem('arise_dashboard_layout_v7');
        return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
    });

    const saveLayout = (newLayout: WidgetConfig[]) => {
        setLayout(newLayout);
        localStorage.setItem('arise_dashboard_layout_v7', JSON.stringify(newLayout));
    };

    const stats = useMemo(() => {
        const allPolicies = clients.flatMap(c => c.policies);
        const activePolicies = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE);
        return {
            premium: activePolicies.reduce((sum, p) => sum + p.premium, 0),
            families: activePolicies.length,
            pending: allPolicies.filter(p => p.status === PolicyStatus.PENDING).length
        };
    }, [clients]);

    // --- Dynamic Sales Volume Data (Fixed date shift bug) ---
    const salesVolumeData = useMemo(() => {
        const days = parseInt(salesVolumeTimeFrame);
        const now = new Date();
        const data = [];
        
        const allPolicies = clients.flatMap(c => c.policies.map(p => {
            const dateStr = p.submittedDate || p.startDate;
            const [y, m, d] = dateStr.split('-').map(Number);
            return {
                ...p,
                date: new Date(y, m - 1, d) // Treat as local date
            };
        }));

        const validPolicies = allPolicies.filter(p => 
            [PolicyStatus.ACTIVE, PolicyStatus.APPROVED, PolicyStatus.PENDING].includes(p.status) || (p.status as string) === 'Issued'
        );

        // Define step for buckets
        const step = days === 30 ? 5 : 1;
        const count = days === 30 ? 6 : 7;

        for (let i = 0; i < count; i++) {
            const bucketDate = new Date();
            bucketDate.setDate(now.getDate() - (count - 1 - i) * step);
            const label = bucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const startRange = new Date(bucketDate);
            startRange.setHours(0,0,0,0);
            const endRange = new Date(bucketDate);
            if (step > 1) {
                endRange.setDate(endRange.getDate() + step - 1);
            }
            endRange.setHours(23,59,59,999);

            const bucketSum = validPolicies
                .filter(p => p.date >= startRange && p.date <= endRange)
                .reduce((sum, p) => sum + p.premium, 0);

            data.push({ n: label, v: bucketSum / 1000 }); // Value in 'k'
        }

        const periodStart = new Date();
        periodStart.setDate(now.getDate() - days);
        periodStart.setHours(0,0,0,0);
        
        const total = validPolicies
            .filter(p => p.date >= periodStart)
            .reduce((sum, p) => sum + p.premium, 0);

        const startDateLabel = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endDateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return { chart: data, total, rangeLabel: `${startDateLabel} - ${endDateLabel}` };
    }, [clients, salesVolumeTimeFrame]);

    // Dynamic Recent Sales
    const recentDeals = useMemo(() => {
        const allDeals = clients.flatMap(client => 
            client.policies
                .filter(p => p.status === PolicyStatus.ACTIVE || p.status === PolicyStatus.APPROVED)
                .map(p => {
                    const dateRaw = p.submittedDate || p.startDate || '';
                    let displayDate = '';
                    if (dateRaw) {
                        const [y, m, d] = dateRaw.split('-').map(Number);
                        const date = new Date(y, m - 1, d);
                        displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                    return {
                        id: p.id,
                        firstName: client.firstName,
                        lastName: client.lastName,
                        fullName: `${client.firstName} ${client.lastName}`,
                        amount: p.premium,
                        date: displayDate,
                        carrier: p.carrier,
                        product: p.productName || p.type
                    };
                })
        );
        return allDeals.sort((a, b) => b.amount - a.amount).slice(0, 5);
    }, [clients]);

    const toggleVisibility = (id: string) => {
        const next = layout.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
        saveLayout(next);
    };

    const cycleSize = (id: string) => {
        const next = layout.map(w => {
            if (w.id !== id) return w;
            const sizes: WidgetConfig['size'][] = ['small', 'medium', 'large', 'full'];
            const nextIdx = (sizes.indexOf(w.size) + 1) % sizes.length;
            return { ...w, size: sizes[nextIdx] };
        });
        saveLayout(next);
    };

    const getSizeClass = (size: WidgetConfig['size']) => {
        switch (size) {
            case 'small': return 'col-span-1';
            case 'medium': return 'col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1';
            case 'large': return 'col-span-1 md:col-span-2';
            case 'full': return 'col-span-1 md:col-span-2 lg:col-span-3';
            default: return 'col-span-1';
        }
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!isEditMode) return;
        e.dataTransfer.setData('index', index.toString());
        setDraggedIdx(index);
        // Custom ghost image transparency
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.4';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedIdx(null);
        setDropTargetIdx(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!isEditMode) return;
        e.preventDefault();
        if (dropTargetIdx !== index) {
            setDropTargetIdx(index);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIdx: number) => {
        if (!isEditMode) return;
        e.preventDefault();
        const sourceIdx = parseInt(e.dataTransfer.getData('index'));
        if (sourceIdx === targetIdx) return;

        const newLayout = [...layout];
        const [movedItem] = newLayout.splice(sourceIdx, 1);
        newLayout.splice(targetIdx, 0, movedItem);
        saveLayout(newLayout);
    };

    const renderWidget = (id: string, index: number) => {
        const config = layout.find(w => w.id === id);
        if (!config || (!config.visible && !isEditMode)) return null;

        const isBeingDragged = draggedIdx === index;
        const isDropTarget = dropTargetIdx === index && draggedIdx !== index;

        const widgetClasses = `relative group transition-all duration-300 h-full ${getSizeClass(config.size)} 
            ${!config.visible ? 'opacity-20 blur-[2px] grayscale scale-[0.98] pointer-events-none' : ''}
            ${isBeingDragged ? 'opacity-40 scale-[0.95] ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-950' : ''}
            ${isDropTarget ? 'scale-[1.02] translate-x-1 ring-2 ring-indigo-500/50' : ''}
            ${isEditMode ? 'cursor-move' : ''}`;

        let content = null;
        switch (id) {
            case 'revenue-forecast': content = <RevenueForecast clients={clients} />; break;
            case 'settled-premium': content = <FinancialCard title="Settled Premium" value={`$${(stats.premium / 1000).toFixed(1)}k`} subtext="Actualized YTD" iconColor="text-indigo-400" trend="+12%" isEditMode={isEditMode} />; break;
            case 'families-protected': content = <FinancialCard title="Families Protected" value={stats.families.toString()} subtext="Active Policies" iconColor="text-emerald-400" trend="+5" isEditMode={isEditMode} />; break;
            case 'pending-business': content = <FinancialCard title="Pending Business" value={stats.pending.toString()} subtext="Underwriting Queue" iconColor="text-amber-400" isEditMode={isEditMode} />; break;
            case 'sales-volume': content = (
                <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-full flex flex-col min-h-[420px] shadow-2xl relative">
                    {/* Header Group */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">Sales Volume</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">Track sales volume over time.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group/dropdown">
                                <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-800 transition-colors">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2">
                                        Last {salesVolumeTimeFrame} Days
                                    </span>
                                    <ChevronDown size={14} className="text-slate-500" />
                                </div>
                                <div className="absolute top-full right-0 mt-1 w-32 bg-slate-900 border border-white/10 rounded-lg shadow-2xl z-50 py-1 hidden group-hover/dropdown:block animate-in fade-in zoom-in-95 origin-top-right">
                                    <button onClick={() => setSalesVolumeTimeFrame('7')} className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors">Last 7 Days</button>
                                    <button onClick={() => setSalesVolumeTimeFrame('30')} className="w-full text-left px-3 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors">Last 30 Days</button>
                                </div>
                            </div>
                            <button className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all">
                                <LineChart size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Date Subtitle */}
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar size={14} className="text-slate-600" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                            Past {salesVolumeTimeFrame} Days: {salesVolumeData.rangeLabel}
                        </span>
                    </div>

                    {/* Metric Row */}
                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-5xl font-black text-white tracking-tighter leading-none">${salesVolumeData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                <TrendingUp size={10} /> +12.5%
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">vs target</span>
                        </div>
                    </div>

                    {/* Main Chart Area */}
                    <div className="flex-1 min-h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesVolumeData.chart} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorSalesVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1e293b" />
                                <XAxis 
                                    dataKey="n" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fill: '#475569', fontWeight: 'bold', textAnchor: 'middle'}}
                                    dy={10}
                                />
                                <YAxis 
                                    width={60}
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 9, fill: '#475569', fontWeight: 'bold'}}
                                    tickFormatter={(v) => `$${v.toFixed(1)}k`}
                                    dx={-5}
                                />
                                <Tooltip 
                                    contentStyle={{background:'#0f172a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px', fontSize: '10px'}} 
                                    itemStyle={{color: '#fff', fontWeight: 'bold'}}
                                    formatter={(v: number) => [`$${(v * 1000).toLocaleString()}`, 'Premium']} 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="v" 
                                    stroke="#6366f1" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorSalesVolume)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ); break;
            case 'team-newsroom': content = <TeamBulletin currentUser={user} />; break;
            case 'daily-tasks': content = (
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 flex flex-col h-full min-h-[250px]">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white text-[10px] uppercase tracking-widest">Daily Tasks</h3><button onClick={(e) => { e.stopPropagation(); onNavigate('TASKS'); }} className="text-[10px] text-indigo-400 font-black uppercase tracking-widest hover:underline">View All</button></div>
                    <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        {MOCK_TASKS.slice(0, 4).map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-2.5 bg-slate-950/30 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all">
                                <div className={`p-1.5 rounded ${task.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}><CheckSquare size={14} /></div>
                                <p className="text-[10px] font-bold text-white truncate flex-1 uppercase tracking-tight">{task.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ); break;
            case 'recent-sales': content = (
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden flex flex-col h-full min-h-[250px]">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-white text-[10px] uppercase tracking-widest">Recent Sales</h3>
                        <MoreHorizontal size={18} className="text-slate-500 cursor-pointer hover:text-white" />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-white/5">
                            {recentDeals.map((deal) => (
                                <div key={deal.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group/item">
                                    <div className="w-10 h-10 rounded-full bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                                        {deal.firstName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{deal.fullName}</p>
                                            <p className="text-xs font-bold text-emerald-400">+${deal.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                                            <p className="truncate font-medium">{deal.carrier} • {deal.product}</p>
                                            <p className="font-medium whitespace-nowrap">{deal.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onNavigate('BOOK_OF_BUSINESS'); }} className="p-3 bg-white/5 border-t border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all text-center">View All Activity <ChevronRight size={12} className="inline ml-1" /></button>
                </div>
            ); break;
            case 'live-leaderboard': content = <MiniLeaderboard onNavigate={onNavigate} clients={clients} teamMembers={teamMembers} />; break;
        }

        return (
            <div 
                className={widgetClasses}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
            >
                {isEditMode && config.visible && (
                    <div className="absolute top-2 right-2 z-30 flex gap-1 animate-in slide-in-from-right-2 duration-300">
                        {/* Drag Handle */}
                        <div className="p-1.5 rounded-lg bg-slate-800 text-slate-500 cursor-grab active:cursor-grabbing border border-white/10 hover:text-white" title="Drag to Move">
                            <GripVertical size={12} />
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleVisibility(id); }} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-white/10" title="Hide Widget">
                            <EyeOff size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); cycleSize(id); }} className="p-1.5 bg-slate-800 text-indigo-400 hover:text-white rounded-lg border border-white/10" title="Resize Widget">
                            <Maximize2 size={12} />
                        </button>
                    </div>
                )}
                {content}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 relative">
            <div className="flex justify-between items-end gap-4 px-1">
                <div>
                    <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name.split(' ')[0] || 'Agent'}</h2>
                    <p className="text-slate-400 text-sm">Control center for your personal production.</p>
                </div>
                
                {/* Tripartite Control Group */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => { setIsEditMode(!isEditMode); setIsVisibilityPanelOpen(false); }}
                        className={`flex items-center gap-2 px-4 py-2 bg-slate-900 border transition-all shadow-sm rounded-lg text-xs font-bold ${isEditMode ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 ring-2 ring-indigo-500/20' : 'border-white/10 text-slate-300 hover:bg-slate-800'}`}
                    >
                        <GripVertical size={14} className={isEditMode ? 'text-indigo-400' : 'text-slate-500'} />
                        {isEditMode ? 'Finish Layout' : 'Edit Layout'}
                    </button>
                    <button 
                        onClick={() => { setIsVisibilityPanelOpen(!isVisibilityPanelOpen); setIsEditMode(false); }}
                        className={`flex items-center gap-2 px-4 py-2 bg-slate-900 border rounded-lg text-xs font-bold transition-all shadow-sm ${isVisibilityPanelOpen ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-slate-300 hover:bg-slate-800'}`}
                    >
                        <Settings size={14} className="text-slate-500" />
                        Visibility
                    </button>
                    <button 
                        onClick={() => { setIsVisibilityPanelOpen(true); setIsEditMode(false); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                    >
                        <Plus size={16} />
                        Add Widget
                    </button>
                </div>
            </div>

            {/* Layout Mode Helper */}
            {isEditMode && (
                <div className="mx-1 p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center gap-3 animate-in slide-in-from-top-2">
                    <Move size={16} className="text-indigo-400 animate-pulse" />
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Layout Mode: Drag cards to reorder or use handles to resize</p>
                </div>
            )}

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
                {layout.filter(w => w.visible || isEditMode).map((w, index) => (
                    <React.Fragment key={w.id}>
                        {renderWidget(w.id, index)}
                    </React.Fragment>
                ))}
            </div>

            {/* Visibility Panel / Widget Drawer */}
            {isVisibilityPanelOpen && (
                <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[60] flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Widget Center</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory Management</p>
                        </div>
                        <button onClick={() => setIsVisibilityPanelOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><PanelRightClose size={20} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {layout.map(w => (
                            <div key={w.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${w.visible ? 'bg-slate-800/50 border-white/10' : 'bg-slate-950 border-white/5 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${w.visible ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-800 text-slate-600'}`}>
                                        {w.id.includes('premium') || w.id.includes('revenue') ? <DollarSign size={14}/> : w.id.includes('task') ? <CheckSquare size={14}/> : w.id.includes('sales') || w.id.includes('volume') ? <TrendingUp size={14}/> : <Layout size={14}/>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase tracking-tight">{w.title}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">{w.size}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleVisibility(w.id)}
                                    className={`p-2 rounded-lg transition-all ${w.visible ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' : 'bg-indigo-600 text-white shadow-lg'}`}
                                >
                                    {w.visible ? <EyeOff size={14}/> : <Plus size={14}/>}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-white/5">
                        <button 
                            onClick={() => setIsVisibilityPanelOpen(false)}
                            className="w-full py-3 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg hover:bg-indigo-500 transition-all text-xs"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Backdrop for Side Panel */}
            {isVisibilityPanelOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsVisibilityPanelOpen(false)} />}
        </div>
    );
};

export default Dashboard;
