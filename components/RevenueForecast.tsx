
import React, { useMemo } from 'react';
import { Client, RevenueForecast as ForecastType, ForecastPeriod, ConfidenceBand } from '../types';
import { calculateRevenueForecast } from '../services/forecastService';
import { TrendingUp, AlertTriangle, CheckCircle2, Info, Clock, ArrowUpRight, Zap, Target } from 'lucide-react';

interface RevenueForecastProps {
    clients: Client[];
    variant?: 'FULL' | 'WIDGET';
}

const ConfidenceBadge: React.FC<{ band: ConfidenceBand }> = ({ band }) => {
    switch (band) {
        case 'HIGH':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1 shadow-sm shadow-green-900/20"><CheckCircle2 size={10} /> HIGH CONFIDENCE</span>;
        case 'MEDIUM':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 shadow-sm shadow-blue-900/20"><Info size={10} /> MODERATE</span>;
        case 'AT_RISK':
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse shadow-sm shadow-red-900/20"><AlertTriangle size={10} /> AT RISK</span>;
    }
};

const PeriodCard: React.FC<{ period: ForecastPeriod; isWide?: boolean }> = ({ period, isWide }) => {
    const total = period.composition.settled + period.composition.weighted + period.composition.velocity;
    const settledPct = (period.composition.settled / total) * 100;
    const weightedPct = (period.composition.weighted / total) * 100;
    const velocityPct = (period.composition.velocity / total) * 100;

    return (
        <div className={`bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-indigo-500/30 transition-all group flex flex-col justify-between relative overflow-hidden h-full`}>
            {/* Confidence Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
                period.confidence === 'HIGH' ? 'bg-green-500' : 
                period.confidence === 'MEDIUM' ? 'bg-indigo-500' : 'bg-red-500'
            }`} />

            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{period.label}</p>
                        <h3 className="text-3xl font-black text-white mt-1">${period.projectedPremium.toLocaleString()}</h3>
                    </div>
                    <ConfidenceBadge band={period.confidence} />
                </div>

                <div className="space-y-4">
                    {/* Composition Bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>Premium DNA</span>
                            <span className="text-slate-400">Projected Return</span>
                        </div>
                        <div className="h-3 w-full bg-slate-950 rounded-lg overflow-hidden flex border border-white/5">
                            <div className="h-full bg-indigo-500 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.2)]" style={{ width: `${settledPct}%` }} title={`Settled: $${period.composition.settled.toLocaleString()}`} />
                            <div className="h-full bg-blue-400 opacity-60" style={{ width: `${weightedPct}%` }} title={`Pipeline: $${period.composition.weighted.toLocaleString()}`} />
                            <div className="h-full bg-slate-700 opacity-30" style={{ width: `${velocityPct}%` }} title={`Velocity: $${period.composition.velocity.toLocaleString()}`} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-slate-600 uppercase">Settled</p>
                            <p className="text-xs font-black text-white">${(period.composition.settled / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="text-center border-x border-white/5">
                            <p className="text-[9px] font-bold text-slate-600 uppercase">Weighted</p>
                            <p className="text-xs font-black text-slate-300">${(period.composition.weighted / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-slate-600 uppercase">Activity</p>
                            <p className="text-xs font-black text-slate-500">${(period.composition.velocity / 1000).toFixed(1)}k</p>
                        </div>
                    </div>
                </div>
            </div>

            {period.confidence === 'AT_RISK' && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                    <Zap size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-300 leading-relaxed font-medium">
                        Horizon threatened by recent activity drop. Increase dials by 25% to recover trajectory.
                    </p>
                </div>
            )}
        </div>
    );
};

const RevenueForecast: React.FC<RevenueForecastProps> = ({ clients, variant = 'FULL' }) => {
    const forecast = useMemo(() => calculateRevenueForecast(clients), [clients]);

    if (variant === 'WIDGET') {
        return (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Clock size={16} className="text-indigo-400" /> 30-Day Revenue Horizon
                    </h3>
                    <ConfidenceBadge band={forecast.d30.confidence} />
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-1">
                        ${forecast.d30.projectedPremium.toLocaleString()}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp size={12} /> Projected Premium Value
                    </p>

                    <div className="mt-8 space-y-4">
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5">
                            <div className="h-full bg-indigo-500" style={{ width: `${(forecast.d30.composition.settled / forecast.d30.projectedPremium) * 100}%` }} />
                            <div className="h-full bg-blue-400 opacity-50" style={{ width: `${(forecast.d30.composition.weighted / forecast.d30.projectedPremium) * 100}%` }} />
                            <div className="h-full bg-slate-800" style={{ width: `${(forecast.d30.composition.velocity / forecast.d30.projectedPremium) * 100}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Settled</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400 opacity-50" /> Weighted</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-800" /> Velocity</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target size={24} className="text-indigo-500" /> Revenue Forecast Engine
                    </h3>
                    <p className="text-sm text-slate-400">Actuarial projection based on stage conversion, historicals, and velocity.</p>
                </div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                    <Zap className="text-indigo-400" size={20} fill="currentColor" />
                    <div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">AI Insight</p>
                        <p className="text-xs font-bold text-white leading-none">Pacing for EOM President's Club</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PeriodCard period={forecast.d7} />
                <PeriodCard period={forecast.d30} />
                <PeriodCard period={forecast.d90} />
            </div>

            {/* Explanation / Breakdown */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={14} className="text-indigo-400" /> Actuarial Methodology
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white">Weighted Pipeline</p>
                            <p className="text-xs text-slate-400 leading-relaxed">Applies probability multipliers to your CRM stages (e.g., 85% for Underwriting, 20% for Appointments).</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white">Activity Velocity</p>
                            <p className="text-xs text-slate-400 leading-relaxed">Projects revenue based on your 7-day trailing dial-to-contact ratios and historical premium per contact.</p>
                        </div>
                    </div>
                </div>
                <div className="w-px bg-white/5 hidden md:block" />
                <div className="flex-1">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-green-500" /> Horizon Drivers
                    </h4>
                    <ul className="space-y-3">
                        <li className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Current PPD (Premium per Dial)</span>
                            <span className="font-bold text-white">$14.20</span>
                        </li>
                        <li className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">7-Day Momentum Factor</span>
                            <span className="font-bold text-green-400">+12.5%</span>
                        </li>
                        <li className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Lag Factor (Avg Time-to-Issue)</span>
                            <span className="font-bold text-white">12 Days</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RevenueForecast;
