
import React, { useState, useEffect, useMemo } from 'react';
import { CommissionRegistry, User } from '../types';
import { Search, Filter, Database, AlertCircle, ChevronDown, Table2, Edit2, Plus, X, Save, Trash2, Check, RefreshCw } from 'lucide-react';
import { INITIAL_REGISTRY_DATA } from '../services/mockData';
import { getCommissionRate } from '../services/commissionService';

interface ProductCommissionProps {
    currentUser: User | null;
}

const ProductCommission: React.FC<ProductCommissionProps> = ({ currentUser }) => {
    const [registry, setRegistry] = useState<CommissionRegistry>(() => {
        try {
            const saved = localStorage.getItem('arise_commission_registry');
            return saved ? JSON.parse(saved) : INITIAL_REGISTRY_DATA;
        } catch { return INITIAL_REGISTRY_DATA; }
    });

    // --- State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number>(100); 
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Modal State
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
    
    // Editing Data
    const [editingTarget, setEditingTarget] = useState<{carrier: string, product: string} | null>(null);
    const [levelEntries, setLevelEntries] = useState<{level: string, fyc: string, renewals: string}[]>([]);
    
    // New Product Data
    const [newProductData, setNewProductData] = useState({ carrier: '', product: '' });

    // Permission Check
    const canEdit = currentUser && ['ADMIN', 'AGENCY_OWNER', 'STAFF'].includes(currentUser.role);

    // Persist Registry
    useEffect(() => {
        localStorage.setItem('arise_commission_registry', JSON.stringify(registry));
    }, [registry]);

    // Generate standard contract levels 80 - 145
    const availableLevels = useMemo(() => {
        const levels = [];
        for (let i = 80; i <= 145; i += 5) {
            levels.push(i);
        }
        return levels;
    }, []);

    // Helper: Sort entries by numeric level
    const sortEntries = (entries: typeof levelEntries) => {
        return [...entries].sort((a, b) => Number(a.level) - Number(b.level));
    };

    // --- Actions ---

    const openRateModal = (carrier: string, product: string) => {
        // 1. Identify all relevant levels: Existing stored levels + Standard levels (80-145)
        const existingLevels = Object.keys(registry[carrier][product]).map(Number);
        
        const standardLevels = [];
        for (let i = 80; i <= 145; i += 5) {
            standardLevels.push(i);
        }
        
        // Merge and deduplicate
        const allLevels = Array.from(new Set([...existingLevels, ...standardLevels])).sort((a, b) => a - b);

        // 2. Map levels to entries, calculating interpolated rates for any holes
        const entries = allLevels.map(level => {
            // Pass current 'registry' state to getCommissionRate to ensure we use the latest data
            // This will return either the explicit value (if exists) or the interpolated value
            const { fyc, renewals } = getCommissionRate(carrier, product, level, registry);
            
            return {
                level: level.toString(),
                fyc: (fyc * 100).toFixed(2), // Convert decimal to percent string
                renewals: (renewals * 100).toFixed(2)
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

        // Validate and convert back to decimal
        levelEntries.forEach(entry => {
            const lvl = parseInt(entry.level);
            const fyc = parseFloat(entry.fyc);
            const ren = parseFloat(entry.renewals);

            if (!isNaN(lvl) && !isNaN(fyc) && !isNaN(ren)) {
                newProductRules[lvl.toString()] = {
                    fyc: fyc / 100,
                    renewals: ren / 100
                };
            }
        });

        // Update Registry
        const updatedRegistry = { ...registry };
        if (!updatedRegistry[carrier]) updatedRegistry[carrier] = {};
        updatedRegistry[carrier][product] = newProductRules;

        setRegistry(updatedRegistry);
        setIsRateModalOpen(false);
        setEditingTarget(null);
    };

    const handleDeleteLevel = (index: number) => {
        const newEntries = [...levelEntries];
        newEntries.splice(index, 1);
        setLevelEntries(newEntries);
    };

    const handleAddLevelRow = () => {
        setLevelEntries(sortEntries([...levelEntries, { level: '', fyc: '0', renewals: '0' }]));
    };

    const updateLevelEntry = (index: number, field: keyof typeof levelEntries[0], value: string) => {
        const newEntries = [...levelEntries];
        newEntries[index] = { ...newEntries[index], [field]: value };
        setLevelEntries(newEntries); // Don't sort while typing to avoid jumping rows
    };

    const handleCreateProduct = () => {
        if (!newProductData.carrier || !newProductData.product) return;
        
        // Initialize with empty object or default
        const updatedRegistry = { ...registry };
        if (!updatedRegistry[newProductData.carrier]) updatedRegistry[newProductData.carrier] = {};
        
        // If product doesn't exist, create it
        if (!updatedRegistry[newProductData.carrier][newProductData.product]) {
            updatedRegistry[newProductData.carrier][newProductData.product] = {
                "100": { fyc: 0.90, renewals: 0.0 } // Default starter level
            };
        }

        setRegistry(updatedRegistry);
        
        // Close Create Modal & Open Rate Modal immediately
        setIsNewProductModalOpen(false);
        setNewProductData({ carrier: '', product: '' });
        
        // Small delay to allow registry update
        setTimeout(() => {
            openRateModal(newProductData.carrier, newProductData.product);
        }, 100);
    };

    // Flatten data for table view
    const tableData = useMemo(() => {
        const rows: { carrier: string, product: string, fyc: number, renewals: number }[] = [];
        
        Object.entries(registry).forEach(([carrier, products]) => {
            Object.entries(products).forEach(([product]) => {
                // Use interpolation for view mode, passing current registry
                const { fyc, renewals } = getCommissionRate(carrier, product, selectedLevel, registry);
                
                rows.push({ carrier, product, fyc, renewals });
            });
        });
        
        return rows.filter(row => 
            row.carrier.toLowerCase().includes(searchTerm.toLowerCase()) || 
            row.product.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.carrier.localeCompare(b.carrier));
    }, [registry, selectedLevel, searchTerm]);

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col relative">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Table2 className="text-indigo-500" /> Product Commission Grid
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {isEditMode ? 'Editing Commission Source Data' : 'View interpolated commission rates for any contract level.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Add Product Button (Edit Mode Only) */}
                    {isEditMode && (
                        <button 
                            onClick={() => setIsNewProductModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                            <Plus size={14} /> Add Product
                        </button>
                    )}

                    {/* Edit Mode Toggle */}
                    {canEdit && (
                        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
                            <button 
                                onClick={() => setIsEditMode(false)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isEditMode ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                View
                            </button>
                            <button 
                                onClick={() => setIsEditMode(true)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${isEditMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <Edit2 size={10} /> Edit Registry
                            </button>
                        </div>
                    )}

                    {/* Level Selector (Disabled in Edit Mode) */}
                    <div className={`relative ${isEditMode ? 'opacity-30 pointer-events-none' : ''}`}>
                        <select 
                            className="appearance-none bg-slate-900 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(Number(e.target.value))}
                        >
                            {availableLevels.map(lvl => (
                                <option key={lvl} value={lvl}>Level {lvl}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    {/* Search */}
                    <div className="relative w-48 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            {Object.keys(registry).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Database className="text-slate-600" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Commission Data</h3>
                    <p className="text-slate-400 max-w-md mb-6">
                        The commission registry is empty.
                        {canEdit ? " Click 'Edit Registry' then 'Add Product' to start building." : " Ask an admin to upload the commission grid."}
                    </p>
                </div>
            ) : (
                <div className={`bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex-1 flex flex-col ${isEditMode ? 'ring-2 ring-indigo-500/50' : ''}`}>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-950/50 text-[10px] text-slate-500 uppercase font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                                <tr>
                                    <th className="px-6 py-4 border-b border-white/5">Carrier Name</th>
                                    <th className="px-6 py-4 border-b border-white/5">Product Name</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right">
                                        {isEditMode ? 'Source Levels' : 'Selected Level'}
                                    </th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right">FYC Rate</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right">Renewals</th>
                                    {isEditMode && <th className="px-6 py-4 border-b border-white/5 text-center w-20">Edit</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tableData.length === 0 ? (
                                    <tr>
                                        <td colSpan={isEditMode ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                                            No products found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                ) : (
                                    tableData.map((row, idx) => (
                                        <tr key={`${row.carrier}-${row.product}-${idx}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-white text-slate-900 font-bold flex items-center justify-center text-xs border border-slate-200">
                                                        {row.carrier.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-slate-200">{row.carrier}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300 font-medium">
                                                {row.product}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isEditMode ? (
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        {Object.keys(registry[row.carrier][row.product]).length} defined
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        Level {selectedLevel}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-white text-sm">
                                                {(row.fyc * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-green-400 text-sm">
                                                {(row.renewals * 100).toFixed(1)}%
                                            </td>
                                            {isEditMode && (
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => openRateModal(row.carrier, row.product)}
                                                        className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-950/30 border-t border-white/5 text-xs text-slate-500 flex justify-between items-center">
                        <span>Showing {tableData.length} products</span>
                        <div className="flex items-center gap-2">
                            {isEditMode ? (
                                <span className="text-indigo-400 font-bold flex items-center gap-1">
                                    <Edit2 size={12}/> Edit Mode Active
                                </span>
                            ) : (
                                <>
                                    <AlertCircle size={12} />
                                    <span>Rates are calculated based on your selected contract level.</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* === RATE CONFIGURATION MODAL === */}
            {isRateModalOpen && editingTarget && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl ring-1 ring-white/10 flex flex-col max-h-[90vh]">
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
                                    <div className="grid grid-cols-4 gap-4 text-[10px] uppercase font-bold text-slate-500 px-2">
                                        <div>Level</div>
                                        <div>FYC %</div>
                                        <div>Renewals %</div>
                                        <div className="text-right">Action</div>
                                    </div>
                                    
                                    {levelEntries.map((entry, idx) => (
                                        <div key={idx} className="grid grid-cols-4 gap-4 items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
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
                                    
                                    {levelEntries.length === 0 && (
                                        <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-lg">
                                            No levels defined. Add a level to enable commissions.
                                        </div>
                                    )}
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

            {/* === ADD PRODUCT MODAL === */}
            {isNewProductModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-sm ring-1 ring-white/10 overflow-hidden">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Plus size={18} className="text-indigo-500" /> New Product
                            </h3>
                            <button onClick={() => setIsNewProductModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carrier Name</label>
                                <input 
                                    type="text"
                                    list="carrier-list"
                                    autoFocus
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Aetna"
                                    value={newProductData.carrier}
                                    onChange={(e) => setNewProductData({...newProductData, carrier: e.target.value})}
                                />
                                <datalist id="carrier-list">
                                    {Object.keys(registry).map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                                <input 
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Final Expense"
                                    value={newProductData.product}
                                    onChange={(e) => setNewProductData({...newProductData, product: e.target.value})}
                                />
                            </div>
                            <button 
                                onClick={handleCreateProduct}
                                disabled={!newProductData.carrier || !newProductData.product}
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                Create & Configure Rates
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCommission;
