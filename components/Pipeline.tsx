
import React, { useState, useRef, useEffect } from 'react';
import { PipelineStage, Client, Policy, PolicyType, PolicyStatus, TeamMember } from '../types';
import { MoreHorizontal, Plus, Calendar as CalendarIcon, X, ChevronRight, ChevronLeft, Phone, MapPin, Edit2, Save, Cake, GripVertical, Upload, ArrowRight, FileSpreadsheet, CheckCircle2, Filter, BookOpen, Clock, Tag, ShieldCheck, DollarSign, Sparkles } from 'lucide-react';
import { ScriptLibrary } from './ScriptLibrary';
import { getAvailableCarriers, getAvailableProducts, calculateCommissionExact } from '../services/commissionService';
import { MOCK_TEAM } from '../services/mockData';

// Helper for local date string
const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface PipelineProps {
    clients: Client[];
    currentUserId: string; // ID of the logged-in agent
    onUpdateClients: (clients: Client[]) => void;
}

type LeadType = 'FEX' | 'MP' | 'IUL' | 'VET' | 'ALL';

const Pipeline: React.FC<PipelineProps> = ({ clients, currentUserId, onUpdateClients }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isScriptsOpen, setIsScriptsOpen] = useState(false);
  
  // Appointment Modal State
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ clientId: string; stage: PipelineStage } | null>(null);
  const [apptDetails, setApptDetails] = useState({
      date: getLocalToday(),
      time: '10:00',
      notes: ''
  });

  // Policy Capture Modal State (App Approved / Underwriting)
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [pendingPolicyMove, setPendingPolicyMove] = useState<{ clientId: string; stage: PipelineStage } | null>(null);
  const [policyForm, setPolicyForm] = useState<{
      carrier: string;
      policyType: PolicyType;
      productName: string;
      policyNumber: string;
      premium: string; // Annual Premium
      coverageAmount: string;
      startDate: string;
      submittedDate: string;
      termLength: number;
      status: PolicyStatus;
      commission: string;
  }>({
      carrier: '',
      policyType: PolicyType.TERM,
      productName: '',
      policyNumber: '',
      premium: '',
      coverageAmount: '',
      startDate: getLocalToday(),
      submittedDate: getLocalToday(),
      termLength: 20,
      status: PolicyStatus.PENDING,
      commission: ''
  });
  
  const [monthlyInput, setMonthlyInput] = useState<string>('');
  const [carrierOptions, setCarrierOptions] = useState<string[]>([]);
  const [productOptions, setProductOptions] = useState<string[]>([]);
  
  // Current User State for Contract Levels
  const [currentUser] = useState<TeamMember>(() => {
        try {
            const saved = localStorage.getItem('arise_team_members');
            const members = saved ? JSON.parse(saved) : MOCK_TEAM;
            // Try to find by ID, otherwise fallback to the first user (likely admin/self) or mock
            return members.find((m: TeamMember) => m.id === currentUserId) || members[0];
        } catch { return MOCK_TEAM[0]; }
  });

  // Load carrier options
  useEffect(() => {
      setCarrierOptions(getAvailableCarriers());
  }, []);

  // Update product options when carrier changes
  useEffect(() => {
      if (policyForm.carrier) {
          setProductOptions(getAvailableProducts(policyForm.carrier));
      } else {
          setProductOptions([]);
      }
  }, [policyForm.carrier]);

  // --- Auto-Calculate Commission Effect ---
  useEffect(() => {
      if (!isPolicyModalOpen) return;

      const premium = parseFloat(policyForm.premium);
      // Only calculate if we have valid numbers and selections
      if (isNaN(premium) || premium === 0 || !policyForm.carrier || !policyForm.productName) {
          return;
      }

      const carrier = policyForm.carrier;
      const product = policyForm.productName;
      
      // Determine Comp Level: Check for override, else use default
      const compLevel = currentUser.carrierCompLevels?.[carrier] || currentUser.defaultCompLevel || 100;

      // Calculate
      const { total } = calculateCommissionExact(carrier, product, premium, compLevel);
      
      // Update form
      setPolicyForm(prev => ({
          ...prev,
          commission: total.toFixed(2)
      }));

  }, [policyForm.carrier, policyForm.productName, policyForm.premium, isPolicyModalOpen, currentUser]);


  // Filter State
  const [activeFilter, setActiveFilter] = useState<LeadType>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<'UPLOAD' | 'MAP'>('UPLOAD');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      stage: ''
  });
  
  const [newLead, setNewLead] = useState<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dob: string;
      state: string;
      stage: PipelineStage;
      leadType: Client['leadType'];
  }>({ 
      firstName: '', 
      lastName: '', 
      email: '', 
      phone: '', 
      dob: '', 
      state: '', 
      stage: PipelineStage.NEW_LEAD,
      leadType: 'FEX' // Default
  });
  
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Drag and Drop State
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState<PipelineStage | null>(null);

  // Auto-scroll Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollSpeed = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  const stages = Object.values(PipelineStage);

  // Clean up auto-scroll on unmount
  useEffect(() => {
      return () => stopAutoScroll();
  }, []);

  const getClientsByStage = (stage: PipelineStage) => {
    return clients.filter(c => 
        c.pipelineStage === stage && 
        (activeFilter === 'ALL' || c.leadType === activeFilter)
    );
  };

  const initiateStageMove = (clientId: string, stage: PipelineStage) => {
      // 1. Intercept APPOINTMENT_SET
      if (stage === PipelineStage.APPOINTMENT_SET) {
          setPendingMove({ clientId, stage });
          setApptDetails({ date: getLocalToday(), time: '10:00', notes: '' });
          setIsApptModalOpen(true);
          return;
      }

      // 2. Intercept APPLICATION_TAKEN or UNDERWRITING or ISSUED
      if (stage === PipelineStage.APPLICATION_TAKEN || stage === PipelineStage.UNDERWRITING || stage === PipelineStage.ISSUED) {
          setPendingPolicyMove({ clientId, stage });
          
          let defaultStatus = PolicyStatus.PENDING;
          if (stage === PipelineStage.UNDERWRITING) defaultStatus = PolicyStatus.PENDING;
          if (stage === PipelineStage.ISSUED) defaultStatus = PolicyStatus.ACTIVE;
          if (stage === PipelineStage.APPLICATION_TAKEN) defaultStatus = PolicyStatus.PENDING;

          setPolicyForm({
              carrier: '',
              policyType: PolicyType.TERM,
              productName: '',
              policyNumber: '',
              premium: '',
              coverageAmount: '',
              startDate: getLocalToday(),
              submittedDate: getLocalToday(),
              termLength: 20,
              status: defaultStatus,
              commission: ''
          });
          setMonthlyInput('');
          setIsPolicyModalOpen(true);
          return;
      }

      // 3. Normal Move
      onUpdateClients(clients.map(c => 
          c.id === clientId ? { ...c, pipelineStage: stage } : c
      ));
  };

  const moveStage = (clientId: string, direction: 'next' | 'prev') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const currentIndex = stages.indexOf(client.pipelineStage);
    let newIndex = currentIndex;
    
    if (direction === 'next' && currentIndex < stages.length - 1) {
      newIndex++;
    } else if (direction === 'prev' && currentIndex > 0) {
      newIndex--;
    }
    
    const nextStage = stages[newIndex];
    if (nextStage !== client.pipelineStage) {
        initiateStageMove(clientId, nextStage);
    }
  };

  const handleConfirmAppointment = () => {
      if (!pendingMove) return;

      const client = clients.find(c => c.id === pendingMove.clientId);
      if (client) {
          // 1. Save to LocalStorage for Calendar component
          try {
              const savedEvents = localStorage.getItem('arise_calendar_events');
              const events = savedEvents ? JSON.parse(savedEvents) : [];
              
              // Dynamic Title Construction
              const leadTypeLabel = client.leadType || 'General';
              const eventTitle = `${leadTypeLabel} Appt: ${client.firstName} ${client.lastName}`;

              events.push({
                  id: `evt-${Date.now()}`,
                  title: eventTitle,
                  date: apptDetails.date,
                  time: apptDetails.time,
                  type: 'Meeting'
              });
              
              localStorage.setItem('arise_calendar_events', JSON.stringify(events));
          } catch (e) {
              console.error("Failed to sync to calendar", e);
          }

          // 2. Update Client Stage
          onUpdateClients(clients.map(c => 
              c.id === pendingMove.clientId 
                  ? { ...c, pipelineStage: pendingMove.stage } 
                  : c
          ));
      }

      setIsApptModalOpen(false);
      setPendingMove(null);
  };

  const handleSavePolicyMove = () => {
      if (!pendingPolicyMove) return;
      const client = clients.find(c => c.id === pendingPolicyMove.clientId);
      if (!client) return;

      // Calculate end date based on term length
      const start = new Date(policyForm.startDate);
      const end = new Date(start);
      if (policyForm.policyType === PolicyType.TERM) {
          end.setFullYear(start.getFullYear() + policyForm.termLength);
      } else {
          // Default for perm products (Age 100 or simply 100 years from now for simplicity)
          end.setFullYear(start.getFullYear() + 100);
      }
      const calculatedEndDate = end.toISOString().split('T')[0];

      // Auto-Activate Status check
      const todayStr = getLocalToday();
      const isFuture = policyForm.startDate > todayStr;
      
      let finalStatus = policyForm.status;

      if (isFuture && finalStatus === PolicyStatus.ACTIVE) {
          finalStatus = PolicyStatus.APPROVED;
      } 

      const annualPremium = parseFloat(policyForm.premium) || 0;
      const manualCommission = parseFloat(policyForm.commission);
      const estimatedCommission = annualPremium * 0.9; // Default 90% if not entered

      // 1. Create Policy Object
      const newPolicy: Policy = {
          id: `pol-${Date.now()}`,
          type: policyForm.policyType,
          carrier: policyForm.carrier || 'Pending Carrier',
          productName: policyForm.productName || 'Pending Product',
          policyNumber: policyForm.policyNumber || 'PENDING',
          premium: annualPremium,
          coverageAmount: parseFloat(policyForm.coverageAmount) || 0,
          commission: isNaN(manualCommission) ? estimatedCommission : manualCommission,
          startDate: policyForm.startDate,
          submittedDate: policyForm.submittedDate,
          endDate: calculatedEndDate, 
          status: finalStatus,
          isPaidOut: finalStatus === PolicyStatus.ACTIVE // Assume active policies are paid/issued
      };

      // 2. Update Client (Add Policy & Change Stage)
      onUpdateClients(clients.map(c => 
          c.id === pendingPolicyMove.clientId 
              ? { 
                  ...c, 
                  pipelineStage: pendingPolicyMove.stage,
                  policies: [newPolicy, ...c.policies] // Prepend new policy
                } 
              : c
      ));

      setIsPolicyModalOpen(false);
      setPendingPolicyMove(null);
  };

  // Premium Calculations
  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setMonthlyInput(val);
      const num = parseFloat(val);
      if (!isNaN(num)) {
          setPolicyForm(prev => ({ ...prev, premium: (num * 12).toFixed(2) }));
      } else {
          setPolicyForm(prev => ({ ...prev, premium: '' }));
      }
  };

  const handleAnnualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPolicyForm(prev => ({ ...prev, premium: val }));
      const num = parseFloat(val);
      if (!isNaN(num)) {
          setMonthlyInput((num / 12).toFixed(2));
      } else {
          setMonthlyInput('');
      }
  };

  const handleAddLead = () => {
    if (!newLead.firstName || !newLead.lastName) return;
    
    const lead: Client = {
        id: Date.now().toString(),
        agentId: currentUserId,
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        email: newLead.email,
        phone: newLead.phone,
        address: newLead.state, // Simple mapping for now
        dateOfBirth: newLead.dob,
        policies: [],
        notes: 'New lead added manually',
        pipelineStage: newLead.stage,
        leadSource: 'Manual',
        leadType: newLead.leadType,
        lastContactDate: getLocalToday()
    };
    
    onUpdateClients([...clients, lead]);
    setIsAddModalOpen(false);
    setNewLead({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '', 
        dob: '', 
        state: '', 
        stage: PipelineStage.NEW_LEAD,
        leadType: 'FEX' 
    });
  };

  const openEditModal = (client: Client) => {
      setEditingClient({ ...client });
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
      if (!editingClient) return;
      onUpdateClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
      setIsEditModalOpen(false);
      setEditingClient(null);
  };

  // --- Auto Scroll Logic ---

  const startAutoScroll = () => {
      if (animationFrameId.current) return;

      const scroll = () => {
          if (scrollContainerRef.current && autoScrollSpeed.current !== 0) {
              scrollContainerRef.current.scrollLeft += autoScrollSpeed.current;
              animationFrameId.current = requestAnimationFrame(scroll);
          } else {
              stopAutoScroll();
          }
      };
      animationFrameId.current = requestAnimationFrame(scroll);
  };

  const stopAutoScroll = () => {
      if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
      }
      autoScrollSpeed.current = 0;
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
      // Allow drop events to bubble up properly
      e.preventDefault(); 
      
      if (!draggedClientId || !scrollContainerRef.current) return;

      const { left, right } = scrollContainerRef.current.getBoundingClientRect();
      const x = e.clientX;
      const threshold = 150; // Distance from edge to trigger scroll
      const maxSpeed = 15;

      if (x < left + threshold) {
          // Scroll Left
          const intensity = 1 - ((x - left) / threshold);
          autoScrollSpeed.current = -1 * maxSpeed * intensity;
          startAutoScroll();
      } else if (x > right - threshold) {
          // Scroll Right
          const intensity = 1 - ((right - x) / threshold);
          autoScrollSpeed.current = maxSpeed * intensity;
          startAutoScroll();
      } else {
          // In the safe zone
          autoScrollSpeed.current = 0;
      }
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
      setDraggedClientId(clientId);
      e.dataTransfer.setData('clientId', clientId);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
      setDraggedClientId(null);
      setTargetStage(null);
      stopAutoScroll();
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
      e.preventDefault(); // Necessary to allow dropping
      if (targetStage !== stage) {
          setTargetStage(stage);
      }
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
      e.preventDefault();
      const clientId = e.dataTransfer.getData('clientId');
      
      if (clientId) {
          const client = clients.find(c => c.id === clientId);
          if (client && client.pipelineStage !== stage) {
              initiateStageMove(clientId, stage);
          }
      }
      
      handleDragEnd(); // Cleanup
  };

  // --- Import Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            // Basic CSV parse
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim());
                setCsvHeaders(headers);
                
                const data = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const row: Record<string, string> = {};
                    headers.forEach((h, i) => {
                        row[h] = values[i]?.trim() || '';
                    });
                    return row;
                });
                setCsvData(data);
                setImportStep('MAP');
                
                // Auto-guess mapping
                const newMapping = { ...fieldMapping };
                headers.forEach(h => {
                    const lowerH = h.toLowerCase();
                    if (lowerH.includes('first')) newMapping.firstName = h;
                    else if (lowerH.includes('last')) newMapping.lastName = h;
                    else if (lowerH.includes('email')) newMapping.email = h;
                    else if (lowerH.includes('phone')) newMapping.phone = h;
                    else if (lowerH.includes('stage') || lowerH.includes('status')) newMapping.stage = h;
                });
                setFieldMapping(newMapping);
            }
        };
        reader.readAsText(file);
    }
  };

  const executeImport = () => {
    const newClients = csvData.map(row => ({
        id: `imported-${Date.now()}-${Math.random()}`,
        agentId: currentUserId,
        firstName: row[fieldMapping.firstName] || 'Unknown',
        lastName: row[fieldMapping.lastName] || 'Client',
        email: row[fieldMapping.email] || '',
        phone: row[fieldMapping.phone] || '',
        address: '',
        policies: [],
        notes: 'Imported via CSV',
        pipelineStage: (row[fieldMapping.stage] as PipelineStage) || PipelineStage.NEW_LEAD,
        leadSource: 'Import',
        lastContactDate: getLocalToday()
    }));
    
    onUpdateClients([...clients, ...newClients]);
    setIsImportModalOpen(false);
    setImportStep('UPLOAD');
    setCsvData([]);
    setCsvHeaders([]);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white text-shadow-sm">Leads Pipeline</h2>
            <div className="relative">
                <button 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1 border transition-colors ${
                        activeFilter === 'ALL' 
                            ? 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-white/10 backdrop-blur-sm' 
                            : 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    }`}
                >
                    <Filter size={12} /> 
                    {activeFilter === 'ALL' ? 'All Types' : activeFilter === 'FEX' ? 'Final Expense' : activeFilter === 'MP' ? 'Mortgage Prot.' : activeFilter === 'IUL' ? 'IUL / Wealth' : 'Veterans'}
                </button>
                {isFilterDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900/90 backdrop-blur-xl rounded-lg shadow-xl border border-white/10 z-20 py-1">
                        <button 
                            onClick={() => { setActiveFilter('ALL'); setIsFilterDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300"
                        >
                            All Leads
                        </button>
                        <div className="border-t border-white/5 my-1"></div>
                        <button onClick={() => { setActiveFilter('FEX'); setIsFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300">Final Expense</button>
                        <button onClick={() => { setActiveFilter('MP'); setIsFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300">Mortgage Protection</button>
                        <button onClick={() => { setActiveFilter('IUL'); setIsFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300">IUL / Wealth</button>
                        <button onClick={() => { setActiveFilter('VET'); setIsFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-slate-300">Veteran Leads</button>
                    </div>
                )}
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsScriptsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm font-bold transition-colors"
            >
                <BookOpen size={16} /> Quick Scripts
            </button>
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-sm border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 text-sm font-medium transition-colors"
            >
                <Upload size={16} /> Import
            </button>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
                <Plus size={16} /> Add Lead
            </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-x-auto pb-4 custom-scrollbar" 
        ref={scrollContainerRef}
        onDragOver={handleContainerDragOver}
      >
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageClients = getClientsByStage(stage);
            const isDragTarget = targetStage === stage && draggedClientId !== null;
            const isNegativeStage = stage === PipelineStage.NOT_INTERESTED || stage === PipelineStage.BAD_NUMBER;
            
            return (
              <div 
                key={stage} 
                className={`w-80 flex flex-col rounded-xl border transition-all duration-200 h-full backdrop-blur-sm ${
                    isDragTarget 
                        ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/20 shadow-lg scale-[1.01]' 
                        : isNegativeStage ? 'bg-slate-900/30 border-white/5 opacity-70' : 'bg-slate-900/60 border-white/5'
                }`}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Stage Header */}
                <div className={`p-4 border-b rounded-t-xl backdrop-blur-sm transition-colors ${
                    isDragTarget ? 'bg-blue-500/20 border-blue-500/30' : isNegativeStage ? 'bg-white/5 border-white/5' : 'border-white/5 bg-white/5'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-semibold ${isDragTarget ? 'text-blue-400' : isNegativeStage ? 'text-slate-500' : 'text-slate-300'}`}>{stage}</h3>
                    <MoreHorizontal size={16} className="text-slate-600 cursor-pointer hover:text-white" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{stageClients.length} Leads</span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {stageClients.map((client) => (
                    <div 
                        key={client.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-slate-800/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-white/10 hover:border-blue-500/50 transition-all group relative cursor-grab active:cursor-grabbing ${
                            draggedClientId === client.id ? 'opacity-40 border-dashed border-blue-400' : ''
                        }`}
                    >
                      {/* Grip Icon for affordance */}
                      <div className="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
                          <GripVertical size={16} className="text-slate-400" />
                      </div>

                      {/* Name and Source */}
                      <div className="flex justify-between items-start mb-2 pl-2">
                         <span className="font-bold text-white text-sm truncate max-w-[140px] block" title={`${client.firstName} ${client.lastName}`}>
                            {client.firstName} {client.lastName}
                         </span>
                         {client.leadType && (
                             <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border 
                                ${client.leadType === 'FEX' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                  client.leadType === 'MP' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                  client.leadType === 'IUL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                 {client.leadType}
                             </span>
                         )}
                      </div>

                      {/* Contact Details */}
                      <div className="space-y-2 mt-3 pl-2">
                          <div className="flex items-center text-xs text-slate-400">
                              <Tag size={12} className="mr-2 text-slate-500" />
                              <span className="font-medium text-slate-300">{client.leadType || 'General Lead'}</span>
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                              <Phone size={12} className="mr-2 text-slate-500" />
                              {client.phone ? client.phone : <span className="italic text-slate-600">No phone</span>}
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                              <Cake size={12} className="mr-2 text-slate-500" />
                              {client.dateOfBirth ? client.dateOfBirth : <span className="italic text-slate-600">No DOB</span>}
                          </div>
                          <div className="flex items-center text-xs text-slate-400">
                              <MapPin size={12} className="mr-2 text-slate-500" />
                              {client.address ? <span className="truncate max-w-[180px]">{client.address}</span> : <span className="italic text-slate-600">No State/Address</span>}
                          </div>
                          
                          {/* Last Contact Footer */}
                          <div className="flex items-center text-xs text-slate-500 pt-2 border-t border-white/5 mt-2">
                              <CalendarIcon size={12} className="mr-2 opacity-70" />
                              Last Contact: {client.lastContactDate}
                          </div>
                      </div>
                      
                      {/* Action Buttons Overlay */}
                      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg border border-blue-500/30 z-10 pointer-events-none">
                          <div className="flex items-center gap-2 pointer-events-auto">
                              <button 
                                onClick={() => moveStage(client.id, 'prev')}
                                disabled={stage === PipelineStage.NEW_LEAD}
                                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700"
                                title="Move Back"
                              >
                                 <ChevronLeft size={16} />
                              </button>
                              
                              <button 
                                 onClick={() => openEditModal(client)}
                                 className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                              >
                                 <Edit2 size={12} /> Edit Lead
                              </button>

                              <button 
                                 onClick={() => moveStage(client.id, 'next')}
                                 disabled={stage === PipelineStage.BAD_NUMBER}
                                 className="p-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-30 text-blue-400 border border-blue-500/20"
                                 title="Move Next"
                              >
                                 <ChevronRight size={16} />
                              </button>
                          </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full py-2 border border-dashed border-slate-700 text-slate-500 rounded-lg text-sm hover:border-blue-500/50 hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
                  >
                      <Plus size={14} /> Add Card
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment Scheduling Modal */}
      {isApptModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
              <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-sm ring-1 ring-white/10 animate-fade-in flex flex-col">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                          <CalendarIcon size={18} className="text-blue-500" /> Schedule Appointment
                      </h3>
                      <button onClick={() => { setIsApptModalOpen(false); setPendingMove(null); }} className="text-slate-400 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-400 mb-2">
                          Confirm the date and time for this appointment. It will be automatically added to your calendar.
                      </p>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                          <div className="relative">
                              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                              <input 
                                  type="date"
                                  className="w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                  value={apptDetails.date}
                                  onChange={(e) => setApptDetails(prev => ({...prev, date: e.target.value}))}
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                          <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                              <input 
                                  type="time"
                                  className="w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                  value={apptDetails.time}
                                  onChange={(e) => setApptDetails(prev => ({...prev, time: e.target.value}))}
                              />
                          </div>
                      </div>

                      <div className="pt-2 flex gap-3">
                          <button 
                              onClick={() => { setIsApptModalOpen(false); setPendingMove(null); }}
                              className="flex-1 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors text-sm"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={handleConfirmAppointment}
                              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
                          >
                              Set Appointment
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Policy Details Modal (Application/Underwriting) */}
      {isPolicyModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
              <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl ring-1 ring-white/10 animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                          <ShieldCheck size={18} className="text-blue-500" /> New Policy Details
                      </h3>
                      <button onClick={() => { setIsPolicyModalOpen(false); setPendingPolicyMove(null); }} className="text-slate-400 hover:text-white transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4 overflow-y-auto">
                      <p className="text-sm text-blue-200 mb-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                          Enter the application details to move this lead to <b>{pendingPolicyMove?.stage}</b>. This will automatically add them to your Book of Business and Applications list.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carrier</label>
                              {carrierOptions.length > 0 ? (
                                  <select 
                                      className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                      value={policyForm.carrier}
                                      onChange={(e) => setPolicyForm({...policyForm, carrier: e.target.value})}
                                  >
                                      <option value="">Select Carrier...</option>
                                      {carrierOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                              ) : (
                                  <input 
                                      type="text" 
                                      className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                      placeholder="e.g. Mutual of Omaha"
                                      value={policyForm.carrier}
                                      onChange={(e) => setPolicyForm({...policyForm, carrier: e.target.value})}
                                  />
                              )}
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product</label>
                              {productOptions.length > 0 ? (
                                  <select 
                                      className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                      value={policyForm.productName}
                                      onChange={(e) => setPolicyForm({...policyForm, productName: e.target.value})}
                                  >
                                      <option value="">Select Product...</option>
                                      {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                              ) : (
                                  <input 
                                      type="text" 
                                      className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                      placeholder="e.g. Living Promise"
                                      value={policyForm.productName}
                                      onChange={(e) => setPolicyForm({...policyForm, productName: e.target.value})}
                                  />
                              )}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Policy Type</label>
                              <select 
                                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                  value={policyForm.policyType}
                                  onChange={(e) => setPolicyForm({...policyForm, policyType: e.target.value as PolicyType})}
                              >
                                  {Object.values(PolicyType).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Term Length</label>
                              <select 
                                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white disabled:opacity-50"
                                  value={policyForm.termLength}
                                  onChange={(e) => setPolicyForm({...policyForm, termLength: parseInt(e.target.value)})}
                                  disabled={policyForm.policyType !== PolicyType.TERM}
                              >
                                  <option value={10}>10 Years</option>
                                  <option value={15}>15 Years</option>
                                  <option value={20}>20 Years</option>
                                  <option value={30}>30 Years</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Policy Number</label>
                              <input 
                                  type="text"
                                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                  placeholder="Pending"
                                  value={policyForm.policyNumber}
                                  onChange={(e) => setPolicyForm({...policyForm, policyNumber: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                              <select 
                                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                  value={policyForm.status}
                                  onChange={(e) => setPolicyForm({...policyForm, status: e.target.value as PolicyStatus})}
                              >
                                  {Object.values(PolicyStatus).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Submitted Date</label>
                              <input 
                                  type="date"
                                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                  value={policyForm.submittedDate}
                                  onChange={(e) => setPolicyForm({...policyForm, submittedDate: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                              <input 
                                  type="date"
                                  className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                  value={policyForm.startDate}
                                  onChange={(e) => setPolicyForm({...policyForm, startDate: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Premium</label>
                              <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                  <input 
                                      type="number"
                                      className="w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={monthlyInput}
                                      onChange={handleMonthlyChange}
                                      placeholder="0.00"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Annual Premium</label>
                              <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                                  <input 
                                      type="number"
                                      className="w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={policyForm.premium}
                                      onChange={handleAnnualChange}
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
                                      className="w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={policyForm.coverageAmount}
                                      onChange={(e) => setPolicyForm({...policyForm, coverageAmount: e.target.value})}
                                      placeholder="0"
                                  />
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission</label>
                          <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                              <input 
                                  type="number"
                                  className={`w-full pl-6 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${policyForm.commission ? 'text-green-400 font-bold' : 'text-white'}`}
                                  value={policyForm.commission}
                                  onChange={(e) => setPolicyForm({...policyForm, commission: e.target.value})}
                                  placeholder="Auto-calculated if empty"
                              />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              {policyForm.commission ? (
                                  <>
                                    <Sparkles size={10} className="text-green-500" />
                                    <span className="text-green-500 font-medium">Auto-calculated based on your contract level ({currentUser.carrierCompLevels?.[policyForm.carrier] || currentUser.defaultCompLevel}%) and selected carrier product.</span>
                                  </>
                              ) : 'Enter premium to see auto-calculated commission.'}
                          </p>
                      </div>
                      
                      <div className="pt-2 flex gap-3">
                          <button 
                              onClick={() => { setIsPolicyModalOpen(false); setPendingPolicyMove(null); }}
                              className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors text-sm"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={handleSavePolicyMove}
                              disabled={!policyForm.carrier || !policyForm.premium}
                              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              <Save size={16} /> Save & Move Lead
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                    <h3 className="font-bold text-white">Add New Lead</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4 bg-slate-900 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                value={newLead.firstName}
                                onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                                value={newLead.lastName}
                                onChange={(e) => setNewLead({...newLead, lastName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                            value={newLead.email}
                            onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                        <input 
                            type="tel" 
                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                            value={newLead.phone}
                            onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Lead Type</label>
                        <select 
                            className="w-full border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-950 text-white"
                            value={newLead.leadType}
                            onChange={(e) => setNewLead({...newLead, leadType: e.target.value as any})}
                        >
                            <option value="FEX">Final Expense</option>
                            <option value="MP">Mortgage Protection</option>
                            <option value="IUL">IUL / Wealth</option>
                            <option value="VET">Veteran Benefits</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleAddLead}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mt-2"
                    >
                        Create Lead
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Quick Scripts Modal */}
      {isScriptsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col relative">
                <button 
                    onClick={() => setIsScriptsOpen(false)}
                    className="absolute top-4 right-4 z-10 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
                <ScriptLibrary />
            </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                        <Upload size={20} className="text-blue-500" /> Import Leads
                    </h3>
                    <button onClick={() => { setIsImportModalOpen(false); setImportStep('UPLOAD'); }} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    {importStep === 'UPLOAD' ? (
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-slate-800/30 transition-colors">
                            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Upload CSV File</h4>
                            <p className="text-slate-400 text-sm mb-6 max-w-sm">
                                Drag and drop your CSV file here, or click to browse. 
                                Ensure your file has headers like "First Name", "Last Name", "Email", etc.
                            </p>
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden" 
                                id="csv-upload"
                            />
                            <label 
                                htmlFor="csv-upload"
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                Select File
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Map Columns</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.keys(fieldMapping).map((field) => (
                                        <div key={field}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                {field.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <select 
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={fieldMapping[field]}
                                                onChange={(e) => setFieldMapping({...fieldMapping, [field]: e.target.value})}
                                            >
                                                <option value="">Select Column...</option>
                                                {csvHeaders.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Preview ({csvData.length} records)</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="text-slate-500 border-b border-slate-800">
                                            <tr>
                                                {Object.keys(fieldMapping).map(k => <th key={k} className="pb-2 pr-4">{k}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300">
                                            {csvData.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="border-b border-slate-800/50">
                                                    {Object.keys(fieldMapping).map(k => (
                                                        <td key={k} className="py-2 pr-4">{row[fieldMapping[k]] || '-'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-800 bg-slate-950/30 rounded-b-xl flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={() => { setIsImportModalOpen(false); setImportStep('UPLOAD'); }}
                        className="px-4 py-2 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    {importStep === 'MAP' && (
                        <button 
                            onClick={executeImport}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                        >
                            Import {csvData.length} Leads
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
