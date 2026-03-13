import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Client, Policy, PolicyStatus, PolicyType, PipelineStage } from '../types';
import { 
    Search, Filter, Edit2, Trash2, 
    BookOpen, Check, Download, X, Save, 
    Calendar, DollarSign, Info, ChevronRight, 
    Plus, Settings2, MoreHorizontal, Eye, EyeOff,
    AlertCircle, FileText, CheckCircle2, User, Clock, ChevronDown
} from 'lucide-react';
import { calculateCommissionExact } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

interface BookOfBusinessProps {
    clients: Client[];
    onUpdateClients: (clients: Client[]) => void;
    onViewClient?: (client: Client) => void;
}

type ColumnId = 'date' | 'client' | 'status' | 'carrier' | 'product' | 'policyNo' | 'monthly' | 'annual' | 'draftDate';

const CarrierLogo: React.FC<{ carrier: string }> = ({ carrier }) => {
    const map: Record<string, { color: string, text: string }> = {
        'Mutual of Omaha': { color: 'bg-green-600', text: 'MO' },
        'Aetna / CVS Health': { color: 'bg-red-600', text: 'A' },
        'Aetna': { color: 'bg-red-600', text: 'A' },
        'Transamerica': { color: 'bg-red-500', text: 'T' },
        'Americo': { color: 'bg-red-700', text: 'A' },
        'Royal Neighbors of America': { color: 'bg-purple-600', text: 'RN' },
        'American Amicable': { color: 'bg-indigo-600', text: 'AA' },
        'Mutual': { color: 'bg-green-600', text: 'M' },
        'Pacific Life': { color: 'bg-blue-600', text: 'P' },
        'Banner Life': { color: 'bg-orange-500', text: 'B' },
    };
    const config = map[carrier] || { color: 'bg-slate-700', text: carrier.substring(0, 1).toUpperCase() };
    return (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${config.color}`}>
            {config.text}
        </div>
    );
};

const StatusBadge: React.FC<{ status: PolicyStatus }> = ({ status }) => {
    const config = {
        [PolicyStatus.ACTIVE]: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        [PolicyStatus.PENDING]: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        [PolicyStatus.APPROVED]: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        [PolicyStatus.CANCELLED]: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        [PolicyStatus.LAPSED]: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        [PolicyStatus.EXPIRED]: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config[status]}`}>
            {status}
        </span>
    );
};

const BookOfBusiness: React.FC<BookOfBusinessProps> = ({ clients, onUpdateClients, onViewClient }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CANCELLED'>('ALL');
    
    // Filtering State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<PolicyType[]>([]);
    const [minPremium, setMinPremium] = useState<string>('');
    const [maxPremium, setMaxPremium] = useState<string>('');
    
    const [isEditColumnsOpen, setIsEditColumnsOpen] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Record<ColumnId, boolean>>({
        date: true, client: true, status: true, carrier: true, product: true,
        policyNo: true, monthly: true, annual: true, draftDate: true
    });

    const filterRef = useRef<HTMLDivElement>(null);

    // Add Deal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDeal, setNewDeal] = useState({
        firstName: '', lastName: '', phone: '', carrier: '', 
        product: '', premium: '', status: PolicyStatus.PENDING,
        policyNumber: '', policyDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (col: ColumnId) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const bookEntries = useMemo(() => {
        return clients.flatMap(client => 
            client.policies.map(policy => ({
                id: `${client.id}-${policy.id}`,
                client,
                policy
            }))
        );
    }, [clients]);

    // Unique carriers for filter list
    const uniqueCarriers = useMemo(() => {
        return Array.from(new Set(bookEntries.map(e => e.policy.carrier))).sort();
    }, [bookEntries]);

    const filteredEntries = useMemo(() => {
        return bookEntries.filter(entry => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                entry.client.firstName.toLowerCase().includes(searchLower) ||
                entry.client.lastName.toLowerCase().includes(searchLower) ||
                entry.policy.policyNumber.toLowerCase().includes(searchLower) ||
                entry.policy.carrier.toLowerCase().includes(searchLower);
            
            const matchesTab = 
                activeTab === 'ALL' || 
                (activeTab === 'ACTIVE' && entry.policy.status === PolicyStatus.ACTIVE) ||
                (activeTab === 'PENDING' && entry.policy.status === PolicyStatus.PENDING) ||
                (activeTab === 'CANCELLED' && (entry.policy.status === PolicyStatus.CANCELLED || entry.policy.status === PolicyStatus.LAPSED));

            const matchesCarrier = selectedCarriers.length === 0 || selectedCarriers.includes(entry.policy.carrier);
            const matchesType = selectedTypes.length === 0 || selectedTypes.includes(entry.policy.type);
            
            const prem = entry.policy.premium;
            const matchesMinPrem = minPremium === '' || prem >= parseFloat(minPremium);
            const matchesMaxPrem = maxPremium === '' || prem <= parseFloat(maxPremium);

            return matchesSearch && matchesTab && matchesCarrier && matchesType && matchesMinPrem && matchesMaxPrem;
        });
    }, [bookEntries, searchTerm, activeTab, selectedCarriers, selectedTypes, minPremium, maxPremium]);

    const handleAddDeal = () => {
        if (!newDeal.firstName || !newDeal.lastName || !newDeal.carrier) return;

        const clientId = `c-new-${Date.now()}`;
        const policyId = `p-new-${Date.now()}`;
        const premium = parseFloat(newDeal.premium) || 0;

        const newClient: Client = {
            id: clientId,
            agentId: 'u1', // Default to current user
            firstName: newDeal.firstName,
            lastName: newDeal.lastName,
            email: '',
            phone: newDeal.phone,
            address: '',
            policies: [{
                id: policyId,
                type: PolicyType.TERM,
                policyNumber: newDeal.policyNumber || 'PENDING',
                carrier: newDeal.carrier,
                productName: newDeal.product,
                premium: premium,
                coverageAmount: 0,
                commission: premium * 0.8,
                startDate: newDeal.policyDate,
                endDate: '',
                status: newDeal.status,
                submittedDate: newDeal.policyDate, // Renamed and synced
                draftDate: newDeal.policyDate // Synchronized
            }],
            notes: 'Added via Book of Business',
            pipelineStage: PipelineStage.NEW_LEAD,
            leadSource: 'Manual',
            lastContactDate: new Date().toISOString().split('T')[0]
        };

        onUpdateClients([newClient, ...clients]);
        setIsAddModalOpen(false);
        setNewDeal({ firstName: '', lastName: '', phone: '', carrier: '', product: '', premium: '', status: PolicyStatus.PENDING, policyNumber: '', policyDate: new Date().toISOString().split('T')[0] });
    };

    const isNearDraft = (dateStr?: string) => {
        if (!dateStr) return false;
        const [y, m, d] = dateStr.split('-').map(Number);
        const draftDate = new Date(y, m - 1, d);
        const now = new Date();
        const diffTime = draftDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    };

    const resetFilters = () => {
        setSelectedCarriers([]);
        setSelectedTypes([]);
        setMinPremium('');
        setMaxPremium('');
        setSearchTerm('');
    };

    const hasActiveFilters = selectedCarriers.length > 0 || selectedTypes.length > 0 || minPremium !== '' || maxPremium !== '';

    return (
        <div className="animate-fade-in space-y-6 flex flex-col h-full relative">
            {/* Header Area */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Book of Business</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage and track all active deals and policies.</p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
                >
                    <Plus size={16} /> Add Deal
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-1">
                {(['ALL', 'ACTIVE', 'PENDING', 'CANCELLED'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                            activeTab === tab 
                                ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5' 
                                : 'text-slate-500 border-transparent hover:text-slate-300'
                        }`}
                    >
                        {tab === 'CANCELLED' ? 'CANCELLED / LAPSED' : tab} Deals
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 bg-slate-900 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isFilterOpen || hasActiveFilters ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-white/10 text-slate-400 hover:text-white'}`}
                        >
                            <Filter size={14} /> 
                            Filter
                            {hasActiveFilters && <span className="ml-1 w-2 h-2 bg-indigo-500 rounded-full"></span>}
                        </button>

                        {isFilterOpen && (
                            <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-left">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Advanced Filters</span>
                                    <button onClick={resetFilters} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase underline">Reset</button>
                                </div>
                                <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {/* Carrier Multi-select */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Carriers</label>
                                        <div className="grid grid-cols-1 gap-1">
                                            {uniqueCarriers.map(carrier => (
                                                <label key={carrier} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-3 h-3 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                                                        checked={selectedCarriers.includes(carrier)}
                                                        onChange={() => {
                                                            setSelectedCarriers(prev => 
                                                                prev.includes(carrier) ? prev.filter(c => c !== carrier) : [...prev, carrier]
                                                            );
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-slate-300 group-hover:text-white transition-colors">{carrier}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Policy Type Multi-select */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Product Types</label>
                                        <div className="grid grid-cols-1 gap-1">
                                            {Object.values(PolicyType).map(type => (
                                                <label key={type} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-3 h-3 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                                                        checked={selectedTypes.includes(type)}
                                                        onChange={() => {
                                                            setSelectedTypes(prev => 
                                                                prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                                            );
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-slate-300 group-hover:text-white transition-colors">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Premium Range */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Annual Premium Range</label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-[9px]">$</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Min" 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-4 pr-2 text-[10px] text-white outline-none focus:border-indigo-500"
                                                    value={minPremium}
                                                    onChange={e => setMinPremium(e.target.value)}
                                                />
                                            </div>
                                            <span className="text-slate-600 text-[10px]">-</span>
                                            <div className="relative flex-1">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-[9px]">$</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Max" 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 pl-4 pr-2 text-[10px] text-white outline-none focus:border-indigo-500"
                                                    value={maxPremium}
                                                    onChange={e => setMaxPremium(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-950/50 border-t border-white/5">
                                    <button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full py-2 bg-indigo-600 text-white font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search by client, deal, or policy" 
                            className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setIsEditColumnsOpen(!isEditColumnsOpen)}
                            className={`flex items-center gap-2 px-4 py-2 bg-slate-900 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isEditColumnsOpen ? 'border-indigo-500 text-indigo-400' : 'border-white/10 text-slate-400 hover:text-white'}`}
                        >
                            <Settings2 size={14} /> Edit Column
                        </button>
                        
                        {isEditColumnsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[60] p-2 animate-in fade-in zoom-in-95 origin-top-right">
                                <div className="p-2 border-b border-white/5 mb-1 flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visibility</span>
                                    <button onClick={() => setIsEditColumnsOpen(false)} className="text-slate-500 hover:text-white"><X size={12}/></button>
                                </div>
                                <div className="space-y-1">
                                    {(Object.keys(visibleColumns) as ColumnId[]).map(col => (
                                        <button 
                                            key={col}
                                            onClick={() => toggleColumn(col)}
                                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                                        >
                                            <span className="text-[10px] font-bold text-slate-300 uppercase truncate">{col.replace(/([A-Z])/g, ' $1')}</span>
                                            {visibleColumns[col] ? <Eye size={12} className="text-indigo-400" /> : <EyeOff size={12} className="text-slate-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* High Density Table */}
            <div className="bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden shadow-2xl flex-1 flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-slate-950/80 sticky top-0 z-10 backdrop-blur-md">
                            <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] border-b border-white/5">
                                {visibleColumns.date && <th className="px-6 py-4">Policy Submitted Date</th>}
                                {visibleColumns.client && <th className="px-6 py-4">Client Name</th>}
                                {visibleColumns.status && <th className="px-6 py-4">Status</th>}
                                {visibleColumns.carrier && <th className="px-6 py-4">Carrier</th>}
                                {visibleColumns.product && <th className="px-6 py-4">Product</th>}
                                {visibleColumns.policyNo && <th className="px-6 py-4">Policy No.</th>}
                                {visibleColumns.monthly && <th className="px-6 py-4">Monthly Premium</th>}
                                {visibleColumns.annual && <th className="px-6 py-4">Annual Premium</th>}
                                {visibleColumns.draftDate && <th className="px-6 py-4">Draft Date</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-slate-900/20">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <BookOpen size={48} />
                                            <p className="text-sm font-black uppercase tracking-widest">No matching policies found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((entry) => {
                                    // Match "Submitted" from Applications: use submittedDate falling back to startDate
                                    const submittedDate = entry.policy.submittedDate || entry.policy.startDate;
                                    const nearDraft = isNearDraft(entry.policy.startDate);
                                    
                                    // Local parsing for reliable formatting (prevents 1-day timezone shift)
                                    const [y, m, d] = submittedDate.split('-').map(Number);
                                    const dateObj = new Date(y, m - 1, d);

                                    // Local parsing for Draft Date formatting to ensure it doesn't revert a day behind
                                    const [dy, dm, dd] = entry.policy.startDate.split('-').map(Number);
                                    const draftDateObj = new Date(dy, dm - 1, dd);

                                    return (
                                        <tr 
                                            key={entry.id} 
                                            className="group hover:bg-indigo-500/5 transition-all"
                                        >
                                            {visibleColumns.date && (
                                                <td className="px-6 py-3">
                                                    <div className="text-[10px] font-bold text-slate-300">
                                                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-tight font-medium">
                                                        {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} (EST)
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.client && (
                                                <td className="px-6 py-3">
                                                    <button 
                                                        onClick={() => onViewClient?.(entry.client)}
                                                        className="text-left group/name"
                                                    >
                                                        <div className="text-[11px] font-black text-white uppercase tracking-tight group-hover/name:text-indigo-400 transition-colors flex items-center gap-2">
                                                            {entry.client.firstName} {entry.client.lastName}
                                                            <ChevronRight size={12} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-indigo-500" />
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium">{entry.client.phone}</div>
                                                    </button>
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-6 py-3">
                                                    <StatusBadge status={entry.policy.status} />
                                                </td>
                                            )}
                                            {visibleColumns.carrier && (
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <CarrierLogo carrier={entry.policy.carrier} />
                                                        <span className="text-[10px] font-bold text-slate-300">{entry.policy.carrier}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.product && (
                                                <td className="px-6 py-3">
                                                    <div className="text-[10px] font-medium text-slate-300 truncate max-w-[150px]">
                                                        {entry.policy.productName || entry.policy.type}
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.policyNo && (
                                                <td className="px-6 py-3 font-mono text-[10px] text-slate-400 font-bold">
                                                    {entry.policy.policyNumber}
                                                </td>
                                            )}
                                            {visibleColumns.monthly && (
                                                <td className="px-6 py-3">
                                                    <span className="text-[11px] font-black text-slate-200">${(entry.policy.premium / 12).toFixed(2)}</span>
                                                </td>
                                            )}
                                            {visibleColumns.annual && (
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-black text-slate-200">${entry.policy.premium.toLocaleString()}</span>
                                                        <span title="View Commission Info">
                                                            <Info size={10} className="text-slate-600 hover:text-indigo-400 transition-colors" />
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.draftDate && (
                                                <td className="px-6 py-3">
                                                    <div className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${nearDraft ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                        {nearDraft && <CheckCircle2 size={10} className="animate-pulse" />}
                                                        {draftDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Count */}
                <div className="p-3 bg-slate-950/50 border-t border-white/5 flex justify-between items-center px-6 shrink-0">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Showing {filteredEntries.length} Records</p>
                    <div className="flex gap-4">
                        <button className="p-1 text-slate-600 hover:text-white"><ChevronRight size={14} className="rotate-180" /></button>
                        <button className="p-1 text-slate-600 hover:text-white"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            {/* Add Deal Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-slate-950/95 backdrop-blur-xl">
                    <div className="bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl w-full max-w-xl overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                    <Plus className="text-indigo-500" /> Register New Deal
                                </h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manual Policy Registration</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client First Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Maria"
                                        value={newDeal.firstName}
                                        onChange={e => setNewDeal({...newDeal, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Last Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Lopez"
                                        value={newDeal.lastName}
                                        onChange={e => setNewDeal({...newDeal, lastName: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carrier</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Americo"
                                        value={newDeal.carrier}
                                        onChange={e => setNewDeal({...newDeal, carrier: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. HMS Plus"
                                        value={newDeal.product}
                                        onChange={e => setNewDeal({...newDeal, product: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium (Annual)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0.00"
                                        value={newDeal.premium}
                                        onChange={e => setNewDeal({...newDeal, premium: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newDeal.status}
                                        onChange={(e) => setNewDeal({...newDeal, status: e.target.value as PolicyStatus})}
                                    >
                                        {Object.values(PolicyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Policy Start / Draft</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none [color-scheme:dark]"
                                        value={newDeal.policyDate}
                                        onChange={e => setNewDeal({...newDeal, policyDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleAddDeal}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-900/20 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={20} /> Deploy Policy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookOfBusiness;