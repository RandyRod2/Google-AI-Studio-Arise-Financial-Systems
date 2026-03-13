import React, { useState, useEffect, useRef } from 'react';
import { generateSaaSUsers, INITIAL_REGISTRY_DATA } from '../services/mockData';
import { SaaSUser, Role, SubscriptionStatus, SubscriptionPlan, CommissionRegistry, CommissionRule } from '../types';
import { 
    Search, Shield, Edit2, Trash2, X, Save, Activity, Lock, 
    AlertTriangle, CheckCircle, Server, CreditCard, ChevronRight,
    TrendingUp, AlertCircle, Download, MoreHorizontal, Filter, Database, Globe,
    DollarSign, Clock, User, Mail, Upload, FileText, Code, Check, ChevronDown, ChevronUp, RefreshCw, Sparkles, Plus
} from 'lucide-react';
import { parseCommissionDocument } from '../services/geminiService';
import { getCommissionRate } from '../services/commissionService';

const PlatformAdmin: React.FC = () => {
    // --- Tabs ---
    const [activeTab, setActiveTab] = useState<'USERS' | 'REGISTRY'>('USERS');

    // --- User Management State ---
    const [users, setUsers] = useState<SaaSUser[]>(() => {
        try {
            const saved = localStorage.getItem('arise_saas_users');
            return saved ? JSON.parse(saved) : generateSaaSUsers(50);
        } catch {
            return generateSaaSUsers(50);
        }
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'ALL'>('ALL'); 
    const [editingUser, setEditingUser] = useState<SaaSUser | null>(null);
    const [editForm, setEditForm] = useState<Partial<SaaSUser>>({});
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // --- Commission Registry State ---
    const [registry, setRegistry] = useState<CommissionRegistry>(() => {
        try {
            const saved = localStorage.getItem('arise_commission_registry');
            return saved ? JSON.parse(saved) : INITIAL_REGISTRY_DATA;
        } catch { return INITIAL_REGISTRY_DATA; }
    });
    const [jsonInput, setJsonInput] = useState(JSON.stringify(registry, null, 2));
    const [viewMode, setViewMode] = useState<'VISUAL' | 'JSON'>('VISUAL');
    const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Rate Editing State (New) ---
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState<{carrier: string, product: string} | null>(null);
    const [levelEntries, setLevelEntries] = useState<{level: string, fyc: string, renewals: string, advanceRate: string, chargebackPeriod: string}[]>([]);

    // Persistence
    useEffect(() => {
        localStorage.setItem('arise_saas_users', JSON.stringify(users));
    }, [users]);

    // Registry Persistence
    const saveRegistry = (newRegistry: CommissionRegistry) => {
        setRegistry(newRegistry);
        setJsonInput(JSON.stringify(newRegistry, null, 2));
        localStorage.setItem('arise_commission_registry', JSON.stringify(newRegistry));
    };

    // --- User Calculations ---
    const totalMRR = users.reduce((acc, u) => acc + (u.status === 'active' ? u.monthlyFee : 0), 0);
    const activeSubscribers = users.filter(u => u.status === 'active').length;
    const pastDueUsers = users.filter(u => u.status === 'past_due');
    const pastDueAmount = pastDueUsers.reduce((acc, u) => acc + u.monthlyFee, 0);
    
    // --- User Actions ---
    const handleEditUser = (user: SaaSUser) => {
        setEditingUser(user);
        setEditForm({ ...user });
        setIsEditModalOpen(true);
    };

    const handleSaveUser = () => {
        if (!editingUser) return;
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editForm } as SaaSUser : u));
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleDeleteUser = (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.agencyName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getRoleColor = (role: string) => {
        switch(role) {
            case 'ADMIN': return 'text-purple-400 font-bold';
            case 'AGENCY_OWNER': return 'text-indigo-400 font-bold';
            case 'MANAGER': return 'text-blue-400 font-medium';
            default: return 'text-slate-400 font-medium';
        }
    };

    // --- Registry Actions ---

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonInput(e.target.value);
    };

    const handleJsonSave = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            saveRegistry(parsed);
            alert('Registry saved successfully!');
        } catch (e) {
            alert('Invalid JSON format. Please check your syntax.');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadSuccess(false);

        try {
            if (file.type === 'application/pdf') {
                // Process with AI
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64String = (reader.result as string).split(',')[1];
                    try {
                        const data = await parseCommissionDocument(base64String, file.type);
                        
                        // Merge with existing registry
                        const mergedRegistry = { ...registry, ...data };
                        saveRegistry(mergedRegistry);
                        
                        setIsUploading(false);
                        setUploadSuccess(true);
                        setTimeout(() => setUploadSuccess(false), 3000);
                    } catch (aiError) {
                        console.error("AI Processing failed", aiError);
                        alert("AI Processing Failed. Please try a clearer PDF or check API key.");
                        setIsUploading(false);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                // Existing CSV logic
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    processCSV(text);
                    setIsUploading(false);
                    setUploadSuccess(true);
                    setTimeout(() => setUploadSuccess(false), 3000);
                };
                reader.readAsText(file);
            }
        } catch (error) {
            console.error("Upload failed", error);
            setIsUploading(false);
            alert("Failed to process document. Please try again.");
        }
    };

    const processCSV = (csvText: string) => {
        const lines = csvText.split(/\r\n|\n/);
        const newRegistry = { ...registry }; // Merge with existing

        lines.forEach((line, index) => {
            if (index === 0) return; // Skip header
            if (!line.trim()) return;

            const cols = line.split(',');
            if (cols.length < 4) return;

            const carrier = cols[0].trim();
            const product = cols[1].trim();
            const level = cols[2].trim(); // e.g. "100"
            const fyc = parseFloat(cols[3].trim());
            const renewals = cols[4] ? parseFloat(cols[4].trim()) : 0;

            if (!newRegistry[carrier]) newRegistry[carrier] = {};
            if (!newRegistry[carrier][product]) newRegistry[carrier][product] = {};

            newRegistry[carrier][product][level] = {
                fyc,
                renewals,
                advanceRate: '75%',
                chargebackPeriod: '9mo'
            };
        });

        saveRegistry(newRegistry);
    };

    const toggleCarrier = (carrier: string) => {
        setExpandedCarrier(expandedCarrier === carrier ? null : carrier);
    };

    const deleteCarrier = (carrier: string) => {
        if (confirm(`Delete all data for ${carrier}?`)) {
            const newReg = { ...registry };
            delete newReg[carrier];
            saveRegistry(newReg);
        }
    };

    // --- Rate Configuration Logic ---

    const sortEntries = (entries: typeof levelEntries) => {
        return [...entries].sort((a, b) => Number(a.level) - Number(b.level));
    };

    // Define standard view levels
    const standardLevelsView = Array.from({ length: 14 }, (_, i) => 80 + i * 5); // [80, 85, ..., 145]

    const openRateModal = (carrier: string, product: string) => {
        // 1. Identify all relevant levels
        const existingLevels = Object.keys(registry[carrier][product]).map(Number);
        const standardLevels = Array.from({ length: 14 }, (_, i) => 80 + i * 5);
        const allLevels = Array.from(new Set([...existingLevels, ...standardLevels])).sort((a, b) => a - b);

        // 2. Map levels to entries
        const entries = allLevels.map(level => {
            const rate = getCommissionRate(carrier, product, level, registry);
            
            return {
                level: level.toString(),
                fyc: (rate.fyc * 100).toFixed(2),
                renewals: (rate.renewals * 100).toFixed(2),
                advanceRate: rate.advanceRate || '75%',
                chargebackPeriod: rate.chargebackPeriod || '9mo'
            };
        });
        
        setEditingTarget({ carrier, product });
        setLevelEntries(entries);
        setIsRateModalOpen(true);
    };

    const handleSaveRates = () => {
        if (!editingTarget) return;

        const { carrier, product } = editingTarget;
        const newProductRules: Record<string, any> = {};

        levelEntries.forEach(entry => {
            const lvl = parseInt(entry.level);
            const fyc = parseFloat(entry.fyc);
            const ren = parseFloat(entry.renewals);

            if (!isNaN(lvl) && !isNaN(fyc) && !isNaN(ren)) {
                newProductRules[lvl.toString()] = {
                    fyc: fyc / 100,
                    renewals: ren / 100,
                    advanceRate: entry.advanceRate,
                    chargebackPeriod: entry.chargebackPeriod
                };
            }
        });

        const updatedRegistry = { ...registry };
        if (!updatedRegistry[carrier]) updatedRegistry[carrier] = {};
        updatedRegistry[carrier][product] = newProductRules;

        saveRegistry(updatedRegistry);
        setIsRateModalOpen(false);
        setEditingTarget(null);
    };

    const handleAddLevelRow = () => {
        setLevelEntries(sortEntries([...levelEntries, { level: '', fyc: '0', renewals: '0', advanceRate: '75%', chargebackPeriod: '9mo' }]));
    };

    const handleDeleteLevel = (index: number) => {
        const newEntries = [...levelEntries];
        newEntries.splice(index, 1);
        setLevelEntries(newEntries);
    };

    const updateLevelEntry = (index: number, field: keyof typeof levelEntries[0], value: string) => {
        const newEntries = [...levelEntries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setLevelEntries(newEntries); 
    };

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-indigo-500" /> Platform Administration
                    </h2>
                    <p className="text-sm text-slate-400">Super Admin Console</p>
                </div>
                
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-sm flex">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'USERS' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <User size={16} /> User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('REGISTRY')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'REGISTRY' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <Database size={16} /> Commission Registry
                    </button>
                </div>
            </div>

            {activeTab === 'USERS' && (
                <div className="space-y-6 animate-fade-in">
                    {pastDueUsers.length > 0 && (
                        <div 
                            onClick={() => setStatusFilter(statusFilter === 'past_due' ? 'ALL' : 'past_due')}
                            className={`bg-red-900/10 border border-red-900/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md ${statusFilter === 'past_due' ? 'ring-2 ring-red-500/30' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-900/20 rounded-full text-red-500 shadow-sm border border-red-500/10">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-400 text-sm">Payment Failures Detected</h3>
                                    <p className="text-red-300 text-xs mt-0.5">
                                        There are <span className="font-bold">{pastDueUsers.length}</span> accounts with failed payments this cycle. Immediate action required.
                                    </p>
                                </div>
                            </div>
                            <button 
                                className="px-4 py-2 bg-slate-900 border border-red-900/30 text-red-400 text-xs font-bold rounded-lg hover:bg-red-900/20 transition-colors shadow-sm whitespace-nowrap"
                            >
                                {statusFilter === 'past_due' ? 'Clear Filter' : 'Review Failed Accounts \u2192'}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total MRR</p>
                                    <h3 className="text-3xl font-bold text-white mt-2">${totalMRR.toLocaleString()}</h3>
                                </div>
                                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                    <DollarSign size={24} className="text-indigo-400" />
                                </div>
                            </div>
                            <p className="text-xs text-green-400 font-bold mt-2 flex items-center">
                                <TrendingUp size={12} className="mr-1" /> +8.4% this month
                            </p>
                        </div>

                        <div 
                            onClick={() => setStatusFilter(statusFilter === 'active' ? 'ALL' : 'active')}
                            className={`bg-slate-900 p-6 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${statusFilter === 'active' ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-900/10' : 'border-slate-800'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Subscribers</p>
                                    <h3 className="text-3xl font-bold text-white mt-2">{activeSubscribers.toLocaleString()}</h3>
                                </div>
                                <div className={`p-2 rounded-lg ${statusFilter === 'active' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    <Activity size={24} className={statusFilter === 'active' ? 'text-white' : 'text-slate-400'} />
                                </div>
                            </div>
                            <button className="text-xs text-indigo-400 font-medium mt-2 hover:underline">
                                {statusFilter === 'active' ? 'Clear filter' : 'Click to filter view >'}
                            </button>
                        </div>

                        <div 
                            onClick={() => setStatusFilter(statusFilter === 'past_due' ? 'ALL' : 'past_due')}
                            className={`bg-slate-900 p-6 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md ${statusFilter === 'past_due' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-900/10' : 'border-slate-800'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Past Due Accounts</p>
                                    <h3 className="text-3xl font-bold text-orange-500 mt-2">{pastDueUsers.length}</h3>
                                </div>
                                <div className={`p-2 rounded-lg ${statusFilter === 'past_due' ? 'bg-orange-600 text-white' : 'bg-orange-500/10 text-orange-400'}`}>
                                    <AlertCircle size={24} className={statusFilter === 'past_due' ? 'text-white' : 'text-orange-400'} />
                                </div>
                            </div>
                            <p className="text-xs text-orange-500 font-bold mt-2">
                                {statusFilter === 'past_due' ? 'Clear filter' : `$${pastDueAmount.toLocaleString()} at risk >`}
                            </p>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Churn Rate</p>
                                    <h3 className="text-3xl font-bold text-white mt-2">0.8%</h3>
                                </div>
                                <div className="p-2 bg-slate-800 text-slate-400 rounded-lg">
                                    <TrendingUp size={24} className="text-slate-400 transform rotate-180" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Industry Avg: 5.2%
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search users & agencies..." 
                                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-white placeholder-slate-600"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-800">
                                        All Roles
                                    </button>
                                    <select 
                                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'ALL')}
                                    >
                                        <option value="ALL">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="trial">Trial</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3">User Details</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Billing</th>
                                            <th className="px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredUsers.slice(0, 10).map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-800 object-cover border border-slate-700" />
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{user.name}</div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                            {user.agencyName && (
                                                                <div className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5">
                                                                    <Database size={10} /> {user.agencyName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs ${getRoleColor(user.role)}`}>
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                                        ${user.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                                        user.status === 'past_due' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                                        {user.status === 'active' && <CheckCircle size={10} />}
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="font-bold text-white text-sm">${user.monthlyFee}</span>
                                                        <p className="text-[10px] text-slate-500 uppercase">{user.plan}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleEditUser(user)}
                                                        className="text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center justify-end gap-1 ml-auto group-hover:visible"
                                                    >
                                                        Manage <ChevronRight size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="p-8 text-center text-slate-500 italic">No users found matching current filters.</div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-500" /> System Health
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-slate-400"><Server size={14} /> API Gateway</span>
                                        <span className="text-green-400 font-bold text-xs flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> 99.9% Up</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-slate-400"><Database size={14} /> Database</span>
                                        <span className="text-green-400 font-bold text-xs flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Healthy</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-slate-400"><CreditCard size={14} /> Stripe Connect</span>
                                        <span className="text-green-400 font-bold text-xs flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Connected</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'REGISTRY' && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Database size={18} className="text-indigo-500" /> Input Data
                            </h3>
                            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                                <button 
                                    onClick={() => setViewMode('VISUAL')} 
                                    className={`p-1.5 rounded transition-all ${viewMode === 'VISUAL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <FileText size={14} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('JSON')} 
                                    className={`p-1.5 rounded transition-all ${viewMode === 'JSON' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Code size={14} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto">
                            {viewMode === 'VISUAL' ? (
                                <div className="space-y-6">
                                    <div 
                                        className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-900/10 transition-all group text-center"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            {isUploading ? <RefreshCw className="animate-spin" size={24}/> : uploadSuccess ? <Check size={24}/> : <Upload size={24} />}
                                        </div>
                                        <p className="text-sm font-bold text-slate-300">Upload Commission Schedule</p>
                                        <p className="text-xs text-slate-500 mt-1">Supports PDF (AI Extraction) or CSV</p>
                                        
                                        {isUploading && (
                                            <div className="mt-3 flex items-center gap-2 text-indigo-400 text-xs font-bold animate-pulse justify-center">
                                                <Sparkles size={12} /> Reading document with AI...
                                            </div>
                                        )}

                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept=".csv,.pdf"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <textarea 
                                        className="w-full h-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-green-400 outline-none resize-none focus:border-indigo-500 flex-1"
                                        value={jsonInput}
                                        onChange={handleJsonChange}
                                        spellCheck={false}
                                    />
                                    <button 
                                        onClick={handleJsonSave}
                                        className="mt-3 w-full py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700"
                                    >
                                        Save JSON
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                            <h3 className="font-bold text-white">Active Registry</h3>
                            <div className="text-xs text-slate-500">
                                {Object.keys(registry).length} Carriers Configured
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {Object.entries(registry).sort().map(([carrier, products]) => (
                                <div key={carrier} className="border border-slate-800 rounded-xl bg-slate-950/30 overflow-hidden">
                                    <div 
                                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                                        onClick={() => toggleCarrier(carrier)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-white text-slate-900 font-bold flex items-center justify-center text-xs">
                                                {carrier.substring(0,2).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-200">{carrier}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500">{Object.keys(products).length} Products</span>
                                            {expandedCarrier === carrier ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
                                        </div>
                                    </div>
                                    
                                    {expandedCarrier === carrier && (
                                        <div className="border-t border-slate-800 bg-slate-900/50 p-4 space-y-4 animate-fade-in">
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={() => deleteCarrier(carrier)}
                                                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                                                >
                                                    <Trash2 size={12}/> Remove Carrier
                                                </button>
                                            </div>
                                            {Object.entries(products).map(([product, levels]) => (
                                                <div key={product} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">{product}</h4>
                                                        <button 
                                                            onClick={() => openRateModal(carrier, product)}
                                                            className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-700 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                                        >
                                                            <Edit2 size={10} /> Edit Rates
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                        {standardLevelsView.map((level) => {
                                                            const rate = getCommissionRate(carrier, product, level, registry);
                                                            return (
                                                                <div key={level} className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                                                                    <div className="text-[10px] text-slate-500">Lvl {level}</div>
                                                                    <div className="font-bold text-white text-sm">{(rate.fyc * 100).toFixed(0)}%</div>
                                                                    <div className="text-[9px] text-green-500">{(rate.advanceRate)} / {(rate.chargebackPeriod)}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isRateModalOpen && editingTarget && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-[800px] ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-white">{editingTarget.product}</h3>
                                <p className="text-xs text-slate-400">{editingTarget.carrier}</p>
                            </div>
                            <button onClick={() => setIsRateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Defined Contract Levels</h4>
                                    <button 
                                        onClick={handleAddLevelRow}
                                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                    >
                                        <Plus size={12} /> Add Level
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="grid grid-cols-6 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2">
                                        <div>Level</div>
                                        <div>FYC %</div>
                                        <div>Renewals %</div>
                                        <div>Advance %</div>
                                        <div>Chargeback</div>
                                        <div className="text-right">Action</div>
                                    </div>
                                    
                                    {levelEntries.map((entry, idx) => (
                                        <div key={idx} className="grid grid-cols-6 gap-2 items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                                            <input 
                                                type="number" 
                                                className="bg-transparent border-b border-slate-700 text-white text-sm font-bold w-full focus:border-indigo-500 outline-none p-1"
                                                placeholder="e.g. 100"
                                                value={entry.level}
                                                onChange={(e) => updateLevelEntry(idx, 'level', e.target.value)}
                                            />
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    className="bg-transparent border-b border-slate-700 text-white text-sm w-full focus:border-green-500 outline-none p-1 pr-4"
                                                    placeholder="0"
                                                    value={entry.fyc}
                                                    onChange={(e) => updateLevelEntry(idx, 'fyc', e.target.value)}
                                                />
                                                <span className="absolute right-0 top-1.5 text-xs text-slate-500">%</span>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    className="bg-transparent border-b border-slate-700 text-white text-sm w-full focus:border-blue-500 outline-none p-1 pr-4"
                                                    placeholder="0"
                                                    value={entry.renewals}
                                                    onChange={(e) => updateLevelEntry(idx, 'renewals', e.target.value)}
                                                />
                                                <span className="absolute right-0 top-1.5 text-xs text-slate-500">%</span>
                                            </div>
                                            <select 
                                                className="bg-slate-900 border border-slate-700 text-white text-[10px] rounded p-1 outline-none"
                                                value={entry.advanceRate}
                                                onChange={(e) => updateLevelEntry(idx, 'advanceRate', e.target.value)}
                                            >
                                                <option value="Paid as Earned">Paid as Earned</option>
                                                <option value="50%">50%</option>
                                                <option value="75%">75%</option>
                                                <option value="100%">100%</option>
                                            </select>
                                            <select 
                                                className="bg-slate-900 border border-slate-700 text-white text-[10px] rounded p-1 outline-none"
                                                value={entry.chargebackPeriod}
                                                onChange={(e) => updateLevelEntry(idx, 'chargebackPeriod', e.target.value)}
                                            >
                                                <option value="6mo">6mo</option>
                                                <option value="9mo">9mo</option>
                                                <option value="12mo">12mo</option>
                                            </select>
                                            <div className="text-right">
                                                <button 
                                                    onClick={() => handleDeleteLevel(idx)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex justify-end gap-3 shrink-0">
                            <button 
                                onClick={() => setIsRateModalOpen(false)}
                                className="px-4 py-2 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveRates}
                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                            >
                                <Save size={16} /> Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden flex flex-col max-h-[90vh] border border-slate-800">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Edit2 size={18} className="text-indigo-500" /> Edit User
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Profile Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                        <div className="relative">
                                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input 
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                                value={editForm.name || ''}
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input 
                                                type="email"
                                                className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                                value={editForm.email || ''}
                                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex justify-end gap-3 shrink-0">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveUser}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformAdmin;
