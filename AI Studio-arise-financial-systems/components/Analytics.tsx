
import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
    ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';
import { 
    Calendar, TrendingUp, DollarSign, FileText, 
    ArrowUpRight, ArrowDownRight, Lightbulb, Activity 
} from 'lucide-react';
import { Client } from '../types';

interface AnalyticsProps {
    clients?: Client[];
}

type TimeFrame = 'WEEKLY' | 'MONTHLY' | 'YTD';

const Analytics: React.FC<AnalyticsProps> = ({ clients = [] }) => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('WEEKLY');

    // Helper to generate simulated chart data
    // This creates high-fidelity chart data that looks realistic for a demo
    const chartData = useMemo(() => {
        const data = [];
        let points = 0;
        let labelFormat: (i: number) => string;

        if (timeFrame === 'WEEKLY') {
            points = 7;
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            labelFormat = (i) => days[i % 7];
        } else if (timeFrame === 'MONTHLY') {
            points = 30;
            labelFormat = (i) => `Day ${i + 1}`;
        } else {
            points = 12;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            labelFormat = (i) => months[i];
        }

        let runningPremium = 0;
        let runningCommission = 0;
        let runningPolicies = 0;

        for (let i = 0; i < points; i++) {
            // Simulate random variations
            const policiesSold = Math.floor(Math.random() * 3); // 0-2 policies/day or unit
            const avgPrem = 1200;
            const premium = policiesSold * (avgPrem + (Math.random() * 500 - 250));
            const commission = premium * 0.85; 

            data.push({
                name: labelFormat(i),
                policies: policiesSold,
                premium: Math.round(premium),
                commission: Math.round(commission)
            });

            runningPremium += premium;
            runningCommission += commission;
            runningPolicies += policiesSold;
        }

        return { data, totals: { policies: runningPolicies, premium: runningPremium, commission: runningCommission } };
    }, [timeFrame]);

    // Metrics derived from the generated data (ensures charts and cards match)
    const { totals } = chartData;
    const daysInPeriod = timeFrame === 'WEEKLY' ? 7 : timeFrame === 'MONTHLY' ? 30 : 365;
    
    // Average policies per active day (days where at least 1 policy was sold)
    const activeDays = chartData.data.filter(d => d.policies > 0).length;
    const avgPoliciesPerActiveDay = activeDays > 0 ? (totals.policies / activeDays).toFixed(1) : '0.0';

    // Forecast Calculation (Simple projection)
    const dailyRate = totals.policies / (timeFrame === 'YTD' ? 12 : pointsFromFrame(timeFrame));
    const projectedPolicies30Days = Math.round(dailyRate * (timeFrame === 'YTD' ? 1 : 30)); // Rough multiplier correction

    function pointsFromFrame(tf: TimeFrame) {
        if (tf === 'WEEKLY') return 7;
        if (tf === 'MONTHLY') return 30;
        return 12;
    }

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
                    <p className="text-slate-500 text-sm">Track your performance and identify growth opportunities.</p>
                </div>
                <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    {(['WEEKLY', 'MONTHLY', 'YTD'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                timeFrame === tf 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-500 hover:bg-gray-50'
                            }`}
                        >
                            {tf === 'WEEKLY' ? 'Weekly' : tf === 'MONTHLY' ? 'Monthly' : 'Year to Date'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                            <ArrowUpRight size={12} className="mr-1" /> Trending
                        </span>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Policies ({timeFrame === 'WEEKLY' ? '7d' : timeFrame === 'MONTHLY' ? '30d' : 'YTD'})</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{totals.policies}</h3>
                    <p className="text-xs text-gray-400 mt-2">Avg {avgPoliciesPerActiveDay} per active day</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Premium</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">${totals.premium.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Gross Annualized Premium</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">Total Commission</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">${totals.commission.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Estimated earnings</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wide">30-Day Forecast</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{timeFrame === 'YTD' ? Math.round(totals.policies / 12) : projectedPolicies30Days}</h3>
                    <p className="text-xs text-gray-400 mt-2">Projected policies sold</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Performance Trend */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-500" />
                        {timeFrame === 'WEEKLY' ? 'Weekly' : timeFrame === 'MONTHLY' ? 'Monthly' : 'YTD'} Performance Trend
                    </h3>
                    <div className="h-72 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.data}>
                                <defs>
                                    <linearGradient id="colorPolicies" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <RechartsTooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
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
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <DollarSign size={18} className="text-green-500" />
                        Revenue Breakdown
                    </h3>
                    <div className="h-72 w-full min-w-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `$${v/1000}k`} />
                                <RechartsTooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar name="Premium ($)" dataKey="premium" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar name="Commission ($)" dataKey="commission" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Lightbulb className="text-yellow-400" /> Performance Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Growth Opportunity</p>
                             <p className="text-sm font-medium leading-relaxed">
                                 Your policy count is trending up this {timeFrame === 'WEEKLY' ? 'week' : timeFrame === 'MONTHLY' ? 'month' : 'year'}. 
                                 Focus on cross-selling <b>Annuities</b> to existing Term Life clients to increase your average premium per sale.
                             </p>
                        </div>
                        <div>
                             <p className="text-green-300 text-xs font-bold uppercase tracking-wider mb-1">Commission Velocity</p>
                             <p className="text-sm font-medium leading-relaxed">
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
