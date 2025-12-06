
import React, { useState, useRef, useEffect } from 'react';
import { PipelineStage, Client } from '../types';
import { MoreHorizontal, Plus, Calendar, X, ChevronRight, ChevronLeft, Phone, MapPin, Edit2, Save, Cake, GripVertical, Upload, ArrowRight, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface PipelineProps {
    clients: Client[];
    currentUserId: string; // ID of the logged-in agent
    onUpdateClients: (clients: Client[]) => void;
}

const Pipeline: React.FC<PipelineProps> = ({ clients, currentUserId, onUpdateClients }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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
  
  const [newLead, setNewLead] = useState({ 
      firstName: '', 
      lastName: '', 
      email: '', 
      phone: '',
      dob: '',
      state: '',
      stage: PipelineStage.NEW_LEAD 
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
    return clients.filter(c => c.pipelineStage === stage);
  };

  const moveStage = (clientId: string, direction: 'next' | 'prev') => {
    onUpdateClients(clients.map(client => {
      if (client.id !== clientId) return client;
      
      const currentIndex = stages.indexOf(client.pipelineStage);
      let newIndex = currentIndex;
      
      if (direction === 'next' && currentIndex < stages.length - 1) {
        newIndex++;
      } else if (direction === 'prev' && currentIndex > 0) {
        newIndex--;
      }
      
      return { ...client, pipelineStage: stages[newIndex] };
    }));
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
        lastContactDate: new Date().toISOString().split('T')[0]
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
        stage: PipelineStage.NEW_LEAD 
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
      
      // Create a ghost image if needed, or rely on browser default
  };

  const handleDragEnd = () => {
      setDraggedClientId(null);
      setTargetStage(null);
      stopAutoScroll();
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
      e.preventDefault(); // Necessary to allow dropping
      // Note: We don't stop propagation so container can see drag position for scrolling
      if (targetStage !== stage) {
          setTargetStage(stage);
      }
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
      e.preventDefault();
      const clientId = e.dataTransfer.getData('clientId');
      
      if (clientId) {
          onUpdateClients(clients.map(client => {
              if (client.id === clientId) {
                  return { ...client, pipelineStage: stage };
              }
              return client;
          }));
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
        lastContactDate: new Date().toISOString().split('T')[0]
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
        <h2 className="text-2xl font-bold text-slate-800">Leads Pipeline</h2>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                Filter View
            </button>
            <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
                <Upload size={16} /> Import
            </button>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
                <Plus size={16} /> Add Lead
            </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-x-auto pb-4" 
        ref={scrollContainerRef}
        onDragOver={handleContainerDragOver}
      >
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageClients = getClientsByStage(stage);
            const isDragTarget = targetStage === stage && draggedClientId !== null;
            
            return (
              <div 
                key={stage} 
                className={`w-80 flex flex-col rounded-xl border transition-all duration-200 h-full ${
                    isDragTarget 
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 shadow-lg scale-[1.01]' 
                        : 'bg-gray-50/50 border-gray-100'
                }`}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Stage Header */}
                <div className={`p-4 border-b rounded-t-xl backdrop-blur-sm transition-colors ${
                    isDragTarget ? 'bg-indigo-100/50 border-indigo-200' : 'border-gray-100 bg-white/50'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-semibold ${isDragTarget ? 'text-indigo-800' : 'text-slate-700'}`}>{stage}</h3>
                    <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
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
                        className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing ${
                            draggedClientId === client.id ? 'opacity-40 border-dashed border-indigo-300' : ''
                        }`}
                    >
                      {/* Grip Icon for affordance */}
                      <div className="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
                          <GripVertical size={16} />
                      </div>

                      {/* Name and Source */}
                      <div className="flex justify-between items-start mb-2 pl-2">
                         <span className="font-bold text-slate-800 text-sm truncate max-w-[140px] block" title={`${client.firstName} ${client.lastName}`}>
                            {client.firstName} {client.lastName}
                         </span>
                         {client.leadSource && (
                             <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                 {client.leadSource}
                             </span>
                         )}
                      </div>

                      {/* Contact Details */}
                      <div className="space-y-2 mt-3 pl-2">
                          <div className="flex items-center text-xs text-gray-500">
                              <Phone size={12} className="mr-2 text-slate-400" />
                              {client.phone ? client.phone : <span className="italic text-gray-400">No phone</span>}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                              <Cake size={12} className="mr-2 text-slate-400" />
                              {client.dateOfBirth ? client.dateOfBirth : <span className="italic text-gray-400">No DOB</span>}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                              <MapPin size={12} className="mr-2 text-slate-400" />
                              {client.address ? <span className="truncate max-w-[180px]">{client.address}</span> : <span className="italic text-gray-400">No State/Address</span>}
                          </div>
                          
                          {/* Last Contact Footer */}
                          <div className="flex items-center text-xs text-slate-400 pt-2 border-t border-gray-50 mt-2">
                              <Calendar size={12} className="mr-2 opacity-70" />
                              Last Contact: {client.lastContactDate}
                          </div>
                      </div>
                      
                      {/* Action Buttons Overlay (Still available if preferred over drag) */}
                      <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg border border-indigo-100 z-10 pointer-events-none">
                          <div className="flex items-center gap-2 pointer-events-auto">
                              <button 
                                onClick={() => moveStage(client.id, 'prev')}
                                disabled={stage === PipelineStage.NEW_LEAD}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-gray-600 border border-gray-200"
                                title="Move Back"
                              >
                                 <ChevronLeft size={16} />
                              </button>
                              
                              <button 
                                 onClick={() => openEditModal(client)}
                                 className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                              >
                                 <Edit2 size={12} /> Edit Lead
                              </button>

                              <button 
                                 onClick={() => moveStage(client.id, 'next')}
                                 disabled={stage === PipelineStage.ISSUED}
                                 className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-30 text-indigo-600 border border-indigo-100"
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
                    className="w-full py-2 border border-dashed border-gray-300 text-gray-400 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1"
                  >
                      <Plus size={14} /> Add Card
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl ring-1 ring-black/5 flex flex-col max-h-[80vh]">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                      <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                          <Upload size={20} className="text-indigo-600" /> Import Leads
                      </h3>
                      <button onClick={() => { setIsImportModalOpen(false); setImportStep('UPLOAD'); }} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="p-8 flex-1 overflow-y-auto">
                      {importStep === 'UPLOAD' ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-6">
                              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                                  <FileSpreadsheet size={40} className="text-indigo-600" />
                              </div>
                              <div className="text-center">
                                  <h4 className="text-lg font-bold text-slate-800">Upload CSV File</h4>
                                  <p className="text-slate-500 text-sm mt-1">Select a CSV file containing your lead data.</p>
                              </div>
                              <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 font-medium py-2 px-6 rounded-lg shadow-sm transition-colors">
                                  <span className="flex items-center gap-2"><Upload size={16} /> Choose File</span>
                                  <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                              </label>
                              <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-500 max-w-md text-center border border-slate-200">
                                  Tip: Ensure your file has a header row. We'll help you map the columns in the next step.
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-6">
                              <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
                                  <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                                  <div>
                                      <h4 className="font-bold text-green-900 text-sm">File Loaded Successfully</h4>
                                      <p className="text-green-700 text-xs mt-1">Found {csvData.length} rows and {csvHeaders.length} columns. Please map the fields below.</p>
                                  </div>
                              </div>

                              <div className="space-y-4">
                                  {Object.keys(fieldMapping).map((systemField) => (
                                      <div key={systemField} className="grid grid-cols-2 gap-4 items-center">
                                          <label className="text-sm font-bold text-slate-600 uppercase flex justify-end">
                                              {systemField.replace(/([A-Z])/g, ' $1').trim()}
                                          </label>
                                          <div className="flex items-center gap-2">
                                              <ArrowRight size={14} className="text-gray-300" />
                                              <select 
                                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                  value={fieldMapping[systemField]}
                                                  onChange={(e) => setFieldMapping({...fieldMapping, [systemField]: e.target.value})}
                                              >
                                                  <option value="">-- Select Column --</option>
                                                  {csvHeaders.map(header => (
                                                      <option key={header} value={header}>{header}</option>
                                                  ))}
                                              </select>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                      {importStep === 'MAP' && (
                          <button 
                              onClick={executeImport}
                              disabled={!fieldMapping.firstName || !fieldMapping.lastName}
                              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                          >
                              Complete Import <ArrowRight size={16} />
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/90 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-md ring-1 ring-black/5 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-slate-800">Add New Lead</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4 bg-white overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={newLead.firstName}
                                onChange={(e) => setNewLead({...newLead, firstName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={newLead.lastName}
                                onChange={(e) => setNewLead({...newLead, lastName: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={newLead.email}
                            onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                                type="tel" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={newLead.phone}
                                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={newLead.dob}
                                onChange={(e) => setNewLead({...newLead, dob: e.target.value})}
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={newLead.state}
                            onChange={(e) => setNewLead({...newLead, state: e.target.value})}
                            placeholder="e.g. TX"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Starting Stage</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none bg-white text-slate-900"
                            value={newLead.stage}
                            onChange={(e) => setNewLead({...newLead, stage: e.target.value as PipelineStage})}
                        >
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleAddLead}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-2"
                    >
                        Create Lead
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/90 backdrop-blur-md">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-lg ring-1 ring-black/5 animate-fade-in flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Edit2 size={18} className="text-indigo-600" /> Edit Lead Details
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4 bg-white overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.firstName}
                                onChange={(e) => setEditingClient({...editingClient, firstName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.lastName}
                                onChange={(e) => setEditingClient({...editingClient, lastName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.phone}
                                onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.dateOfBirth || ''}
                                onChange={(e) => setEditingClient({...editingClient, dateOfBirth: e.target.value})}
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                            value={editingClient.email}
                            onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address / State</label>
                        <div className="relative">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg pl-8 pr-2 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.address}
                                onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                                placeholder="123 Main St, State, Zip"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lead Type</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.leadSource}
                                onChange={(e) => setEditingClient({...editingClient, leadSource: e.target.value})}
                            >
                                <option value="Manual">Manual</option>
                                <option value="Facebook Ad">Facebook Ad</option>
                                <option value="Website">Website</option>
                                <option value="Referral">Referral</option>
                                <option value="Direct Mail">Direct Mail</option>
                                <option value="Cold Call">Cold Call</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stage</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={editingClient.pipelineStage}
                                onChange={(e) => setEditingClient({...editingClient, pipelineStage: e.target.value as PipelineStage})}
                            >
                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white text-slate-900"
                            rows={3}
                            value={editingClient.notes}
                            onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={16} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
