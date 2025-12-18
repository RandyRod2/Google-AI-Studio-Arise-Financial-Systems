
import React, { useState, useRef, useEffect } from 'react';
import { Application, Client, TeamMember } from '../types';
import { FileText, Filter, Download, CheckCircle, XCircle, MoreHorizontal, Edit2, Trash2, X, Save, Phone, Calendar, Hash, ShieldCheck, DollarSign, Upload, Eye, ChevronDown, Plus } from 'lucide-react';
import { calculateCommissionExact, getAvailableCarriers, getAvailableProducts } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

// Helper for local date string
const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface ApplicationsProps {
    applications: Application[];
    clients: Client[];
    onUpdateApplication: (application: Application) => void;
    onAddApplication: (application: Application) => void;
    onDeleteApplication: (appId: string) => void;
}

const Applications: React.FC<ApplicationsProps> = ({ applications, clients, onUpdateApplication, onAddApplication, onDeleteApplication }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<Application | null>(null);
    
    // Form State
    const [newApp, setNewApp] = useState<Partial<Application>>({
        status: 'Submitted',
        submittedDate: getLocalToday(),
        policyStartDate: getLocalToday()
    });
    const [monthlyInput, setMonthlyInput] = useState<string>(''); // Local state for monthly input string
    
    // Dynamic Carrier/Product options
    const [carrierOptions, setCarrierOptions] = useState<string[]>([]);
    const [productOptions, setProductOptions] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Current User / Agent (Mocked for now, in real app would come from context)
    // We'll use the first user in MOCK_TEAM as the "current user" to determine comp level
    const [currentUser] = useState<TeamMember>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved)[0] : MOCK_TEAM[0];
        } catch { return MOCK_TEAM[0]; }
    });

    useEffect(() => {
        setCarrierOptions(getAvailableCarriers());
    }, []);

    // Update product options when carrier changes
    useEffect(() => {
        if (newApp.carrier) {
            setProductOptions(getAvailableProducts(newApp.carrier));
        }
    }, [newApp.carrier]);

    useEffect(() => {
        if (editingApp?.carrier) {
            setProductOptions(getAvailableProducts(editingApp.carrier));
        }
    }, [editingApp?.carrier]);

    const handleEditClick = (app: Application) => {
        setEditingApp({ ...app });
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        if (editingApp) {
            // Sanitize inputs to ensure no NaN values are saved
            const finalApp = {
                ...editingApp,
                premium: isNaN(editingApp.premium) ? 0 : editingApp.premium,
                coverageAmount: editingApp.coverageAmount && isNaN(editingApp.coverageAmount) ? 0 : editingApp.coverageAmount
            };
            onUpdateApplication(finalApp);
            setIsEditModalOpen(false);
            setEditingApp(null);
        }
    };

    const openAddModal = () => {
        setNewApp({ 
            status: 'Submitted', 
            submittedDate: getLocalToday(),
            policyStartDate: getLocalToday()
        });
        setMonthlyInput('');
        setIsAddModalOpen(true);
    };

    const handleAdd = () => {
        if (!newApp.clientId || !newApp.carrier || !newApp.product) return;
        
        // Find client name for display optimization (though data model ideally just uses ID)
        const client = clients.find(c => c.id === newApp.clientId);
    
        const app: Application = {
            id: `app-${Date.now()}`,
            clientId: newApp.clientId,
            clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
            carrier: newApp.carrier,
            product: newApp.product,
            policyNumber: newApp.policyNumber,
            submittedDate: newApp.submittedDate || getLocalToday(),
            policyStartDate: newApp.policyStartDate,
            premium: newApp.premium || 0,
            coverageAmount: newApp.coverageAmount || 0,
            status: newApp.status as any || 'Submitted',
            notes: newApp.notes || ''
        };
        
        onAddApplication(app);
        setIsAddModalOpen(false);
        setNewApp({ status: 'Submitted', submittedDate: getLocalToday() });
        setMonthlyInput('');
    };

    const handleStatusChange = (app: Application, newStatus: Application['status']) => {
        onUpdateApplication({ ...app, status: newStatus });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingApp) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingApp({ ...editingApp, documentUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Auto-Calculation Handlers ---
    
    const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMonthlyInput(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setNewApp(prev => ({ ...prev, premium: num * 12 }));
        } else {
            setNewApp(prev => ({ ...prev, premium: 0 }));
        }
    };

    const handleAnnualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setNewApp(prev => ({ ...prev, premium: val }));
        if (!isNaN(val)) {
            setMonthlyInput((val / 12).toFixed(2));
        } else {
            setMonthlyInput('');
        }
    };

    const getClientDetails = (clientId: string) => {
        return clients.find(c => c.id === clientId);
    };

    // Helper calculations for modal
    const calculateMetrics = () => {
        if (!editingApp) return { monthly: 0, commPercent: 0, advance: 0, backend: 0, totalComm: 0 };
        const premium = isNaN(editingApp.premium) ? 0 : editingApp.premium;
        const monthly = premium / 12;
        
        // --- DYNAMIC COMMISSION CALCULATION ---
        const carrier = editingApp.carrier;
        // Determine Comp Level: Use Carrier Override if exists, else Default
        const compLevel = currentUser.carrierCompLevels?.[carrier] || currentUser.defaultCompLevel;
        
        const commData = calculateCommissionExact(carrier, editingApp.product, premium, compLevel);
        const totalComm = commData.total;
        
        const commPercent = commData.fycRate * 100;
        const advance = totalComm * 0.75;
        const backend = totalComm * 0.25;
        return { monthly, commPercent, advance, backend, totalComm };
    };

    const metrics = calculateMetrics();
    const clientDetails = editingApp ? getClientDetails(editingApp.clientId) : null;

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Applications</h2>
                <div className="flex gap-2">
                     <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium">
                        <Filter size={16} /> Filter
                     </button>
                     <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium">
                        <Download size={16} /> Export
                     </button>
                     <button 
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                     >
                        <Plus size={16} /> Add Application
                     </button>
                </div>
            </div>

            {/* ... rest of the component (render logic unchanged except default values) ... */}
            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Product Details</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4">Premium</th>
                            <th className="px-6 py-4">Coverage</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {applications.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No applications found.</td>
                            </tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <select
                                            value={app.status}
                                            onChange={(e) => handleStatusChange(app, e.target.value as Application['status'])}
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer appearance-none pr-8 relative
                                                ${app.status === 'Issued' || app.status === 'Approved' ? 'bg-green-500/10 text-green-400' : 
                                                  app.status === 'Underwriting' ? 'bg-yellow-500/10 text-yellow-400' : 
                                                  app.status === 'Declined' ? 'bg-red-500/10 text-red-400' : 
                                                  'bg-blue-500/10 text-blue-400'}`}
                                            style={{backgroundImage: 'none'}}
                                        >
                                            <option value="Submitted">Submitted</option>
                                            <option value="Underwriting">Underwriting</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Issued">Issued</option>
                                            <option value="Declined">Declined</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(app)}>
                                        <div className="text-sm font-bold text-white hover:text-blue-400 transition-colors">{app.clientName}</div>
                                    </td>
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(app)}>
                                        <div className="text-sm text-white font-medium">{app.carrier}</div>
                                        <div className="text-xs text-slate-500">{app.product}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 cursor-pointer" onClick={() => handleEditClick(app)}>
                                        {app.submittedDate}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white cursor-pointer" onClick={() => handleEditClick(app)}>
                                        ${app.premium.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400 cursor-pointer" onClick={() => handleEditClick(app)}>
                                        ${(app.coverageAmount || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditClick(app)}
                                                className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => onDeleteApplication(app.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Application Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-lg animate-fade-in ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                            <h3 className="font-bold text-xl text-white">Add New Application</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Client</label>
                                <select 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                    value={newApp.clientId || ''}
                                    onChange={(e) => setNewApp({...newApp, clientId: e.target.value})}
                                    autoFocus
                                >
                                    <option value="">Select a Client...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* ... (Existing form fields for carrier, product, premium, etc.) ... */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Carrier</label>
                                    {carrierOptions.length > 0 ? (
                                        <select 
                                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                            value={newApp.carrier || ''}
                                            onChange={(e) => setNewApp({...newApp, carrier: e.target.value})}
                                        >
                                            <option value="">Select Carrier...</option>
                                            {carrierOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    ) : (
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                            placeholder="e.g. Mutual of Omaha"
                                            value={newApp.carrier || ''}
                                            onChange={(e) => setNewApp({...newApp, carrier: e.target.value})}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Product</label>
                                    {productOptions.length > 0 ? (
                                        <select 
                                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                            value={newApp.product || ''}
                                            onChange={(e) => setNewApp({...newApp, product: e.target.value})}
                                        >
                                            <option value="">Select Product...</option>
                                            {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    ) : (
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                            placeholder="e.g. Living Promise"
                                            value={newApp.product || ''}
                                            onChange={(e) => setNewApp({...newApp, product: e.target.value})}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Monthly Premium</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-7 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.00"
                                            value={monthlyInput}
                                            onChange={handleMonthlyChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Annual Premium</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-7 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0.00"
                                            value={newApp.premium || ''}
                                            onChange={handleAnnualChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Coverage Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                        <input 
                                            type="number"
                                            className="w-full pl-7 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="0"
                                            value={newApp.coverageAmount || ''}
                                            onChange={(e) => setNewApp({...newApp, coverageAmount: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                    <select 
                                        className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                        value={newApp.status}
                                        onChange={(e) => setNewApp({...newApp, status: e.target.value as any})}
                                    >
                                        <option value="Submitted">Submitted</option>
                                        <option value="Underwriting">Underwriting</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Issued">Issued</option>
                                        <option value="Declined">Declined</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Policy Number</label>
                                <input 
                                    type="text"
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                    placeholder="Optional"
                                    value={newApp.policyNumber || ''}
                                    onChange={(e) => setNewApp({...newApp, policyNumber: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Submitted Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={newApp.submittedDate}
                                        onChange={(e) => setNewApp({...newApp, submittedDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Policy Start Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={newApp.policyStartDate || ''}
                                        onChange={(e) => setNewApp({...newApp, policyStartDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                                <textarea 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-950 text-white"
                                    rows={3}
                                    placeholder="Optional notes..."
                                    value={newApp.notes || ''}
                                    onChange={(e) => setNewApp({...newApp, notes: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAdd}
                                disabled={!newApp.clientId || !newApp.carrier}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={16} /> Create Application
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Application Modal */}
            {isEditModalOpen && editingApp && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl animate-fade-in ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                             <div>
                                <h3 className="font-bold text-xl text-white">{editingApp.clientName}</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">Application Quick View</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 space-y-6">
                            {/* ... (Existing read-only or quick-edit fields) ... */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* ... Phone, Status, etc. ... */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Phone size={14} className="text-slate-500"/>
                                        {clientDetails?.phone || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">App Status</label>
                                    <div className="relative">
                                        <select
                                            value={editingApp.status}
                                            onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as Application['status'] })}
                                            className={`w-full appearance-none px-2.5 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer pr-8 
                                                ${editingApp.status === 'Issued' || editingApp.status === 'Approved' ? 'bg-green-500/10 text-green-400' : 
                                                  editingApp.status === 'Underwriting' ? 'bg-yellow-500/10 text-yellow-400' : 
                                                  editingApp.status === 'Declined' ? 'bg-red-500/10 text-red-400' : 
                                                  'bg-blue-500/10 text-blue-400'}`}
                                        >
                                            <option value="Submitted">Submitted</option>
                                            <option value="Underwriting">Underwriting</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Issued">Issued (Paid)</option>
                                            <option value="Declined">Declined</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Submitted</label>
                                    {/* Editable Submitted Date */}
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-500"/>
                                        <input 
                                            type="date"
                                            className="bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none text-white w-24 text-xs font-bold [color-scheme:dark]"
                                            value={editingApp.submittedDate}
                                            onChange={(e) => setEditingApp({...editingApp, submittedDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Policy Start</label>
                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-500"/>
                                        <input 
                                            type="date"
                                            className="bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none text-white w-24 text-xs font-bold [color-scheme:dark]"
                                            value={editingApp.policyStartDate || ''}
                                            onChange={(e) => setEditingApp({...editingApp, policyStartDate: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                             {/* Policy Details Section */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" /> Application Details
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Carrier</label>
                                        {carrierOptions.length > 0 ? (
                                            <select 
                                                className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                                value={editingApp.carrier}
                                                onChange={(e) => setEditingApp({...editingApp, carrier: e.target.value, product: ''})}
                                            >
                                                <option value="">Select Carrier...</option>
                                                {carrierOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                                value={editingApp.carrier}
                                                onChange={(e) => setEditingApp({...editingApp, carrier: e.target.value})}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500">Product</label>
                                        {productOptions.length > 0 ? (
                                            <select 
                                                className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                                value={editingApp.product}
                                                onChange={(e) => setEditingApp({...editingApp, product: e.target.value})}
                                            >
                                                <option value="">Select Product...</option>
                                                {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                type="text"
                                                className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                                value={editingApp.product}
                                                onChange={(e) => setEditingApp({...editingApp, product: e.target.value})}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Coverage Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                            <input 
                                                type="number"
                                                className="w-full pl-5 border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={editingApp.coverageAmount || ''}
                                                onChange={(e) => setEditingApp({...editingApp, coverageAmount: parseFloat(e.target.value)})}
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
                                                value={editingApp.premium || ''}
                                                onChange={(e) => setEditingApp({...editingApp, premium: parseFloat(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-3">
                                        <label className="text-xs font-medium text-slate-500">Policy Number</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-700 rounded p-1.5 text-sm font-medium text-white bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                            value={editingApp.policyNumber || ''}
                                            onChange={(e) => setEditingApp({...editingApp, policyNumber: e.target.value})}
                                            placeholder="Pending"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-800" />
                            
                            {/* ... (Document Upload Section remains same) ... */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-500" /> Document Upload
                                </h4>
                                <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/50 flex flex-col items-center justify-center gap-2">
                                    {editingApp.documentUrl ? (
                                        <div className="w-full flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-700">
                                            <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
                                                <FileText size={16} className="text-blue-500" />
                                                <span>Application_Copy.pdf</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a 
                                                    href={editingApp.documentUrl} 
                                                    download="Application_Copy.pdf"
                                                    className="p-1 text-slate-500 hover:text-blue-400"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button 
                                                    onClick={() => setEditingApp({...editingApp, documentUrl: undefined})}
                                                    className="p-1 text-slate-500 hover:text-red-400"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="text-slate-500" size={24} />
                                            <p className="text-sm text-slate-400 font-medium">Upload Application Copy</p>
                                            <p className="text-xs text-slate-600">PDF or Image (Max 10MB)</p>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700"
                                            >
                                                Select File
                                            </button>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept=".pdf,image/*"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                             {/* Commission Breakdown Section (Estimates) */}
                             <div>
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <DollarSign size={16} className="text-green-400" /> Projected Commission
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Commission %</label>
                                        <div className="text-lg font-bold text-blue-400">
                                            {metrics.commPercent.toFixed(0)}%
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
                                        <label className="text-xs font-bold text-slate-500 uppercase">Total Comm</label>
                                        <div className="text-lg font-bold text-white">
                                            ${metrics.totalComm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-800 mt-2 flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Current Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            editingApp.status === 'Issued' ? 'bg-green-500/10 text-green-400' :
                                            editingApp.status === 'Approved' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                            {editingApp.status === 'Issued' ? 'Issued (Paid)' : 
                                             editingApp.status === 'Approved' ? 'Approved (Pending Issue)' : 
                                             editingApp.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-800" />

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                                <textarea 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white bg-slate-950"
                                    rows={3}
                                    value={editingApp.notes}
                                    onChange={(e) => setEditingApp({...editingApp, notes: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Applications;
