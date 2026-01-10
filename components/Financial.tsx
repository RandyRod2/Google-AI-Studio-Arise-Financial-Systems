
import React, { useState, useEffect, useMemo } from 'react';
// Add PieChart and Pie to the recharts import
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie } from 'recharts';
// Import missing mock data and generation functions
import { generateRevenueData, MOCK_TEAM } from '../services/mockData';
// Rename PieChart from lucide-react to PieChartIcon to avoid collision
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, Users, Wallet, PieChart as PieChartIcon, Briefcase, Edit2, X, Save, Clock, ArrowRightLeft, Landmark, BarChart3 } from 'lucide-react';
import { Client, PolicyStatus, TeamMember, PolicyType } from '../types';
import { calculateCommissionExact } from '../services/commissionService';

interface FinancialProps {
    clients?: Client[]; 
}

interface ExpenseData {
    leads: number;
    software: number;
    licensing: number;
}

const Financial: React.FC<FinancialProps> = ({ clients = [] }) => {
    const [viewMode, setViewMode] = useState<'PERSONAL' | 'TEAM'>('PERSONAL');
    const [timeFrame, setTimeFrame] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YTD'>('YTD');
    
    const [expenseData, setExpenseData] = useState<ExpenseData>({ leads: 0, software: 0, licensing: 0 });
    
    const [overrides, setOverrides] = useState<Record<string, { expenses?: ExpenseData }>>(() => {
        try {
            const saved = localStorage.getItem('arise_financial_overrides_v1');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [tempExpenseData, setTempExpenseData] = useState<ExpenseData>({ leads: 0, software: 0, licensing: 0 });

    const [teamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch { return MOCK_TEAM; }
    });

    const getAgentForClient = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return teamMembers[0];
        return teamMembers.find(m => m.id === client.agentId) || teamMembers[0];
    };

    const isDateInTimeFrame = (dateStr?: string) => {
        if (!dateStr) return false;
        const [y, m, d] = dateStr.split('-').map(Number);
        const checkDate = new Date(y, m - 1, d);
        checkDate.setHours(0,0,0,0);
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const currentYear = now.getFullYear();
        if (timeFrame === 'YTD') return checkDate.getFullYear() === currentYear && checkDate <= now;
        if (timeFrame === 'QUARTERLY') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const checkQuarter = Math.floor(checkDate.getMonth() / 3);
            return checkDate.getFullYear() === currentYear && checkQuarter === currentQuarter;
        }
        if (timeFrame === 'MONTHLY') return checkDate.getFullYear() === currentYear && checkDate.getMonth() === now.getMonth();
        if (timeFrame === 'WEEKLY') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0,0,0,0);
            return checkDate >= startOfWeek && checkDate <= now;
        }
        return true;
    };

    const enrichedPolicies = useMemo(() => clients.flatMap(client => {
        const agentProfile = getAgentForClient(client.id);
        return client.policies.map(policy => {
            const { total } = calculateCommissionExact(policy.carrier, policy.productName || '', policy.premium, agentProfile.carrierCompLevels?.[policy.carrier] || agentProfile.defaultCompLevel || 100);
            return { ...policy, calculatedCommission: total };
        });
    }), [clients, teamMembers]);
    
    const periodPolicies = useMemo(() => enrichedPolicies.filter(p => 
        ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status) &&
        isDateInTimeFrame(p.submittedDate || p.startDate)
    ), [enrichedPolicies, timeFrame]);

    // Carrier Mix Data - Aggregated from Real Policies
    const carrierVolumeData = useMemo(() => {
        const mix: Record<string, number> = {};
        periodPolicies.forEach(p => {
            mix[p.carrier] = (mix[p.carrier] || 0) + p.premium;
        });
        return Object.entries(mix)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [periodPolicies]);

    // Product Mix Data - Aggregated from Real Policies
    const productMixData = useMemo(() => {
        const mix: Record<string, number> = {};
        periodPolicies.forEach(p => {
            const type = p.type || 'Other';
            mix[type] = (mix[type] || 0) + p.premium;
        });
        return Object.entries(mix)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [periodPolicies]);

    const totalProjectedCommission = periodPolicies.reduce((sum, p) => sum + p.calculatedCommission, 0);
    const totalAdvance = totalProjectedCommission * 0.75; 
    const totalBackend = totalProjectedCommission * 0.25;
    const paidPolicies = periodPolicies.filter(p => p.isPaidOut === true);
    const crmPaidCommission = paidPolicies.reduce((sum, p) => sum + (p.calculatedCommission * 0.75), 0);
    const pendingPolicies = periodPolicies.filter(p => !p.isPaidOut);
    const totalPendingCommission = pendingPolicies.reduce((sum, p) => sum + (p.calculatedCommission * 0.75), 0);

    useEffect(() => {
        const currentOverride = overrides[timeFrame];
        if (currentOverride?.expenses) {
            setExpenseData(currentOverride.expenses);
        } else {
            const baseMonthly = { leads: 2500, software: 99, licensing: 50 };
            let multiplier = 1;
            if (timeFrame === 'WEEKLY') multiplier = 0.23;
            if (timeFrame === 'QUARTERLY') multiplier = 3;
            if (timeFrame === 'YTD') multiplier = (new Date().getMonth() + 1);
            setExpenseData({
                leads: Math.round(baseMonthly.leads * multiplier),
                software: Math.round(baseMonthly.software * multiplier),
                licensing: Math.round(baseMonthly.licensing * multiplier)
            });
        }
    }, [timeFrame, overrides]); 

    const totalExpenses = expenseData.leads + expenseData.software + expenseData.licensing;
    const timeScale = timeFrame === 'WEEKLY' ? 0.02 : timeFrame === 'MONTHLY' ? 0.08 : timeFrame === 'QUARTERLY' ? 0.25 : 1;
    const teamTotalProduction = MOCK_TEAM.reduce((acc, curr) => acc + curr.production, 0) * timeScale;
    const teamOverridesMock = Math.round(teamTotalProduction * 0.15); 
    const displayTotal = viewMode === 'PERSONAL' ? crmPaidCommission : teamOverridesMock;
    const displayPending = viewMode === 'PERSONAL' ? totalPendingCommission : Math.round(teamTotalProduction * 0.05);
    const displayTitle = viewMode === 'PERSONAL' ? 'Realized Income' : 'Overrides';
    const netIncome = displayTotal - totalExpenses;
    const profitMargin = displayTotal > 0 ? (netIncome / displayTotal) * 100 : 0;

    const openExpenseModal = () => {
        setTempExpenseData({ ...expenseData });
        setIsExpenseModalOpen(true);
    };

    const saveExpenses = () => {
        setExpenseData(tempExpenseData);
        const updated = { ...overrides, [timeFrame]: { ...overrides[timeFrame], expenses: tempExpenseData } };
        setOverrides(updated);
        localStorage.setItem('arise_financial_overrides_v1', JSON.stringify(updated));
        setIsExpenseModalOpen(false);
    };

    const revenueChartData = generateRevenueData().map(d => ({
        ...d,
        commissions: viewMode === 'TEAM' ? d.commissions * 1.5 : d.commissions
    }));

    // More distinct colors for product distribution
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white text-shadow-sm">Financial Performance</h2>
                    <p className="text-sm text-slate-400">Tracking {timeFrame.toLowerCase()} earnings and expenses.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                     <div className="flex gap-1 text-xs bg-slate-900/50 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-sm">
                        {(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YTD'] as const).map((tf) => (
                            <button 
                                key={tf}
                                onClick={() => setTimeFrame(tf)}
                                className={`px-3 py-1.5 font-bold rounded-md transition-all ${timeFrame === tf ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1 text-xs bg-slate-900/50 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-sm">
                        <button 
                            onClick={() => setViewMode('PERSONAL')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all ${viewMode === 'PERSONAL' ? 'bg-blue-500/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            Personal
                        </button>
                        <button 
                            onClick={() => setViewMode('TEAM')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all ${viewMode === 'TEAM' ? 'bg-blue-500/10 text-blue-400 shadow-sm' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                        >
                            Team
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'PERSONAL' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600/90 to-blue-800/90 backdrop-blur-md rounded-xl p-6 text-white shadow-lg relative overflow-hidden border border-white/10">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-blue-100">
                                <Wallet size={18} />
                                <span className="text-sm font-medium">Total Potential ({timeFrame})</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">${totalProjectedCommission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                            <p className="text-xs text-blue-200">Based on {periodPolicies.length} policies sold this period</p>
                        </div>
                        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white opacity-5 rounded-full"></div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-6 border border-white/5 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-green-500/10 text-green-400 rounded-md">
                                <DollarSign size={16} />
                             </div>
                             <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Advance (Est. 75%)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">${totalAdvance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                             <div className="bg-green-500 h-full w-[75%]"></div>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-6 border border-white/5 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md">
                                <PieChartIcon size={16} />
                             </div>
                             <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Backend (Est. 25%)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">${totalBackend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                             <div className="bg-blue-500 h-full w-[25%]"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">{displayTitle}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">${displayTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-green-400 mt-4 flex items-center">
                        <TrendingUp size={12} className="mr-1" /> {timeFrame} Paid
                    </p>
                </div>
                
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">Pending Pay</p>
                            <h3 className="text-2xl font-bold text-white mt-1">${displayPending.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                        {viewMode === 'PERSONAL' 
                            ? `${pendingPolicies.length} policies pending` 
                            : 'Expected clearing: 7 days'}
                    </p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">{viewMode === 'PERSONAL' ? 'Chargeback Risk' : 'Team At Risk'}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{viewMode === 'PERSONAL' ? '$1,200' : '3 Agents'}</h3>
                        </div>
                        <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-orange-400 mt-4">{viewMode === 'PERSONAL' ? '2 policies at risk' : 'Low production alert'}</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">{viewMode === 'PERSONAL' ? 'Avg Case Size' : 'Active Agents'}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{viewMode === 'PERSONAL' ? `$1,850` : MOCK_TEAM.length.toString()}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            {viewMode === 'PERSONAL' ? <TrendingUp size={20} /> : <Users size={20} />}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4">{viewMode === 'PERSONAL' ? 'Target: $2,000' : `${MOCK_TEAM.filter(m => m.production > 50000).length} High Producers`}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={openExpenseModal}
                    className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm cursor-pointer hover:border-blue-500/50 transition-all group relative"
                >
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">Total Expenses ({timeFrame})</p>
                            <h3 className="text-2xl font-bold text-white mt-1">${totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <Edit2 size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-slate-500 pt-4 border-t border-white/5">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Leads: <b>${expenseData.leads.toLocaleString()}</b></span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Software: <b>${expenseData.software.toLocaleString()}</b></span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Other: <b>${expenseData.licensing.toLocaleString()}</b></span>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm relative group">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-slate-500">Net Income ({timeFrame})</p>
                            <h3 className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${netIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${netIncome >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            <Wallet size={20} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                             <p className={`text-xs font-bold ${profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profitMargin.toFixed(1)}% Profit Margin
                            </p>
                            <span className="text-xs text-slate-500">Gross: ${displayTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className={`h-full ${profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Carrier Mix & Portfolio Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <BarChart3 size={18} className="text-indigo-400" /> Carrier Volume Mix
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Premium by Carrier</span>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={carrierVolumeData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                <XAxis type="number" axisLine={false} tickLine={false} hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} 
                                    width={120}
                                />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                    contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'}}
                                    formatter={(v: number) => [`$${v.toLocaleString()}`, 'Premium']}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {carrierVolumeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <PieChartIcon size={18} className="text-emerald-400" /> Product Distribution
                        </h3>
                    </div>
                    <div className="flex-1 min-h-[350px]">
                         {productMixData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={productMixData}
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {productMixData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'}}
                                        formatter={(v: number) => [`$${v.toLocaleString()}`, 'Premium']}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        align="center" 
                                        iconType="circle"
                                        wrapperStyle={{fontSize: '10px', fontWeight: 'bold', paddingTop: '30px'}} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm text-center px-6">
                                No policy data available for this period.
                            </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-6">{viewMode === 'PERSONAL' ? 'Commission Income Trend' : 'Override Volume Trend'}</h3>
                <div className="h-72 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueChartData}>
                            <defs>
                                <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `$${v/1000}k`} />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}} />
                            <Area type="monotone" dataKey="commissions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorComm)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-sm ring-1 ring-white/10 border border-slate-800">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                            <h3 className="font-bold text-white flex items-center gap-2"><Briefcase size={16} className="text-blue-500" /> Edit Expenses</h3>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lead Spend</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span><input type="number" className="w-full pl-6 pr-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-950 text-white" value={tempExpenseData.leads} onChange={e => setTempExpenseData({...tempExpenseData, leads: Number(e.target.value)})} /></div></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Software</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span><input type="number" className="w-full pl-6 pr-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-950 text-white" value={tempExpenseData.software} onChange={e => setTempExpenseData({...tempExpenseData, software: Number(e.target.value)})} /></div></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Licensing</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span><input type="number" className="w-full pl-6 pr-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-950 text-white" value={tempExpenseData.licensing} onChange={e => setTempExpenseData({...tempExpenseData, licensing: Number(e.target.value)})} /></div></div>
                            <button onClick={saveExpenses} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors mt-2 flex items-center justify-center gap-2"><Save size={16} /> Save Expenses</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Financial;
