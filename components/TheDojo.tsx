import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Mic, MicOff, Send, Play, Square, Trophy, MessageSquare, RefreshCw, User, Bot, 
    AlertCircle, CheckCircle2, Phone, TrendingUp, Heart, Home, Flag, BookOpen, 
    Joystick, Volume2, Info, Star, ArrowRight, Activity, Brain, CheckSquare, 
    Zap, Flame, ThermometerSun, ShieldAlert, Check, Target, ChevronRight, X,
    History, PlayCircle, Quote, Shield, Swords, Timer, ZapOff, Ghost, Siren,
    UserCheck, Scale, AudioLines, Zap as ZapIcon, Stethoscope, Briefcase,
    UserPlus, Users, Train, ShieldCheck, Sparkles, Medal, Award
} from 'lucide-react';
import { 
    connectToLiveDojo, 
    decodeBase64Audio, 
    decodeAudioData, 
    createPcmBlob,
    createChatSession,
    sendMessageToGemini
} from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';
// Fix: Renamed DojoGoldenRebuttal to DojoGoldenRebuttals to match exported member in types.ts
import { DojoScorecard, DojoMoment, DojoGoldenRebuttals } from '../types';
import { ScriptLibrary } from './ScriptLibrary';

interface MissionGoal {
    id: string;
    text: string;
    keywords: string[];
    completed: boolean;
}

interface Battlecard {
    bridge: string;
    prompt: string;
    objectionText: string;
}

interface RoleplayScenario {
    id: string;
    title: string;
    icon: React.ReactNode;
    leadType: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
    aiPersona: string;
    vocalProfile: string;
    objective: string;
    keywords: string[];
    goals: MissionGoal[];
    isGauntlet?: boolean;
}

const SCENARIOS: RoleplayScenario[] = [
    {
        id: 'gauntlet_mode',
        title: 'Objection Gauntlet',
        icon: <Swords size={24} className="text-orange-500" />,
        leadType: 'TRAINING MODE',
        description: 'The Ultimate Stress Test. The prospect fires objections whenever they hear hesitation, rambling, or weakness. 3 strikes and they hang up.',
        difficulty: 'Extreme',
        aiPersona: 'You are a highly resistant, impatient prospect on a life insurance telesales call. You are a regular consumer who requested information but is now being defensive. You MUST only use the 7 approved life insurance objections. NEVER talk about smart home technology, electronics, or unrelated topics. If the agent makes a mistake or pauses, use one of the approved objections.',
        vocalProfile: 'Distracted, loud, impatient, and aggressive.',
        objective: 'Survive the conversation for 2 minutes without getting hung up on.',
        keywords: ['Rebuttal', 'Deflection', 'Bridge', 'Control'],
        isGauntlet: true,
        goals: [
            { id: 'g1', text: 'Deflect Price Objection', keywords: ['monthly', 'budget', 'pennies'], completed: false },
            { id: 'g2', text: 'Deflect "Busy" Objection', keywords: ['2 minutes', 'quick', 'eligibility'], completed: false },
            { id: 'g3', text: 'Maintain Alpha Tone', keywords: ['understand', 'listen', 'look', 'verify'], completed: false }
        ]
    },
    {
        id: 'easy_fex',
        title: 'FEX: Dorothy',
        icon: <Heart size={24} className="text-emerald-500" />,
        leadType: 'FEX Lead',
        description: 'Calling "Dorothy", 68. She is sweet but easily distracted. Keep her on track and qualify her health.',
        difficulty: 'Easy',
        aiPersona: 'You are "Dorothy", 68. You are friendly and talkative, but you get off track easily talking about your grandkids. You want coverage so your kids don\'t have a burden.',
        vocalProfile: 'Sweet, elderly, gentle, slow-paced.',
        objective: 'Complete the health qualifying and present options.',
        keywords: ['Funeral', 'Kids', 'Budget'],
        goals: [
            { id: 'rapport', text: 'Build rapport', keywords: ['family', 'kids', 'how are you'], completed: false },
            { id: 'health', text: 'Qualify health', keywords: ['medication', 'hospital', 'doctor'], completed: false }
        ]
    },
    {
        id: 'vet_easy',
        title: 'Veteran: Sgt. Dave',
        icon: <UserCheck size={24} className="text-sky-400" />,
        leadType: 'Veteran Lead',
        description: 'Sgt. Dave, 65. Friendly and just looking for a "free review" he saw on an ad. Low resistance mission.',
        difficulty: 'Easy',
        aiPersona: 'You are Sgt. Dave, 65. You are retired and happy. You saw an ad for "Veteran Burial Benefits" and clicked it because you were curious. You have no resistance, but you are a bit slow to understand technical terms. You want to make sure your wife is taken care of.',
        vocalProfile: 'Friendly, slow, relaxed, story-teller.',
        objective: 'Complete a full fact-find and identify the VA payout gap.',
        keywords: ['Review', 'Wife', 'Simple'],
        goals: [
            { id: 'v1', text: 'Build veteran rapport', keywords: ['branch', 'service', 'rank'], completed: false },
            { id: 'v2', text: 'Explain VA limits', keywords: ['standard', 'benefit', 'private'], completed: false }
        ]
    },
    {
        id: 'hard_fex',
        title: 'FEX: Grumpy Harold',
        icon: <Heart size={24} className="text-rose-500" />,
        leadType: 'FEX Lead',
        description: 'Harold, 74. He is skeptical and thinks "the state" pays for his funeral. He is very defensive about his money.',
        difficulty: 'Hard',
        aiPersona: 'You are "Harold", 74. You are grumpy and believe the state gives you $255 so you don\'t need insurance. You think everything is a scam.',
        vocalProfile: 'Rough, deep voice, skeptical, fast to judge.',
        objective: 'Overcome the "State pays for it" objection and qualify for a graded plan.',
        keywords: ['Social Security', 'Inflation', 'Burial'],
        goals: [
            { id: 'myth', text: 'Bust the $255 Myth', keywords: ['255', 'social security', 'government'], completed: false },
            { id: 'budget', text: 'Find a Budget', keywords: ['monthly', 'spend', 'afford'], completed: false }
        ]
    },
    {
        id: 'mp_commuter',
        title: 'MP: The Rushed Commuter',
        icon: <Train size={24} className="text-blue-400" />,
        leadType: 'MP Lead',
        description: 'Sarah, 35. She is literally running to catch a train. You have 15 seconds to give her a reason NOT to hang up.',
        difficulty: 'Hard',
        aiPersona: 'You are Sarah, 35. You are extremely busy and stressed. There is train station noise in the background. You want to hang up immediately. You will ONLY stay on if the agent acknowledges you are busy and provides a 2-minute value proposition.',
        vocalProfile: 'Fast-paced, breathless, distracted, noisy background.',
        objective: 'Secure 2 minutes to verify the mortgage details.',
        keywords: ['Commute', '2 minutes', 'Train'],
        goals: [
            { id: 'busy_rebuttal', text: 'Bridge the "Busy" Objection', keywords: ['rushing', 'understand', 'quick'], completed: false },
            { id: 'hook', text: 'Deliver 15-second hook', keywords: ['protect', 'mortgage', 'home'], completed: false }
        ]
    },
    {
        id: 'mp_second_op',
        title: 'MP: The Second Opinion',
        icon: <Home size={24} className="text-indigo-400" />,
        leadType: 'MP Lead',
        description: 'Brenda, 48. She already has a quote from her bank and thinks it is too expensive. Pitch the independent advantage.',
        difficulty: 'Medium',
        aiPersona: 'You are Brenda, 48. You just bought a house. Your bank offered you mortgage protection for $120/mo and it seemed high. You are looking for a deal. You are skeptical of agents but motivated by price.',
        vocalProfile: 'Pragmatic, direct, cost-conscious.',
        objective: 'Differentiate from "Bank Products" and secure the data for a comparison.',
        keywords: ['Comparison', 'Bank', 'Independent'],
        goals: [
            { id: 'm1', text: 'Contrast Bank vs Independent', keywords: ['bank', 'choice', 'A-rated'], completed: false },
            { id: 'm2', text: 'Qualify Health for discounts', keywords: ['health', 'discounts', 'best rate'], completed: false }
        ]
    },
    {
        id: 'mp_equity_unhealthy',
        title: 'MP: Equity Protection Pivot',
        icon: <ShieldCheck size={24} className="text-rose-400" />,
        leadType: 'MP Lead',
        description: 'John, 62. He has severe heart health issues and is a knockout for Term. Pivot to the "Buying Time" strategy.',
        difficulty: 'Extreme',
        aiPersona: 'You are John, 62. You just found out your heart health makes you ineligible for big policies. You are discouraged. You will say: "If I can\'t pay off the whole $300k, why even get a $30k policy? It won\'t save the house." You need the agent to build value on how $30k buys your wife 2 years of mortgage payments so she isn\'t forced out in 30 days.',
        vocalProfile: 'Tired, heavy breathing, stubborn, discouraged.',
        objective: 'Pivot to Equity Protection and build value on "Breathing Room."',
        keywords: ['Breathing room', 'Breathing space', 'Buy time', 'Equity'],
        goals: [
            { id: 'knockout', text: 'Handle the Health Knockout', keywords: ['health', 'understand', 'option'], completed: false },
            { id: 'time_pivot', text: 'Sell the "Buying Time" Concept', keywords: ['months', 'years', 'payments', 'time'], completed: false },
            { id: 'equity_save', text: 'Explain Equity Preservation', keywords: ['foreclosure', 'sell', 'terms', 'equity'], completed: false }
        ]
    },
    {
        id: 'iul_tax',
        title: 'IUL: The Tax Trap',
        icon: <TrendingUp size={24} className="text-emerald-500" />,
        leadType: 'IUL Lead',
        description: 'Linda, 52. Worried about her 401k and taxes. Pivot her from accumulation to protection/indexing.',
        difficulty: 'Hard',
        aiPersona: 'You are Linda, 52. You are financially literate but worried about the market. You don\'t think you need "life insurance" because your kids are grown.',
        vocalProfile: 'Inquisitive, cautious, educated.',
        objective: 'Educate on Living Benefits and Tax-Free retirement.',
        keywords: ['Taxes', 'Market', 'Risk'],
        goals: [
            { id: 'pivot', text: 'Pivot to Tax-Free', keywords: ['deferring', 'future', 'upside'], completed: false },
            { id: 'living', text: 'Explain Living Benefits', keywords: ['critical', 'chronic', 'access'], completed: false }
        ]
    },
    {
        id: 'iul_baby_bank',
        title: 'IUL: The Baby Bank',
        icon: <TrendingUp size={24} className="text-emerald-400" />,
        leadType: 'IUL Lead',
        description: 'Marcus, 32. He wants to save for his child\'s college. Pivot him from a 529 to a flexible "Head-Start" IUL.',
        difficulty: 'Medium',
        aiPersona: 'You are Marcus, 32. You have a 1-year-old daughter. You want to save $200/mo for her future. You think a 529 is the only way. You are worried about her NOT going to college and losing the money or the penalties.',
        vocalProfile: 'Earnest, concerned, young parent.',
        objective: 'Explain the flexibility of IUL cash value versus the restrictiveness of a 529.',
        keywords: ['College', '529', 'Flexible'],
        goals: [
            { id: 'i1', text: 'Highlight 529 penalties', keywords: ['penalty', 'restrictive', 'taxes'], completed: false },
            { id: 'i2', text: 'Show IUL flexibility', keywords: ['wedding', 'house', 'any purpose'], completed: false }
        ]
    },
    {
        id: 'vet_joe',
        title: 'Veteran: Helping Sgt. Joe',
        icon: <UserCheck size={24} className="text-blue-500" />,
        leadType: 'Veteran Lead',
        description: 'Sgt. Joe, 68. Direct and disciplined. Thinks the VA is "good enough." Explain the VA payout delay and gap.',
        difficulty: 'Medium',
        aiPersona: 'You are Sgt. Joe, 68. You served with honor and you trust the VA. You are very direct and don\'t like "salesy" talk. You respond well to respect and logic.',
        vocalProfile: 'Gruff, firm, disciplined, direct.',
        objective: 'Correct the VA $255 misconception and identify the payout timing issue.',
        keywords: ['VA', 'Burial', 'Honor'],
        goals: [
            { id: 'payout_gap', text: 'Explain the 6-month VA delay', keywords: ['waiting', 'months', 'immediate'], completed: false },
            { id: 'va_math', text: 'Contrast $255 vs Funeral Cost', keywords: ['10000', 'math', '255'], completed: false }
        ]
    },
    {
        id: 'annuity_fear',
        title: 'Annuity: Market Panic',
        icon: <Activity size={24} className="text-amber-500" />,
        leadType: 'ANNUITY Lead',
        description: 'Robert, 70. Just watched the news and is panicking about his 401k. Move him into a Fixed Indexed Annuity.',
        difficulty: 'Hard',
        aiPersona: 'You are Robert, 70. You are terrified that a market crash will wipe out your retirement. You are emotional and reactive.',
        vocalProfile: 'Anxious, trembling, high-energy.',
        objective: 'Transition fear into a safe-money solution with an FIA.',
        keywords: ['Safe', 'Guaranteed', 'Floor'],
        goals: [
            { id: 'safety', text: 'Explain the "Zero is Hero" Floor', keywords: ['zero', 'hero', 'lose nothing'], completed: false },
            { id: 'income', text: 'Solve for Lifetime Income', keywords: ['mailbox', 'money', 'lifetime'], completed: false }
        ]
    },
    {
        id: 'cold_referral',
        title: 'Cold Call: Referral Loop',
        icon: <Users size={24} className="text-indigo-400" />,
        leadType: 'REFERRAL',
        description: 'You are calling a "friend of a client". They didn\'t ask for a call. You have 15 seconds to hook them.',
        difficulty: 'Hard',
        aiPersona: 'You are Bill. You just sat down for dinner. You don\'t know who the agent is and you hate cold calls.',
        vocalProfile: 'Rushed, dismissive, "Get to the point".',
        objective: 'Get permission to send a video and follow up.',
        keywords: ['Friend', 'Gift', 'Review'],
        goals: [
            { id: 'hook', text: 'Use the "Gift" opener', keywords: ['gift', 'free', 'complimentary'], completed: false },
            { id: 'bridge', text: 'Drop the mutual friend name', keywords: ['john', 'referred', 'asked'], completed: false }
        ]
    }
];

const OBJECTION_MAP: Record<string, Battlecard> = {
    "price": { bridge: "PRICE BRIDGE", prompt: "Glad to hear... budget... pennies... everyday items", objectionText: "The price is just too high." },
    "busy": { bridge: "TIME BRIDGE", prompt: "I understand... 2 minutes... quick verification... eligibility", objectionText: "I'm right in the middle of something." },
    "driving": { bridge: "PERMISSION BRIDGE", prompt: "Eyes on road... quick questions... qualify... non-medical", objectionText: "I'm driving right now, call me back." },
    "already": { bridge: "LEGACY BRIDGE", prompt: "Review for price... state regulated... confirm amount... verify", objectionText: "I already have this taken care of." },
    "email": { bridge: "VALUE BRIDGE", prompt: "Verify first... generic brochure... non-medical... look for it", objectionText: "Just send me an email and I will look." },
    "trust": { bridge: "LICENSE BRIDGE", prompt: "State regulated... license number... official... confirm identity", objectionText: "I don't know who you are, this is a scam." },
    "not_interested": { bridge: "RELEVANCE BRIDGE", prompt: "That's fine... most people say that... just verifying... request made", objectionText: "I am no longer interested." }
};

const RankLegend: React.FC = () => (
    <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/10 space-y-4">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-400" /> Sales Proficiency Legend
        </h4>
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                    <Medal className="text-white" size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">SCORE 10: ELITE</p>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">(Zen Master)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Flawless execution. "Low & Slow" Alpha tonality, 100% Bridge use, and zero strikes.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Trophy className="text-white" size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">SCORE 8-9: HIGH PERFORMANCE</p>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">(Advanced)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Very good at handling objections. Stayed on script with minor tonality spikes.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Award className="text-white" size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">SCORE 5-7: DEVELOPING</p>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tighter">(Professional)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">Handled basics but struggled under high pressure. Cadence too fast.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    <AlertCircle className="text-white" size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">SCORE 1-4: REMEDIATION</p>
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">(Recruit)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">High hang-up risk. Silence or rambling triggered fatal objections.</p>
                </div>
            </div>
        </div>
    </div>
);

const PerformanceMeter: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const percentage = score * 10;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>{label}</span>
                <span className={score >= 8 ? 'text-green-500' : score >= 5 ? 'text-yellow-500' : 'text-red-500'}>{score}/10</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ease-out ${score >= 8 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const TheDojo: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'SCRIPTS'>('SIMULATOR');
    const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [strikes, setStrikes] = useState(0);
    const [activeBattlecard, setActiveBattlecard] = useState<Battlecard | null>(null);
    const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
    const transcriptRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    const [pitchValue, setPitchValue] = useState(0);
    const [pacingValue, setPacingValue] = useState(0);
    const [tonalityAlert, setTonalityAlert] = useState<string | null>(null);
    const [activeGoals, setActiveGoals] = useState<MissionGoal[]>([]);
    
    const [timeLeft, setTimeLeft] = useState(120);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [preStartCount, setPreStartCount] = useState(3);
    
    const isGauntlet = selectedScenario?.id === 'gauntlet_mode';
    const isMutedRef = useRef(false);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [scorecard, setScorecard] = useState<DojoScorecard | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const micStreamRef = useRef<MediaStream | null>(null);
    const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        let interval: any;
        if (isSessionActive && analyserRef.current) {
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            interval = setInterval(() => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let maxVal = 0;
                let maxIndex = 0;
                for(let i=1; i<bufferLength/4; i++) {
                    if(dataArray[i] > maxVal) {
                        maxVal = dataArray[i];
                        maxIndex = i;
                    }
                }
                
                if (maxVal > 30) {
                    const normalizedPitch = Math.min(100, (maxIndex / (bufferLength/8)) * 100);
                    setPitchValue(normalizedPitch);
                    if (normalizedPitch > 75) {
                        setTonalityAlert("ALPHA RISK: Tone too high (Mousey)");
                    } else if (normalizedPitch < 25) {
                        setTonalityAlert("EXCELLENT: Alpha Depth detected");
                        setTimeout(() => setTonalityAlert(null), 1500);
                    } else {
                        setTonalityAlert(null);
                    }
                }
            }, 400);
        }
        return () => {
            clearInterval(interval);
            setTonalityAlert(null);
        };
    }, [isSessionActive]);

    useEffect(() => {
        let interval: any;
        if (isSessionActive && timeLeft > 0) {
            interval = setInterval(() => { setTimeLeft(prev => prev - 1); }, 1000);
        } else if (timeLeft === 0 && isSessionActive) {
            finishSession();
        }
        return () => clearInterval(interval);
    }, [isSessionActive, timeLeft]);

    const stopAudio = useCallback(() => {
        sourcesRef.current.forEach(source => {
            try { source.stop(); } catch(e) {}
            sourcesRef.current.delete(source);
        });
        nextStartTimeRef.current = 0;
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop());
            micStreamRef.current = null;
        }
    }, []);

    const startBriefing = (scenario: RoleplayScenario) => {
        setSelectedScenario(scenario);
        setIsBriefingOpen(true);
        setTimeLeft(scenario.isGauntlet ? 120 : 600);
        setStrikes(0);
        setActiveBattlecard(null);
    };

    const startSession = async () => {
        if (!selectedScenario) return;
        if (isGauntlet) {
            setIsBriefingOpen(false);
            setIsCountingDown(true);
            setPreStartCount(3);
            const cd = setInterval(() => {
                setPreStartCount(prev => {
                    if (prev <= 1) {
                        clearInterval(cd);
                        setIsCountingDown(false);
                        initializeCall();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return;
        }
        initializeCall();
    };

    const initializeCall = async () => {
        if (!selectedScenario) return;
        setIsBriefingOpen(false);
        setActiveGoals(selectedScenario.goals.map(g => ({ ...g, completed: false })));
        setIsSessionActive(true);
        setScorecard(null);
        setUserTranscript('');
        setModelTranscript('');
        setStrikes(0);
        setActiveBattlecard(null);
        setSelectedSegment(null);
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputNodeRef.current = audioContextRef.current.createGain();
            outputNodeRef.current.connect(audioContextRef.current.destination);
        }
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const analyser = inputCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyserRef.current = analyser;

        const voiceSystemInstruction = `
            # MISSION PROTOCOL: ${isGauntlet ? 'ADAPTIVE OBJECTION GAUNTLET' : 'ROLEPLAY'}
            YOU ARE: ${selectedScenario.aiPersona}
            VOCAL STYLE: ${selectedScenario.vocalProfile}
            
            # ALLOWED OBJECTIONS (ONLY USE THESE 7):
            1. Price: "The price is just too high." [OBJ: price]
            2. Busy: "I'm right in the middle of something." [OBJ: busy]
            3. Driving: "I'm driving right now, call me back." [OBJ: driving]
            4. Already Covered: "I already have this taken care of." [OBJ: already]
            5. Send Email: "Just send me an email and I will look." [OBJ: email]
            6. Trust/Scam: "I don't know who you are, this is a scam." [OBJ: trust]
            7. Not Interested: "I am no longer interested." [OBJ: not_interested]

            # STRICT CONSTRAINTS:
            - NEVER talk about smart home technology, electronics, or unrelated topics.
            - YOU ARE A PROSPECT ON A LIFE INSURANCE CALL.
            
            # TRIGGER LOGIC (CRITICAL):
            Monitor the agent for these vulnerabilities:
            1. SILENCE: If the agent stops talking for > 1.5s, FIRE an objection immediately.
            2. RAMBLING: If the agent speaks > 15 words without asking a question, INTERRUPT with an objection.
            3. WEAKNESS: If the agent sounds nervous or uncertain, pounce with an objection.
            
            # HUD COMMS (STRICT FORMATTING):
            - When firing an objection, you MUST prefix your response with [OBJ: type] where type is strictly one of: price, busy, driving, already, email, trust, or not_interested.
            - If the agent fails a rebuttal (e.g. sounding weak, arguing), prefix with [STRIKE].
            
            # STRIKE SYSTEM:
            3 strikes and you say "You know what, I'm not doing this, don't call me again" and hang up.
        `;

        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = micStream;

            const sessionPromise = connectToLiveDojo({
                onopen: () => {
                    const source = inputCtx.createMediaStreamSource(micStream);
                    source.connect(analyser);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromise.then(session => {
                            if (!isMutedRef.current) {
                                session.sendRealtimeInput({ media: pcmBlob });
                            }
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && audioContextRef.current) {
                        const ctx = audioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBytes = decodeBase64Audio(base64Audio);
                        const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNodeRef.current!);
                        source.onended = () => sourcesRef.current.delete(source);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }

                    if (msg.serverContent?.inputTranscription) {
                        const text = msg.serverContent.inputTranscription.text.toLowerCase();
                        setUserTranscript(prev => (prev + " " + text).trim());
                        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
                        setPacingValue(prev => Math.min(200, (prev + wordCount * 12) / 2));
                        setActiveGoals(prev => prev.map(goal => {
                            if (goal.completed) return goal;
                            const hit = goal.keywords.some(k => text.includes(k.toLowerCase()));
                            return hit ? { ...goal, completed: true } : goal;
                        }));
                    }

                    if (msg.serverContent?.outputTranscription) {
                        const text = msg.serverContent.outputTranscription.text;
                        setModelTranscript(prev => (prev + " " + text).trim());
                        
                        // Robust regex to capture Battlecard triggers
                        const objMatch = text.match(/\[OBJ:\s*(price|busy|driving|already|email|trust|not_interested)\]/i);
                        if (objMatch) {
                            const type = objMatch[1].toLowerCase();
                            if (OBJECTION_MAP[type]) {
                                setActiveBattlecard(OBJECTION_MAP[type]);
                                setTonalityAlert(`OBJECTION: ${type.toUpperCase()}`);
                                setTimeout(() => setTonalityAlert(null), 3000);
                            }
                        }
                        
                        if (text.includes('[STRIKE]')) {
                            setStrikes(prev => {
                                const next = prev + 1;
                                if (next >= 3) finishSession();
                                return next;
                            });
                        }
                    }

                    if (msg.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e) => {
                    console.error("Live Error", e);
                    if (e.message?.includes('inference') || e.message?.includes('tokenizer')) {
                        setTonalityAlert("RECOVERING AUDIO CHANNEL...");
                        setTimeout(() => setTonalityAlert(null), 3000);
                    }
                },
                onclose: () => setIsSessionActive(false)
            }, voiceSystemInstruction);

            sessionPromiseRef.current = sessionPromise;
            drawVisualizer();

        } catch (err) {
            console.error("Failed to start voice session", err);
            alert("Microphone access is required.");
            setIsSessionActive(false);
        }
    };

    const drawVisualizer = () => {
        if (!visualizerCanvasRef.current || !analyserRef.current) return;
        const canvas = visualizerCanvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            if (!isSessionActive) return;
            requestAnimationFrame(render);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const alphaHue = pitchValue > 70 ? 0 : 230; 
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                ctx.fillStyle = `hsla(${alphaHue}, 70%, 50%, 0.8)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        render();
    };

    const finishSession = async () => {
        setIsSessionActive(false);
        stopAudio();
        setIsEvaluating(true);

        const chat = await createChatSession();
        const evaluationPrompt = `
            # [TACTICAL ROLEPLAY EVALUATION]
            Scenario: ${selectedScenario?.title}
            Agent Transcript: "${userTranscript}"
            Prospect Transcript: "${modelTranscript}"
            
            TASKS:
            1. COMMAND MAP: Split the Agent Transcript into 7 equal chronological segments. For each, assign a control score (1-10) based on leadership, bridges used, and alpha tonality.
            2. GOLDEN REBUTTALS: Identify every major objection the prospect fired. Provide a side-by-side comparison of the Agent's actual response versus the "Golden Rebuttal" (Elite Standard).
            3. CRITICAL MOMENTS: Highlight specific quotes from the transcript where the agent won or lost the frame. Map these to segment indices (0-6).
            4. ALPHA METRICS: Provide an overall 'tonalityScore' (pitch control) and 'pacingScore' (cadence) from 1-10.
            5. FINAL SCORE: Provide an 'overall' score from 1-10, where 10 is the best (Elite) and 1 is the lowest (Remediation).
            
            Return STRICTLY JSON:
            {
                "overall": number, "rapport": number, "qualifying": number, "objectionHandling": number, "closing": number,
                "tonalityScore": number, "pacingScore": number,
                "feedback": string, "strengths": string[], "improvements": string[],
                "moments": [{ "text": string, "suggestion": string, "type": "CRITIQUE" | "WIN", "timestamp": string, "segmentIndex": number }],
                "goldenRebuttals": [{ "objection": string, "userResponse": string, "eliteResponse": string, "bridgeName": string }],
                "controlTimeline": number[],
                "transcriptSegments": string[]
            }
        `;

        try {
            const stream = await sendMessageToGemini(chat, evaluationPrompt);
            let resultText = '';
            for await (const chunk of stream) { if (chunk.text) resultText += chunk.text; }
            const cleanJson = resultText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            setScorecard(parsed);
        } catch (e) {
            console.error("Evaluation Failed", e);
        } finally {
            setIsEvaluating(false);
        }
    };

    const scrollToSegment = (index: number) => {
        setSelectedSegment(index);
        const element = transcriptRefs.current[index];
        if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    };

    const getGradeDisplayData = (score: number) => {
        if (score >= 10) return { label: 'ELITE', sub: 'Zen Master / Alpha Closer', color: 'bg-indigo-600', glow: 'shadow-[0_0_50px_rgba(99,102,241,0.6)] border-indigo-400', icon: <Medal /> };
        if (score >= 8) return { label: 'HIGH PERFORMANCE', sub: 'Advanced Closer', color: 'bg-emerald-600', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.4)] border-emerald-400', icon: <Trophy /> };
        if (score >= 5) return { label: 'DEVELOPING', sub: 'Professional', color: 'bg-amber-600', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)] border-amber-400', icon: <Award /> };
        return { label: 'REMEDIATION', sub: 'Recruit (Needs Practice)', color: 'bg-rose-600', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)] border-rose-400', icon: <AlertCircle /> };
    };

    return (
        <div className="animate-fade-in flex flex-col bg-slate-950 min-h-[calc(100vh-4rem)] pb-40">
            <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between shrink-0 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg shadow-lg ${isGauntlet ? 'bg-orange-600' : 'bg-indigo-600'}`}>
                        {isGauntlet ? <Swords className="text-white" size={20} /> : <Joystick className="text-white" size={20} />}
                    </div>
                    <div><h2 className="text-lg font-bold text-white leading-none">ARISE Sales Crucible</h2></div>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('SIMULATOR')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${activeTab === 'SIMULATOR' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>Simulator</button>
                    <button onClick={() => setActiveTab('SCRIPTS')} className={`px-4 py-1.5 text-xs font-bold rounded-md ${activeTab === 'SCRIPTS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>Scripts</button>
                </div>
            </div>

            {activeTab === 'SCRIPTS' ? (
                <div className="p-4 lg:p-8 h-full"><ScriptLibrary /></div>
            ) : (
                <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                    {!selectedScenario ? (
                        <div className="space-y-10">
                            <div className="text-center">
                                <h3 className="text-3xl font-bold text-white mb-2">ARISE Sales Crucible</h3>
                                <p className="text-slate-400 text-lg">Where high-performance agents turn verbal pressure into systematic profit.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {SCENARIOS.map(s => (
                                    <div key={s.id} onClick={() => startBriefing(s)} className={`p-6 rounded-xl border border-white/5 cursor-pointer transition-all hover:scale-[1.02] flex flex-col h-full ${s.isGauntlet ? 'bg-orange-950/20 border-orange-500/50 shadow-lg' : 'bg-slate-900 hover:border-indigo-500/50'}`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-slate-800 rounded-lg">{s.icon}</div>
                                            <div>
                                                <h4 className="font-bold text-white uppercase text-sm tracking-widest">{s.title}</h4>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase">{s.difficulty}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-6 italic line-clamp-3">"{s.description}"</p>
                                        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{s.isGauntlet ? 'Trigger-Based' : 'Dynamic'}</span>
                                            <ChevronRight className="text-indigo-500" size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isBriefingOpen ? (
                        <div className="max-w-3xl mx-auto bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in flex flex-col h-auto">
                            <div className={`p-6 border-b border-white/5 flex justify-between items-center ${isGauntlet ? 'bg-orange-900/20' : 'bg-slate-950'}`}>
                                <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest">Mission Briefing: {selectedScenario.title}</h3>
                                <button onClick={() => setSelectedScenario(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                            </div>
                            <div className="p-8 space-y-8 flex flex-col h-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Objective</label>
                                    <p className="text-white text-lg font-bold leading-tight">{selectedScenario.objective}</p>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adaptive Logic Parameters</label>
                                    <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5"><p className="text-sm text-slate-300 italic leading-relaxed">"{selectedScenario.aiPersona}"</p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedScenario.goals.map(g => (
                                        <div key={g.id} className="p-3 bg-slate-950/30 rounded-lg border border-white/5 flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <span className="text-xs text-slate-300">{g.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setSelectedScenario(null)} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all">Abort</button>
                                    <button onClick={startSession} className="flex-2 px-12 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-xl transition-all active:scale-95">Enter Simulator</button>
                                </div>
                            </div>
                        </div>
                    ) : isSessionActive ? (
                        <div className="flex flex-col items-center gap-12 w-full max-w-5xl mx-auto">
                            {tonalityAlert && (
                                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                                    <div className={`px-6 py-3 rounded-full border-2 shadow-2xl flex items-center gap-3 backdrop-blur-xl ${tonalityAlert.includes('EXCELLENT') ? 'bg-green-950/40 border-green-500 text-green-400' : 'bg-red-950/40 border-red-500 text-red-500'}`}>
                                        {tonalityAlert.includes('EXCELLENT') ? <ZapIcon size={20} fill="currentColor" /> : <ShieldAlert size={20} />}
                                        <span className="font-black uppercase tracking-widest text-sm">{tonalityAlert}</span>
                                    </div>
                                </div>
                            )}

                            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col relative overflow-hidden group">
                                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-500 ${pitchValue > 70 ? 'bg-red-500' : 'bg-indigo-500'}`} />
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">Alpha Wave Tracker {pitchValue > 70 && <span className="text-red-500 animate-pulse">UP-TALKING</span>}</h4>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold"><span className="text-indigo-400">PITCH DEPTH</span><span className={pitchValue > 70 ? 'text-red-500' : 'text-slate-300'}>{Math.round(100 - pitchValue)}% Alpha</span></div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${pitchValue > 70 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${100 - pitchValue}%` }} /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold"><span className="text-emerald-400">SPEECH PACING</span><span className="text-slate-300">{Math.round(pacingValue)} WPM</span></div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${Math.min(100, (pacingValue / 180) * 100)}%` }} /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <div className={`text-6xl font-black ${strikes > 0 ? 'text-red-500' : 'text-white'}`}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2, '0')}</div>
                                    <div className="flex gap-2 mt-4">{[1,2,3].map(i => <div key={i} className={`w-10 h-2 rounded-full transition-all ${i <= strikes ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-800'}`} />)}</div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Prospect Patience (Strikes)</p>
                                </div>
                                <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-xl border border-white/10 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Live Battlecard</h4>
                                    {activeBattlecard ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500">
                                            <div className="flex items-center gap-2"><ZapIcon className="text-orange-500" size={16} fill="currentColor" /><span className="text-sm font-black text-orange-400 uppercase tracking-tighter">{activeBattlecard.bridge}</span></div>
                                            <div className="p-3 bg-slate-950 rounded-lg border border-orange-500/20"><p className="text-xs text-white leading-relaxed font-bold italic">"{activeBattlecard.prompt}"</p></div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase">Target: {activeBattlecard.objectionText}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center flex-1 py-4 opacity-30"><Ghost size={32} className="mb-2" /><p className="text-[10px] uppercase font-bold text-center">Standby for<br/>Resistance</p></div>
                                    )}
                                </div>
                            </div>

                            <div className="relative w-80 h-80 flex items-center justify-center">
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-10 transition-colors duration-500 ${pitchValue > 70 ? 'bg-red-500' : 'bg-indigo-500'}`} />
                                <div className="relative z-10 w-64 h-64 rounded-full bg-slate-900 border-4 border-white/5 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                                    <canvas ref={visualizerCanvasRef} width={256} height={100} className="w-full absolute bottom-0 opacity-60" />
                                    <div className={`p-4 rounded-full bg-white/5 mb-4 transition-colors ${pitchValue > 70 ? 'text-red-500' : 'text-indigo-400'}`}>
                                        <AudioLines size={48} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Connected</span>
                                </div>
                            </div>

                            <div className="flex gap-8">
                                <button onClick={() => setIsMuted(!isMuted)} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{isMuted ? <MicOff size={28}/> : <Mic size={28}/>}</button>
                                <button onClick={finishSession} className="px-12 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold flex items-center gap-3 shadow-2xl active:scale-95 transition-all text-lg"><Square size={20} fill="white" /> End & Evaluate</button>
                            </div>
                        </div>
                    ) : scorecard ? (
                        <div className="space-y-10 animate-fade-in w-full max-w-6xl mx-auto flex flex-col h-auto">
                            <div className="flex justify-between items-center pb-8 border-b border-white/5 shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-lg"><Trophy className="text-green-500" size={40}/></div>
                                    <div><h3 className="text-3xl font-bold text-white">Analysis Log</h3><p className="text-slate-400 text-lg">Tactical debrief of simulation artifacts.</p></div>
                                </div>
                                <button onClick={() => setSelectedScenario(null)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-xl transition-all">New Mission</button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-auto">
                                <div className="lg:col-span-8 space-y-8 h-auto">
                                    <div className="bg-slate-900 p-8 rounded-2xl border border-white/5 shadow-sm h-auto relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" /><h4 className="text-sm font-bold text-white uppercase tracking-widest mb-10 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-400"/> Command Map <span className="text-[10px] text-slate-500 normal-case ml-2">(Click a segment to sync transcript)</span></h4>
                                        <div className="relative h-64 flex items-end justify-between px-8">{scorecard.controlTimeline.map((val, i) => (<div key={i} onClick={() => scrollToSegment(i)} className={`flex flex-col items-center gap-3 w-full group relative cursor-pointer transition-all ${selectedSegment === i ? 'scale-105 opacity-100' : 'opacity-70 hover:opacity-100'}`}><div className={`w-full max-w-[48px] rounded-t-lg transition-all duration-1000 ${val >= 8 ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : val >= 5 ? 'bg-slate-600' : 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]'} ${selectedSegment === i ? 'ring-2 ring-white ring-offset-4 ring-offset-slate-900' : ''}`} style={{ height: `${val * 10}%` }} /><span className={`text-[10px] font-bold uppercase ${selectedSegment === i ? 'text-indigo-400' : 'text-slate-600'}`}>Part {i+1}</span></div>))}</div>
                                    </div>
                                    <div className="bg-slate-900 rounded-2xl border border-white/5 shadow-sm overflow-hidden flex flex-col h-[500px]">
                                        <div className="p-4 bg-slate-950/50 border-b border-white/5 flex justify-between items-center"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interactive Transcript</h4></div>
                                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">{scorecard.transcriptSegments.map((segment, i) => (<div key={i} ref={el => transcriptRefs.current[i] = el} className={`p-4 rounded-xl transition-all border ${selectedSegment === i ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-800/30 border-white/5'}`}><div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Part {i+1}</span><span className="text-[10px] font-bold text-slate-600">{scorecard.controlTimeline[i]}/10 Control</span></div><p className="text-sm text-slate-300 leading-relaxed italic">"{segment}"</p></div>))}</div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">The Golden Rebuttals</h4>
                                        {scorecard.goldenRebuttals.map((r, i) => (
                                            <div key={i} className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden"><div className="p-4 bg-slate-950 border-b border-white/5 flex justify-between items-center"><div className="flex items-center gap-2"><ShieldAlert className="text-orange-500" size={16} /><span className="text-xs font-black text-white uppercase tracking-wider">{r.objection}</span></div><span className="px-2 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded uppercase">{r.bridgeName}</span></div><div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5"><div className="p-6 space-y-3"><p className="text-[10px] font-bold text-slate-500 uppercase">Your Actual Response</p><p className="text-sm text-slate-400 italic">"{r.userResponse}"</p></div><div className="p-6 space-y-3 bg-indigo-950/20"><p className="text-[10px] font-bold text-indigo-400 uppercase">Elite Standard Rebuttal</p><p className="text-sm text-white font-bold italic leading-relaxed">"{r.eliteResponse}"</p></div></div></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:col-span-4 space-y-8 h-auto sticky top-24">
                                    <div className={`p-10 rounded-2xl text-white shadow-2xl relative overflow-hidden ring-4 ring-white/10 shrink-0 transition-all duration-1000 ${getGradeDisplayData(scorecard.overall).color} ${getGradeDisplayData(scorecard.overall).glow}`}>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Mission Grade</p>
                                                <span className="animate-pulse">{getGradeDisplayData(scorecard.overall).icon}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <h4 className="text-8xl font-black">{scorecard.overall}</h4>
                                                <span className="text-2xl font-bold opacity-60">/ 10</span>
                                            </div>
                                            <p className="mt-4 text-sm font-black uppercase tracking-widest">{getGradeDisplayData(scorecard.overall).label}</p>
                                            <p className="text-xs font-medium opacity-80 mt-1">{getGradeDisplayData(scorecard.overall).sub}</p>
                                        </div>
                                        <History className="absolute -right-12 -bottom-12 w-56 h-56 opacity-10 rotate-12" />
                                        {scorecard.overall >= 10 && <Sparkles className="absolute top-4 right-4 text-white animate-pulse" size={40} />}
                                    </div>
                                    <RankLegend />
                                    <div className="p-8 bg-slate-900 rounded-2xl border border-white/5 space-y-8 shadow-sm h-auto"><h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skill Matrix</h4><PerformanceMeter label="Tonality & Alpha" score={scorecard.tonalityScore || 8} /><PerformanceMeter label="Pacing & Cadence" score={scorecard.pacingScore || 7} /><PerformanceMeter label="Objection Handling" score={scorecard.objectionHandling} /><PerformanceMeter label="Call Authority" score={scorecard.qualifying} /><PerformanceMeter label="Script Alignment" score={scorecard.closing} /></div>
                                    <div className="p-8 bg-slate-900 rounded-2xl border border-white/5 shadow-sm h-auto"><h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Executive Summary</h4><p className="text-sm text-slate-300 italic leading-relaxed">"{scorecard.feedback}"</p></div>
                                </div>
                            </div>
                        </div>
                    ) : isEvaluating ? (
                        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center p-20 text-center animate-pulse"><div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8" /><h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Debriefing Simulation...</h3><p className="text-slate-400 text-lg">AI Coach is reviewing your audio for tone, bridges, and command segments.</p></div>
                    ) : null}
                </div>
            )}

            {isCountingDown && (
                <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center text-white backdrop-blur-3xl bg-opacity-95"><p className="text-xs font-bold text-orange-500 uppercase tracking-[0.4em] mb-6">Gauntlet Initialization</p><h3 className="text-[12rem] font-black scale-up">{preStartCount}</h3><p className="mt-16 text-slate-500 italic max-w-md text-center text-lg">"120 seconds. Adapt to the pressure. 3 strikes and the client hangs up."</p></div>
            )}
        </div>
    );
};

export default TheDojo;
