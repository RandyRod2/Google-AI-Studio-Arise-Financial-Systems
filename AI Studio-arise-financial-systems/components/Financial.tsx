
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateRevenueData, generateProductMix, MOCK_TEAM } from '../services/mockData';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertTriangle, Users, Wallet, PieChart, Briefcase, Edit2, X, Save, Clock, ArrowRightLeft, Landmark } from 'lucide-react';
import { Client, PolicyStatus } from '../types';

interface FinancialProps {
    clients?: Client[]; // Optional to support existing usage, but we'll pass it in
}

interface ExpenseData {
    leads: number;
    software: number;
    licensing: number;
}

const Financial: React.FC<FinancialProps> = ({ clients = [] }) => {
    const [viewMode, setViewMode] = useState<'PERSONAL' | 'TEAM'>('PERSONAL');
    const [timeFrame, setTimeFrame] = useState<'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YTD'>('YTD');
    
    // --- State ---
    const [expenseData, setExpenseData] = useState<ExpenseData>({ leads: 0, software: 0, licensing: 0 });
    
    // Overrides Persistence (Expenses only now)
    const [overrides, setOverrides] = useState<Record<string, { expenses?: ExpenseData }>>(() => {
        try {
            const saved = localStorage.getItem('arise_financial_overrides_v1');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Modals
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    
    const [tempExpenseData, setTempExpenseData] = useState<ExpenseData>({ leads: 0, software: 0, licensing: 0 });

    // --- Helper: Date filtering logic ---
    const isDateInTimeFrame = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        now.setHours(0,0,0,0);
        const checkDate = new Date(date);
        checkDate.setHours(0,0,0,0);
        const currentYear = now.getFullYear();

        if (timeFrame === 'YTD') {
            return checkDate.getFullYear() === currentYear && checkDate <= now;
        }
        if (timeFrame === 'QUARTERLY') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const checkQuarter = Math.floor(checkDate.getMonth() / 3);
            return checkDate.getFullYear() === currentYear && checkQuarter === currentQuarter;
        }
        if (timeFrame === 'MONTHLY') {
            return checkDate.getFullYear() === currentYear && checkDate.getMonth() === now.getMonth();
        }
        if (timeFrame === 'WEEKLY') {
            const dayOfWeek = now.getDay();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - dayOfWeek);
            return checkDate >= startOfWeek && checkDate <= now;
        }
        return true;
    };

    // --- Derived CRM Data (Defaults) ---
    const allPolicies = clients.flatMap(c => c.policies);
    const activePolicies = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE);
    const periodPolicies = activePolicies.filter(p => isDateInTimeFrame(p.startDate));

    // Projections
    const totalProjectedCommission = periodPolicies.reduce((sum, p) => sum + p.commission, 0);
    const totalAdvance = totalProjectedCommission * 0.75; 
    const totalBackend = totalProjectedCommission * 0.25;

    // Realized from CRM
    const paidPolicies = periodPolicies.filter(p => p.isPaidOut === true);
    const crmPaidCommission = paidPolicies.reduce((sum, p) => sum + p.commission, 0);

    // Pending
    const pendingPolicies = periodPolicies.filter(p => !p.isPaidOut);
    const totalPendingCommission = pendingPolicies.reduce((sum, p) => sum + p.commission, 0);


    // --- Effect: Recalculate or Load Overrides on TimeFrame Change ---
    useEffect(() => {
        const currentOverride = overrides[timeFrame];

        // EXPENSE LOGIC
        if (currentOverride?.expenses) {
            setExpenseData(currentOverride.expenses);
        } else {
            // Default: Calculate scalable mock expenses
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

    // --- Persist Overrides ---
    const updateOverrides = (data: ExpenseData) => {
        const updated = {
            ...overrides,
            [timeFrame]: {
                ...overrides[timeFrame],
                expenses: data
            }
        };
        setOverrides(updated);
        localStorage.setItem('arise_financial_overrides_v1', JSON.stringify(updated));
    };

    // --- Calculation Variables ---
    const totalExpenses = expenseData.leads + expenseData.software + expenseData.licensing;
    
    // Team Logic
    const timeScale = timeFrame === 'WEEKLY' ? 0.02 : timeFrame === 'MONTHLY' ? 0.08 : timeFrame === 'QUARTERLY' ? 0.25 : 1;
    const teamTotalProduction = MOCK_TEAM.reduce((acc, curr) => acc + curr.production, 0) * timeScale;
    const teamOverridesMock = Math.round(teamTotalProduction * 0.15); 

    // Display Values
    const displayTotal = viewMode === 'PERSONAL' ? crmPaidCommission : teamOverridesMock;
    const displayPending = viewMode === 'PERSONAL' ? totalPendingCommission : Math.round(teamTotalProduction * 0.05);
    const displayTitle = viewMode === 'PERSONAL' ? 'Realized Income' : 'Overrides';
    const netIncome = displayTotal - totalExpenses;
    const profitMargin = displayTotal > 0 ? (netIncome / displayTotal) * 100 : 0;

    // --- Handlers: Modal Open/Close ---
    
    // EXPENSES
    const openExpenseModal = () => {
        setTempExpenseData({ ...expenseData });
        setIsExpenseModalOpen(true);
    };

    const saveExpenses = () => {
        setExpenseData(tempExpenseData);
        updateOverrides(tempExpenseData);
        setIsExpenseModalOpen(false);
    };

    // Chart Data
    const revenueChartData = generateRevenueData().map(d => ({
        ...d,
        commissions: viewMode === 'TEAM' ? d.commissions * 1.5 : d.commissions
    }));

    return (
        <div className="space-y-6 animate-fade-in relative">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Financial Performance</h2>
                    <p className="text-sm text-slate-500">Tracking {timeFrame.toLowerCase()} earnings and expenses.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                     <div className="flex gap-1 text-xs bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        {(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YTD'] as const).map((tf) => (
                            <button 
                                key={tf}
                                onClick={() => setTimeFrame(tf)}
                                className={`px-3 py-1.5 font-bold rounded-md transition-all ${timeFrame === tf ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-1 text-xs bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <button 
                            onClick={() => setViewMode('PERSONAL')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all ${viewMode === 'PERSONAL' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
                        >
                            Personal
                        </button>
                        <button 
                            onClick={() => setViewMode('TEAM')}
                            className={`px-3 py-1.5 font-bold rounded-md transition-all ${viewMode === 'TEAM' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
                        >
                            Team
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'PERSONAL' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-indigo-100">
                                <Wallet size={18} />
                                <span className="text-sm font-medium">Total Potential ({timeFrame})</span>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">${totalProjectedCommission.toLocaleString()}</h3>
                            <p className="text-xs text-indigo-200">Based on {periodPolicies.length} policies sold this period</p>
                        </div>
                        <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white opacity-5 rounded-full"></div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-green-100 text-green-700 rounded-md">
                                <DollarSign size={16} />
                             </div>
                             <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Advance (Est. 75%)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">${totalAdvance.toLocaleString()}</h3>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                             <div className="bg-green-500 h-full w-[75%]"></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                                <PieChart size={16} />
                             </div>
                             <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Backend (Est. 25%)</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800">${totalBackend.toLocaleString()}</h3>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                             <div className="bg-blue-500 h-full w-[25%]"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">{displayTitle}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">${displayTotal.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-green-600 mt-4 flex items-center">
                        <TrendingUp size={12} className="mr-1" /> {timeFrame} Paid
                    </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Pending Pay</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">${displayPending.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        {viewMode === 'PERSONAL' 
                            ? `${pendingPolicies.length} policies pending` 
                            : 'Expected clearing: 7 days'}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">{viewMode === 'PERSONAL' ? 'Chargeback Risk' : 'Team At Risk'}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{viewMode === 'PERSONAL' ? '$1,200' : '3 Agents'}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <p className="text-xs text-orange-600 mt-4">{viewMode === 'PERSONAL' ? '2 policies at risk' : 'Low production alert'}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">{viewMode === 'PERSONAL' ? 'Avg Case Size' : 'Active Agents'}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{viewMode === 'PERSONAL' ? '$1,850' : MOCK_TEAM.length}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            {viewMode === 'PERSONAL' ? <TrendingUp size={20} /> : <Users size={20} />}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">{viewMode === 'PERSONAL' ? 'Target: $2,000' : `${MOCK_TEAM.filter(m => m.production > 50000).length} High Producers`}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={openExpenseModal}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-all group relative"
                >
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Total Expenses ({timeFrame})</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">${totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                            <Edit2 size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-gray-500 pt-4 border-t border-gray-50">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div> Leads: <b>${expenseData.leads.toLocaleString()}</b></span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Software: <b>${expenseData.software.toLocaleString()}</b></span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Other: <b>${expenseData.licensing.toLocaleString()}</b></span>
                    </div>
                    <div className="absolute top-2 right-2 text-[10px] text-gray-300 group-hover:text-indigo-500 transition-colors">
                        Click to edit
                    </div>
                </div>

                <div 
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative group"
                >
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Net Income ({timeFrame})</p>
                            <h3 className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${netIncome.toLocaleString()}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${netIncome >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            <Wallet size={20} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                             <p className={`text-xs font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {profitMargin.toFixed(1)}% Profit Margin
                            </p>
                            <span className="text-xs text-gray-400">Gross: ${displayTotal.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                             <div className={`h-full ${profitMargin >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(profitMargin), 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Expenses Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm ring-1 ring-black/5 animate-fade-in">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase size={16} className="text-indigo-600" /> Edit Expenses
                            </h3>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            
                            <p className="text-xs text-center text-gray-500 mb-2">
                                Adjusting <b>{timeFrame}</b> expenses. <br/>
                            </p>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lead Spend</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                                        value={tempExpenseData.leads}
                                        onChange={(e) => setTempExpenseData({...tempExpenseData, leads: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Software & Tools</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                                        value={tempExpenseData.software}
                                        onChange={(e) => setTempExpenseData({...tempExpenseData, software: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Licensing & Other</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                                        value={tempExpenseData.licensing}
                                        onChange={(e) => setTempExpenseData({...tempExpenseData, licensing: Number(e.target.value)})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={saveExpenses}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors mt-2 flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Save Expenses
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{viewMode === 'PERSONAL' ? 'Commission Income Trend' : 'Override Volume Trend'}</h3>
                    <div className="h-72 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData}>
                                <defs>
                                    <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `$${v/1000}k`} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Area type="monotone" dataKey="commissions" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorComm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Product Mix (Premium)</h3>
                    <div className="h-72 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={generateProductMix()} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Financial;
