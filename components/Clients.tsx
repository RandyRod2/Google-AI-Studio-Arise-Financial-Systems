import React, { useState } from 'react';
import { quickSummarize } from '../services/geminiService';
import { Client, PipelineStage, Policy, PolicyType, PolicyStatus, TeamMember, Beneficiary } from '../types';
import { Search, MapPin, Phone, Mail, FileText, ChevronRight, ArrowLeft, Plus, X, Save, NotebookPen, Sparkles, Loader2, Filter, ChevronDown, ArrowUpDown, DollarSign, Wallet, Calendar, ShieldCheck, Edit2, Cake, Trash2, Tag, Layers, Users, Activity, AlertCircle } from 'lucide-react';
import { calculateCommissionExact } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

interface ClientsProps {
  clients: Client[];
  currentUserId: string; // ID of the logged-in agent
  onUpdateClients: (clients: Client[]) => void;
  onSelectClient: (client: Client | null) => void;
  selectedClient: Client | null;
}

// Helper for local date string
const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Masking helpers for sensitive data
const maskSSN = (ssn?: string) => {
  if (!ssn) return 'N/A';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length < 4) return ssn;
  return `***-**-${digits.slice(-4)}`;
};

const maskAccount = (acc?: string) => {
  if (!acc) return 'N/A';
  if (acc.length < 4) return acc;
  return `****${acc.slice(-4)}`;
};

const maskCard = (card?: string) => {
  if (!card) return 'N/A';
  const digits = card.replace(/\D/g, '');
  if (digits.length < 4) return card;
  return `**** **** **** ${digits.slice(-4)}`;
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const Clients: React.FC<ClientsProps> = ({ clients, currentUserId, onUpdateClients, onSelectClient, selectedClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NAME');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  
  // Edit mode state (Profile)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  // Note state
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesBuffer, setNotesBuffer] = useState('');
  
  // AI Summary state
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Policy Modal State (Add & Edit)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Partial<Policy>>({
      status: PolicyStatus.PENDING,
      startDate: getLocalToday(),
      submittedDate: getLocalToday(),
      type: PolicyType.TERM
  });
  const [termLength, setTermLength] = useState<number>(20);

  // Load ALL Team Members to find the correct agent for each client
  const [teamMembers] = useState<TeamMember[]>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            return saved ? JSON.parse(saved) : MOCK_TEAM;
        } catch { return MOCK_TEAM; }
  });

  const getAgentForClient = (clientId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return teamMembers[0];
      return teamMembers.find(m => m.id === client.agentId) || teamMembers[0];
  };

  // Helper to calculate total premium for sorting
  const getClientPremium = (client: Client) => client.policies.reduce((sum, p) => sum + p.premium, 0);

  const getBeneficiaryTotals = (beneficiaries: Beneficiary[] = []) => {
      const primary = beneficiaries.filter(b => b.type === 'Primary').reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);
      const contingent = beneficiaries.filter(b => b.type === 'Contingent').reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);
      return { primary, contingent };
  };

  const handleAddBeneficiary = () => {
      if (!selectedClient) return;
      const newBeneficiary: Beneficiary = {
          id: `ben-${Date.now()}`,
          clientId: selectedClient.id,
          name: '',
          relationship: '',
          type: 'Primary',
          percentage: 0
      };
      const currentBeneficiaries = editForm.beneficiaries || [];
      setEditForm({ ...editForm, beneficiaries: [...currentBeneficiaries, newBeneficiary] });
  };

  const handleRemoveBeneficiary = (id: string) => {
      const currentBeneficiaries = editForm.beneficiaries || [];
      setEditForm({ ...editForm, beneficiaries: currentBeneficiaries.filter(b => b.id !== id) });
  };

  const handleUpdateBeneficiary = (id: string, updates: Partial<Beneficiary>) => {
      const currentBeneficiaries = editForm.beneficiaries || [];
      setEditForm({
          ...editForm,
          beneficiaries: currentBeneficiaries.map(b => b.id === id ? { ...b, ...updates } : b)
      });
  };

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
            beneficiaries: [],
            notes: 'New client added manually',
            pipelineStage: PipelineStage.NEW_LEAD,
            leadSource: 'Manual',
            lastContactDate: getLocalToday(),
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

  const handleStartEditNotes = () => {
      if (selectedClient) {
          setNotesBuffer(selectedClient.notes || '');
          setIsEditingNotes(true);
          setIsAddingNote(false); // Close add mode if open
      }
  };

  const handleSaveNotes = () => {
      if (selectedClient) {
          const updatedClient = { ...selectedClient, notes: notesBuffer };
          onUpdateClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
          onSelectClient(updatedClient);
          setIsEditingNotes(false);
      }
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
          if (policy.type === PolicyType.TERM && policy.startDate && policy.endDate) {
              const startYear = new Date(policy.startDate).getFullYear();
              const endYear = new Date(policy.endDate).getFullYear();
              const diff = endYear - startYear;
              setTermLength(diff > 0 ? Math.round(diff / 5) * 5 : 20); // Approx to nearest 5
          } else {
              setTermLength(20);
          }
      } else {
          setEditingPolicy({
              status: PolicyStatus.PENDING,
              startDate: getLocalToday(),
              submittedDate: getLocalToday(),
              type: PolicyType.TERM
          });
          setTermLength(20);
      }
      setIsPolicyModalOpen(true);
  };

  const handleDeletePolicy = (policyId: string) => {
      if (!selectedClient) return;
      if (window.confirm("Are you sure you want to delete this policy?")) {
          const updatedPolicies = selectedClient.policies.filter(p => p.id !== policyId);
          const updatedClient = { ...selectedClient, policies: updatedPolicies };
          onUpdateClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
          onSelectClient(updatedClient);
      }
  };

  const handleSavePolicy = () => {
      if (!selectedClient || !editingPolicy.carrier || !editingPolicy.policyNumber) return;

      const annualPremium = Number(editingPolicy.premium) || 0;
      
      // Calculate Commission Dynamically
      const carrier = editingPolicy.carrier;
      const product = editingPolicy.productName || 'Default';
      
      // Get the correct agent profile for this client
      const agentProfile = getAgentForClient(selectedClient.id);
      const compLevel = agentProfile.carrierCompLevels?.[carrier] || agentProfile.defaultCompLevel || 100;
      
      const { total } = calculateCommissionExact(carrier, product, annualPremium, compLevel);
      
      // Use calculated commission
      const commission = total;

      let endDate = editingPolicy.endDate;
      const startDate = editingPolicy.startDate || getLocalToday();

      if (editingPolicy.type === PolicyType.TERM) {
          const start = new Date(startDate);
          start.setFullYear(start.getFullYear() + termLength);
          endDate = start.toISOString().split('T')[0];
      } else {
          // Default for perm products (Age 100+)
          const start = new Date(startDate);
          start.setFullYear(start.getFullYear() + 100); 
          endDate = start.toISOString().split('T')[0];
      }

      // Auto-Activate Status check
      const todayStr = getLocalToday();
      const isFuture = startDate > todayStr;
      
      let finalStatus = editingPolicy.status || PolicyStatus.PENDING;

      if (isFuture) {
          if (finalStatus === PolicyStatus.ACTIVE) {
              finalStatus = PolicyStatus.APPROVED;
          }
      } else {
          if (finalStatus === PolicyStatus.PENDING || finalStatus === PolicyStatus.APPROVED) {
              finalStatus = PolicyStatus.ACTIVE;
          }
      }

      const policyData: Policy = {
          id: editingPolicy.id || `pol-${Date.now()}`,
          type: editingPolicy.type || PolicyType.TERM,
          policyNumber: editingPolicy.policyNumber,
          carrier: editingPolicy.carrier,
          premium: annualPremium,
          coverageAmount: Number(editingPolicy.coverageAmount) || 0,
          commission: commission,
          startDate: startDate,
          submittedDate: editingPolicy.submittedDate || getLocalToday(),
          endDate: endDate,
          status: finalStatus,
          productName: editingPolicy.productName || 'Manual Policy',
          isPaidOut: finalStatus === PolicyStatus.ACTIVE 
      };

      let updatedPolicies;
      if (editingPolicy.id) {
          updatedPolicies = selectedClient.policies.map(p => p.id === editingPolicy.id ? policyData : p);
      } else {
          updatedPolicies = [policyData, ...selectedClient.policies];
      }

      const updatedClient = {
          ...selectedClient,
          pipelineStage: selectedClient.pipelineStage === PipelineStage.ISSUED ? PipelineStage.ISSUED : PipelineStage.ISSUED, 
          policies: updatedPolicies
      };

      onUpdateClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
      onSelectClient(updatedClient); 
      setIsPolicyModalOpen(false);
      setEditingPolicy({});
  };

  if (selectedClient) {
    return (
      <div className="animate-fade-in space-y-6">
        <button 
          onClick={() => { onSelectClient(null); setIsEditing(false); setIsAddingNote(false); setIsEditingNotes(false); setSummary(null); }}
          className="flex items-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Contacts
        </button>

        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-sm border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center gap-6 bg-white/5">
            <img 
              src={selectedClient.avatarUrl || `https://ui-avatars.com/api/?name=${selectedClient.firstName}+${selectedClient.lastName}`} 
              alt={`${selectedClient.firstName} ${selectedClient.lastName}`} 
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20"
            />
            <div className="flex-1 w-full">
              {isEditing ? (
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                      <input 
                        className="text-2xl font-bold text-white border-b border-slate-600 focus:border-blue-500 outline-none pb-1 bg-transparent"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      />
                      <input 
                        className="text-2xl font-bold text-white border-b border-slate-600 focus:border-blue-500 outline-none pb-1 bg-transparent"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      />
                  </div>
              ) : (
                  <h2 className="text-3xl font-bold text-white text-shadow-sm">{selectedClient.firstName} {selectedClient.lastName}</h2>
              )}
              
              <div className="flex flex-wrap gap-4 mt-3 text-slate-400 text-sm">
                <div className="flex items-center">
                    <MapPin size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-slate-600 focus:border-blue-500 outline-none bg-transparent text-white"
                            value={editForm.address}
                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        />
                    ) : selectedClient.address}
                </div>
                <div className="flex items-center">
                    <Phone size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-slate-600 focus:border-blue-500 outline-none bg-transparent text-white"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        />
                    ) : selectedClient.phone}
                </div>
                <div className="flex items-center">
                    <Mail size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-slate-600 focus:border-blue-500 outline-none bg-transparent text-white w-48"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        />
                    ) : selectedClient.email}
                </div>
                <div className="flex items-center">
                    <Cake size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-slate-600 focus:border-blue-500 outline-none bg-transparent text-white w-32"
                            value={editForm.dateOfBirth || ''}
                            onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                            placeholder="YYYY-MM-DD"
                        />
                    ) : (selectedClient.dateOfBirth || 'DOB Pending')}
                </div>
                <div className="flex items-center">
                    <Tag size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <input 
                            className="border-b border-slate-600 focus:border-blue-500 outline-none bg-transparent text-white w-32"
                            value={editForm.leadSource || ''}
                            onChange={(e) => setEditForm({...editForm, leadSource: e.target.value})}
                            placeholder="Lead Source"
                        />
                    ) : (selectedClient.leadSource || 'Source Pending')}
                </div>
                <div className="flex items-center">
                    <Layers size={16} className="mr-1.5" /> 
                    {isEditing ? (
                        <select 
                            className="border-b border-slate-600 focus:border-blue-500 outline-none bg-slate-900 text-white text-xs"
                            value={editForm.leadType || ''}
                            onChange={(e) => setEditForm({...editForm, leadType: e.target.value as any})}
                        >
                            <option value="">Type...</option>
                            <option value="FEX">Final Expense</option>
                            <option value="MP">Mortgage Protection</option>
                            <option value="IUL">IUL / Wealth</option>
                            <option value="VET">Veteran</option>
                        </select>
                    ) : (selectedClient.leadType || 'Type Pending')}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
               {isEditing ? (
                   <>
                       <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition-colors text-sm">Cancel</button>
                       <button 
                           onClick={saveEdit} 
                           disabled={
                               (editForm.beneficiaries || []).length > 0 && (
                                   ((editForm.beneficiaries || []).some(b => b.type === 'Primary') && getBeneficiaryTotals(editForm.beneficiaries).primary !== 100) ||
                                   ((editForm.beneficiaries || []).some(b => b.type === 'Contingent') && getBeneficiaryTotals(editForm.beneficiaries).contingent !== 100)
                               )
                           }
                           className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm flex items-center gap-2"
                       >
                           <Save size={16} /> Save
                       </button>
                   </>
               ) : (
                   <button onClick={startEditing} className="px-4 py-2 bg-slate-800/50 text-blue-400 rounded-lg hover:bg-slate-700 font-medium transition-colors text-sm border border-slate-700">
                     Edit Profile
                   </button>
               )}
               {!isEditing && (
                   <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm shadow-md shadow-blue-900/50">
                     Contact
                   </button>
               )}
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Application Information Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Identification */}
                    <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={18} className="text-blue-500" />
                            <h3 className="font-semibold text-white">Personal Identification</h3>
                        </div>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">SSN</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                        value={editForm.ssn || ''}
                                        onChange={(e) => setEditForm({...editForm, ssn: e.target.value})}
                                        placeholder="XXX-XX-XXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Driver's License</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                        value={editForm.driversLicense || ''}
                                        onChange={(e) => setEditForm({...editForm, driversLicense: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Height</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                            value={editForm.height || ''}
                                            onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                                            placeholder="5'10''"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Weight (lbs)</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                            value={editForm.weight || ''}
                                            onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Occupation</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                        value={editForm.occupation || ''}
                                        onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-y-3 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs">SSN</p>
                                    <p className="text-slate-200 font-mono">{maskSSN(selectedClient.ssn)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Driver's License</p>
                                    <p className="text-slate-200">{selectedClient.driversLicense || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Height / Weight</p>
                                    <p className="text-slate-200">{selectedClient.height || '--'} / {selectedClient.weight || '--'} lbs</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Occupation</p>
                                    <p className="text-slate-200">{selectedClient.occupation || 'N/A'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Beneficiary Information */}
                    <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-blue-500" />
                                <h3 className="font-semibold text-white">Beneficiary Information</h3>
                            </div>
                            {isEditing && (
                                <button 
                                    onClick={handleAddBeneficiary}
                                    className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={12} /> Add Beneficiary
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="space-y-6">
                                {/* Primary Group */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Beneficiaries</h4>
                                        <span className={`text-xs font-mono ${(getBeneficiaryTotals(editForm.beneficiaries).primary === 100) ? 'text-green-400' : 'text-amber-400'}`}>
                                            Total: {getBeneficiaryTotals(editForm.beneficiaries).primary}%
                                        </span>
                                    </div>
                                    {(editForm.beneficiaries || []).filter(b => b.type === 'Primary').length === 0 && (
                                        <p className="text-xs text-slate-600 italic">No primary beneficiaries added.</p>
                                    )}
                                    {(editForm.beneficiaries || []).filter(b => b.type === 'Primary').map((ben) => (
                                        <div key={ben.id} className="bg-slate-950/50 p-3 rounded-lg border border-white/5 space-y-3 relative group">
                                            <button 
                                                onClick={() => handleRemoveBeneficiary(ben.id)}
                                                className="absolute top-2 right-2 text-slate-600 hover:text-red-400 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Full Name</label>
                                                    <input 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.name}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { name: e.target.value })}
                                                        placeholder="Beneficiary Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Relationship</label>
                                                    <input 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.relationship}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { relationship: e.target.value })}
                                                        placeholder="e.g. Spouse"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Type</label>
                                                    <select 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.type}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { type: e.target.value as any })}
                                                    >
                                                        <option value="Primary">Primary</option>
                                                        <option value="Contingent">Contingent</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Allocation (%)</label>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.percentage}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { percentage: Number(e.target.value) })}
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Contingent Group */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contingent Beneficiaries</h4>
                                        <span className={`text-xs font-mono ${(getBeneficiaryTotals(editForm.beneficiaries).contingent === 100) ? 'text-green-400' : 'text-amber-400'}`}>
                                            Total: {getBeneficiaryTotals(editForm.beneficiaries).contingent}%
                                        </span>
                                    </div>
                                    {(editForm.beneficiaries || []).filter(b => b.type === 'Contingent').length === 0 && (
                                        <p className="text-xs text-slate-600 italic">No contingent beneficiaries added.</p>
                                    )}
                                    {(editForm.beneficiaries || []).filter(b => b.type === 'Contingent').map((ben) => (
                                        <div key={ben.id} className="bg-slate-950/50 p-3 rounded-lg border border-white/5 space-y-3 relative group">
                                            <button 
                                                onClick={() => handleRemoveBeneficiary(ben.id)}
                                                className="absolute top-2 right-2 text-slate-600 hover:text-red-400 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Full Name</label>
                                                    <input 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.name}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { name: e.target.value })}
                                                        placeholder="Beneficiary Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Relationship</label>
                                                    <input 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.relationship}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { relationship: e.target.value })}
                                                        placeholder="e.g. Spouse"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Type</label>
                                                    <select 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.type}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { type: e.target.value as any })}
                                                    >
                                                        <option value="Primary">Primary</option>
                                                        <option value="Contingent">Contingent</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1 uppercase">Allocation (%)</label>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                        value={ben.percentage}
                                                        onChange={(e) => handleUpdateBeneficiary(ben.id, { percentage: Number(e.target.value) })}
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {(getBeneficiaryTotals(editForm.beneficiaries).primary !== 100 || getBeneficiaryTotals(editForm.beneficiaries).contingent !== 100) && (
                                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-2 text-amber-400 text-[10px]">
                                        <AlertCircle size={14} />
                                        <span>Allocations must sum to 100% for both Primary and Contingent groups.</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Primary View */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary</h4>
                                        <span className="text-[10px] text-slate-400">{getBeneficiaryTotals(selectedClient.beneficiaries).primary}% Total</span>
                                    </div>
                                    {(!selectedClient.beneficiaries || selectedClient.beneficiaries.filter(b => b.type === 'Primary').length === 0) ? (
                                        <p className="text-xs text-slate-600 italic">None listed.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedClient.beneficiaries.filter(b => b.type === 'Primary').map(ben => (
                                                <div key={ben.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{ben.name}</p>
                                                        <p className="text-xs text-slate-500">{ben.relationship}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-mono text-blue-400">{ben.percentage}%</p>
                                                        <p className="text-[10px] text-slate-600 uppercase">Allocation</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Contingent View */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contingent</h4>
                                        <span className="text-[10px] text-slate-400">{getBeneficiaryTotals(selectedClient.beneficiaries).contingent}% Total</span>
                                    </div>
                                    {(!selectedClient.beneficiaries || selectedClient.beneficiaries.filter(b => b.type === 'Contingent').length === 0) ? (
                                        <p className="text-xs text-slate-600 italic">None listed.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {selectedClient.beneficiaries.filter(b => b.type === 'Contingent').map(ben => (
                                                <div key={ben.id} className="bg-white/5 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{ben.name}</p>
                                                        <p className="text-xs text-slate-500">{ben.relationship}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-mono text-blue-400">{ben.percentage}%</p>
                                                        <p className="text-[10px] text-slate-600 uppercase">Allocation</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Health Information */}
                    <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={18} className="text-blue-500" />
                            <h3 className="font-semibold text-white">Health Information</h3>
                        </div>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Health Conditions</label>
                                    <textarea 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                        rows={2}
                                        value={editForm.healthConditions || ''}
                                        onChange={(e) => setEditForm({...editForm, healthConditions: e.target.value})}
                                        placeholder="List any major health conditions..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Current Prescriptions</label>
                                    <textarea 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                        rows={2}
                                        value={editForm.currentPrescriptions || ''}
                                        onChange={(e) => setEditForm({...editForm, currentPrescriptions: e.target.value})}
                                        placeholder="List current medications..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs">Conditions</p>
                                    <p className="text-slate-200 line-clamp-2">{selectedClient.healthConditions || 'None reported'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Prescriptions</p>
                                    <p className="text-slate-200 line-clamp-2">{selectedClient.currentPrescriptions || 'None reported'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Information */}
                    <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-blue-500" />
                            <h3 className="font-semibold text-white">Payment Information</h3>
                        </div>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Payment Method</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                        value={editForm.paymentMethod || ''}
                                        onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value as any})}
                                    >
                                        <option value="">Select Method</option>
                                        <option value="Bank Draft">Bank Draft</option>
                                        <option value="Credit Card">Credit Card</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Draft Date</label>
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                        value={editForm.draftDate || ''}
                                        onChange={(e) => setEditForm({...editForm, draftDate: e.target.value})}
                                    >
                                        <option value="">Select Date</option>
                                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day.toString()}>
                                                {getOrdinal(day)} of the month
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {editForm.paymentMethod === 'Bank Draft' && (
                                    <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Bank Name</label>
                                            <input 
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                value={editForm.bankName || ''}
                                                onChange={(e) => setEditForm({...editForm, bankName: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Routing Number</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={editForm.routingNumber || ''}
                                                    onChange={(e) => setEditForm({...editForm, routingNumber: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Account Number</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={editForm.accountNumber || ''}
                                                    onChange={(e) => setEditForm({...editForm, accountNumber: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {editForm.paymentMethod === 'Credit Card' && (
                                    <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Card Number</label>
                                            <input 
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                value={editForm.cardNumber || ''}
                                                onChange={(e) => setEditForm({...editForm, cardNumber: e.target.value})}
                                                placeholder="XXXX XXXX XXXX XXXX"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-1">
                                                <label className="block text-xs text-slate-500 mb-1">Exp Date</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={editForm.expirationDate || ''}
                                                    onChange={(e) => setEditForm({...editForm, expirationDate: e.target.value})}
                                                    placeholder="MM/YY"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-xs text-slate-500 mb-1">CVV</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={editForm.cvv || ''}
                                                    onChange={(e) => setEditForm({...editForm, cvv: e.target.value})}
                                                    placeholder="123"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-xs text-slate-500 mb-1">Zip Code</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={editForm.billingZipCode || ''}
                                                    onChange={(e) => setEditForm({...editForm, billingZipCode: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs">Method</p>
                                    <p className="text-slate-200">{selectedClient.paymentMethod || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Draft Date</p>
                                    <p className="text-slate-200">
                                        {selectedClient.draftDate ? `${getOrdinal(parseInt(selectedClient.draftDate))} of the month` : 'Not set'}
                                    </p>
                                </div>
                                {selectedClient.paymentMethod === 'Bank Draft' && (
                                    <div className="grid grid-cols-2 gap-y-3 border-t border-white/5 pt-3">
                                        <div>
                                            <p className="text-slate-500 text-xs">Bank</p>
                                            <p className="text-slate-200">{selectedClient.bankName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs">Routing</p>
                                            <p className="text-slate-200 font-mono">{selectedClient.routingNumber || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-slate-500 text-xs">Account Number</p>
                                            <p className="text-slate-200 font-mono">{maskAccount(selectedClient.accountNumber)}</p>
                                        </div>
                                    </div>
                                )}
                                {selectedClient.paymentMethod === 'Credit Card' && (
                                    <div className="grid grid-cols-2 gap-y-3 border-t border-white/5 pt-3">
                                        <div className="col-span-2">
                                            <p className="text-slate-500 text-xs">Card Number</p>
                                            <p className="text-slate-200 font-mono">{maskCard(selectedClient.cardNumber)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs">Expires</p>
                                            <p className="text-slate-200">{selectedClient.expirationDate || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs">Billing Zip</p>
                                            <p className="text-slate-200">{selectedClient.billingZipCode || 'N/A'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Active Policies</h3>
                    <button 
                        onClick={() => handleOpenPolicyModal()}
                        className="text-sm text-blue-400 font-medium hover:underline flex items-center gap-1 hover:text-blue-300"
                    >
                        <Plus size={14} /> Add Policy
                    </button>
                </div>
                <div className="space-y-4">
                    {selectedClient.policies.length === 0 ? (
                        <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-slate-500 bg-white/5">
                            No active policies. Client is a prospect.
                        </div>
                    ) : selectedClient.policies.map((policy) => {
                        // Calculate metrics using registry AND correct agent level
                        const carrier = policy.carrier;
                        const product = policy.productName || '';
                        
                        const agentProfile = getAgentForClient(selectedClient.id);
                        const compLevel = agentProfile.carrierCompLevels?.[carrier] || agentProfile.defaultCompLevel || 100;
                        
                        const { total: calcCommission, fycRate } = calculateCommissionExact(carrier, product, policy.premium, compLevel);
                        
                        // Use calculated commission for display consistency
                        const displayComm = calcCommission;
                        const commPercentage = (fycRate * 100).toFixed(0);
                        const advancedCommission = displayComm * 0.75;
                        const remainingCommission = displayComm * 0.25;

                        return (
                          <div key={policy.id} className="border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-colors group relative bg-slate-900/40">
                              <div className="absolute top-4 right-4 flex items-center gap-2">
                                  <button 
                                      onClick={() => handleOpenPolicyModal(policy)}
                                      className="p-2 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
                                      title="Edit Policy"
                                  >
                                      <Edit2 size={16} />
                                  </button>
                                  <button 
                                      onClick={() => handleDeletePolicy(policy.id)}
                                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                      title="Delete Policy"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                              
                              <div className="flex justify-between items-start mb-2 pr-20">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                                          <FileText size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-white">{policy.type} Insurance</h4>
                                          <div className="flex items-center gap-2 text-sm text-slate-400">
                                              <span>{policy.carrier}</span>
                                              <span className="text-slate-600">•</span>
                                              <span className="font-mono text-slate-400 bg-slate-800/50 px-1.5 rounded text-xs">#{policy.policyNumber}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                      policy.status === PolicyStatus.ACTIVE ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                      policy.status === PolicyStatus.APPROVED ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                      {policy.status}
                                  </span>
                              </div>
                               <div className="mt-4 flex flex-col gap-2 text-sm text-slate-400 border-b border-white/5 pb-4 mb-4">
                                   <div className="flex justify-between items-center">
                                  <div>
                                      <span className="text-slate-500">Term:</span> {policy.startDate} - {policy.endDate}
                                  </div>
                                  <div className="font-semibold text-white">
                                      ${policy.premium.toLocaleString()} / yr
                                  </div>
                              </div>
                              
                              {/* Commission Breakdown Section */}
                              <div className="bg-slate-950/50 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center gap-2 mb-3">
                                      <Wallet size={14} className="text-blue-500" />
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Commission Breakdown</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                      <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Total</p>
                                          <p className="font-bold text-white">${displayComm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                      </div>
                                      <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                                          <p className="text-[10px] text-slate-500 uppercase font-semibold">Rate</p>
                                          <p className="font-bold text-blue-400">{commPercentage}%</p>
                                      </div>
                                      <div className="bg-green-900/10 p-2 rounded border border-green-900/30 text-center">
                                          <p className="text-[10px] text-green-500 uppercase font-semibold">Advance</p>
                                          <p className="font-bold text-green-400">${advancedCommission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                      </div>
                                      <div className="bg-blue-900/10 p-2 rounded border border-blue-900/30 text-center">
                                          <p className="text-[10px] text-blue-500 uppercase font-semibold">Backend</p>
                                          <p className="font-bold text-blue-400">${remainingCommission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                      </div>
                                  </div>
                                  <p className="text-[10px] text-slate-600 mt-2 text-center">
                                      * Calculated based on contract level ({compLevel}%) for {agentProfile.name}.
                                  </p>
                              </div>
                          </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Notes</h3>
                        {!isEditing && !isEditingNotes && (
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleSummarize}
                                    disabled={isSummarizing || !selectedClient.notes}
                                    className="text-sm text-blue-400 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                                    title="Generate AI Summary"
                                >
                                    {isSummarizing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} 
                                    {isSummarizing ? 'Thinking...' : 'Summarize'}
                                </button>
                                <button
                                    onClick={handleStartEditNotes}
                                    className="text-sm text-blue-400 font-medium hover:underline flex items-center gap-1"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                    onClick={() => setIsAddingNote(!isAddingNote)}
                                    className="text-sm text-blue-400 font-medium hover:underline flex items-center gap-1"
                                >
                                    <NotebookPen size={14} /> {isAddingNote ? 'Cancel' : 'Add'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {summary && (
                        <div className="mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg animate-fade-in relative group">
                             <div className="flex items-center gap-2 mb-1">
                                 <Sparkles size={12} className="text-blue-400" />
                                 <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">AI Summary</span>
                             </div>
                             <p className="text-sm text-blue-200 leading-relaxed">{summary}</p>
                             <button 
                                onClick={() => setSummary(null)}
                                className="absolute top-2 right-2 text-blue-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={14} />
                             </button>
                        </div>
                    )}

                    {!isEditingNotes && isAddingNote && (
                        <div className="mb-4 bg-slate-950 p-3 rounded-lg border border-blue-500/30 shadow-sm animate-fade-in">
                            <textarea
                                className="w-full text-sm outline-none resize-none mb-2 p-1 bg-slate-950 text-white placeholder-slate-500"
                                rows={3}
                                placeholder="Type a new note..."
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsAddingNote(false)}
                                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={saveNewNote}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium hover:bg-blue-700"
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    )}

                    {isEditingNotes ? (
                        <div className="animate-fade-in">
                            <textarea 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white mb-3"
                                rows={8}
                                value={notesBuffer}
                                onChange={(e) => setNotesBuffer(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsEditingNotes(false)}
                                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveNotes}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : isEditing ? (
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white"
                            rows={8}
                            value={editForm.notes}
                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        />
                    ) : (
                        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {selectedClient.notes ? (
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedClient.notes}
                                </p>
                            ) : (
                                <p className="text-slate-600 text-sm italic">No notes yet.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                         <h3 className="font-bold text-lg mb-2">Up-sell Opportunity</h3>
                         <p className="text-blue-100 text-sm mb-4">
                             Based on the client's current IUL policy, they might benefit from a Critical Illness rider or Final Expense policy for family members.
                         </p>
                         <button className="w-full py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
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
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-lg ring-1 ring-white/10 flex flex-col max-h-[90vh] animate-fade-in">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                        <h3 className="font-bold text-xl text-white flex items-center gap-2">
                            <ShieldCheck size={20} className="text-blue-500" /> {editingPolicy.id ? 'Edit Policy' : 'Add New Policy'}
                        </h3>
                        <button onClick={() => setIsPolicyModalOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Carrier</label>
                                <input 
                                    type="text"
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                                    placeholder="e.g. Mutual of Omaha"
                                    value={editingPolicy.carrier || ''}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, carrier: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Policy Type</label>
                                <select 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                    value={editingPolicy.type}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, type: e.target.value as PolicyType})}
                                >
                                    {Object.values(PolicyType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                            <input 
                                type="text"
                                className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                                placeholder="e.g. Living Promise Graded"
                                value={editingPolicy.productName || ''}
                                onChange={(e) => setEditingPolicy({...editingPolicy, productName: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Policy Number</label>
                                <input 
                                    type="text"
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                                    placeholder="Enter policy #"
                                    value={editingPolicy.policyNumber || ''}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, policyNumber: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                <select 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                    value={editingPolicy.status}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, status: e.target.value as PolicyStatus})}
                                >
                                    {Object.values(PolicyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Submitted Date</label>
                                <input 
                                    type="date"
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                    value={editingPolicy.submittedDate || ''}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, submittedDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                                <div className="relative">
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={editingPolicy.startDate}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, startDate: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Draft Date</label>
                                <select 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                    value={editingPolicy.draftDate || ''}
                                    onChange={(e) => setEditingPolicy({...editingPolicy, draftDate: e.target.value})}
                                >
                                    <option value="">Select Date</option>
                                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                        <option key={day} value={day.toString()}>
                                            {getOrdinal(day)} of the month
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {editingPolicy.type === PolicyType.TERM && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Term Length (Years)</label>
                                <select 
                                    className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                    value={termLength}
                                    onChange={(e) => setTermLength(Number(e.target.value))}
                                >
                                    <option value={10}>10 Years</option>
                                    <option value={15}>15 Years</option>
                                    <option value={20}>20 Years</option>
                                    <option value={25}>25 Years</option>
                                    <option value={30}>30 Years</option>
                                    <option value={35}>35 Years</option>
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Annual Premium</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={editingPolicy.premium || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, premium: parseFloat(e.target.value)})}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coverage</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={editingPolicy.coverageAmount || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, coverageAmount: parseFloat(e.target.value)})}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                    <input 
                                        type="number"
                                        className="w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={editingPolicy.commission || ''}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, commission: parseFloat(e.target.value)})}
                                        placeholder="Auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex gap-3 shrink-0">
                        <button 
                            onClick={() => setIsPolicyModalOpen(false)}
                            className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSavePolicy}
                            disabled={!editingPolicy.carrier || !editingPolicy.policyNumber}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
        <h2 className="text-2xl font-bold text-white text-shadow-sm">My Contacts</h2>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search name, email, phone..." 
                    className="pl-10 pr-4 py-2 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-900/50 text-white placeholder-slate-600 w-64 backdrop-blur-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="relative">
                <select 
                    className="appearance-none pl-4 pr-8 py-2 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-900/50 text-slate-300 cursor-pointer backdrop-blur-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    {Object.values(PipelineStage).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>

            <div className="relative">
                <select 
                    className="appearance-none pl-4 pr-8 py-2 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-900/50 text-slate-300 cursor-pointer backdrop-blur-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="NAME">Sort by Name</option>
                    <option value="RECENT">Sort by Recent</option>
                    <option value="PREMIUM">Sort by Premium</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>

            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
                <Plus size={16} /> Add Contact
            </button>
        </div>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-md rounded-xl shadow-sm border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Contact Info</th>
                        <th className="px-6 py-4">Stage</th>
                        <th className="px-6 py-4">Policies</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {processedClients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                No clients found matching your search.
                            </td>
                        </tr>
                    ) : processedClients.map((client) => (
                        <tr 
                            key={client.id} 
                            onClick={() => onSelectClient(client)}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={client.avatarUrl || `https://ui-avatars.com/api/?name=${client.firstName}+${client.lastName}`} 
                                        alt="" 
                                        className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-slate-700"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-200 text-sm">{client.firstName} {client.lastName}</div>
                                        <div className="text-xs text-slate-500">Added: {client.lastContactDate}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} className="text-slate-500" />
                                        {client.email}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-slate-500" />
                                        {client.phone}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    client.pipelineStage === PipelineStage.ISSUED ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    client.pipelineStage === PipelineStage.NEW_LEAD ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}>
                                    {client.pipelineStage}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-slate-500" />
                                    <span className="text-sm font-medium text-slate-300">{client.policies.length} Policies</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight className="inline-block text-slate-600 group-hover:text-blue-500 transition-colors" size={20} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md ring-1 ring-white/10 flex flex-col">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                    <h3 className="font-bold text-xl text-white">Add New Contact</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                                value={newClient.firstName}
                                onChange={(e) => setNewClient({...newClient, firstName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                                value={newClient.lastName}
                                onChange={(e) => setNewClient({...newClient, lastName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                            value={newClient.email}
                            onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                        <input 
                            type="tel" 
                            className="w-full border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                            value={newClient.phone}
                            onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                        />
                    </div>
                    
                    <button 
                        onClick={handleAddClient}
                        disabled={!newClient.firstName || !newClient.lastName}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 mt-2"
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