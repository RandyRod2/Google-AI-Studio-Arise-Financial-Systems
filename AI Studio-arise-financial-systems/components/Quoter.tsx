
import React, { useState, useMemo } from 'react';
import { Search, Plus, X, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Calculator, Stethoscope, Pill, User, Ruler } from 'lucide-react';

// --- MOCK CARRIER DATA & RULES ---

type PlanType = 'LEVEL' | 'GRADED' | 'MODIFIED' | 'GI';

interface CarrierPlan {
    id: string;
    carrierName: string;
    planName: string;
    minAge: number;
    maxAge: number;
    baseRate: number; // Base monthly cost per $1k coverage
    policyFee: number;
    type: PlanType;
    logoColor: string;
}

interface HealthCondition {
    id: string;
    name: string;
    category: string;
    questions?: {
        id: string;
        text: string;
        type: 'BOOLEAN' | 'NUMBER';
    }[];
}

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 
    'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 
    'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 
    'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AVAILABLE_CONDITIONS: HealthCondition[] = [
    { id: 'diabetes', name: 'Diabetes', category: 'Endocrine', questions: [
        { id: 'insulin', text: 'Insulin dependent?', type: 'BOOLEAN' },
        { id: 'onset_age', text: 'Age of diagnosis?', type: 'NUMBER' },
        { id: 'complications', text: 'Any neuropathy or retinopathy?', type: 'BOOLEAN' }
    ]},
    { id: 'copd', name: 'COPD / Emphysema', category: 'Respiratory', questions: [
        { id: 'oxygen', text: 'Uses oxygen?', type: 'BOOLEAN' },
        { id: 'tobacco', text: 'Current smoker?', type: 'BOOLEAN' }
    ]},
    { id: 'heart_attack', name: 'Heart Attack', category: 'Cardiovascular', questions: [
        { id: 'years_ago', text: 'Years since event?', type: 'NUMBER' }
    ]},
    { id: 'stroke', name: 'Stroke / TIA', category: 'Cardiovascular', questions: [
        { id: 'years_ago', text: 'Years since event?', type: 'NUMBER' },
        { id: 'residual', text: 'Any residual effects?', type: 'BOOLEAN' }
    ]},
    { id: 'cancer', name: 'Cancer (Internal)', category: 'Oncology', questions: [
        { id: 'years_free', text: 'Years cancer free?', type: 'NUMBER' },
        { id: 'metastatic', text: 'Was it metastatic?', type: 'BOOLEAN' }
    ]},
    { id: 'kidney_disease', name: 'Kidney Disease', category: 'Renal', questions: [
        { id: 'dialysis', text: 'Currently on dialysis?', type: 'BOOLEAN' }
    ]},
    { id: 'liver_disease', name: 'Liver Disease', category: 'Hepatic', questions: [
        { id: 'cirrhosis', text: 'Diagnosed with Cirrhosis?', type: 'BOOLEAN' }
    ]},
    { id: 'parkinsons', name: 'Parkinson\'s Disease', category: 'Neurological', questions: [
        { id: 'adl_help', text: 'Help with ADLs needed?', type: 'BOOLEAN' }
    ]},
    { id: 'alzheimers', name: 'Alzheimer\'s / Dementia', category: 'Neurological' },
    { id: 'hbp', name: 'High Blood Pressure', category: 'Cardiovascular' },
    { id: 'cholesterol', name: 'High Cholesterol', category: 'Cardiovascular' },
    { id: 'afib', name: 'Atrial Fibrillation', category: 'Cardiovascular' },
    { id: 'depression', name: 'Depression / Anxiety', category: 'Mental Health', questions: [
        { id: 'hospitalized', text: 'Hospitalized in last 2 years?', type: 'BOOLEAN' }
    ]}
];

const CARRIER_PLANS: CarrierPlan[] = [
    { id: 'moo_lp', carrierName: 'Mutual of Omaha', planName: 'Living Promise', minAge: 45, maxAge: 85, baseRate: 3.2, policyFee: 36, type: 'LEVEL', logoColor: 'bg-green-600' },
    { id: 'moo_graded', carrierName: 'Mutual of Omaha', planName: 'Living Promise Graded', minAge: 45, maxAge: 80, baseRate: 5.5, policyFee: 36, type: 'GRADED', logoColor: 'bg-green-600' },
    { id: 'aetna_cvs', carrierName: 'Aetna / CVS', planName: 'Ascent', minAge: 40, maxAge: 89, baseRate: 3.1, policyFee: 40, type: 'LEVEL', logoColor: 'bg-red-600' },
    { id: 'aetna_mod', carrierName: 'Aetna / CVS', planName: 'Ascent Modified', minAge: 40, maxAge: 75, baseRate: 6.2, policyFee: 40, type: 'MODIFIED', logoColor: 'bg-red-600' },
    { id: 'trans_i', carrierName: 'Transamerica', planName: 'Immediate Solution', minAge: 0, maxAge: 85, baseRate: 3.0, policyFee: 30, type: 'LEVEL', logoColor: 'bg-red-500' },
    { id: 'prosperity', carrierName: 'Prosperity', planName: 'New Vista', minAge: 50, maxAge: 80, baseRate: 3.4, policyFee: 35, type: 'LEVEL', logoColor: 'bg-yellow-600' },
    { id: 'gerber', carrierName: 'Gerber', planName: 'Guaranteed Life', minAge: 50, maxAge: 80, baseRate: 8.5, policyFee: 0, type: 'GI', logoColor: 'bg-blue-600' },
];

const Quoter: React.FC = () => {
    // --- STATE ---
    const [inputs, setInputs] = useState({
        age: 65,
        gender: 'Male',
        tobacco: 'No',
        state: 'TX',
        coverage: 15000,
        heightFt: 5,
        heightIn: 9,
        weight: 180
    });

    const [selectedConditions, setSelectedConditions] = useState<{
        conditionId: string;
        answers: Record<string, any>;
    }[]>([]);

    const [conditionSearch, setConditionSearch] = useState('');
    const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);

    // --- ACTIONS ---

    const addCondition = (conditionId: string) => {
        if (!selectedConditions.find(c => c.conditionId === conditionId)) {
            setSelectedConditions([...selectedConditions, { conditionId, answers: {} }]);
        }
        setConditionSearch('');
        setIsConditionDropdownOpen(false);
    };

    const removeCondition = (conditionId: string) => {
        setSelectedConditions(selectedConditions.filter(c => c.conditionId !== conditionId));
    };

    const updateConditionAnswer = (conditionId: string, questionId: string, value: any) => {
        setSelectedConditions(prev => prev.map(c => {
            if (c.conditionId !== conditionId) return c;
            return {
                ...c,
                answers: { ...c.answers, [questionId]: value }
            };
        }));
    };

    // --- UNDERWRITING ENGINE ---

    const underwritingResults = useMemo(() => {
        // Calculate BMI
        const heightInInches = (inputs.heightFt * 12) + inputs.heightIn;
        const bmi = heightInInches > 0 ? (inputs.weight * 703) / (heightInInches * heightInInches) : 0;

        return CARRIER_PLANS.map(plan => {
            let status: 'APPROVED' | 'DECLINED' | 'REFER_TO_GRADED' = 'APPROVED';
            let reasons: string[] = [];

            // 1. Basic Eligibility
            if (inputs.age < plan.minAge || inputs.age > plan.maxAge) {
                status = 'DECLINED';
                reasons.push(`Age ${inputs.age} outside limits (${plan.minAge}-${plan.maxAge})`);
            }

            // 2. BMI Check
            if (bmi > 45 && plan.type !== 'GI') {
                status = 'DECLINED';
                reasons.push(`BMI ${bmi.toFixed(1)} too high`);
            } else if (bmi > 40 && plan.type === 'LEVEL') {
                status = 'DECLINED';
                reasons.push(`BMI ${bmi.toFixed(1)} too high for Level`);
            }

            // 3. Medical Logic (The "Brain")
            selectedConditions.forEach(sc => {
                const { conditionId, answers } = sc;

                // --- DIABETES RULES ---
                if (conditionId === 'diabetes') {
                    if (answers['insulin'] === true) {
                        if (plan.id === 'trans_i') {
                            status = 'DECLINED';
                            reasons.push('Declines Insulin usage');
                        }
                        if (plan.id === 'moo_lp' && answers['onset_age'] < 50) {
                            status = 'DECLINED'; // MOO allows insulin if start age > 50 for Level
                            reasons.push('Insulin start before age 50');
                        }
                    }
                    if (answers['complications'] === true && plan.type === 'LEVEL') {
                        status = 'DECLINED';
                        reasons.push('Diabetes complications knockout Level');
                    }
                }

                // --- COPD RULES ---
                if (conditionId === 'copd') {
                    if (plan.type === 'LEVEL') {
                        status = 'DECLINED';
                        reasons.push('COPD is not accepted for Level');
                    }
                    if (answers['oxygen'] === true && plan.type !== 'GI') {
                        status = 'DECLINED';
                        reasons.push('Oxygen use is knockout');
                    }
                }

                // --- HEART ATTACK RULES ---
                if (conditionId === 'heart_attack') {
                    const years = Number(answers['years_ago']);
                    if (years < 2 && plan.type === 'LEVEL') {
                        status = 'DECLINED';
                        reasons.push('Event within 2 years');
                    }
                    if (years < 1 && plan.type === 'GRADED') {
                        status = 'DECLINED';
                        reasons.push('Event within 1 year');
                    }
                }

                // --- STROKE RULES ---
                if (conditionId === 'stroke') {
                    const years = Number(answers['years_ago']);
                    if (years < 2 && plan.type === 'LEVEL') {
                        status = 'DECLINED';
                        reasons.push('Stroke within 2 years');
                    }
                    if (years < 1 && plan.type === 'GRADED') {
                        status = 'DECLINED';
                        reasons.push('Stroke within 1 year');
                    }
                }

                // --- CANCER RULES ---
                if (conditionId === 'cancer') {
                    const yearsFree = Number(answers['years_free']);
                    if (yearsFree < 2 && plan.type !== 'GI') {
                        status = 'DECLINED';
                        reasons.push('Cancer within 2 years');
                    }
                    if (yearsFree < 4 && plan.id === 'moo_lp') {
                        status = 'DECLINED'; // MOO strict on cancer
                        reasons.push('Cancer within 4 years');
                    }
                }

                // --- KIDNEY RULES ---
                if (conditionId === 'kidney_disease') {
                    if (answers['dialysis'] === true && plan.type !== 'GI') {
                        status = 'DECLINED';
                        reasons.push('Dialysis is knockout');
                    }
                }

                // --- LIVER RULES ---
                if (conditionId === 'liver_disease') {
                    if (answers['cirrhosis'] === true && plan.type !== 'GI') {
                        status = 'DECLINED';
                        reasons.push('Cirrhosis is knockout');
                    }
                }

                // --- NEURO RULES ---
                if (conditionId === 'alzheimers' && plan.type !== 'GI') {
                    status = 'DECLINED';
                    reasons.push('Dementia/Alz is GI only');
                }

                if (conditionId === 'parkinsons') {
                    if (answers['adl_help'] === true && plan.type !== 'GI') {
                        status = 'DECLINED';
                        reasons.push('ADL assistance required');
                    }
                }

                // --- MENTAL HEALTH RULES ---
                if (conditionId === 'depression') {
                    if (answers['hospitalized'] === true && plan.type === 'LEVEL') {
                        status = 'DECLINED';
                        reasons.push('Hospitalization for mental health');
                    }
                }
            });

            // Calculate Premium if Approved
            let monthlyPremium = 0;
            if (status === 'APPROVED') {
                // Mock calculation: (Base Rate * Coverage/1000) * Factors + Fee
                let rate = plan.baseRate;
                if (inputs.tobacco === 'Yes') rate *= 1.3;
                if (inputs.gender === 'Male') rate *= 1.2;
                
                // Age Factor (compound 3% per year over 50)
                const ageFactor = Math.pow(1.03, Math.max(0, inputs.age - 50));
                
                monthlyPremium = (rate * ageFactor * (inputs.coverage / 1000)) + (plan.policyFee / 12);
            }

            return {
                ...plan,
                status,
                reasons,
                monthlyPremium
            };

        }).filter(res => res.status === 'APPROVED' || res.reasons.length > 0).sort((a, b) => {
            // Sort: Approved first, then by Price
            if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
            if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
            return a.monthlyPremium - b.monthlyPremium;
        });
    }, [inputs, selectedConditions]);

    const numInputClass = "w-full p-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 focus:bg-white focus:border-indigo-500 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calculator className="text-indigo-600" /> Smart Quoter
                    </h2>
                    <p className="text-slate-500 text-sm">Underwriting intelligence engine. Real-time approval odds.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
                
                {/* LEFT PANEL: INPUTS */}
                <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto pr-1">
                    
                    {/* Basic Info Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <User size={16} className="text-indigo-500" /> Client Profile
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full p-2 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 focus:bg-white focus:border-indigo-500 outline-none appearance-none"
                                            value={inputs.state}
                                            onChange={e => setInputs({...inputs, state: e.target.value})}
                                        >
                                            {US_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
                                    <input 
                                        type="number" 
                                        className={numInputClass}
                                        value={inputs.age || ''}
                                        onChange={e => setInputs({...inputs, age: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                                    <div className="flex bg-slate-50 p-1 rounded-lg border border-gray-200">
                                        <button 
                                            className={`flex-1 py-1 text-xs rounded font-medium transition-all ${inputs.gender === 'Male' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                            onClick={() => setInputs({...inputs, gender: 'Male'})}
                                        >
                                            M
                                        </button>
                                        <button 
                                            className={`flex-1 py-1 text-xs rounded font-medium transition-all ${inputs.gender === 'Female' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                                            onClick={() => setInputs({...inputs, gender: 'Female'})}
                                        >
                                            F
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nicotine</label>
                                    <div className="flex bg-slate-50 p-1 rounded-lg border border-gray-200">
                                        <button 
                                            className={`flex-1 py-1 text-xs rounded font-medium transition-all ${inputs.tobacco === 'Yes' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                                            onClick={() => setInputs({...inputs, tobacco: 'Yes'})}
                                        >
                                            Yes
                                        </button>
                                        <button 
                                            className={`flex-1 py-1 text-xs rounded font-medium transition-all ${inputs.tobacco === 'No' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
                                            onClick={() => setInputs({...inputs, tobacco: 'No'})}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Height & Weight */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
                                    <div className="flex gap-1">
                                        <input 
                                            type="number"
                                            placeholder="Ft"
                                            className={numInputClass}
                                            value={inputs.heightFt || ''}
                                            onChange={e => setInputs({...inputs, heightFt: parseInt(e.target.value) || 0})}
                                        />
                                        <input 
                                            type="number"
                                            placeholder="In"
                                            className={numInputClass}
                                            value={inputs.heightIn || ''}
                                            onChange={e => setInputs({...inputs, heightIn: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Weight (lbs)</label>
                                    <input 
                                        type="number" 
                                        className={numInputClass}
                                        value={inputs.weight || ''}
                                        onChange={e => setInputs({...inputs, weight: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Face Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                    <input 
                                        type="number" 
                                        step="1000"
                                        className={`${numInputClass} pl-7 font-bold text-slate-800`}
                                        value={inputs.coverage || ''}
                                        placeholder="0"
                                        onChange={e => setInputs({...inputs, coverage: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical Logic Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex-1">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <Stethoscope size={16} className="text-red-500" /> Medical & Rx
                        </h3>
                        
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Add condition (e.g. Diabetes)"
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                value={conditionSearch}
                                onChange={(e) => {
                                    setConditionSearch(e.target.value);
                                    setIsConditionDropdownOpen(true);
                                }}
                                onFocus={() => setIsConditionDropdownOpen(true)}
                            />
                            {/* Autocomplete Dropdown */}
                            {isConditionDropdownOpen && conditionSearch && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {AVAILABLE_CONDITIONS.filter(c => c.name.toLowerCase().includes(conditionSearch.toLowerCase()))
                                        .map(c => (
                                            <div 
                                                key={c.id} 
                                                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700 flex justify-between items-center bg-white"
                                                onClick={() => addCondition(c.id)}
                                            >
                                                {c.name}
                                                <Plus size={14} className="text-indigo-400" />
                                            </div>
                                        ))
                                    }
                                    {AVAILABLE_CONDITIONS.filter(c => c.name.toLowerCase().includes(conditionSearch.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-3 text-xs text-gray-400 text-center bg-white">No matching conditions</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Conditions List */}
                        <div className="space-y-4">
                            {selectedConditions.map((sc) => {
                                const def = AVAILABLE_CONDITIONS.find(c => c.id === sc.conditionId);
                                if (!def) return null;

                                return (
                                    <div key={sc.conditionId} className="bg-white border border-gray-200 rounded-lg p-3 animate-fade-in shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-sm text-slate-800">{def.name}</div>
                                            <button 
                                                onClick={() => removeCondition(sc.conditionId)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {/* Dynamic Questions */}
                                        {def.questions && (
                                            <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                                                {def.questions.map(q => (
                                                    <div key={q.id}>
                                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{q.text}</label>
                                                        {q.type === 'BOOLEAN' ? (
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => updateConditionAnswer(sc.conditionId, q.id, true)}
                                                                    className={`px-3 py-1 rounded text-xs border ${sc.answers[q.id] === true ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                                                >
                                                                    Yes
                                                                </button>
                                                                <button 
                                                                    onClick={() => updateConditionAnswer(sc.conditionId, q.id, false)}
                                                                    className={`px-3 py-1 rounded text-xs border ${sc.answers[q.id] === false ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <input 
                                                                type="number"
                                                                className="w-20 p-1 text-sm border border-gray-200 rounded bg-white text-slate-900 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                value={sc.answers[q.id] || ''}
                                                                onChange={(e) => updateConditionAnswer(sc.conditionId, q.id, e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            <div className="pt-4 border-t border-dashed border-gray-200">
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <Pill size={12} /> Rx Lookup (Beta)
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Type drug name..."
                                    disabled
                                    className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: RESULTS */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800">Quotes & Eligibility</h3>
                            <p className="text-xs text-slate-500">Based on {selectedConditions.length} health conditions.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">Level</span>
                            <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg">Graded</span>
                            <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-lg">Declined</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {underwritingResults.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                No plans available for these criteria.
                            </div>
                        ) : underwritingResults.map((result) => {
                            const isApproved = result.status === 'APPROVED';
                            
                            return (
                                <div key={result.id} className={`bg-white rounded-xl border shadow-sm transition-all relative overflow-hidden group
                                    ${!isApproved ? 'border-red-200 opacity-80 bg-red-50/30' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'}`}>
                                    
                                    {/* Status Stripe */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                                        ${result.status === 'DECLINED' ? 'bg-red-500' : 
                                          result.type === 'LEVEL' ? 'bg-green-500' : 
                                          result.type === 'GRADED' || result.type === 'MODIFIED' ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                                    </div>

                                    <div className="p-4 pl-6 flex flex-col sm:flex-row items-center gap-4">
                                        {/* Logo / Name */}
                                        <div className="flex-1 flex items-center gap-4 w-full">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm ${result.logoColor}`}>
                                                {result.carrierName.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{result.carrierName}</h4>
                                                <p className="text-xs text-slate-500 font-medium">{result.planName}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border 
                                                        ${result.type === 'LEVEL' ? 'text-green-700 border-green-200 bg-green-50' : 
                                                          result.type === 'GI' ? 'text-blue-700 border-blue-200 bg-blue-50' : 
                                                          'text-yellow-700 border-yellow-200 bg-yellow-50'}`}>
                                                        {result.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Decision & Price */}
                                        <div className="text-right w-full sm:w-auto">
                                            {isApproved ? (
                                                <>
                                                    <div className="text-2xl font-bold text-slate-900">${result.monthlyPremium.toFixed(2)}</div>
                                                    <div className="text-xs text-gray-500">per month</div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600 font-bold">
                                                    <XCircle size={18} /> DECLINED
                                                </div>
                                            )}
                                        </div>

                                        {/* Action */}
                                        {isApproved && (
                                            <button className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                                                Select
                                            </button>
                                        )}
                                    </div>

                                    {/* Reasons / Knockouts */}
                                    {result.reasons.length > 0 && (
                                        <div className="px-6 py-2 bg-red-50 border-t border-red-100 flex items-start gap-2">
                                            <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-red-700 font-medium">
                                                {result.reasons.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Quoter;
