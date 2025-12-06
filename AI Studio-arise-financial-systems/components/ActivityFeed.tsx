
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Phone, MessageSquare, Calendar, CheckCircle2, DollarSign, TrendingUp, 
    Save, RotateCcw, Target, Clock, Voicemail, FileText, Users, 
    Briefcase, CreditCard, ChevronDown, Lightbulb, Trophy
} from 'lucide-react';

interface KPIMetrics {
    // Outbound
    dials: number;
    contacts: number;
    voicemails: number;
    
    // Lead Gen
    leadsGenerated: number;
    qualifiedLeads: number;
    followUps: number;
    textsSent: number;
    
    // Appointments
    appointmentsSet: number;
    appointmentsSat: number; // Completed
    presentations: number;
    
    // Sales
    applications: number;
    policiesSold: number;
    totalPremium: number;
    
    // Financial & Time
    commission: number;
    leadSpend: number;
    hoursWorked: number;
    
    // Notes
    notes: string;
}

type TimePeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YTD';
type AgentType = 'FULL_TIME' | 'PART_TIME';

const ActivityFeed: React.FC = () => {
    // Helper to get date string YYYY-MM-DD
    const getDateString = (date: Date) => date.toISOString().split('T')[0];
    const todayStr = getDateString(new Date());

    const emptyMetrics: KPIMetrics = {
        dials: 0, contacts: 0, voicemails: 0,
        leadsGenerated: 0, qualifiedLeads: 0, followUps: 0, textsSent: 0,
        appointmentsSet: 0, appointmentsSat: 0, presentations: 0,
        applications: 0, policiesSold: 0, totalPremium: 0,
        commission: 0, leadSpend: 0, hoursWorked: 0,
        notes: ''
    };

    // Initialize history from local storage or generate mock history for demo
    const [history, setHistory] = useState<Record<string, KPIMetrics>>(() => {
        try {
            const saved = localStorage.getItem('arise_kpi_history_v2');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Error loading KPI history", e);
        }
        
        // Generate mock history for the last 30 days so the aggregated views look good immediately
        const mockHistory: Record<string, KPIMetrics> = {};
        const today = new Date();
        
        for (let i = 1; i <= 60; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dStr = getDateString(d);
            
            // Random realistic data generation
            const dials = Math.floor(Math.random() * 40) + 10;
            const contacts = Math.floor(dials * (0.15 + Math.random() * 0.15)); // 15-30% contact rate
            const sets = Math.floor(contacts * (0.2 + Math.random() * 0.2)); // 20-40% set rate
            const sales = Math.floor(sets * (0.2 + Math.random() * 0.2)); // Sales
            const premium = sales * (800 + Math.random() * 1000); // Avg premium varies
            
            mockHistory[dStr] = {
                ...emptyMetrics,
                dials,
                contacts,
                voicemails: Math.max(0, dials - contacts),
                leadsGenerated: Math.floor(Math.random() * 3),
                qualifiedLeads: Math.floor(Math.random() * 2),
                followUps: Math.floor(Math.random() * 5),
                textsSent: Math.floor(Math.random() * 10),
                appointmentsSet: sets,
                appointmentsSat: Math.floor(sets * 0.8),
                presentations: Math.floor(sets * 0.8),
                applications: sales,
                policiesSold: sales,
                totalPremium: Math.round(premium),
                commission: Math.round(premium * 0.85),
                hoursWorked: 4 + Math.random() * 6,
                leadSpend: Math.floor(Math.random() * 50),
                notes: `Auto-generated log for ${dStr}`
            };
        }
        return mockHistory;
    });

    const [viewPeriod, setViewPeriod] = useState<TimePeriod>('DAILY');
    const [agentType, setAgentType] = useState<AgentType>('FULL_TIME');
    const [isSaved, setIsSaved] = useState(false);

    // Save history whenever it changes
    useEffect(() => {
        localStorage.setItem('arise_kpi_history_v2', JSON.stringify(history));
    }, [history]);

    // Ensure today has an entry
    useEffect(() => {
        if (!history[todayStr]) {
            setHistory(prev => ({ ...prev, [todayStr]: { ...emptyMetrics } }));
        }
    }, [todayStr]);

    const handleInputChange = (field: keyof KPIMetrics, value: string) => {
        if (viewPeriod !== 'DAILY') return;

        const currentToday = history[todayStr] || emptyMetrics;
        let newValue: string | number = value;

        if (field !== 'notes') {
             newValue = parseFloat(value);
             if (isNaN(newValue)) newValue = 0;
        }

        const updatedEntry = { ...currentToday, [field]: newValue };
        setHistory(prev => ({ ...prev, [todayStr]: updatedEntry }));
        setIsSaved(false);
    };

    const handleSave = () => {
        // Autosave happens via useEffect, this just triggers visual feedback
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset today\'s numbers?')) {
            setHistory(prev => ({ ...prev, [todayStr]: { ...emptyMetrics } }));
            setIsSaved(false);
        }
    };

    // Calculate Aggregated Stats based on View Period
    const displayStats = useMemo(() => {
        if (viewPeriod === 'DAILY') {
            return history[todayStr] || emptyMetrics;
        }

        const now = new Date();
        const startOfPeriod = new Date(now);
        startOfPeriod.setHours(0,0,0,0);

        if (viewPeriod === 'WEEKLY') {
            // Last 7 days including today? Or Calendar week? Let's do Calendar Week (Start Sunday)
            const day = now.getDay(); 
            startOfPeriod.setDate(now.getDate() - day);
        } else if (viewPeriod === 'MONTHLY') {
            startOfPeriod.setDate(1);
        } else if (viewPeriod === 'YTD') {
            startOfPeriod.setMonth(0, 1);
        }

        // Sum up metrics
        const aggregated = { ...emptyMetrics };
        
        Object.keys(history).forEach(dateStr => {
            // Parse date strictly from YYYY-MM-DD to avoid TZ issues
            const [y, m, d] = dateStr.split('-').map(Number);
            const entryDate = new Date(y, m - 1, d); // Month is 0-indexed in JS Date

            if (entryDate >= startOfPeriod && entryDate <= now) {
                (Object.keys(aggregated) as Array<keyof KPIMetrics>).forEach(key => {
                    if (typeof aggregated[key] === 'number') {
                        (aggregated[key] as number) += (history[dateStr][key] as number || 0);
                    }
                });
            }
        });

        // For notes, we don't aggregate string
        aggregated.notes = ""; 
        return aggregated;

    }, [history, viewPeriod, todayStr]);


    // Calculations based on displayStats
    const contactRate = displayStats.dials > 0 ? ((displayStats.contacts / displayStats.dials) * 100).toFixed(1) : '0.0';
    const appointmentRate = displayStats.contacts > 0 ? ((displayStats.appointmentsSet / displayStats.contacts) * 100).toFixed(1) : '0.0';
    const presentationRate = displayStats.appointmentsSat > 0 ? ((displayStats.presentations / displayStats.appointmentsSat) * 100).toFixed(1) : '0.0';
    const closeRate = displayStats.presentations > 0 ? ((displayStats.policiesSold / displayStats.presentations) * 100).toFixed(1) : '0.0';
    
    const avgPremiumPerSale = displayStats.policiesSold > 0 ? (displayStats.totalPremium / displayStats.policiesSold).toFixed(0) : '0';
    const avgCommPerSale = displayStats.policiesSold > 0 ? (displayStats.commission / displayStats.policiesSold).toFixed(0) : '0';
    const costPerAcquisition = displayStats.policiesSold > 0 ? (displayStats.leadSpend / displayStats.policiesSold).toFixed(2) : '0.00';
    const hourlyRate = displayStats.hoursWorked > 0 ? (displayStats.commission / displayStats.hoursWorked).toFixed(2) : '0.00';

    // Insight Logic
    const getInsight = () => {
        if (viewPeriod === 'DAILY' && displayStats.dials === 0) return "Start your day by logging your dials to see analytics.";
        if (Number(contactRate) < 10 && displayStats.dials > 20) return "Contact rate is low. Try calling at different times or check lead quality.";
        if (Number(appointmentRate) < 20 && displayStats.contacts > 5) return "Appointment set rate is low. Review your opening script and value proposition.";
        if (Number(presentationRate) < 70 && displayStats.appointmentsSat > 2) return "Presentation rate is low. Ensure you are bridging from warm-up to presentation effectively.";
        if (Number(closeRate) < 25 && displayStats.presentations > 2) return "Close rate is below target. Focus on objection handling and trial closes.";
        if (Number(hourlyRate) > 100) return "Great hourly return! Scale up your activity to maximize earnings.";
        
        return `Tracking ${viewPeriod.toLowerCase()} performance. Consistency is key to long-term growth.`;
    };

    const InputGroup = ({ title, icon, children }: { title: string, icon: React.ReactNode, children?: React.ReactNode }) => (
        <div className="bg-slate-50/50 rounded-lg border border-gray-100 p-4 relative group">
            {viewPeriod !== 'DAILY' && <div className="absolute inset-0 bg-gray-50/50 z-10 cursor-not-allowed rounded-lg" title="Switch to Daily view to edit"></div>}
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                {icon} {title}
            </h4>
            <div className="space-y-3">
                {children}
            </div>
        </div>
    );

    const NumberInput = ({ label, field }: { label: string, field: keyof KPIMetrics }) => (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input 
                type="number" 
                min="0"
                disabled={viewPeriod !== 'DAILY'}
                className={`w-full px-3 py-1.5 border rounded-md text-sm outline-none transition-all text-slate-900
                    ${viewPeriod === 'DAILY' 
                        ? 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 text-slate-800' 
                        : 'bg-white border-transparent text-gray-500 font-medium'}`}
                value={displayStats[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder="0"
            />
        </div>
    );

    const CurrencyInput = ({ label, field }: { label: string, field: keyof KPIMetrics }) => (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input 
                    type="number" 
                    min="0"
                    disabled={viewPeriod !== 'DAILY'}
                    className={`w-full pl-6 pr-3 py-1.5 border rounded-md text-sm outline-none transition-all text-slate-900
                        ${viewPeriod === 'DAILY' 
                            ? 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 text-slate-800' 
                            : 'bg-white border-transparent text-gray-500 font-medium'}`}
                    value={displayStats[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder="0.00"
                />
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Agent Performance Tracker</h2>
                    <p className="text-slate-500 text-sm">Monitor activity and analyze key conversion metrics.</p>
                </div>
                <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    {(['DAILY', 'WEEKLY', 'MONTHLY', 'YTD'] as TimePeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setViewPeriod(p)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewPeriod === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Actions Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={16} />
                        <span className="font-medium">
                            {viewPeriod === 'DAILY' 
                                ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) 
                                : `${viewPeriod} Summary`}
                        </span>
                        {viewPeriod !== 'DAILY' && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Aggregated View</span>}
                    </div>
                    {viewPeriod === 'DAILY' && (
                        <div className="flex gap-2">
                            <button 
                                onClick={handleReset}
                                className="px-3 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                            >
                                <RotateCcw size={14} /> Reset Today
                            </button>
                            <button 
                                onClick={handleSave}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isSaved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                            >
                                {isSaved ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save Data</>}
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6">
                     {/* Daily Targets Section - Moved to Top */}
                    <div className="mb-8 bg-indigo-50/30 rounded-xl border border-indigo-100 p-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Target size={18} className="text-indigo-600" /> Daily Targets
                            </h3>
                            <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                <button 
                                    onClick={() => setAgentType('FULL_TIME')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${agentType === 'FULL_TIME' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
                                >
                                    Full-Time
                                </button>
                                <button 
                                    onClick={() => setAgentType('PART_TIME')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${agentType === 'PART_TIME' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
                                >
                                    Part-Time
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                        <Phone size={14} />
                                    </div>
                                    Dials
                                </div>
                                <span className="font-bold text-slate-800 text-lg">{agentType === 'FULL_TIME' ? '300' : '150'}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                        <Briefcase size={14} />
                                    </div>
                                    Presentations
                                </div>
                                <span className="font-bold text-slate-800 text-lg">{agentType === 'FULL_TIME' ? '5' : '3'}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                        <Trophy size={14} />
                                    </div>
                                    Sales
                                </div>
                                <span className="font-bold text-slate-800 text-lg">{agentType === 'FULL_TIME' ? '1-2+' : '1'}</span>
                            </div>
                             <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                        <Clock size={14} />
                                    </div>
                                    Dialing Hours
                                </div>
                                <span className="font-bold text-slate-800 text-lg">{agentType === 'FULL_TIME' ? '6+' : '3+'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Input Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                        <InputGroup title="Outbound" icon={<Phone size={14} />}>
                            <NumberInput label="Total Dials" field="dials" />
                            <NumberInput label="Contacts Reached" field="contacts" />
                            <NumberInput label="Voicemails Left" field="voicemails" />
                        </InputGroup>

                        <InputGroup title="Lead Gen" icon={<Users size={14} />}>
                            <NumberInput label="Leads Generated" field="leadsGenerated" />
                            <NumberInput label="Qualified Leads" field="qualifiedLeads" />
                            <div className="grid grid-cols-2 gap-2">
                                <NumberInput label="Follow-ups" field="followUps" />
                                <NumberInput label="Texts Sent" field="textsSent" />
                            </div>
                        </InputGroup>

                        <InputGroup title="Appointments" icon={<Calendar size={14} />}>
                            <NumberInput label="Appointments Set" field="appointmentsSet" />
                            <NumberInput label="Completed (Sat)" field="appointmentsSat" />
                            <NumberInput label="Presentations" field="presentations" />
                        </InputGroup>

                        <InputGroup title="Sales Results" icon={<CheckCircle2 size={14} />}>
                            <NumberInput label="Applications" field="applications" />
                            <NumberInput label="Policies Sold" field="policiesSold" />
                            <CurrencyInput label="Total Premium" field="totalPremium" />
                        </InputGroup>

                        <InputGroup title="Financial & Time" icon={<Briefcase size={14} />}>
                            <CurrencyInput label="Commission" field="commission" />
                            <CurrencyInput label="Lead Spend" field="leadSpend" />
                            <NumberInput label="Hours Worked" field="hoursWorked" />
                        </InputGroup>
                    </div>

                    {/* Notes Area */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Notes</label>
                        <textarea 
                            className={`w-full bg-slate-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white text-slate-900 ${viewPeriod !== 'DAILY' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            rows={2}
                            placeholder={viewPeriod === 'DAILY' ? "Add notes about today's activities, wins, or challenges..." : "Notes are only editable in Daily view."}
                            value={displayStats.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            disabled={viewPeriod !== 'DAILY'}
                        />
                    </div>

                    {/* Ratios & Insights Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Ratios */}
                        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
                            <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 text-center">
                                <div className="text-2xl font-bold text-slate-800">{contactRate}%</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Contact Rate</div>
                                <div className="text-[10px] text-gray-400">Contacts / Dials</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 text-center">
                                <div className="text-2xl font-bold text-slate-800">{appointmentRate}%</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Appt Rate</div>
                                <div className="text-[10px] text-gray-400">Appts / Contacts</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-gray-100 text-center">
                                <div className="text-2xl font-bold text-slate-800">{presentationRate}%</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Pres Rate</div>
                                <div className="text-[10px] text-gray-400">Pres / Appts</div>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                                <div className="text-2xl font-bold text-indigo-700">{closeRate}%</div>
                                <div className="text-[10px] text-indigo-600 font-bold uppercase mt-1">Close Rate</div>
                                <div className="text-[10px] text-indigo-400">Sales / Pres</div>
                            </div>

                             <div className="p-4 bg-white rounded-xl border border-gray-100 text-center shadow-sm">
                                <div className="text-lg font-bold text-slate-800">${parseInt(avgPremiumPerSale).toLocaleString()}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Avg Prem/Sale</div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-100 text-center shadow-sm">
                                <div className="text-lg font-bold text-slate-800">${parseInt(avgCommPerSale).toLocaleString()}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Avg Comm/Sale</div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-100 text-center shadow-sm">
                                <div className="text-lg font-bold text-orange-600">${costPerAcquisition}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cost Per Acq.</div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-100 text-center shadow-sm">
                                <div className="text-lg font-bold text-green-600">${hourlyRate}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Hourly Return</div>
                            </div>
                        </div>

                        {/* Right Column: Insights Only (Targets moved to top) */}
                        <div className="space-y-6">
                            {/* Performance Insights */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg flex flex-col justify-center relative overflow-hidden h-full min-h-[160px]">
                                <div className="relative z-10">
                                    <h4 className="font-bold flex items-center gap-2 mb-3">
                                        <Lightbulb size={18} className="text-yellow-300" /> Performance Insights
                                    </h4>
                                    <p className="text-sm text-indigo-100 leading-relaxed italic">
                                        "{getInsight()}"
                                    </p>
                                </div>
                                <Target className="absolute right-[-10px] bottom-[-20px] text-white opacity-10 w-32 h-32" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
