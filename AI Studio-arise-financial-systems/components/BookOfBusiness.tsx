
import React, { useState } from 'react';
import { Client, Policy, PolicyStatus, PolicyType } from '../types';
import { 
    Search, Filter, Eye, Edit2, Trash2, 
    BookOpen, Phone, ShieldCheck, MoreHorizontal, Download, X, Save, 
    Calendar, Hash, DollarSign, User, Activity, FileText, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';

interface BookOfBusinessProps {
    clients: Client[];
    onUpdateClients: (clients: Client[]) => void;
}

const BookOfBusiness: React.FC<BookOfBusinessProps> = ({ clients, onUpdateClients }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<{policy: Policy, clientId: string} | null>(null);

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

    // Calculate next renewal (anniversary) based on start date and current date
    const calculateRenewalDate = (startDateStr: string) => {
        const start = new Date(startDateStr);
        const today = new Date();
        const currentYear = today.getFullYear();
        let renewalYear = currentYear;
        
        // Create date for this year's anniversary
        const thisYearAnniversary = new Date(start);
        thisYearAnniversary.setFullYear(currentYear);

        // If anniversary has passed, next renewal is next year
        if (thisYearAnniversary < today) {
            renewalYear = currentYear + 1;
        }

        const nextRenewal = new Date(start);
        nextRenewal.setFullYear(renewalYear);
        
        return nextRenewal.toISOString().split('T')[0];
    };

    // Calculation Helpers for Modal
    const calculateMetrics = () => {
        if (!editingPolicy) return { monthly: 0, commPercent: 0, advance: 0, backend: 0 };
        const { premium, commission } = editingPolicy.policy;
        const monthly = premium / 12;
        const commPercent = premium > 0 ? (commission / premium) * 100 : 0;
        const advance = commission * 0.75;
        const backend = commission * 0.25;
        return { monthly, commPercent, advance, backend };
    };

    const metrics = calculateMetrics();

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-indigo-600" /> Policy Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Servicing, Renewals, and Commission Tracking.</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search client, carrier, or policy #" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Policy Details</th>
                                <th className="px-6 py-4">Annual Premium</th>
                                <th className="px-6 py-4">Renewal Date</th>
                                <th className="px-6 py-4">Commission</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                                        No active policies found.
                                        <br/>
                                        <span className="text-xs">Issued applications will appear here automatically.</span>
                                    </td>
                                </tr>
                            ) : (
                                bookEntries.map(({ client, policy }) => {
                                    const renewalDate = calculateRenewalDate(policy.startDate);
                                    
                                    return (
                                        <tr key={`${client.id}-${policy.id}`} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(client, policy)}>
                                                <div className="font-bold text-slate-800 text-sm hover:text-indigo-600 transition-colors">{client.firstName} {client.lastName}</div>
                                                <div className="text-xs text-gray-500">{client.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(client, policy)}>
                                                <div className="font-medium text-slate-800 text-sm">{policy.carrier}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {policy.productName || policy.type}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-gray-400">#{policy.policyNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(client, policy)}>
                                                <div className="font-bold text-slate-800 text-sm">
                                                    ${policy.premium.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase">/yr</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                                                    <RefreshCw size={14} className="text-indigo-500" />
                                                    {renewalDate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${policy.isPaidOut ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {policy.isPaidOut ? 'PAID' : 'PENDING'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-1 font-medium">
                                                        Est. ${(policy.commission || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center w-fit gap-1">
                                                    <ShieldCheck size={12} /> Active
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit Policy"
                                                        onClick={() => handleEditClick(client, policy)}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePolicy(client.id, policy.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-200/60 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl animate-fade-in ring-1 ring-black/5 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">{getEditingClient()?.firstName} {getEditingClient()?.lastName}</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Servicing & Details</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-6">
                            
                            {/* Top Row: Client Basic Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400"/>
                                        {getEditingClient()?.phone || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Renewal Date</label>
                                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <RefreshCw size={14} className="text-indigo-500"/>
                                        {calculateRenewalDate(editingPolicy.policy.startDate)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Policy Number</label>
                                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <Hash size={14} className="text-gray-400"/>
                                        {editingPolicy.policy.policyNumber}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                        <ShieldCheck size={12} className="mr-1"/>
                                        {editingPolicy.policy.status}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Policy Details Section */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-600" /> Policy Details
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Carrier</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                            value={editingPolicy.policy.carrier}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, carrier: e.target.value}})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Product</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                            value={editingPolicy.policy.productName || ''}
                                            placeholder={editingPolicy.policy.type}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, productName: e.target.value}})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Policy Type</label>
                                        <select
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                            value={editingPolicy.policy.type}
                                            onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, type: e.target.value as PolicyType}})}
                                        >
                                            {Object.values(PolicyType).map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Coverage Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-5 border border-gray-300 rounded p-1.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={editingPolicy.policy.coverageAmount || ''}
                                                onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, coverageAmount: parseFloat(e.target.value) || 0}})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Monthly Premium</label>
                                        <div className="text-sm font-bold text-slate-800 py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
                                            ${metrics.monthly.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Annual Premium</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-5 border border-gray-300 rounded p-1.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={editingPolicy.policy.premium}
                                                onChange={(e) => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, premium: parseFloat(e.target.value) || 0}})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-3">
                                        <label className="text-xs font-medium text-gray-500">Policy Number</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm font-medium text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
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
                                    <hr className="border-gray-100" />
                                    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white rounded text-indigo-600">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Application Document</p>
                                                <p className="text-xs text-gray-500">Attached from original application</p>
                                            </div>
                                        </div>
                                        <a 
                                            href={editingPolicy.policy.documentUrl} 
                                            download="Application_Document.pdf"
                                            className="px-3 py-1.5 bg-white text-indigo-600 text-xs font-bold rounded border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                                        >
                                            <Download size={12} /> Download
                                        </a>
                                    </div>
                                </>
                            )}

                            <hr className="border-gray-100" />

                            {/* Commission Breakdown Section */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-600" /> Commission Tracking
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Total Comm.</label>
                                        <div className="text-lg font-bold text-slate-800">
                                            ${editingPolicy.policy.commission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Advance (Est)</label>
                                        <div className="text-lg font-bold text-green-600">
                                            ${metrics.advance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Backend (Est)</label>
                                        <div className="text-lg font-bold text-blue-600">
                                            ${metrics.backend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Payment Status</label>
                                        <div className={`text-sm font-bold flex items-center gap-1 ${editingPolicy.policy.isPaidOut ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {editingPolicy.policy.isPaidOut ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                                            {editingPolicy.policy.isPaidOut ? 'Paid' : 'Pending'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 pt-2 border-t border-gray-200 mt-2 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Update Commission Status:</span>
                                        <button 
                                            onClick={() => setEditingPolicy({...editingPolicy, policy: {...editingPolicy.policy, isPaidOut: !editingPolicy.policy.isPaidOut}})}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${editingPolicy.policy.isPaidOut ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                                        >
                                            {editingPolicy.policy.isPaidOut ? 'Mark as Pending' : 'Mark as Paid'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                             {/* Notes Section */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Client Notes</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    rows={3}
                                    value={getEditingClient()?.notes || ''} 
                                    readOnly 
                                    placeholder="No notes available."
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSavePolicy}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
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
