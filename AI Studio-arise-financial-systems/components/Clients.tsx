
import React, { useState } from 'react';
import { quickSummarize } from '../services/geminiService';
import { Client, PipelineStage, Policy, PolicyType, PolicyStatus } from '../types';
import { Search, MapPin, Phone, Mail, FileText, ChevronRight, ArrowLeft, Plus, X, Save, NotebookPen, Sparkles, Loader2, Filter, ChevronDown, ArrowUpDown, DollarSign, Wallet, Calendar, ShieldCheck, Edit2, Cake } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  currentUserId: string; // ID of the logged-in agent
  onUpdateClients: (clients: Client[]) => void;
  onSelectClient: (client: Client | null) => void;
  selectedClient: Client | null;
}

export const Clients: React.FC<ClientsProps> = ({ clients, currentUserId, onUpdateClients, onSelectClient, selectedClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NAME');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  // Note state
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // AI Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Policy Modal State (Add & Edit)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy>>({
      status: PolicyStatus.PENDING,
      startDate: new Date().toISOString().split('T')[0],
      type: PolicyType.TERM
  });

  // Helper to calculate total premium for sorting
  const getClientPremium = (client: Client) => client.policies.reduce((sum, p) => sum + p.premium, 0);

  const processedClients = clients
    .filter(c => {
        const matchesSearch = 
            c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || c.pipelineStage === statusFilter;

        return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
        if (sortBy === 'NAME') {
            return a.lastName.localeCompare(b.lastName);
        } else if (sortBy === 'RECENT') {
            return new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime();
        } else if (sortBy === 'PREMIUM') {
            return getClientPremium(b) - getClientPremium(a);
        }
        return 0;
    });

  const handleAddClient = () => {
    if (!newClient.firstName || !newClient.lastName) return;
    
    const client: Client = {
        id: Date.now().toString(),
        agentId: currentUserId,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
        phone: newClient.phone,
        address: 'Address Pending',
        policies: [],
        notes: 'New client added manually',
        pipelineStage: PipelineStage.NEW_LEAD,
        leadSource: 'Manual',
        lastContactDate: new Date().toISOString().split('T')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${newClient.firstName}+${newClient.lastName}&background=random`
    };
    
    onUpdateClients([client, ...clients]);
    setIsAddModalOpen(false);
    setNewClient({ firstName: '', lastName: '', email: '', phone: '' });
  };

  const startEditing = () => {
    if (selectedClient) {
        setEditForm({ ...selectedClient });
        setIsEditing(true);
    }
  };

  const saveEdit = () => {
    if (selectedClient && editForm) {
        const updatedClient = { ...selectedClient, ...editForm } as Client;
        onUpdateClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
        onSelectClient(updatedClient); // Update the parent view
        setIsEditing(false);
    }
  };

  const saveNewNote = () => {
    if (!selectedClient || !noteInput.trim()) return;
    
    const timestamp = new Date().toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newEntry = `[${timestamp}]\n${noteInput}`;
    // Prepend new note to keep latest at top
    const updatedNotes = selectedClient.notes 
        ? `${newEntry}\n\n${selectedClient.notes}` 
        : newEntry;
        
    const updatedClient = { ...selectedClient, notes: updatedNotes };
    
    // Update local list
    onUpdateClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    // Update parent selection
    onSelectClient(updatedClient);
    
    setNoteInput('');
    setIsAddingNote(false);
    setSummary(null); // Clear summary when new notes are added
  };
  
  const handleSummarize = async () => {
      if (!selectedClient?.notes) return;
      
      setIsSummarizing(true);
      try {
          const result = await quickSummarize(selectedClient.notes);
          setSummary(result);
      } catch (error) {
          console.error("Failed to summarize", error);
      } finally {
          setIsSummarizing(false);
      }
  };

  const handleOpenPolicyModal = (policy?: Policy) => {
      if (policy) {
          setEditingPolicy({ ...policy });
      } else {
          setEditingPolicy({
              status: PolicyStatus.PENDING,
              startDate: new Date().toISOString().split('T')[0],
              type: PolicyType.TERM
          });
      }
      setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = () => {
      if (!selectedClient || !editingPolicy.carrier || !editingPolicy.policyNumber) return;

      const annualPremium = Number(editingPolicy.premium) || 0;
      // Auto-calc commission if not provided (approx 90% default)
      const commission = Number(editingPolicy.commission) || (annualPremium * 0.9);

      const policyData: Policy = {
          id: editingPolicy.id || `pol-${Date.now()}`,
          type: editingPolicy.type || PolicyType.TERM,
          policyNumber: editingPolicy.policyNumber,
          carrier: editingPolicy.carrier,
          premium: annualPremium,
          coverageAmount: Number(editingPolicy.coverageAmount) || 0,
          commission: commission,
          startDate: editingPolicy.startDate || new Date().toISOString().split('T')[0],
          endDate: editingPolicy.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString().split('T')[0],
          status: editingPolicy.status || PolicyStatus.PENDING,
          productName: editingPolicy.productName || 'Manual Policy',
          isPaidOut: editingPolicy.status === PolicyStatus.ACTIVE // Assume active policies added manually are paid/in-force
      };

      let updatedPolicies;
      if (editingPolicy.id) {
          // Edit existing
          updatedPolicies = selectedClient.policies.map(p => p.id === editingPolicy.id ? policyData : p);
      } else {
          // Add new
          updatedPolicies = [policyData, ...selectedClient.policies];
      }

      const updatedClient = {
          ...selectedClient,
          pipelineStage: selectedClient.pipelineStage === PipelineStage.ISSUED ? PipelineStage.ISSUED : PipelineStage.ISSUED, // Ensure stage moves to Issued if adding policy
          policies: updatedPolicies
      };

      onUpdateClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
      onSelectClient(updatedClient); // Update local view
      setIsPolicyModalOpen(false);
      setEditingPolicy({});
  };

  if (selectedClient) {
    return (
      <div className="animate-fade-in space-y-6">
        <button 
          onClick={() => { onSelectClient(null); setIsEditing(false); setIsAddingNote(false); setSummary(null); }}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Contacts
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-6">
            <img 
              src={selectedClient.avatarUrl || `https://ui-avatars.com/api/?name=${selectedClient.firstName}+${selectedClient.lastName}`} 
              alt={`${selectedClient.firstName} ${selectedClient.lastName}`} 
              className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50"
            />
            <div className="flex-1 w-full">
              {isEditing ? (
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                      <input 
                        className="text-2xl font-bold text-slate-900 border-b border-gray-300 focus:border-indigo-500 outline-none pb-1 bg-white"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      />
                      <input 
                        className="text-2xl font-bold text-slate-900 border-b border-gray-300 focus:border-indigo-500 outline-none pb-1 bg-white"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      />
                  </div>
              ) : (
                  <h2 className="text-3xl font-bold text-slate-900">{selectedClient.firstName} {selectedClient.lastName}</h2>
              )}
              
              <div className="flex flex-wrap gap-4 mt-3 text-slate-500 text-sm">
                <div className="flex items-center">
                    <MapPin size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-gray-300 focus:border-indigo-500 outline-none bg-white text-slate-900"
                            value={editForm.address}
                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        />
                    ) : selectedClient.address}
                </div>
                <div className="flex items-center">
                    <Phone size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-gray-300 focus:border-indigo-500 outline-none bg-white text-slate-900"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        />
                    ) : selectedClient.phone}
                </div>
                <div className="flex items-center">
                    <Mail size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-gray-300 focus:border-indigo-500 outline-none bg-white text-slate-900 w-48"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        />
                    ) : selectedClient.email}
                </div>
                <div className="flex items-center">
                    <Cake size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-gray-300 focus:border-indigo-500 outline-none bg-white text-slate-900 w-32"
                            value={editForm.dateOfBirth || ''}
                            onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                            placeholder="YYYY-MM-DD"
                        />
                    ) : (selectedClient.dateOfBirth || 'DOB Pending')}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
               {isEditing ? (
                   <>
                       <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm">Cancel</button>
                       <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-sm flex items-center gap-2">
                           <Save size={16} /> Save
                       </button>
                   </>
               ) : (
                   <button onClick={startEditing} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors text-sm">
                     Edit Profile
                   </button>
               )}
               {!isEditing && (
                   <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-sm shadow-md shadow-indigo-200">
                     Contact
                   </button>
               )}
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Active Policies</h3>
                    <button 
                        onClick={() => handleOpenPolicyModal()}
                        className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                    >
                        <Plus size={14} /> Add Policy
                    </button>
                </div>
                <div className="space-y-4">
                    {selectedClient.policies.length === 0 ? (
                        <div className="p-6 border border-dashed border-gray-300 rounded-xl text-center text-gray-400">
                            No active policies. Client is a prospect.
                        </div>
                    ) : selectedClient.policies.map((policy) => {
                        const advancedCommission = policy.commission * 0.75;
                        const remainingCommission = policy.commission * 0.25;
                        const commPercentage = policy.premium > 0 ? Math.round((policy.commission / policy.premium) * 100) : 0;

                        return (
                          <div key={policy.id} className="border border-gray-200 rounded-xl p-5 hover:border-indigo-200 transition-colors group relative">
                              <button 
                                  onClick={() => handleOpenPolicyModal(policy)}
                                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit Policy"
                              >
                                  <Edit2 size={16} />
                              </button>
                              
                              <div className="flex justify-between items-start mb-2 pr-10">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                          <FileText size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800">{policy.type} Insurance</h4>
                                          <div className="flex items-center gap-2 text-sm text-slate-500">
                                              <span>{policy.carrier}</span>
                                              <span className="text-gray-300">•</span>
                                              <span className="font-mono text-slate-600 bg-gray-100 px-1.5 rounded text-xs">#{policy.policyNumber}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${policy.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {policy.status}
                                  </span>
                              </div>
                              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 border-b border-gray-100 pb-4 mb-4">
                                  <div>
                                      <span className="text-gray-400">Term:</span> {policy.startDate} - {policy.endDate}
                                  </div>
                                  <div className="font-semibold text-slate-900">
                                      ${policy.premium.toLocaleString()} / yr
                                  </div>
                              </div>
                              
                              {/* Commission Breakdown Section */}
                              <div className="bg-slate-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-3">
                                      <Wallet size={14} className="text-indigo-600" />
                                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Commission Breakdown</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                      <div className="bg-white p-2 rounded border border-gray-200 text-center">
                                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Total</p>
                                          <p className="font-bold text-slate-900">${policy.commission.toLocaleString()}</p>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-gray-200 text-center">
                                          <p className="text-[10px] text-gray-500 uppercase font-semibold">Comm %</p>
                                          <p className="font-bold text-indigo-600">{commPercentage}%</p>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded border border-green-100 text-center">
                                          <p className="text-[10px] text-green-700 uppercase font-semibold">Advance</p>
                                          <p className="font-bold text-green-700">${advancedCommission.toLocaleString()}</p>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded border border-blue-100 text-center">
                                          <p className="text-[10px] text-blue-700 uppercase font-semibold">Backend</p>
                                          <p className="font-bold text-blue-700">${remainingCommission.toLocaleString()}</p>
                                      </div>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                                      * Advance represents 9 months upfront. Backend paid months 10-12.
                                  </p>
                              </div>
                          </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Notes</h3>
                        {!isEditing && (
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleSummarize}
                                    disabled={isSummarizing || !selectedClient.notes}
                                    className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                                    title="Generate AI Summary"
                                >
                                    {isSummarizing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} 
                                    {isSummarizing ? 'Thinking...' : 'Summarize'}
                                </button>
                                <button 
                                    onClick={() => setIsAddingNote(!isAddingNote)}
                                    className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1"
                                >
                                    <NotebookPen size={14} /> {isAddingNote ? 'Cancel' : 'Add'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {summary && (
                        <div className="mb-4 bg-indigo-50 border border-indigo-100 p-3 rounded-lg animate-fade-in relative group">
                             <div className="flex items-center gap-2 mb-1">
                                 <Sparkles size={12} className="text-indigo-600" />
                                 <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">AI Summary</span>
                             </div>
                             <p className="text-sm text-indigo-900 leading-relaxed">{summary}</p>
                             <button 
                                onClick={() => setSummary(null)}
                                className="absolute top-2 right-2 text-indigo-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={14} />
                             </button>
                        </div>
                    )}

                    {isAddingNote && (
                        <div className="mb-4 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm animate-fade-in">
                            <textarea
                                className="w-full text-sm outline-none resize-none mb-2 p-1 bg-white text-slate-900"
                                rows={3}
                                placeholder="Type a new note..."
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsAddingNote(false)}
                                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={saveNewNote}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md font-medium hover:bg-indigo-700"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    )}

                    {isEditing ? (
                        <textarea 
                            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                            rows={8}
                            value={editForm.notes}
                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        />
                    ) : (
                        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {selectedClient.notes ? (
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedClient.notes}
                                </p>
                            ) : (
                                <p className="text-gray-400 text-sm italic">No notes yet.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                         <h3 className="font-bold text-lg mb-2">Up-sell Opportunity</h3>
                         <p className="text-indigo-100 text-sm mb-4">
                             Based on the client's current IUL policy, they might benefit from a Critical Illness rider or Final Expense policy for family members.
                         </p>
                         <button className="w-full py-2 bg-white text-indigo-600 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors">
                             Generate Proposal
                         </button>
                    </div>
                    <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white opacity-10 rounded-full"></div>
                </div>
            </div>
          </div>
        </div>

        {/* Policy Modal (Add/Edit) */}
        {isPolicyModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-md">
                <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-lg ring-1 ring-black/5 flex flex-col max-h-[90vh] animate-fade-in">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-indigo-600" /> {editingPolicy.id ? 'Edit Policy' : 'Add New Policy'}
                        </h3>
                        <button onClick={() => setIsPolicyModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    placeholder="e.g. Mutual of Omaha"
                                    value={editingPolicy.carrier || ''}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, carrier: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    value={editingPolicy.type}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, type: e.target.value as PolicyType})}
                                >
                                    {Object.values(PolicyType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input 
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                placeholder="e.g. Living Promise Graded"
                                value={editingPolicy.productName || ''}
                                onChange={(e) => setEditingPolicy({...editingPolicy, productName: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    placeholder="Enter policy #"
                                    value={editingPolicy.policyNumber || ''}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, policyNumber: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    value={editingPolicy.status}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, status: e.target.value as PolicyStatus})}
                                >
                                    {Object.values(PolicyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <div className="relative">
                                    <input 
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editingPolicy.startDate}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, startDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <div className="relative">
                                    <input 
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editingPolicy.endDate || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, endDate: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Annual Premium</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editingPolicy.premium || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, premium: parseFloat(e.target.value)})}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Coverage</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editingPolicy.coverageAmount || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, coverageAmount: parseFloat(e.target.value)})}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editingPolicy.commission || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, commission: parseFloat(e.target.value)})}
                                        placeholder="Auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3 shrink-0">
                        <button 
                            onClick={() => setIsPolicyModalOpen(false)}
                            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSavePolicy}
                            disabled={!editingPolicy.carrier || !editingPolicy.policyNumber}
                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} /> Save Policy
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- List View (Default) ---
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">My Contacts</h2>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search name, email, phone..." 
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="relative">
                <select 
                    className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    {Object.values(PipelineStage).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            <div className="relative">
                <select 
                    className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-700 cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="NAME">Sort by Name</option>
                    <option value="RECENT">Sort by Recent</option>
                    <option value="PREMIUM">Sort by Premium</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
                <Plus size={16} /> Add Contact
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Contact Info</th>
                        <th className="px-6 py-4">Stage</th>
                        <th className="px-6 py-4">Policies</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {processedClients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                No clients found matching your search.
                            </td>
                        </tr>
                    ) : processedClients.map((client) => (
                        <tr 
                            key={client.id} 
                            onClick={() => onSelectClient(client)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={client.avatarUrl || `https://ui-avatars.com/api/?name=${client.firstName}+${client.lastName}`} 
                                        alt="" 
                                        className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{client.firstName} {client.lastName}</div>
                                        <div className="text-xs text-gray-500">Added: {client.lastContactDate}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-gray-400" />
                                        {client.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        {client.phone}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    client.pipelineStage === PipelineStage.ISSUED ? 'bg-green-100 text-green-700' :
                                    client.pipelineStage === PipelineStage.NEW_LEAD ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {client.pipelineStage}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-gray-400" />
                                    <span className="text-sm font-medium text-slate-700">{client.policies.length} Policies</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight className="inline-block text-gray-300 group-hover:text-indigo-500 transition-colors" size={20} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md ring-1 ring-black/5 flex flex-col">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-xl text-slate-800">Add New Contact</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={newClient.firstName}
                                onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={newClient.lastName}
                                onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={newClient.email}
                            onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input 
                            type="tel" 
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        />
                    </div>
                    
                    <button 
                        onClick={handleAddClient}
                        disabled={!newClient.firstName || !newClient.lastName}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 mt-2"
                    >
                        Create Contact
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
