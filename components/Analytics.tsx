
import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';
import { 
    Calendar, TrendingUp, DollarSign, FileText, 
    ArrowUpRight, ArrowDownRight, Lightbulb, Activity 
} from 'lucide-react';
import { Client, PolicyStatus, TeamMember } from '../types';
import { calculateCommissionExact } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

interface AnalyticsProps {
    clients?: Client[];
}

type TimeFrame = 'WEEKLY' | 'MONTHLY' | 'YTD';

const Analytics: React.FC<AnalyticsProps> = ({ clients = [] }) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('WEEKLY');

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

    // --- Real Data Calculation ---
    const analyticsData = useMemo(() => {
        const now = new Date();
        const startOfPeriod = new Date(now);
        startOfPeriod.setHours(0, 0, 0, 0);

        if (timeFrame === 'WEEKLY') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
            startOfPeriod.setDate(diff);
        } else if (timeFrame === 'MONTHLY') {
            startOfPeriod.setDate(1);
        } else {
            startOfPeriod.setMonth(0, 1);
        }

        // Enrich policies with calculated commission
        const allPolicies = clients.flatMap(client => {
            const agentProfile = getAgentForClient(client.id);
            return client.policies.map(policy => {
                const carrier = policy.carrier;
                const product = policy.productName || '';
                const compLevel = agentProfile.carrierCompLevels?.[carrier] || agentProfile.defaultCompLevel || 100;
                const { total } = calculateCommissionExact(carrier, product, policy.premium, compLevel);
                
                return {
                    ...policy,
                    calculatedCommission: total
                };
            });
        });
        
        // Filter policies within time frame using manual parse to stay in local time
        const periodPolicies = allPolicies.filter(p => {
            const dateStr = p.submittedDate || p.startDate;
            if (!dateStr) return false;
            
            const [y, m, d] = dateStr.split('-').map(Number);
            const pDate = new Date(y, m - 1, d); // Local Midnight
            
            // Set now to end of day for inclusive comparison
            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);

            return pDate >= startOfPeriod && pDate <= endOfToday && 
                   ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status);
        });

        // Totals
        const totalPolicies = periodPolicies.length;
        const totalPremium = periodPolicies.reduce((sum, p) => sum + p.premium, 0);
        // Use calculated commission
        const totalCommission = periodPolicies.reduce((sum, p) => sum + p.calculatedCommission, 0);

        // Chart Data Generation (Bucketing real data)
        const chartData = [];
        let points = 0;
        let labelFormat: (d: Date) => string;
        let incrementStep: (d: Date) => void;

        // Clone start date for iteration
        const iterDate = new Date(startOfPeriod);

        if (timeFrame === 'WEEKLY') {
            points = 7;
            labelFormat = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });
            incrementStep = (d) => d.setDate(d.getDate() + 1);
        } else if (timeFrame === 'MONTHLY') {
            // Days in month
            points = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); 
            labelFormat = (d) => d.getDate().toString();
            incrementStep = (d) => d.setDate(d.getDate() + 1);
        } else {
            points = 12;
            iterDate.setMonth(0, 1); // Reset to Jan 1
            labelFormat = (d) => d.toLocaleDateString('en-US', { month: 'short' });
            incrementStep = (d) => d.setMonth(d.getMonth() + 1);
        }

        for (let i = 0; i < points; i++) {
            // Define bucket range
            const bucketStart = new Date(iterDate);
            const bucketEnd = new Date(iterDate);
            
            if (timeFrame === 'YTD') {
                bucketEnd.setMonth(bucketEnd.getMonth() + 1);
                bucketEnd.setDate(0); // End of month
            } else {
                bucketEnd.setHours(23, 59, 59, 999);
            }

            // Aggregate for this bucket
            const bucketPolicies = allPolicies.filter(p => {
                const dateStr = p.submittedDate || p.startDate;
                if (!dateStr) return false;
                
                const [y, m, d] = dateStr.split('-').map(Number);
                const pDate = new Date(y, m - 1, d);

                return pDate >= bucketStart && pDate <= bucketEnd && 
                       ['Active', 'Approved', 'Pending', 'Issued'].includes(p.status);
            });

            const bucketPrem = bucketPolicies.reduce((sum, p) => sum + p.premium, 0);
            const bucketComm = bucketPolicies.reduce((sum, p) => sum + p.calculatedCommission, 0);

            chartData.push({
                name: labelFormat(bucketStart),
                policies: bucketPolicies.length,
                premium: bucketPrem,
                commission: bucketComm
            });

            // Move to next step
            incrementStep(iterDate);
            if (iterDate > now && timeFrame !== 'YTD') break; // Stop if future (except YTD we show all months usually or just up to now)
        }

        return {
            totals: {
                policies: totalPolicies,
                premium: totalPremium,
                commission: totalCommission
            },
            chart: chartData
        };

    }, [clients, timeFrame, teamMembers]);

    const { totals, chart } = analyticsData;

    // Average policies per active day (days where at least 1 policy was sold)
    const activeDays = chart.filter(d => d.policies > 0).length;
    const avgPoliciesPerActiveDay = activeDays > 0 ? (totals.policies / activeDays).toFixed(1) : '0.0';

    // Forecast Calculation (Simple projection)
    const daysPassed = chart.length; 
    const dailyRate = daysPassed > 0 ? totals.policies / daysPassed : 0;
    const projectedPolicies30Days = Math.round(dailyRate * 30); 

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
                    <p className="text-slate-400 text-sm">Track your performance and identify growth opportunities.</p>
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
                            {tf === 'WEEKLY' ? 'Weekly' : tf === 'MONTHLY' ? 'Monthly' : 'Year to Date'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center border border-green-500/20">
                            <ArrowUpRight size={12} className="mr-1" /> Trending
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Policies ({timeFrame === 'WEEKLY' ? 'This Week' : timeFrame === 'MONTHLY' ? 'This Month' : 'YTD'})</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{totals.policies}</h3>
                    <p className="text-xs text-slate-400 mt-2">Avg {avgPoliciesPerActiveDay} per active day</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Premium</p>
                    <h3 className="text-3xl font-bold text-white mt-1">${totals.premium.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <p className="text-xs text-slate-400 mt-2">Gross Annualized Premium</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Total Commission</p>
                    <h3 className="text-3xl font-bold text-white mt-1">${totals.commission.toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
                    <p className="text-xs text-slate-400 mt-2">Estimated earnings</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">30-Day Forecast</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{timeFrame === 'YTD' ? Math.round(totals.policies / 12) : projectedPolicies30Days}</h3>
                    <p className="text-xs text-slate-400 mt-2">Projected policies sold</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Performance Trend */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
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
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} allowDecimals={false} />
                                <RechartsTooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{color: '#94a3b8'}} />
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

                {/* Revenue Breakdown */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                        <DollarSign size={18} className="text-green-400" />
                        Revenue Breakdown
                    </h3>
                    <div className="h-72 w-full min-w-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `$${v/1000}k`} />
                                <RechartsTooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#0f172a', color: '#fff'}}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{color: '#94a3b8'}} />
                                <Bar name="Premium ($)" dataKey="premium" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="Commission ($)" dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Lightbulb className="text-yellow-400" /> Performance Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Growth Opportunity</p>
                             <p className="text-sm font-medium leading-relaxed text-slate-200">
                                 Your policy count is {totals.policies > 5 ? 'strong' : 'building'} this period. 
                                 Consider focusing on cross-selling <b>Annuities</b> to existing clients to increase your average premium per sale.
                             </p>
                        </div>
                        <div>
                             <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">Commission Velocity</p>
                             <p className="text-sm font-medium leading-relaxed text-slate-200">
                                 You are averaging <b>${Math.round(totals.commission / (totals.policies || 1)).toLocaleString()}</b> in commission per policy. 
                                 Increasing your average face amount by $50k could boost this by 15%.
                             </p>
                        </div>
                    </div>
                </div>
                {/* Decorative Background Elements */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
            </div>
        </div>
    );
};

export default Analytics;
