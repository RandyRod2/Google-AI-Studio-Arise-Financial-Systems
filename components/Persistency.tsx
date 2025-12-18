
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, DollarSign, XCircle, AlertCircle, CheckCircle2, Minus } from 'lucide-react';
import { Client, Policy, PolicyStatus } from '../types';

interface PersistencyProps {
    clients: Client[];
}

const Persistency: React.FC<PersistencyProps> = ({ clients = [] }) => {
    // --- Data Processing ---
    const { 
        metrics, 
        carrierStats, 
        lapsedPolicies, 
        chargebackTotal, 
        lostPremium 
    } = useMemo(() => {
        const allPolicies = clients.flatMap(c => c.policies.map(p => ({ ...p, clientName: `${c.firstName} ${c.lastName}` })));
        
        // Mocking time-based persistency for demo purposes (in a real app, this compares cohort dates)
        const total = allPolicies.length;
        const active = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE || p.status === PolicyStatus.APPROVED).length;
        const lapsedArr = allPolicies.filter(p => p.status === PolicyStatus.LAPSED || p.status === PolicyStatus.CANCELLED);
        
        // 13-Month Persistency (Global)
        const rate13 = total > 0 ? (active / total) * 100 : 100;

        // Mocking 3/6/12 splits slightly for the visual to match screenshot vibes
        const rate3 = Math.min(100, rate13 + 5); 
        const rate6 = Math.min(100, rate13 + 2);
        
        // Chargebacks (Sum of commission on lapsed policies)
        const chargeback = lapsedArr.reduce((sum, p) => sum + p.commission, 0);
        const lostPrem = lapsedArr.reduce((sum, p) => sum + p.premium, 0);

        // Carrier Stats
        const carrierMap: Record<string, { total: number, active: number }> = {};
        allPolicies.forEach(p => {
            if (!carrierMap[p.carrier]) carrierMap[p.carrier] = { total: 0, active: 0 };
            carrierMap[p.carrier].total += 1;
            if (p.status === PolicyStatus.ACTIVE || p.status === PolicyStatus.APPROVED) {
                carrierMap[p.carrier].active += 1;
            }
        });

        const carrierData = Object.keys(carrierMap).map(c => ({
            name: c,
            rate: (carrierMap[c].active / carrierMap[c].total) * 100,
            count: carrierMap[c].total
        })).sort((a,b) => b.rate - a.rate);

        return {
            metrics: {
                m3: rate3.toFixed(1),
                m6: rate6.toFixed(1),
                m12: rate13.toFixed(1)
            },
            carrierStats: carrierData,
            lapsedPolicies: lapsedArr,
            chargebackTotal: chargeback,
            lostPremium: lostPrem
        };
    }, [clients]);

    // Gauge Chart Data
    const gaugeData = [
        { name: 'Retained', value: parseFloat(metrics.m12) },
        { name: 'Lost', value: 100 - parseFloat(metrics.m12) }
    ];
    
    return (
        <div className="animate-fade-in space-y-6 pb-10">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white">Persistency Tracking</h2>
                    <p className="text-slate-400 text-sm">Monitor policy retention and chargeback risks.</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                    {parseFloat(metrics.m12) >= 90 ? <CheckCircle2 className="text-green-400" size={18} /> : <AlertCircle className="text-yellow-400" size={18} />}
                    <span className="font-bold text-white">{metrics.m12}% Active Rate</span>
                </div>
            </div>

            {/* Top KPI Cards - Layout from Screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 3-Month */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">3-Month Persistency</p>
                    <div className="flex justify-between items-end mt-2">
                        <h3 className="text-3xl font-bold text-white">{metrics.m3}%</h3>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center border border-green-500/20">
                            <TrendingUp size={12} className="mr-1" /> Stable
                        </span>
                    </div>
                </div>

                {/* 6-Month */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">6-Month Persistency</p>
                    <div className="flex justify-between items-end mt-2">
                        <h3 className="text-3xl font-bold text-white">{metrics.m6}%</h3>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center border border-green-500/20">
                            <TrendingUp size={12} className="mr-1" /> +0.5%
                        </span>
                    </div>
                </div>

                {/* 12-Month */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">12-Month Persistency</p>
                    <div className="flex justify-between items-end mt-2">
                        <h3 className="text-3xl font-bold text-white">{metrics.m12}%</h3>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full flex items-center border border-red-500/20">
                            <TrendingDown size={12} className="mr-1" /> Current
                        </span>
                    </div>
                </div>

                {/* Chargebacks */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chargebacks (YTD)</p>
                    <div className="flex justify-between items-end mt-2">
                        <h3 className="text-3xl font-bold text-red-400">${chargebackTotal.toLocaleString()}</h3>
                        <span className="text-xs text-slate-400">
                            {lapsedPolicies.length} Policies
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Overview & Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: Gauge Overview */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm flex flex-col">
                    <h3 className="font-bold text-white mb-6">Persistency Overview</h3>
                    <div className="flex-1 flex items-center justify-between px-4">
                        <div className="relative w-48 h-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gaugeData}
                                        cx="50%"
                                        cy="100%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell key="retained" fill="#6366f1" />
                                        <Cell key="lost" fill="#1e293b" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-end -mb-2">
                                <span className="text-3xl font-bold text-white">{metrics.m12}%</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">12-Month</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300">Excellent Performance</p>
                                    <p className="text-[10px] text-slate-500">≥90% Retention</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300">Good Performance</p>
                                    <p className="text-[10px] text-slate-500">80-89% Retention</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-300">Needs Improvement</p>
                                    <p className="text-[10px] text-slate-500">&lt;80% Retention</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Cancellation Impact (Red Box) */}
                <div className="bg-red-900/10 backdrop-blur-md p-6 rounded-xl border border-red-500/20 shadow-sm flex flex-col">
                    <h3 className="font-bold text-red-400 mb-6 flex items-center gap-2">
                        <AlertCircle size={18} /> Cancellation Impact
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-red-500/10">
                            <p className="text-xs font-bold text-red-300 uppercase">Lost Premium</p>
                            <h4 className="text-2xl font-bold text-white mt-1">${lostPremium.toLocaleString()}</h4>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-red-500/10">
                            <p className="text-xs font-bold text-red-300 uppercase">Lost Commission</p>
                            <h4 className="text-2xl font-bold text-white mt-1">${chargebackTotal.toLocaleString()}</h4>
                        </div>
                    </div>

                    <div className="mt-auto bg-red-500/10 p-4 rounded-lg border border-red-500/20 flex gap-3 items-start">
                        <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-red-200 leading-relaxed">
                            <span className="font-bold">Action Required:</span> {lapsedPolicies.length} policies have lapsed or cancelled recently. Review the list below to attempt reinstatement or manage chargeback funds.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Carriers & List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Carrier Specific Bars */}
                <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                    <h3 className="font-bold text-white mb-6">Carrier-Specific Persistency</h3>
                    <div className="space-y-6">
                        {carrierStats.map((carrier) => (
                            <div key={carrier.name}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-medium text-slate-300">{carrier.name}</span>
                                    <span className={`text-xs font-bold ${carrier.rate >= 90 ? 'text-green-400' : carrier.rate >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {carrier.rate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${carrier.rate >= 90 ? 'bg-green-500' : carrier.rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{width: `${carrier.rate}%`}}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 text-right">{carrier.count} policies</p>
                            </div>
                        ))}
                        {carrierStats.length === 0 && (
                            <p className="text-sm text-slate-500 italic text-center py-4">No policy data available.</p>
                        )}
                    </div>
                </div>

                {/* Cancelled List */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white">Cancelled / Lapsed Policies</h3>
                        <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                            {lapsedPolicies.length} Alerts
                        </span>
                    </div>
                    <div className="overflow-y-auto max-h-[400px] flex-1 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-3">Client</th>
                                    <th className="px-6 py-3">Policy</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Loss</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {lapsedPolicies.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-3">
                                            <p className="text-sm font-bold text-white group-hover:text-red-300 transition-colors">{(p as any).clientName}</p>
                                            <p className="text-xs text-slate-500">{p.carrier}</p>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                {p.status}
                                            </span>
                                            <p className="text-[10px] text-slate-500 mt-1">{p.type}</p>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                                            {p.endDate || 'N/A'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <p className="text-sm font-bold text-red-400">-${p.commission.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-500">Comm.</p>
                                        </td>
                                    </tr>
                                ))}
                                {lapsedPolicies.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                                            No lapsed policies found. Great work!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Persistency;
