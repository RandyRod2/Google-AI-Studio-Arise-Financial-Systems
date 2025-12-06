
import React, { useState } from 'react';
import { Search, Copy, ExternalLink, CheckCircle2, Clock, AlertTriangle, Building2, Check, Plus, Edit2, X, Save, Ban } from 'lucide-react';

interface Carrier {
    id: string;
    name: string;
    logoColor: string;
    logoText: string;
    status: 'Active' | 'Pending' | 'Not Contracted';
    writingNumber: string;
    supportPhone: string;
    contractingEmail: string;
    portalUrl: string;
}

const INITIAL_CARRIERS: Carrier[] = [
    {
        id: '2',
        name: 'Aetna / CVS Health',
        logoColor: 'bg-red-600',
        logoText: 'AE',
        status: 'Active',
        writingNumber: 'N55201',
        supportPhone: '866-272-6630',
        contractingEmail: 'contracting@aetna.com',
        portalUrl: 'https://www.aetna.com/insurance-producer.html'
    },
    {
        id: '5',
        name: 'American Amicable',
        logoColor: 'bg-indigo-600',
        logoText: 'AA',
        status: 'Active',
        writingNumber: '110293',
        supportPhone: '800-736-7311',
        contractingEmail: 'contracting@americanamicable.com',
        portalUrl: 'https://www.americanamicable.com'
    },
    {
        id: 'ahl',
        name: 'American Home Life',
        logoColor: 'bg-blue-400',
        logoText: 'AH',
        status: 'Pending',
        writingNumber: 'Pending',
        supportPhone: '800-876-0199',
        contractingEmail: 'cs@amhomelife.com',
        portalUrl: 'https://www.amhomelife.com'
    },
    {
        id: 'americo',
        name: 'Americo',
        logoColor: 'bg-red-700',
        logoText: 'AM',
        status: 'Active',
        writingNumber: 'AM-22019',
        supportPhone: '800-231-0801',
        contractingEmail: 'agent.services@americo.com',
        portalUrl: 'https://www.americo.com/agent'
    },
    {
        id: 'balt',
        name: 'The Baltimore Life',
        logoColor: 'bg-red-800',
        logoText: 'BL',
        status: 'Active',
        writingNumber: 'BL-99201',
        supportPhone: '800-628-5433',
        contractingEmail: 'agent.services@baltlife.com',
        portalUrl: 'https://www.baltlife.com'
    },
    {
        id: 'banner',
        name: 'Banner Life',
        logoColor: 'bg-orange-500',
        logoText: 'BN',
        status: 'Active',
        writingNumber: '0029910',
        supportPhone: '800-638-8428',
        contractingEmail: 'customerservice@legalandgeneral.com',
        portalUrl: 'https://www.legalandgeneral.com/us/advisors'
    },
    {
        id: 'columbus',
        name: 'Columbus Life',
        logoColor: 'bg-blue-800',
        logoText: 'CL',
        status: 'Not Contracted',
        writingNumber: '',
        supportPhone: '800-677-9696',
        contractingEmail: 'service@columbuslife.com',
        portalUrl: 'https://www.columbuslife.com'
    },
    {
        id: 'f_and_g',
        name: 'Fidelity & Guaranty',
        logoColor: 'bg-yellow-500',
        logoText: 'FG',
        status: 'Active',
        writingNumber: 'FG-99100',
        supportPhone: '800-445-6758',
        contractingEmail: 'contracting@fglife.com',
        portalUrl: 'https://www.fglife.com'
    },
    {
        id: '4',
        name: 'Foresters Financial',
        logoColor: 'bg-blue-600',
        logoText: 'FF',
        status: 'Active',
        writingNumber: 'AG-99281',
        supportPhone: '800-828-1540',
        contractingEmail: 'licensing@foresters.com',
        portalUrl: 'https://portal.foresters.biz'
    },
    {
        id: '8',
        name: 'John Hancock',
        logoColor: 'bg-slate-700',
        logoText: 'JH',
        status: 'Pending',
        writingNumber: 'Pending',
        supportPhone: '800-387-2747',
        contractingEmail: 'contracting@jhancock.com',
        portalUrl: 'https://www.johnhancock.com'
    },
    {
        id: 'ladder',
        name: 'Ladder Life',
        logoColor: 'bg-green-500',
        logoText: 'LL',
        status: 'Active',
        writingNumber: 'LL-DIGITAL',
        supportPhone: '844-533-2070',
        contractingEmail: 'partners@ladderlife.com',
        portalUrl: 'https://www.ladderlife.com/agents'
    },
    {
        id: 'liberty',
        name: 'Liberty Bankers',
        logoColor: 'bg-green-700',
        logoText: 'LB',
        status: 'Active',
        writingNumber: 'LB-4421',
        supportPhone: '800-745-4927',
        contractingEmail: 'licensing@lbl.com',
        portalUrl: 'https://www.lbl.com'
    },
    {
        id: '1',
        name: 'Mutual of Omaha',
        logoColor: 'bg-green-600',
        logoText: 'MO',
        status: 'Active',
        writingNumber: '00129482',
        supportPhone: '800-775-6000',
        contractingEmail: 'contracts@mutualofomaha.com',
        portalUrl: 'https://www.mutualofomaha.com/agent'
    },
    {
        id: 'royal',
        name: 'Royal Neighbors',
        logoColor: 'bg-purple-600',
        logoText: 'RN',
        status: 'Active',
        writingNumber: 'RN-1102',
        supportPhone: '800-627-4762',
        contractingEmail: 'agent.support@royalneighbors.org',
        portalUrl: 'https://agent.royalneighbors.org'
    },
    {
        id: 'sbli',
        name: 'SBLI',
        logoColor: 'bg-blue-700',
        logoText: 'SB',
        status: 'Pending',
        writingNumber: 'Pending',
        supportPhone: '888-224-7254',
        contractingEmail: 'brokerage@sbli.com',
        portalUrl: 'https://www.sbli.com/agent'
    },
    {
        id: '3',
        name: 'Transamerica',
        logoColor: 'bg-red-500',
        logoText: 'TA',
        status: 'Pending',
        writingNumber: 'Pending',
        supportPhone: '800-797-2643',
        contractingEmail: 'contracting@transamerica.com',
        portalUrl: 'https://www.transamerica.com/login'
    },
    {
        id: 'uhl',
        name: 'United Home Life',
        logoColor: 'bg-blue-500',
        logoText: 'UH',
        status: 'Active',
        writingNumber: 'UHL-8821',
        supportPhone: '800-428-3001',
        contractingEmail: 'licensing@unitedhomelife.com',
        portalUrl: 'https://www.unitedhomelife.com'
    }
];

const Carriers: React.FC = () => {
    // Main state for carriers
    const [carriers, setCarriers] = useState<Carrier[]>(INITIAL_CARRIERS);
    
    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Pending' | 'Not Contracted'>('ALL');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ number: string, status: Carrier['status'] }>({ number: '', status: 'Pending' });

    // Add Carrier Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCarrier, setNewCarrier] = useState<Partial<Carrier>>({
        name: '',
        writingNumber: '',
        status: 'Pending',
        supportPhone: '',
        contractingEmail: '',
        portalUrl: ''
    });

    const filteredCarriers = carriers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              c.writingNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening modal
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Not Contracted': return 'bg-gray-100 text-gray-500 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'Active': return <CheckCircle2 size={14} className="mr-1" />;
            case 'Pending': return <Clock size={14} className="mr-1" />;
            case 'Not Contracted': return <Ban size={14} className="mr-1" />;
            default: return null;
        }
    };

    // --- Actions ---

    const openEditModal = (carrier: Carrier) => {
        setEditingCarrierId(carrier.id);
        setEditForm({ number: carrier.writingNumber, status: carrier.status });
        setIsEditModalOpen(true);
    };

    const saveEditing = () => {
        if (!editingCarrierId) return;
        
        setCarriers(prev => prev.map(c => 
            c.id === editingCarrierId 
                ? { ...c, writingNumber: editForm.number, status: editForm.status } 
                : c
        ));
        setIsEditModalOpen(false);
        setEditingCarrierId(null);
    };

    const handleAddCarrier = () => {
        if (!newCarrier.name) return;

        const generatedLogoText = newCarrier.name.substring(0, 2).toUpperCase();
        
        const carrierToAdd: Carrier = {
            id: `custom-${Date.now()}`,
            name: newCarrier.name,
            logoColor: 'bg-indigo-600', // Default color for custom
            logoText: generatedLogoText,
            status: newCarrier.status as any || 'Pending',
            writingNumber: newCarrier.writingNumber || 'Pending',
            supportPhone: newCarrier.supportPhone || '',
            contractingEmail: newCarrier.contractingEmail || '',
            portalUrl: newCarrier.portalUrl || ''
        };

        setCarriers([...carriers, carrierToAdd]);
        setIsAddModalOpen(false);
        setNewCarrier({ name: '', writingNumber: '', status: 'Pending', supportPhone: '', contractingEmail: '', portalUrl: '' });
    };

    const getCarrierName = () => {
        return carriers.find(c => c.id === editingCarrierId)?.name || 'Carrier';
    };

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-indigo-600" /> My Carriers
                    </h2>
                    <p className="text-slate-500 text-sm">Manage your writing numbers and carrier relationships.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
                        {(['ALL', 'Active', 'Pending', 'Not Contracted'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                                    statusFilter === status 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'text-slate-500 hover:bg-gray-50'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 md:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search carriers..." 
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus size={16} /> Add Carrier
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCarriers.map((carrier) => (
                    <div 
                        key={carrier.id} 
                        onClick={() => openEditModal(carrier)}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-400 cursor-pointer flex flex-col overflow-hidden group relative"
                    >
                        {/* Edit Hint Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-full shadow-sm">
                                <Edit2 size={12} />
                            </div>
                        </div>

                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${carrier.logoColor}`}>
                                    {carrier.logoText}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center ${getStatusColor(carrier.status)}`}>
                                    {getStatusIcon(carrier.status)}
                                    {carrier.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{carrier.name}</h3>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 flex-1">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Writing Number</p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className={`font-mono text-slate-800 font-bold px-2 py-1 rounded text-sm select-all ${carrier.writingNumber ? 'bg-slate-100' : 'text-gray-400 italic'}`}>
                                        {carrier.writingNumber || 'None'}
                                    </span>
                                    {carrier.writingNumber && carrier.writingNumber !== 'Pending' && (
                                        <button 
                                            onClick={(e) => handleCopy(carrier.writingNumber, carrier.id, e)}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1 relative"
                                            title="Copy Number"
                                        >
                                            {copiedId === carrier.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Agent Support</p>
                                <p className="text-sm text-slate-700 font-medium select-all">{carrier.supportPhone || 'N/A'}</p>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contracting</p>
                                <p className="text-sm text-slate-700 font-medium break-all select-all">{carrier.contractingEmail || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                            {carrier.portalUrl ? (
                                <a 
                                    href={carrier.portalUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()} // Prevent card click
                                    className="w-full py-2 bg-white border border-gray-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    Carrier Portal <ExternalLink size={14} />
                                </a>
                            ) : (
                                <button disabled className="w-full py-2 bg-gray-100 border border-gray-200 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed">
                                    Portal Unavailable
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredCarriers.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-400 font-medium">No carriers found matching "{searchTerm}" or filter "{statusFilter}"</p>
                    <button 
                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                        className="mt-2 text-indigo-600 text-sm hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Edit Writing Number Modal (Light Backdrop) */}
            {isEditModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/90 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-sm ring-1 ring-black/5 animate-fade-in flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Edit2 size={18} className="text-indigo-600" /> Edit {getCarrierName()}
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Status</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Not Contracted">Not Contracted</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Writing Number</label>
                                <input 
                                    type="text"
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 font-mono"
                                    value={editForm.number}
                                    onChange={(e) => setEditForm({...editForm, number: e.target.value})}
                                    placeholder="Enter ID or 'Pending'"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={saveEditing}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Carrier Modal (Light Backdrop) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/90 backdrop-blur-md">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md ring-1 ring-black/5 animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-600" /> Add New Carrier
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Name</label>
                                <input 
                                    type="text"
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    placeholder="e.g. New Life Insurance Co."
                                    value={newCarrier.name}
                                    onChange={(e) => setNewCarrier({...newCarrier, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Writing Number</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        placeholder="Optional"
                                        value={newCarrier.writingNumber}
                                        onChange={(e) => setNewCarrier({...newCarrier, writingNumber: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={newCarrier.status}
                                        onChange={(e) => setNewCarrier({...newCarrier, status: e.target.value as any})}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Not Contracted">Not Contracted</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Support Phone</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    placeholder="800-555-0199"
                                    value={newCarrier.supportPhone}
                                    onChange={(e) => setNewCarrier({...newCarrier, supportPhone: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contracting Email</label>
                                <input 
                                    type="email"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    placeholder="contracting@carrier.com"
                                    value={newCarrier.contractingEmail}
                                    onChange={(e) => setNewCarrier({...newCarrier, contractingEmail: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Portal URL</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    placeholder="https://agent.carrier.com"
                                    value={newCarrier.portalUrl}
                                    onChange={(e) => setNewCarrier({...newCarrier, portalUrl: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 shrink-0">
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddCarrier}
                                disabled={!newCarrier.name}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} /> Save Carrier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Carriers;
