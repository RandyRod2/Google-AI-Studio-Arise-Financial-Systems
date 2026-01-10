
import React, { useState, useEffect, useMemo } from 'react';
import { getAuditLogs, clearAuditVault } from '../services/auditService';
import { AuditLog } from '../types';
import { 
    ShieldAlert, Search, Filter, Clock, User, 
    ShieldCheck, AlertCircle, Terminal, Trash2,
    ArrowUpDown, ChevronRight, Activity, Database,
    Info, Download, Eye, Zap
} from 'lucide-react';

const SecurityAudit: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MED' | 'LOW'>('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        refreshLogs();
        
        // Listen for new logs broadcasted from services
        const handleNewLog = () => refreshLogs();
        window.addEventListener('arise-audit-broadcast', handleNewLog);
        return () => window.removeEventListener('arise-audit-broadcast', handleNewLog);
    }, []);

    const refreshLogs = () => {
        setIsRefreshing(true);
        const data = getAuditLogs();
        setLogs(data);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesRisk = true;
            if (riskFilter === 'HIGH') matchesRisk = log.riskScore >= 8;
            if (riskFilter === 'MED') matchesRisk = log.riskScore >= 4 && log.riskScore < 8;
            if (riskFilter === 'LOW') matchesRisk = log.riskScore < 4;

            return matchesSearch && matchesRisk;
        });
    }, [logs, searchTerm, riskFilter]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(l => l.timestamp.startsWith(today));
        return {
            total: logs.length,
            today: todayLogs.length,
            highRisk: logs.filter(l => l.riskScore >= 8).length,
            systemEntropy: (logs.length / 5000) * 100
        };
    }, [logs]);

    const getRiskColor = (score: number) => {
        if (score >= 8) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
        if (score >= 4) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    };

    return (
        <div className="animate-fade-in space-y-6 flex flex-col h-full">
            {/* Header / Stats Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Capacity</p>
                    <div className="flex items-end justify-between">
                        <h3 className="text-2xl font-black text-white">{stats.total} <span className="text-xs text-slate-500 font-bold">/ 5000</span></h3>
                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-indigo-500" style={{ width: `${stats.systemEntropy}%` }} />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Critical Events</p>
                    <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-rose-500">{stats.highRisk}</h3>
                        <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
                    </div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Logs Today</p>
                    <h3 className="text-2xl font-black text-emerald-400">+{stats.today}</h3>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Status</p>
                        <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            Synchronized
                        </span>
                    </div>
                    <button onClick={refreshLogs} className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                        <Activity size={16} className="text-indigo-400" />
                    </button>
                </div>
            </div>

            {/* Terminal View Container */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl flex-1 flex flex-col overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-6 border-b border-white/5 bg-slate-950/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input 
                            type="text" 
                            placeholder="SEARCH SYSTEM LEDGER (ACTOR, ENTITY, ACTION)..."
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-700 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-950 p-1 rounded-xl border border-white/5 flex gap-1">
                            {(['ALL', 'HIGH', 'MED', 'LOW'] as const).map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setRiskFilter(f)}
                                    className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${riskFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                    {f} Risk
                                </button>
                            ))}
                        </div>
                        <button onClick={clearAuditVault} className="p-3 text-slate-600 hover:text-rose-500 transition-colors" title="Purge Vault">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Ledger Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 sticky top-0 z-10">
                            <tr className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-5">Timestamp (ISO_8601)</th>
                                <th className="px-6 py-5">Actor_Identity</th>
                                <th className="px-6 py-5">Action_Node</th>
                                <th className="px-6 py-5">Entity_Target</th>
                                <th className="px-6 py-5">Risk_LVL</th>
                                <th className="px-8 py-5 text-right">Artifacts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Terminal size={48} />
                                            <p className="text-sm font-black uppercase tracking-[0.4em]">Vault Synchronized / No Discrepancies Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-indigo-500/5 transition-all group">
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <Clock size={12} className="text-slate-700" />
                                                <span className="text-slate-500">{log.timestamp}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User size={12} className="text-indigo-400/50" />
                                                <span className="text-white font-bold">{log.actorName}</span>
                                                <span className="text-[9px] text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded uppercase">{log.actorRole}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-indigo-400 font-bold uppercase tracking-tight">{log.action}</span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-300 uppercase tracking-tighter">
                                            {log.entity}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md border font-black ${getRiskColor(log.riskScore)}`}>
                                                0{log.riskScore}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    className="p-1.5 text-slate-700 hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                                                    onClick={() => alert(`LOG DETAIL:\n\n${log.details}`)}
                                                >
                                                    <Info size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Terminal Status */}
                <div className="p-4 bg-slate-950/80 border-t border-white/5 flex justify-between items-center px-10">
                    <div className="flex gap-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500" /> Security Hash: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                        <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500" /> Read Status: Success</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Page 01 // Total Logs: {stats.total}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityAudit;
