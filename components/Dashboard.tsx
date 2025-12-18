
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MOCK_TEAM, MOCK_TASKS } from '../services/mockData';
import { DollarSign, TrendingUp, Trophy, ChevronRight, MoreHorizontal, User, Settings, Plus, X, Layout, CheckSquare, Target, Eye, EyeOff, CheckCircle2, Calendar, ArrowUpRight, GripHorizontal, Maximize2, MoveLeft, MoveRight, Crown, GripVertical, ChevronLeft } from 'lucide-react';
import { ViewState, Client, PolicyStatus } from '../types';

// --- Helper Functions ---

const getLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// --- Helper Components ---

const FinancialCard: React.FC<{ title: string; value: string; subtext: string; iconColor: string; trend?: string }> = ({ title, value, subtext, iconColor, trend }) => (
    <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-sm flex flex-col justify-between h-auto min-h-[160px] relative overflow-hidden group hover:border-indigo-500/30 transition-all h-full">
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

// --- Redesigned Leaderboard (Podium Style) ---
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
                
                {/* Date Filter Control */}
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
                {/* Podium Section */}
                <div className="flex justify-center items-end gap-4 mb-6 mt-2">
                    {/* 2nd Place */}
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

                    {/* 1st Place */}
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

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="relative mb-2">
                            <div className="w-12 h-12 rounded-full border-2 border-orange-700 p-0.5">
                                <img src={topThree[2].avatarUrl} alt="" className="w-full h-full rounded-full object-cover grayscale-[0.2]" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-orange-700 text-white text-[10px] font-bold text-center py-0.5">3rd</div>
                        </div>
                        <p className="text-xs font-bold text-slate-300 truncate max-w-[60px]">{topThree[2].name.split(' ')[0]}</p>
                        <p className="text-[10px] text-slate-500">${(topThree[2].displayProduction/1000).toFixed(1)}k</p>
                    </div>
                </div>

                {/* List Section */}
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

// --- New Widgets ---

interface SalesVolumeWidgetProps {
    clients: Client[];
}

const SalesVolumeWidget: React.FC<SalesVolumeWidgetProps> = ({ clients }) => {
    const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');

    // Aggregate real data from clients based on time range
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
            const dateKey = getLocalDateString(d); // YYYY-MM-DD
            const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const dailyTotal = allPolicies
                .filter(p => {
                    const pDateStr = p.submittedDate || p.startDate; 
                    // Matches date string exactly and checks all relevant positive statuses
                    return pDateStr === dateKey && ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status);
                })
                .reduce((sum, p) => sum + p.premium, 0);

            total += dailyTotal;
            result.push({ name: displayStr, value: dailyTotal });
        }

        return { chartData: result, total, days: daysToGenerate };
    }, [timeRange, clients]);

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - data.days + 1);
    const dateRangeStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const growthPercent = 12.5; 

    return (
        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm animate-fade-in h-full flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-white">Sales Volume</h3>
                    <p className="text-xs text-slate-400">Track sales volume over time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="bg-slate-950/50 border border-white/10 text-xs rounded-lg px-2 py-1 outline-none text-slate-300 font-medium cursor-pointer hover:bg-slate-950/80 transition-colors"
                    >
                        <option value="7D">Last 7 Days</option>
                        <option value="30D">Last 30 Days</option>
                        <option value="90D">Last 90 Days</option>
                        <option value="YTD">Year to Date</option>
                    </select>
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                        <TrendingUp size={20} />
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Calendar size={12} /> {timeRange === 'YTD' ? 'Year to Date' : `Past ${data.days} Days`}: {dateRangeStr}
                </div>
                <h3 className="text-3xl font-bold text-white">${data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center">
                        <ArrowUpRight size={12} className="mr-1" /> +{growthPercent}%
                    </span>
                    <span className="text-xs text-slate-500">vs target</span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 10}} 
                            interval={Math.ceil(data.days / 6)}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 10}} 
                            tickFormatter={(value) => `$${value/1000}k`} 
                        />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', fontSize: '12px', color: '#f1f5f9'}} 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#6366f1" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorSales)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

interface RecentDealsProps {
    clients: Client[];
}

const RecentDeals: React.FC<RecentDealsProps> = ({ clients }) => {
    const recentDeals = clients
        .flatMap(client => client.policies.map(policy => ({ 
            ...policy, 
            clientName: `${client.firstName} ${client.lastName}`, 
            clientAvatar: client.avatarUrl 
        })))
        .filter(p => ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status))
        .sort((a, b) => new Date(b.submittedDate || b.startDate).getTime() - new Date(a.submittedDate || a.startDate).getTime())
        .slice(0, 5); 

    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                <h3 className="font-bold text-white text-sm">Recent Deals</h3>
                <MoreHorizontal size={16} className="text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <div className="divide-y divide-white/5 flex-1 overflow-y-auto custom-scrollbar">
                {recentDeals.length > 0 ? recentDeals.map((deal) => (
                    <div key={deal.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 border border-indigo-500/20">
                                {deal.clientName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{deal.clientName}</p>
                                <p className="text-[10px] text-slate-500 truncate">{deal.carrier} • {deal.productName || deal.type}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-green-400">+${deal.premium.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-600">{new Date(deal.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                        </div>
                    </div>
                )) : (
                    <div className="p-6 text-center text-xs text-slate-500">No recent deals found.</div>
                )}
            </div>
            <button className="w-full py-2 text-xs font-bold text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors border-t border-white/5 flex items-center justify-center gap-1 mt-auto shrink-0">
                View All Activity <ChevronRight size={12} />
            </button>
        </div>
    );
};

const TaskSnapshot: React.FC = () => {
    const tasks = MOCK_TASKS.slice(0, 3);
    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <CheckSquare size={16} className="text-green-500" /> My Tasks
                </h3>
                <span className="text-xs font-medium text-slate-500">{tasks.length} Pending</span>
            </div>
            <div className="p-3 space-y-2">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div>
                            <p className="text-xs font-bold text-slate-300 group-hover:text-white line-clamp-1">{task.title}</p>
                            <p className="text-[10px] text-slate-500">{task.dueDate} • {task.type}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface DashboardGoal {
    id: string;
    title: string;
    current: number;
    target: number;
}

const GoalWidget: React.FC<{ goal: DashboardGoal }> = ({ goal }) => {
    const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
    
    const data = [
        { name: 'Completed', value: goal.current },
        { name: 'Remaining', value: Math.max(0, goal.target - goal.current) }
    ];
    const COLORS = ['#6366f1', '#1e293b']; // Indigo and Slate-800

    return (
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden h-full p-4 relative group flex flex-col items-center justify-center min-h-[220px]">
            <div className="absolute top-4 left-4 flex items-center gap-2">
                <Target size={16} className="text-indigo-500" />
                <h3 className="font-bold text-white text-sm">Monthly Goal</h3>
            </div>
            
            <div className="w-32 h-32 relative mt-6 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-white">{percent}%</span>
                </div>
            </div>
            
            <div className="text-center z-10 w-full px-2">
                 <p className="text-xs text-slate-500 font-medium mb-1 truncate">{goal.title}</p>
                 <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-white leading-none">
                        ${goal.current.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium mt-1">
                        of ${goal.target.toLocaleString()} target
                    </span>
                 </div>
            </div>
        </div>
    );
};

// --- Widget Wrapper Component with Sizing Controls ---
type WidgetSize = 1 | 2 | 3 | 4;

interface WidgetWrapperProps {
    children: React.ReactNode;
    id: string;
    span: WidgetSize;
    editMode: boolean;
    onResize: (id: string, delta: number) => void;
    // Drag props
    onDragStart?: (e: React.DragEvent, id: string) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent, id: string) => void;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ children, id, span, editMode, onResize, onDragStart, onDragOver, onDrop }) => {
    // Map span number to grid class
    const getSpanClass = (s: WidgetSize) => {
        switch(s) {
            case 1: return 'col-span-1';
            case 2: return 'col-span-1 md:col-span-2';
            case 3: return 'col-span-1 md:col-span-2 lg:col-span-3';
            case 4: return 'col-span-1 md:col-span-2 lg:col-span-4';
            default: return 'col-span-1';
        }
    };

    return (
        <div 
            draggable={editMode}
            onDragStart={(e) => editMode && onDragStart && onDragStart(e, id)}
            onDragOver={(e) => editMode && onDragOver && onDragOver(e)}
            onDrop={(e) => editMode && onDrop && onDrop(e, id)}
            className={`relative flex flex-col h-full transition-all duration-300 ${getSpanClass(span)} ${editMode ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950 rounded-xl z-10 scale-[0.99] bg-slate-900 cursor-move border-dashed border-2 border-indigo-500/50' : ''}`}
        >
            {children}
            
            {editMode && (
                <>
                    <div className="absolute top-2 left-2 z-20 text-indigo-400 bg-slate-950/90 rounded p-1 shadow-sm border border-indigo-900">
                        <GripVertical size={16} />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1 z-20 bg-slate-950/90 text-white rounded-lg p-1 backdrop-blur-sm shadow-lg border border-slate-800">
                        <button 
                            onClick={() => onResize(id, -1)} 
                            className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={span <= 1}
                            title="Shrink"
                        >
                            <MoveLeft size={16} />
                        </button>
                        <span className="text-xs font-bold px-1 py-1 min-w-[20px] text-center">{span}x</span>
                        <button 
                            onClick={() => onResize(id, 1)} 
                            className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={span >= 4}
                            title="Expand"
                        >
                            <MoveRight size={16} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Main Dashboard Component ---

type WidgetId = 'financials' | 'sales_volume' | 'map' | 'leaderboard' | 'recentDeals' | 'tasks' | 'goals';

const DEFAULT_WIDGETS: Record<WidgetId, boolean> = {
    financials: true,
    sales_volume: true,
    map: true,
    leaderboard: true,
    recentDeals: true,
    tasks: false,
    goals: false
};

const DEFAULT_SIZES: Record<WidgetId, WidgetSize> = {
    financials: 4,
    sales_volume: 2,
    map: 2,
    leaderboard: 1,
    recentDeals: 1,
    tasks: 1,
    goals: 1
};

const DEFAULT_ORDER: WidgetId[] = [
    'financials',
    'sales_volume',
    'map',
    'leaderboard',
    'tasks',
    'goals',
    'recentDeals'
];

interface DashboardProps {
    userName?: string;
    onNavigate?: (view: ViewState) => void;
    clients?: Client[]; 
}

const Dashboard: React.FC<DashboardProps> = ({ userName, onNavigate, clients = [] }) => {
    // --- State ---
    const [visibleWidgets, setVisibleWidgets] = useState<Record<WidgetId, boolean>>(() => {
        try {
            const saved = localStorage.getItem('arise_dashboard_layout');
            return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
        } catch { return DEFAULT_WIDGETS; }
    });

    const [widgetSizes, setWidgetSizes] = useState<Record<WidgetId, WidgetSize>>(() => {
        try {
            const saved = localStorage.getItem('arise_dashboard_sizes');
            return saved ? JSON.parse(saved) : DEFAULT_SIZES;
        } catch { return DEFAULT_SIZES; }
    });

    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
        try {
            const saved = localStorage.getItem('arise_dashboard_order');
            return saved ? JSON.parse(saved) : DEFAULT_ORDER;
        } catch { return DEFAULT_ORDER; }
    });

    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [financialsTimeRange, setFinancialsTimeRange] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');

    // Goal State
    const [dashboardGoal, setDashboardGoal] = useState<DashboardGoal>(() => {
        try {
            const savedGoals = localStorage.getItem('arise_goals_v2');
            if (savedGoals) {
                const parsed = JSON.parse(savedGoals);
                if (parsed.MONTHLY && parsed.MONTHLY.length > 0) {
                    return parsed.MONTHLY[0];
                }
            }
            return { id: 'g1', title: 'Primary Premium Goal', current: 0, target: 40000 };
        } catch { 
            return { id: 'g1', title: 'Primary Premium Goal', current: 0, target: 40000 }; 
        }
    });

    const allPolicies = useMemo(() => clients.flatMap(c => c.policies), [clients]);

    const filteredMetrics = useMemo(() => {
        const now = new Date();
        const startOfPeriod = new Date(now);
        startOfPeriod.setHours(0, 0, 0, 0);

        if (financialsTimeRange === 'WEEKLY') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
            startOfPeriod.setDate(diff);
        } else {
            startOfPeriod.setDate(1); // 1st of month
        }

        // Helper to parse YYYY-MM-DD
        const parseDate = (str: string) => {
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        const activeInPeriod = allPolicies.filter(p => {
            // Include pending and approved for pipeline metrics
            if (!['Active', 'Approved', 'Pending', 'Issued'].includes(p.status)) return false;
            
            // Use submittedDate for pipeline/performance metrics if available, else startDate
            const pDateStr = p.submittedDate || p.startDate;
            if (!pDateStr) return false;
            
            const pDate = parseDate(pDateStr);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);
            
            return pDate >= startOfPeriod && pDate <= endOfToday;
        });

        const submitted = activeInPeriod.reduce((sum, p) => sum + p.premium, 0);
        const comm = activeInPeriod.reduce((sum, p) => sum + p.commission, 0);
        const paid = activeInPeriod.filter(p => p.isPaidOut).reduce((sum, p) => sum + p.commission, 0);

        return {
            submitted,
            comm,
            deals: activeInPeriod.length,
            paid
        };
    }, [allPolicies, financialsTimeRange]);

    const submittedBusiness = filteredMetrics.submitted;
    const totalComm = filteredMetrics.comm;
    const upfront = totalComm * 0.75;
    const deferred = totalComm * 0.25;
    const totalDeals = filteredMetrics.deals;
    const paidPayouts = filteredMetrics.paid;

    useEffect(() => {
        setDashboardGoal(prev => ({ ...prev, current: submittedBusiness }));
    }, [submittedBusiness]);

    useEffect(() => {
        localStorage.setItem('arise_dashboard_layout', JSON.stringify(visibleWidgets));
    }, [visibleWidgets]);

    useEffect(() => {
        localStorage.setItem('arise_dashboard_sizes', JSON.stringify(widgetSizes));
    }, [widgetSizes]);

    useEffect(() => {
        localStorage.setItem('arise_dashboard_order', JSON.stringify(widgetOrder));
    }, [widgetOrder]);

    const toggleWidget = (id: WidgetId) => {
        setVisibleWidgets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddWidget = (id: WidgetId) => {
        setVisibleWidgets(prev => ({ ...prev, [id]: true }));
        setIsAddWidgetOpen(false);
    };

    const handleResize = (id: string, delta: number) => {
        const wid = id as WidgetId;
        const currentSize = widgetSizes[wid] || 1;
        const newSize = Math.max(1, Math.min(4, currentSize + delta)) as WidgetSize;
        setWidgetSizes(prev => ({ ...prev, [wid]: newSize }));
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('widgetId', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); 
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('widgetId') as WidgetId;
        
        if (sourceId && sourceId !== targetId) {
            const newOrder = [...widgetOrder];
            const sourceIndex = newOrder.indexOf(sourceId);
            const targetIndex = newOrder.indexOf(targetId as WidgetId);
            
            newOrder.splice(sourceIndex, 1);
            newOrder.splice(targetIndex, 0, sourceId);
            
            setWidgetOrder(newOrder);
        }
    };

    const renderWidgetContent = (id: WidgetId) => {
        switch(id) {
            case 'financials':
                return (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-3 shrink-0 px-1">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Performance Metrics</h3>
                            <div className="flex bg-slate-950/50 p-0.5 rounded-lg border border-white/10">
                                <button 
                                    onClick={() => setFinancialsTimeRange('WEEKLY')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${financialsTimeRange === 'WEEKLY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    This Week
                                </button>
                                <button 
                                    onClick={() => setFinancialsTimeRange('MONTHLY')}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${financialsTimeRange === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    This Month
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                            <FinancialCard 
                                title="Submitted Business" 
                                value={`$${submittedBusiness.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
                                subtext="Total Premium Volume" 
                                iconColor="text-blue-400" 
                                trend="+12%"
                            />
                            <FinancialCard 
                                title="Total Commission" 
                                value={`$${totalComm.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
                                subtext="Projected Income" 
                                iconColor="text-indigo-400"
                                trend="+8%" 
                            />
                            <FinancialCard 
                                title="Upfront Commission (75%)" 
                                value={`$${upfront.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
                                subtext="Advance Payment" 
                                iconColor="text-emerald-400" 
                            />
                            <FinancialCard 
                                title="Deferred Commission (25%)" 
                                value={`$${deferred.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
                                subtext="Backend & Renewals" 
                                iconColor="text-purple-400" 
                            />
                            <FinancialCard 
                                title="Total Deals" 
                                value={totalDeals.toString()} 
                                subtext="Policies Sold" 
                                iconColor="text-teal-400" 
                            />
                            <FinancialCard 
                                title="Paid Payouts" 
                                value={`$${paidPayouts.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`} 
                                subtext="Realized Income" 
                                iconColor="text-orange-400" 
                            />
                        </div>
                    </div>
                );
            case 'sales_volume': return <SalesVolumeWidget clients={clients} />;
            case 'map': return (
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-sm p-6 text-white border border-white/5 relative overflow-hidden flex flex-col justify-center h-full min-h-[250px] animate-fade-in">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">US Policy Map</h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            Geographic distribution of your active book. (Map visualization coming soon).
                        </p>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-900/40 to-transparent"></div>
                </div>
            );
            case 'leaderboard': return <MiniLeaderboard onNavigate={onNavigate} />;
            case 'tasks': return <TaskSnapshot />;
            case 'goals': return <GoalWidget goal={dashboardGoal} />;
            case 'recentDeals': return <RecentDeals clients={clients} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10 relative">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white text-shadow-sm">Hello, {userName || 'Agent'}!</h2>
                    <p className="text-slate-400 text-sm mt-1">Here is a snapshot of your performance today.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setEditMode(!editMode)}
                        className={`text-xs font-bold border px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            editMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-900/60 backdrop-blur-md border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {editMode ? <CheckSquare size={14} /> : <GripHorizontal size={14} />} 
                        {editMode ? 'Done Editing' : 'Edit Layout'}
                    </button>
                    <button 
                        onClick={() => setIsCustomizeOpen(true)}
                        className="text-xs font-bold bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-400 px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <Settings size={14} /> Visibility
                    </button>
                    <button 
                        onClick={() => setIsAddWidgetOpen(true)}
                        className="text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Plus size={14} /> Add Widget
                    </button>
                </div>
            </div>

            {/* --- Main Resizable & Reorderable Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">
                {widgetOrder.map((id) => {
                    if (!visibleWidgets[id]) return null;
                    return (
                        <WidgetWrapper 
                            key={id}
                            id={id} 
                            span={widgetSizes[id]} 
                            editMode={editMode} 
                            onResize={handleResize}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {renderWidgetContent(id)}
                        </WidgetWrapper>
                    );
                })}
            </div>

            {/* --- CUSTOMIZE MODAL --- */}
            {isCustomizeOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Layout size={18} className="text-indigo-500" /> Dashboard Visibility
                            </h3>
                            <button onClick={() => setIsCustomizeOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            {Object.keys(DEFAULT_WIDGETS).map((key) => {
                                const id = key as WidgetId;
                                const isVisible = visibleWidgets[id];
                                let label = '';
                                switch(id) {
                                    case 'financials': label = 'Performance Metrics'; break;
                                    case 'sales_volume': label = 'Sales Volume Chart'; break;
                                    case 'map': label = 'Policy Map'; break;
                                    case 'leaderboard': label = 'Leaderboard'; break;
                                    case 'recentDeals': label = 'Recent Deals'; break;
                                    case 'tasks': label = 'Tasks Snapshot'; break;
                                    case 'goals': label = 'Goal Progress'; break;
                                }

                                return (
                                    <div 
                                        key={id}
                                        onClick={() => toggleWidget(id)}
                                        className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isVisible ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </div>
                                            <span className={`text-sm font-medium ${isVisible ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isVisible ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isVisible ? 'left-6' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end">
                            <button 
                                onClick={() => setIsCustomizeOpen(false)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500 transition-colors shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD WIDGET MODAL --- */}
            {isAddWidgetOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-indigo-500" /> Add Widget
                            </h3>
                            <button onClick={() => setIsAddWidgetOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Task Widget */}
                                <button 
                                    onClick={() => handleAddWidget('tasks')}
                                    disabled={visibleWidgets.tasks}
                                    className={`p-4 rounded-xl border text-left transition-all ${visibleWidgets.tasks ? 'border-white/5 bg-white/5 opacity-60 cursor-default' : 'border-white/10 hover:border-indigo-500 hover:bg-white/5 bg-slate-900/50'}`}
                                >
                                    <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center mb-3 border border-green-500/20">
                                        <CheckSquare size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-200 text-sm">Task Snapshot</h4>
                                    <p className="text-xs text-slate-500 mt-1">View your top 3 pending tasks.</p>
                                    {visibleWidgets.tasks && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 mt-2"><CheckCircle2 size={10} /> Added</span>}
                                </button>

                                {/* Goal Widget */}
                                <button 
                                    onClick={() => handleAddWidget('goals')}
                                    disabled={visibleWidgets.goals}
                                    className={`p-4 rounded-xl border text-left transition-all ${visibleWidgets.goals ? 'border-white/5 bg-white/5 opacity-60 cursor-default' : 'border-white/10 hover:border-indigo-500 hover:bg-white/5 bg-slate-900/50'}`}
                                >
                                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center mb-3 border border-indigo-500/20">
                                        <Target size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-200 text-sm">Goal Progress</h4>
                                    <p className="text-xs text-slate-500 mt-1">Track your primary premium goal.</p>
                                    {visibleWidgets.goals && <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 mt-2"><CheckCircle2 size={10} /> Added</span>}
                                </button>

                                {/* Placeholder Widgets */}
                                <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 opacity-50 cursor-not-allowed">
                                    <div className="w-10 h-10 bg-slate-800 text-slate-600 rounded-lg flex items-center justify-center mb-3">
                                        <DollarSign size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-500 text-sm">Cash Flow</h4>
                                    <p className="text-xs text-slate-600 mt-1">Coming Soon</p>
                                </div>
                                <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 opacity-50 cursor-not-allowed">
                                    <div className="w-10 h-10 bg-slate-800 text-slate-600 rounded-lg flex items-center justify-center mb-3">
                                        <User size={20} />
                                    </div>
                                    <h4 className="font-bold text-slate-500 text-sm">Top Clients</h4>
                                    <p className="text-xs text-slate-600 mt-1">Coming Soon</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
