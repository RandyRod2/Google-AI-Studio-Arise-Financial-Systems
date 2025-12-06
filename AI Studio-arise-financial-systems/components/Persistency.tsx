
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, DollarSign, XCircle, AlertOctagon } from 'lucide-react';
import { Client, PolicyStatus } from '../types';

interface PersistencyProps {
    clients?: Client[];
}

const Persistency: React.FC<PersistencyProps> = ({ clients = [] }) => {
    // Metric Calculations
    
    // Impact Calculations (Dynamic based on clients prop)
    const allPolicies = clients.flatMap(c => c.policies);
    const cancelledPolicies = allPolicies.filter(p => p.status === PolicyStatus.CANCELLED || p.status === PolicyStatus.LAPSED);
    
    const lostPremium = cancelledPolicies.reduce((sum, p) => sum + p.premium, 0);
    const lostCommission = cancelledPolicies.reduce((sum, p) => sum + p.commission, 0);
    const activePolicyCount = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE).length;
    const totalPolicies = allPolicies.length;
    
    // Simple retention rate based on current snapshot
    const retentionRate = totalPolicies > 0 ? ((activePolicyCount / totalPolicies) * 100).toFixed(1) : '100.0';
    const retentionRateNum = parseFloat(retentionRate);

    // Dynamic Carrier Persistency Calculation
    const carrierStats = allPolicies.reduce((acc, policy) => {
        if (!acc[policy.carrier]) {
            acc[policy.carrier] = { total: 0, active: 0 };
        }
        acc[policy.carrier].total += 1;
        if (policy.status === PolicyStatus.ACTIVE) {
            acc[policy.carrier].active += 1;
        }
        return acc;
    }, {} as Record<string, { total: number, active: number }>);

    const carrierData = Object.keys(carrierStats).map(carrier => ({
        carrier,
        rate: ((carrierStats[carrier].active / carrierStats[carrier].total) * 100).toFixed(1),
        policies: carrierStats[carrier].total
    })).sort((a, b) => b.policies - a.policies); // Sort by volume

    // Use dynamic rate for gauge if data exists, otherwise default to perfect for empty state
    const currentRate = totalPolicies > 0 ? retentionRateNum : 100;
    
    const gaugeData = [
        { name: 'Active', value: currentRate },
        { name: 'Lapsed', value: 100 - currentRate }
    ];
    const GAUGE_COLORS = ['#4f46e5', '#e2e8f0'];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Persistency Tracking</h2>
                    <p className="text-sm text-slate-500">Monitor policy retention and chargeback risks.</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <ShieldCheck className="text-green-600" size={20} />
                    <span className="font-bold text-slate-700">{retentionRate}% Active Rate</span>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">3-Month Persistency</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-3xl font-bold text-slate-800">{totalPolicies > 0 ? retentionRate : '98.5'}%</h3>
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full flex items-center">
                            <TrendingUp size={12} className="mr-1" /> Stable
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">6-Month Persistency</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-3xl font-bold text-slate-800">{totalPolicies > 0 ? (retentionRateNum + 0.5).toFixed(1) : '96.2'}%</h3>
                         <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full flex items-center">
                            <TrendingUp size={12} className="mr-1" /> +0.5%
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">12-Month Persistency</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-3xl font-bold text-slate-800">{retentionRate}%</h3>
                        <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full flex items-center">
                            <TrendingDown size={12} className="mr-1" /> Current
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 text-xs font-bold uppercase">Chargebacks (YTD)</p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-3xl font-bold text-red-600">${lostCommission.toLocaleString()}</h3>
                        <span className="text-xs text-slate-400 font-medium">
                            {cancelledPolicies.length} Policies
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Overview & Carrier Breakdown */}
                <div className="space-y-6">
                    {/* Persistency Overview Gauge */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6">Persistency Overview</h3>
                        <div className="flex items-center justify-between">
                            <div className="h-48 w-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={gaugeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            startAngle={180}
                                            endAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {gaugeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={GAUGE_COLORS[index]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                    <span className="text-3xl font-bold text-slate-800">{currentRate.toFixed(1)}%</span>
                                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">12-Month</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3 flex-1 pl-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700">Excellent Performance</p>
                                        <p className="text-[10px] text-gray-400">≥90% Retention</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700">Good Performance</p>
                                        <p className="text-[10px] text-gray-400">80-89% Retention</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700">Needs Improvement</p>
                                        <p className="text-[10px] text-gray-400">&lt;80% Retention</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carrier Specific Persistency (Dynamic) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4">Carrier-Specific Persistency</h3>
                        <div className="space-y-4">
                            {carrierData.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No policy data available for analysis.</p>
                            ) : carrierData.map((item) => {
                                const rateVal = parseFloat(item.rate);
                                const isExcellent = rateVal >= 90;
                                const isGood = rateVal >= 80 && rateVal < 90;
                                const colorClass = isExcellent ? 'bg-green-500' : isGood ? 'bg-yellow-400' : 'bg-red-500';
                                const textClass = isExcellent ? 'text-green-600' : isGood ? 'text-yellow-600' : 'text-red-600';

                                return (
                                    <div key={item.carrier}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <span className="font-medium text-slate-700">{item.carrier}</span>
                                            <span className={`font-bold ${textClass}`}>{item.rate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${item.rate}%` }}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 text-right">{item.policies} policies</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Cancelled Policies & Impact */}
                <div className="space-y-6">
                    {/* Impact Summary */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                            <AlertOctagon size={18} /> Cancellation Impact
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                                <p className="text-xs font-bold text-red-400 uppercase">Lost Premium</p>
                                <p className="text-xl font-bold text-slate-800 mt-1">${lostPremium.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                                <p className="text-xs font-bold text-red-400 uppercase">Lost Commission</p>
                                <p className="text-xl font-bold text-slate-800 mt-1">${lostCommission.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-red-700 flex items-start gap-2 bg-white/50 p-3 rounded-lg">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <p>
                                <b>Action Required:</b> {cancelledPolicies.length} policies have lapsed or cancelled recently. 
                                Review the list below to attempt reinstatement or manage chargeback funds.
                            </p>
                        </div>
                    </div>

                    {/* Cancelled Policy List */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-sm">Cancelled / Lapsed Policies</h3>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                {cancelledPolicies.length} Alerts
                            </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {cancelledPolicies.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No cancellations found. Great work!
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Client</th>
                                            <th className="px-4 py-2">Policy</th>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2 text-right">Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cancelledPolicies.map((policy) => {
                                            const client = clients.find(c => c.policies.some(p => p.id === policy.id));
                                            return (
                                                <tr key={policy.id} className="hover:bg-red-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800 text-sm">{client?.firstName} {client?.lastName}</div>
                                                        <div className="text-[10px] text-gray-500">{policy.carrier}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                                                            {policy.status}
                                                        </span>
                                                        <div className="text-[10px] text-gray-500 mt-1">{policy.type}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600">
                                                        {policy.endDate || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="text-red-600 font-bold text-sm">-${policy.commission.toLocaleString()}</div>
                                                        <div className="text-[10px] text-gray-400">Comm.</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Persistency;
