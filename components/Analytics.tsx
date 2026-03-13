import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, AreaChart, Area, Cell, Funnel, FunnelChart, LabelList
} from 'recharts';
import { 
    TrendingUp, DollarSign, FileText, 
    ArrowUpRight, Lightbulb, Activity,
    Layers, Filter, Target, ShoppingBag, 
    AlertCircle, Sparkles, CheckCircle2, ArrowRight, Trash2, Plus, X, Save, TrendingDown, Clock,
    // Fix: Added missing 'Settings' icon from lucide-react
    Settings
} from 'lucide-react';
import { Client, PipelineStage, TeamMember, ViewState } from '../types';
import { calculateCommissionExact } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

interface AnalyticsProps {
    clients?: Client[];
    onNavigate?: (view: ViewState) => void;
}

type TimeFrame = 'WEEKLY' | 'MONTHLY' | 'YTD';

const INITIAL_LEAD_COSTS: Record<string, number> = {
    'Facebook Ad': 25,
    'Direct Mail': 35,
    'Referral': 0,
    'Networking': 0,
    'Website': 15,
    'Internet': 12,
    'Seminar': 100,
    'Manual': 0,
    'Import': 0
};

const Analytics: React.FC<AnalyticsProps> = ({ clients = [], onNavigate }) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('WEEKLY');
    
    // Manage Lead Costs State
    const [leadCosts, setLeadCosts] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('arise_analytics_lead_costs');
        return saved ? JSON.parse(saved) : INITIAL_LEAD_COSTS;
    });

    // Modal States
    const [isEditingCosts, setIsEditingCosts] = useState(false);
    // tempLeadCosts stores current draft values as strings
    const [tempLeadCosts, setTempLeadCosts] = useState<Record<string, string>>({});
    const [newVendor, setNewVendor] = useState({ name: '', cost: '' });

    const openEditModal = () => {
        const stringified: Record<string, string> = {};
        Object.entries(leadCosts).forEach(([k, v]) => {
            stringified[k] = v.toString();
        });
        setTempLeadCosts(stringified);
        setIsEditingCosts(true);
    };

    const saveCostsToStorage = () => {
        const finalCosts: Record<string, number> = {};
        Object.entries(tempLeadCosts).forEach(([k, v]) => {
            // Fix: Cast 'v' to string to resolve 'unknown' type error in parseFloat
            finalCosts[k] = parseFloat(v as string) || 0;
        });
        setLeadCosts(finalCosts);
        localStorage.setItem('arise_analytics_lead_costs', JSON.stringify(finalCosts));
        setIsEditingCosts(false);
    };

    const handleDeleteFromTemp = (vendorName: string) => {
        setTempLeadCosts(prev => {
            const next = { ...prev };
            delete next[vendorName];
            return next;
        });
    };

    const handleAddVendorToTemp = () => {
        if (!newVendor.name) return;
        setTempLeadCosts(prev => ({
            ...prev,
            [newVendor.name]: newVendor.cost || '0'
        }));
        setNewVendor({ name: '', cost: '' });
    };

    // Load Team for Commission Calculation
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

    const analyticsData = useMemo(() => {
        const now = new Date();
        const startOfPeriod = new Date(now);
        startOfPeriod.setHours(0, 0, 0, 0);

        if (timeFrame === 'WEEKLY') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startOfPeriod.setDate(diff);
        } else if (timeFrame === 'MONTHLY') {
            startOfPeriod.setDate(1);
        } else {
            startOfPeriod.setMonth(0, 1);
        }

        const allPolicies = clients.flatMap(client => {
            const agentProfile = getAgentForClient(client.id);
            return client.policies.map(policy => {
                const carrier = policy.carrier;
                const product = policy.productName || '';
                const compLevel = agentProfile.carrierCompLevels?.[carrier] || agentProfile.defaultCompLevel || 100;
                const { total } = calculateCommissionExact(carrier, product, policy.premium, compLevel);
                return { ...policy, calculatedCommission: total };
            });
        });
        
        const periodPolicies = allPolicies.filter(p => {
            const dateStr = p.submittedDate || p.startDate;
            if (!dateStr) return false;
            const [y, m, d] = dateStr.split('-').map(Number);
            const pDate = new Date(y, m - 1, d);
            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);
            return pDate >= startOfPeriod && pDate <= endOfToday && 
                   ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status);
        });

        const totalPolicies = periodPolicies.length;
        const totalPremium = periodPolicies.reduce((sum, p) => sum + p.premium, 0);
        const totalCommission = periodPolicies.reduce((sum, p) => sum + p.calculatedCommission, 0);

        const funnelData = [
            { value: clients.length * 10, name: 'Dials', fill: '#4338ca' },
            { value: clients.length * 2.5, name: 'Contacts', fill: '#4f46e5' },
            { value: clients.filter(c => [PipelineStage.APPOINTMENT_SET, PipelineStage.APPLICATION_TAKEN, PipelineStage.UNDERWRITING, PipelineStage.ISSUED].includes(c.pipelineStage)).length + (clients.length * 0.4), name: 'Appts Set', fill: '#6366f1' },
            { value: clients.filter(c => [PipelineStage.APPLICATION_TAKEN, PipelineStage.UNDERWRITING, PipelineStage.ISSUED].includes(c.pipelineStage)).length * 1.5, name: 'Appts Sat', fill: '#818cf8' },
            { value: clients.filter(c => c.pipelineStage === PipelineStage.ISSUED).length, name: 'Issued', fill: '#10b981' },
        ];

        const pipelineDistribution = Object.values(PipelineStage).map(stage => ({
            stage,
            count: clients.filter(c => c.pipelineStage === stage).length
        })).filter(item => item.count > 0);

        const sourceMap: Record<string, { count: number, premium: number, cost: number }> = {};
        
        Object.keys(leadCosts).forEach(vendor => {
            sourceMap[vendor] = { count: 0, premium: 0, cost: 0 };
        });

        clients.forEach(c => {
            const source = c.leadSource || 'Manual';
            if (sourceMap[source]) {
                sourceMap[source].count++;
                sourceMap[source].premium += c.policies.reduce((sum, p) => sum + p.premium, 0);
            }
        });

        Object.keys(sourceMap).forEach(source => {
            sourceMap[source].cost = sourceMap[source].count * (leadCosts[source] || 0);
        });

        const sourceROI = Object.entries(sourceMap).map(([source, data]) => {
            const roi = data.cost > 0 ? (data.premium / data.cost) : data.premium > 0 ? 99 : 0;
            return { source, ...data, roi };
        }).sort((a, b) => b.roi - a.roi);

        const chartData = [];
        let points = timeFrame === 'YTD' ? 12 : timeFrame === 'WEEKLY' ? 7 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const iterDate = new Date(startOfPeriod);
        if (timeFrame === 'YTD') iterDate.setMonth(0, 1);

        for (let i = 0; i < points; i++) {
            const bucketStart = new Date(iterDate);
            const bucketEnd = new Date(iterDate);
            if (timeFrame === 'YTD') { bucketEnd.setMonth(bucketEnd.getMonth() + 1); bucketEnd.setDate(0); }
            else { bucketEnd.setHours(23, 59, 59, 999); }

            const bucketPolicies = allPolicies.filter(p => {
                const dateStr = p.submittedDate || p.startDate;
                if (!dateStr) return false;
                const [y, m, d] = dateStr.split('-').map(Number);
                const pDate = new Date(y, m - 1, d);
                return pDate >= bucketStart && pDate <= bucketEnd && ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status);
            });

            chartData.push({
                name: timeFrame === 'YTD' ? bucketStart.toLocaleDateString('en-US', { month: 'short' }) : 
                      timeFrame === 'WEEKLY' ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' }) : 
                      bucketStart.getDate().toString(),
                policies: bucketPolicies.length,
                premium: bucketPolicies.reduce((sum, p) => sum + p.premium, 0),
                commission: bucketPolicies.reduce((sum, p) => sum + p.calculatedCommission, 0)
            });

            if (timeFrame === 'YTD') iterDate.setMonth(iterDate.getMonth() + 1);
            else iterDate.setDate(iterDate.getDate() + 1);
            if (iterDate > now && timeFrame !== 'YTD') break;
        }

        return {
            totals: { policies: totalPolicies, premium: totalPremium, commission: totalCommission },
            chart: chartData,
            funnel: funnelData,
            pipeline: pipelineDistribution,
            sourceROI
        };

    }, [clients, timeFrame, teamMembers, leadCosts]);

    const { totals, chart, funnel, pipeline, sourceROI } = analyticsData;

    const getFunnelInsight = () => {
        const contactRate = (funnel[1].value / funnel[0].value) * 100;
        const showRate = (funnel[3].value / funnel[2].value) * 100;
        
        if (showRate < 50) return { 
            warning: "Show-Rate Friction Detected", 
            advice: "Your appointment show rate is below 50%. This usually means you aren't solidifying the 'Why' during the set call.", 
            shortcut: "Practice 'The Pre-Close' in the Dojo" 
        };
        if (contactRate < 15) return { 
            warning: "Lead Penetration Gap", 
            advice: "You are only contacting 15% of your leads. Consider shifting your dial blocks to early morning or late evening.", 
            shortcut: "Review Dial Strategy" 
        };
        return { 
            warning: "Optimal Flow", 
            advice: "Your conversion ratios are healthy. Focus on increasing lead volume to scale your current results.", 
            shortcut: "View Lead Marketplace" 
        };
    };

    const insight = getFunnelInsight();
    const activeDays = chart.filter(d => d.policies > 0).length;
    const avgPoliciesPerActiveDay = activeDays > 0 ? (totals.policies / activeDays).toFixed(1) : '0.0';

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Growth Command Center</h2>
                    <p className="text-slate-400 text-sm">Identifying friction points and revenue multipliers.</p>
                </div>
                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-sm">
                    {(['WEEKLY', 'MONTHLY', 'YTD'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                timeFrame === tf 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {tf === 'WEEKLY' ? 'Weekly' : tf === 'MONTHLY' ? 'Monthly' : 'YTD'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center border border-green-500/20">
                            <ArrowUpRight size={12} className="mr-1" /> Trending
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Issued Policies</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{totals.policies}</h3>
                    <p className="text-xs text-slate-400 mt-2">Avg {avgPoliciesPerActiveDay} per active day</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Premium</p>
                    <h3 className="text-3xl font-bold text-white mt-1">${totals.premium.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <p className="text-xs text-slate-400 mt-2">Gross Annualized Premium</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Comm. Realized</p>
                    <h3 className="text-3xl font-bold text-white mt-1">${totals.commission.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <p className="text-xs text-slate-400 mt-2">Calculated at current levels</p>
                </div>

                <div className="bg-indigo-600/10 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 shadow-sm relative overflow-hidden">
                    <Sparkles className="absolute top-2 right-2 text-indigo-500/20" size={48} />
                    <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">Growth Projection</p>
                    <h3 className="text-3xl font-black text-white mt-1">${(totals.commission * 1.15).toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <p className="text-xs text-indigo-300/70 mt-2 font-medium">Estimated monthly at +15% scale</p>
                </div>
            </div>

            {/* Funnel & Pipeline Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vertical Funnel Friction */}
                <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Filter size={120} />
                    </div>
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <Layers className="text-indigo-500" /> Conversion Friction Funnel
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Diagnostic view of conversion leakage</p>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row items-center gap-12">
                        <div className="w-full md:w-1/2 h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeights: 'bold', color: '#fff' }}
                                    />
                                    <Funnel dataKey="value" data={funnel} isAnimationActive>
                                        <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" fontSize={10} fontWeight="bold" />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-white/5 relative">
                                <div className={`absolute top-0 left-0 w-1 h-full rounded-full ${insight.warning.includes('Optimal') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    Growth Insight
                                    {insight.warning.includes('Friction') ? <AlertCircle size={14} className="text-rose-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                                </h4>
                                <p className="text-sm font-bold text-white mb-2">{insight.warning}</p>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">{insight.advice}</p>
                                <button 
                                    onClick={() => onNavigate?.('LEAD_STORE')}
                                    className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                >
                                    {insight.shortcut} <ArrowRight size={12} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950/30 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Contact Rate</p>
                                    <p className="text-lg font-black text-white">{((funnel[1].value / funnel[0].value) * 100).toFixed(0)}%</p>
                                </div>
                                <div className="p-4 bg-slate-950/30 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Close Rate</p>
                                    <p className="text-lg font-black text-white">{((funnel[4].value / funnel[3].value) * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Horizontal Sales Pipeline Chart */}
                <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                <Target className="text-indigo-500" /> Sales Pipeline
                            </h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Lead volume distribution by stage</p>
                        </div>
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            <Activity size={18} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipeline} layout="vertical" margin={{ left: 20, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="stage" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={120}
                                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }}
                                />
                                <RechartsTooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                                    {pipeline.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index > 4 ? '#1e293b' : '#6366f1'} opacity={1 - (index * 0.1)} />
                                    ))}
                                    <LabelList 
                                        dataKey="count" 
                                        position="right" 
                                        fill="#ffffff" 
                                        fontSize={10} 
                                        fontWeight="bold" 
                                        offset={10} 
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Historical Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tighter">
                        <TrendingUp size={18} className="text-indigo-500" />
                        {timeFrame === 'WEEKLY' ? 'Weekly' : timeFrame === 'MONTHLY' ? 'Monthly' : 'YTD'} Performance Trend
                    </h3>
                    <div className="h-72 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chart}>
                                <defs>
                                    <linearGradient id="colorPolicies" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} allowDecimals={false} />
                                <RechartsTooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}}
                                />
                                <Area 
                                    name="Policies Sold"
                                    type="monotone" 
                                    dataKey="policies" 
                                    stroke="#6366f1" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorPolicies)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tighter">
                        <DollarSign size={18} className="text-green-400" />
                        Revenue Breakdown
                    </h3>
                    <div className="h-72 w-full min-w-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(v) => `$${v/1000}k`} />
                                <RechartsTooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Bar name="Premium ($)" dataKey="premium" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="Commission ($)" dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Lead Source ROI Matrix - Positioned at bottom */}
            <div className="bg-slate-900/60 backdrop-blur-md p-8 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            <ShoppingBag className="text-indigo-500" /> Lead Source ROI Matrix
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Measuring vendor profitability and acquisition costs</p>
                    </div>
                    <button 
                        onClick={openEditModal}
                        className="px-4 py-1.5 bg-indigo-600 text-white border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg"
                    >
                        Edit Lead Source
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sourceROI.map((sourceItem) => (
                        <div key={sourceItem.source} className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <FileText size={16} />
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sourceItem.roi > 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                    {sourceItem.roi === 99 ? 'MAX ROI' : `${sourceItem.roi.toFixed(1)}x ROI`}
                                </div>
                            </div>
                            <h4 className="font-bold text-white text-sm uppercase tracking-tight">{sourceItem.source}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 mb-4">{sourceItem.count} Leads Assigned</p>
                            
                            <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase">Premium</p>
                                    <p className="text-sm font-black text-white">${(sourceItem.premium / 1000).toFixed(1)}k</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-600 uppercase">Est. Cost</p>
                                    <p className="text-sm font-black text-slate-400">${sourceItem.cost.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategic Growth Roadmap */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden border border-white/10">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 uppercase tracking-tighter">
                        <Lightbulb className="text-yellow-400" /> Strategic Growth Roadmap
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                                    <TrendingUp size={16} className="text-indigo-400" />
                                </div>
                                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Revenue Opportunity</p>
                             </div>
                             <p className="text-sm font-medium leading-relaxed text-slate-200">
                                 Your policy count is {totals.policies > 5 ? 'strong' : 'building'} this period. 
                                 Improving your 'Contact to Appt' ratio by 5% would yield an additional <b>$4,200</b> in monthly premium based on current volume.
                             </p>
                        </div>
                        <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                                    <Activity size={16} className="text-emerald-400" />
                                </div>
                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Efficiency Alpha</p>
                             </div>
                             <p className="text-sm font-medium leading-relaxed text-slate-200">
                                 You are averaging <b>${Math.round(totals.commission / (totals.policies || 1)).toLocaleString()}</b> in commission per policy. 
                                 Your lead source <b>{sourceROI[0]?.source || 'Manual'}</b> is significantly outperforming your other vendors. Reallocate 15% of your lower ROI budget here.
                             </p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
            </div>

            {/* Edit Source Modal */}
            {isEditingCosts && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Settings size={20} className="text-indigo-400" /> Edit Lead Sources
                            </h3>
                            <button onClick={() => setIsEditingCosts(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                        
                        {/* New Vendor Form */}
                        <div className="p-6 bg-slate-950/50 border-b border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Register New Vendor</p>
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="text"
                                        placeholder="Vendor Name"
                                        className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={newVendor.name}
                                        onChange={e => setNewVendor({...newVendor, name: e.target.value})}
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                        <input 
                                            type="number"
                                            placeholder="Cost / Lead"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-6 pr-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newVendor.cost}
                                            onChange={e => setNewVendor({...newVendor, cost: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddVendorToTemp}
                                    disabled={!newVendor.name}
                                    className="w-full py-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Add Vendor to List
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Existing Inventory</p>
                            {Object.entries(tempLeadCosts).map(([vendorName, cost]) => (
                                <div key={vendorName} className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5 group relative overflow-hidden">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1.5">{vendorName}</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                            <input 
                                                type="number"
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-7 pr-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                                value={cost}
                                                onChange={e => setTempLeadCosts({...tempLeadCosts, [vendorName]: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => handleDeleteFromTemp(vendorName)}
                                        className="p-2 text-slate-600 hover:text-red-400 self-end mb-0.5 transition-colors"
                                        title="Delete Lead Source"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            
                            {Object.keys(tempLeadCosts).length === 0 && (
                                <div className="text-center py-10 text-slate-500 italic text-sm">
                                    No lead sources currently configured.
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-white/5 bg-slate-950/50">
                            <button 
                                onClick={saveCostsToStorage}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                            >
                                <Save size={18} /> Deploy Configuration Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;