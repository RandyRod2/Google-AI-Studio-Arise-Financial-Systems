
import React, { useState } from 'react';
import { Client, Policy, PolicyStatus, PolicyType, TeamMember } from '../types';
import { 
    Search, Filter, Eye, Edit2, Trash2, 
    BookOpen, Phone, ShieldCheck, MoreHorizontal, Download, X, Save, 
    Calendar, Hash, DollarSign, User, Activity, FileText, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import { calculateCommissionExact } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

interface BookOfBusinessProps {
    clients: Client[];
    onUpdateClients: (clients: Client[]) => void;
}

const BookOfBusiness: React.FC<BookOfBusinessProps> = ({ clients, onUpdateClients }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<{policy: Policy, clientId: string} | null>(null);

    // Current User / Agent (Mocked for now, in real app would come from context)
    const [currentUser] = useState<TeamMember>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved)[0] : MOCK_TEAM[0];
        } catch { return MOCK_TEAM[0]; }
    });

    // Flatten clients and policies to get a list of "Book of Business" entries
    // Filter strictly for ACTIVE (Approved) policies
    const bookEntries = clients.flatMap(client => 
        client.policies
            .filter(policy => policy.status === PolicyStatus.ACTIVE)
            .map(policy => ({
                client,
                policy
            }))
    ).filter(entry => {
        const searchLower = searchTerm.toLowerCase();
        return (
            entry.client.firstName.toLowerCase().includes(searchLower) ||
            entry.client.lastName.toLowerCase().includes(searchLower) ||
            entry.policy.policyNumber.toLowerCase().includes(searchLower) ||
            entry.policy.carrier.toLowerCase().includes(searchLower)
        );
    });

    const handleDeletePolicy = (clientId: string, policyId: string) => {
        if (!window.confirm("Are you sure you want to remove this policy from your Book of Business?")) return;

        const updatedClients = clients.map(c => {
            if (c.id === clientId) {
                return {
                    ...c,
                    policies: c.policies.filter(p => p.id !== policyId)
                };
            }
            return c;
        });
        onUpdateClients(updatedClients);
    };

    const handleEditClick = (client: Client, policy: Policy) => {
        setEditingPolicy({ policy: { ...policy }, clientId: client.id });
        setIsEditModalOpen(true);
    };

    const handleSavePolicy = () => {
        if (!editingPolicy) return;

        const { policy: updatedPolicy, clientId } = editingPolicy;
        
        const updatedClients = clients.map(c => {
            if (c.id === clientId) {
                return {
                    ...c,
                    policies: c.policies.map(p => p.id === updatedPolicy.id ? updatedPolicy : p)
                };
            }
            return c;
        });

        onUpdateClients(updatedClients);
        setIsEditModalOpen(false);
        setEditingPolicy(null);
    };

    const getEditingClient = () => {
        return clients.find(c => c.id === editingPolicy?.clientId);
    };

    // Calculate renewal date: 1 Year from Start Date
    const calculateRenewalDate = (startDateStr: string) => {
        if (!startDateStr) return 'N/A';
        const start = new Date(startDateStr);
        start.setFullYear(start.getFullYear() + 1);
        return start.toISOString().split('T')[0];
    };

    // Calculation Helpers for Modal
    const calculateMetrics = () => {
        if (!editingPolicy) return { monthly: 0, commPercent: 0, advance: 0, backend: 0, totalComm: 0 };
        const { premium } = editingPolicy.policy;
        const monthly = premium / 12;

        const carrier = editingPolicy.policy.carrier;
        const compLevel = currentUser.carrierCompLevels?.[carrier] || currentUser.defaultCompLevel;
        const commData = calculateCommissionExact(carrier, editingPolicy.policy.productName || '', premium, compLevel);
        const totalComm = commData.total;

        const commPercent = commData.fycRate * 100;
        const advance = totalComm * 0.75;
        const backend = totalComm * 0.25;
        return { monthly, commPercent, advance, backend, totalComm };
    };

    const metrics = calculateMetrics();

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-blue-500" /> Policy Management
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Servicing, Renewals, and Commission Tracking.</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search client, carrier, or policy #" 
                            className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-slate-900 text-white placeholder-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Policy Details</th>
                                <th className="px-6 py-4">Annual Premium</th>
                                <th className="px-6 py-4">Renewal Date</th>
                                <th className="px-6 py-4">Commission</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {bookEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                                        No active policies found.
                                        <br/>
                                        <span className="text-xs">Issued applications will appear here automatically.</span>
                                    </td>
                                </tr>
                            ) : (
                                bookEntries.map(({ client, policy }) => {
                                    const renewalDate = calculateRenewalDate(policy.startDate);
                                    
                                    return (
                                        <tr key={`${client.id}-${policy.id}`} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(client, policy)}>
                                                <div className="font-bold text-white text-sm hover:text-blue-400 transition-colors">{client.firstName} {client.lastName}</div>
                                                <div className="text-xs text-slate-500">{client.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(client, policy)}>
                                                <div className="font-medium text-white text-sm">{policy.carrier}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                                        {policy.productName || policy.type}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-500">#{policy.policyNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(client, policy)}>
                                                <div className="font-bold text-white text-sm">
                                                    ${policy.premium.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase">/yr</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-300 font-medium">
                                                    <RefreshCw size={14} className="text-blue-500" />
                                                    {renewalDate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${policy.isPaidOut ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                        {policy.isPaidOut ? 'PAID' : 'PENDING'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 mt-1 font-medium">
                                                        Est. ${(policy.commission || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 flex items-center w-fit gap-1 border border-green-500/20">
                                                    <ShieldCheck size={12} /> Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded"
                                                        title="Edit Policy"
                                                        onClick={() => handleEditClick(client, policy)}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePolicy(client.id, policy.id)}
                                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                                                        title="Remove from Book"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Policy Modal - Detailed View */}
            {isEditModalOpen && editingPolicy && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl animate-fade-in ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-white">{getEditingClient()?.firstName} {getEditingClient()?.lastName}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Servicing & Details</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-6">
                            
                            {/* Top Row: Client Basic Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Phone size={14} className="text-slate-500"/>
                                        {getEditingClient()?.phone || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Renewal Date</label>
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        <RefreshCw size={14} className="text-blue-500"/>
                                        {calculateRenewalDate(editingPolicy.policy.startDate)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Policy Number</label>
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Hash size={14} className="text-slate-500"/>
                                        {editingPolicy.policy.policyNumber}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                        <ShieldCheck size={12} className="mr-1"/>
                                        {editingPolicy.policy.status}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                            {/* Policy Details Section */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" /> Policy Details
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Carrier</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                            value={editingPolicy.policy.carrier}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, carrier: e.target.value}})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Product</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                            value={editingPolicy.policy.productName || ''}
                                            placeholder={editingPolicy.policy.type}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, productName: e.target.value}})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Policy Type</label>
                                        <select
                                            className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                            value={editingPolicy.policy.type}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, type: e.target.value as PolicyType}})}
                                        >
                                            {Object.values(PolicyType).map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Coverage Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-5 border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={editingPolicy.policy.coverageAmount || ''}
                                                onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, coverageAmount: parseFloat(e.target.value) || 0}})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Monthly Premium</label>
                                        <div className="text-sm font-bold text-white py-1.5 px-2 bg-slate-800 rounded border border-slate-700">
                                            ${metrics.monthly.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Annual Premium</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-5 border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={editingPolicy.policy.premium}
                                                onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, premium: parseFloat(e.target.value) || 0}})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-3">
                                        <label className="text-xs font-medium text-slate-500">Policy Number</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                            value={editingPolicy.policy.policyNumber || ''}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, policyNumber: e.target.value}})}
                                            placeholder="Pending"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Attached Document Section */}
                            {editingPolicy.policy.documentUrl && (
                                <>
                                    <hr className="border-slate-800" />
                                    <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-slate-900 rounded text-blue-500">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Application Document</p>
                                                <p className="text-xs text-slate-500">Attached from original application</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={editingPolicy.policy.documentUrl} 
                                            download="Application_Document.pdf"
                                            className="px-3 py-1.5 bg-slate-900 text-blue-400 text-xs font-bold rounded border border-slate-700 hover:bg-slate-800 flex items-center gap-1"
                                        >
                                            <Download size={12} /> Download
                                        </a>
                                    </div>
                                </>
                            )}

                            <hr className="border-slate-800" />

                            {/* Commission Breakdown Section */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-400" /> Commission Tracking
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Total Comm.</label>
                                        <div className="text-lg font-bold text-white">
                                            ${metrics.totalComm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Advance (Est)</label>
                                        <div className="text-lg font-bold text-green-400">
                                            ${metrics.advance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Backend (Est)</label>
                                        <div className="text-lg font-bold text-blue-400">
                                            ${metrics.backend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Payment Status</label>
                                        <div className={`text-sm font-bold flex items-center gap-1 ${editingPolicy.policy.isPaidOut ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {editingPolicy.policy.isPaidOut ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                                            {editingPolicy.policy.isPaidOut ? 'Paid' : 'Pending'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-800 mt-2 flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Update Commission Status:</span>
                                        <button 
                                            onClick={() => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, isPaidOut: !editingPolicy.policy.isPaidOut}})}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${editingPolicy.policy.isPaidOut ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                                        >
                                            {editingPolicy.policy.isPaidOut ? 'Mark as Pending' : 'Mark as Paid'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                             {/* Notes Section */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Client Notes</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white"
                                    rows={3}
                                    value={getEditingClient()?.notes || ''} 
                                    readOnly 
                                    placeholder="No notes available."
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSavePolicy}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                            >
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookOfBusiness;
