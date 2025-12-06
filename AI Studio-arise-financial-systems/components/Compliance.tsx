
import React, { useState, useRef } from 'react';
import { MOCK_COMPLIANCE } from '../services/mockData';
import { ShieldCheck, AlertOctagon, Upload, Download, Filter, CheckCircle2, X, FileText, Calendar, AlertTriangle, Eye, Loader2, RefreshCw } from 'lucide-react';

const Compliance: React.FC = () => {
    // Extended state to handle updates
    const [complianceItems, setComplianceItems] = useState(MOCK_COMPLIANCE);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTION'>('ALL');
    
    // Modal State
    const [selectedItem, setSelectedItem] = useState<typeof MOCK_COMPLIANCE[0] | null>(null);
    const [modalMode, setModalMode] = useState<'VIEW' | 'UPLOAD' | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived Stats
    const activeCount = complianceItems.filter(i => i.status === 'Active').length;
    const actionCount = complianceItems.filter(i => i.status !== 'Active').length;

    const filteredItems = complianceItems.filter(item => {
        if (filterStatus === 'ALL') return true;
        return item.status !== 'Active';
    });

    const handleActionClick = (item: typeof MOCK_COMPLIANCE[0]) => {
        setSelectedItem(item);
        if (item.status === 'Missing' || item.status === 'Expiring Soon') {
            setModalMode('UPLOAD');
        } else {
            setModalMode('VIEW');
        }
        setUploadSuccess(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            // Simulate upload delay
            setTimeout(() => {
                setIsUploading(false);
                setUploadSuccess(true);
                
                // Update item status in the list
                if (selectedItem) {
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    const newExpiry = nextYear.toISOString().split('T')[0];
                    
                    setComplianceItems(prev => prev.map(i => 
                        i.id === selectedItem.id 
                            ? { ...i, status: 'Active', expiry: newExpiry } 
                            : i
                    ));
                }
            }, 1500);
        }
    };

    const closeModal = () => {
        setSelectedItem(null);
        setModalMode(null);
        setIsUploading(false);
        setUploadSuccess(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Compliance Center</h2>
                    <p className="text-sm text-slate-500">Manage licenses, certifications, and carrier appointments.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <ShieldCheck className="text-green-600" size={18} />
                        <span className="text-sm font-bold text-slate-700">{activeCount} Active</span>
                    </div>
                    {actionCount > 0 && (
                        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">
                            <AlertOctagon className="text-red-600" size={18} />
                            <span className="text-sm font-bold text-red-700">{actionCount} Action Required</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilterStatus('ALL')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                        >
                            All Items
                        </button>
                        <button 
                            onClick={() => setFilterStatus('ACTION')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'ACTION' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                        >
                            Action Required
                        </button>
                    </div>
                    <div className="relative">
                        <Filter size={16} className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Filter..." className="pl-9 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-500 bg-white w-40" />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-4">Requirement</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Expiration</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.type === 'License' ? <ShieldCheck size={18} /> : <FileText size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-400">ID: {item.id.toUpperCase()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.type}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center gap-1
                                        ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                          item.status === 'Expiring Soon' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status === 'Active' && <CheckCircle2 size={12} />}
                                        {item.status === 'Expiring Soon' && <AlertOctagon size={12} />}
                                        {item.status === 'Missing' && <AlertTriangle size={12} />}
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.expiry}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleActionClick(item)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ml-auto w-24 border
                                            ${item.status === 'Missing' || item.status === 'Expiring Soon' 
                                                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm' 
                                                : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        {item.status === 'Missing' ? <Upload size={14} /> : 
                                         item.status === 'Expiring Soon' ? <RefreshCw size={14} /> : <Eye size={14} />}
                                        {item.status === 'Missing' ? 'Upload' : 
                                         item.status === 'Expiring Soon' ? 'Renew' : 'View'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredItems.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-sm italic">
                        No items found matching filter.
                    </div>
                )}
            </div>

            {/* Alert Banner for AML */}
            {complianceItems.some(i => i.name === 'AML Training' && i.status !== 'Active') && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 animate-fade-in">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                        <AlertOctagon size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">Anti-Money Laundering (AML) Update</h4>
                        <p className="text-blue-700 text-sm mt-1">
                            New federal guidelines require all agents to update their AML certification by the end of Q4. 
                            Please complete the module in the Training tab or upload your external certificate above.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedItem && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{selectedItem.name}</h3>
                                <p className="text-xs text-gray-500">{selectedItem.type}</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {modalMode === 'UPLOAD' ? (
                                <div className="space-y-6">
                                    {!uploadSuccess ? (
                                        <>
                                            <div 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                                            >
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">Click to upload document</p>
                                                <p className="text-xs text-gray-400 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept=".pdf,.jpg,.png"
                                                onChange={handleFileUpload}
                                            />
                                            {isUploading && (
                                                <div className="flex items-center justify-center gap-2 text-indigo-600 text-sm font-medium">
                                                    <Loader2 size={16} className="animate-spin" /> Uploading & verifying...
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-4 animate-fade-in">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800">Verification Successful</h4>
                                            <p className="text-slate-500 text-sm mt-2 mb-6">
                                                Your document has been verified. The status has been updated to Active.
                                            </p>
                                            <button 
                                                onClick={closeModal}
                                                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* VIEW MODE */
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                                            <ShieldCheck size={32} className="text-indigo-600" />
                                            <div>
                                                <h4 className="font-bold text-slate-900">Official Certificate</h4>
                                                <p className="text-xs text-gray-500">Verified by State Department</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">License Number</p>
                                                <p className="font-medium text-slate-800 mt-0.5">LIC-{Math.floor(Math.random() * 1000000)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Issue Date</p>
                                                <p className="font-medium text-slate-800 mt-0.5">Jan 15, 2023</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Expiration</p>
                                                <p className="font-medium text-slate-800 mt-0.5">{selectedItem.expiry}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                                                <span className="inline-flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded text-xs mt-0.5">
                                                    <CheckCircle2 size={10} /> Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <button className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                            <Download size={14} /> Download Copy
                                        </button>
                                        <button 
                                            onClick={closeModal}
                                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Compliance;
