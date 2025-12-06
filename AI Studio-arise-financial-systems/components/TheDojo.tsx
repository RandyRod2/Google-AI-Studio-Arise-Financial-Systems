
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Play, Square, Trophy, MessageSquare, RefreshCw, User, Bot, AlertCircle, CheckCircle2, Phone, TrendingUp, Heart, Home, Flag } from 'lucide-react';
import { createChatSession, sendMessageToGemini } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

interface RoleplayScenario {
    id: string;
    title: string;
    icon: React.ReactNode;
    leadType: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    aiPersona: string;
    objective: string;
}

const SCENARIOS: RoleplayScenario[] = [
    {
        id: 'telesales_fex',
        title: 'Final Expense Telesales',
        icon: <Heart size={24} className="text-rose-500" />,
        leadType: 'FEX Lead',
        description: 'Calling a 72-year-old regarding a "State Regulated Life Insurance" request form on Facebook.',
        difficulty: 'Medium',
        aiPersona: 'You are "Betty", a 72-year-old widow living in Ohio on a fixed income. You are skeptical of telemarketers. You remember clicking something on Facebook about burial insurance but you think you might already have coverage through your bank or Colonial Penn. You are polite but dismissive and try to get off the phone quickly. You need to be convinced that this specific program is different.',
        objective: 'Overcome the "I already have insurance" objection and build enough value to start the application process.'
    },
    {
        id: 'telesales_mp',
        title: 'Mortgage Protection',
        icon: <Home size={24} className="text-blue-500" />,
        leadType: 'Mortgage Lead',
        description: 'Calling a new homeowner (age 45) who just closed on a $350k home. The lead is 2 weeks old.',
        difficulty: 'Hard',
        aiPersona: 'You are "Mike", a 45-year-old busy father and professional. You receive 10 spam calls a day. You are answering the phone while working from home. You are annoyed by the interruption. You think this is just another bill collector or scam. You are very protective of your time and your main objection is "I am too busy" or "Just email me the info".',
        objective: 'Disarm the "Salesman Alarm", verify the loan amount, and book a firm 15-minute appointment for later today.'
    },
    {
        id: 'telesales_iul',
        title: 'IUL / Wealth Building',
        icon: <TrendingUp size={24} className="text-emerald-500" />,
        leadType: 'General Life Lead',
        description: 'Calling a 35-year-old who requested info on "Tax-Free Retirement".',
        difficulty: 'Hard',
        aiPersona: 'You are "Sarah", a 35-year-old marketing manager in California. You make good money but have no savings outside of a small 401k. You clicked the ad because you are worried about taxes, but you think Life Insurance is only for when you die. You are analytical and skeptical that insurance can be an investment. You ask tough questions about fees and returns.',
        objective: 'Pivot the conversation from "Death Insurance" to "Living Benefits" and get agreement to run a customized illustration.'
    },
    {
        id: 'telesales_vet',
        title: 'Veteran Benefits Review',
        icon: <Flag size={24} className="text-indigo-500" />,
        leadType: 'Veteran Lead',
        description: 'Calling a 60-year-old retired veteran to review their government benefits gaps.',
        difficulty: 'Medium',
        aiPersona: 'You are "John", a 60-year-old retired Army veteran. You are proud and loyal. You believe the VA takes care of everything and you have SGLI/VGLI history. You are resistant to "civilian" insurance. You speak directly and respect authority. You will hang up if the agent sounds weak or unknowledgeable about military benefits.',
        objective: 'Expose the gaps in VA burial benefits (which only cover a fraction of costs) and transition to a private supplement quote.'
    }
];

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

const TheDojo: React.FC = () => {
    const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startSession = (scenario: RoleplayScenario) => {
        setSelectedScenario(scenario);
        setMessages([]);
        setFeedback(null);
        setIsSessionActive(true);
        
        // Initialize Gemini with specific Persona Instructions
        const chat = createChatSession();
        chatSessionRef.current = chat;

        // Seed the AI with the persona
        const systemPrompt = `ACTIVATE ROLEPLAY MODE. 
        CONTEXT: Telesales Call (Phone Only).
        ${scenario.aiPersona}
        
        RULES:
        1. Keep responses short (1-3 sentences) like a real phone conversation.
        2. Do not break character.
        3. React realistically to the user's tone and script. If they sound robotic, be dismissive. If they build rapport, open up.
        4. If the user successfully meets the objective: "${scenario.objective}", then say "[BREAK CHARACTER] Good job, you win!" and end the roleplay.
        
        Start the conversation now by answering the phone (e.g., "Hello?" or "Who is this?").`;

        // Send hidden system prompt to start
        setIsThinking(true);
        sendMessageToGemini(chat, systemPrompt).then(async (stream) => {
            let text = '';
            for await (const chunk of stream) {
                if (chunk.text) text += chunk.text;
            }
            setMessages([{ id: 'init', role: 'ai', text }]);
            setIsThinking(false);
        });
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !chatSessionRef.current) return;

        const userText = inputText;
        setInputText('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
        setIsThinking(true);

        try {
            const stream = await sendMessageToGemini(chatSessionRef.current, userText);
            let aiResponse = '';
            
            for await (const chunk of stream) {
                if (chunk.text) aiResponse += chunk.text;
            }

            setMessages(prev => [...prev, { id: Date.now().toString() + '_ai', role: 'ai', text: aiResponse }]);

            if (aiResponse.includes("[BREAK CHARACTER]")) {
                finishSession();
            }

        } catch (error) {
            console.error("Dojo Error:", error);
        } finally {
            setIsThinking(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const finishSession = async () => {
        if (!chatSessionRef.current) return;
        setIsSessionActive(false);
        setIsThinking(true);

        // Ask for feedback
        const feedbackPrompt = `[SYSTEM INSTRUCTION]: The roleplay is over. 
        Please provide a report card on the agent's performance.
        1. Did they meet the objective?
        2. Tone and Empathy check.
        3. One specific thing they did well.
        4. One specific thing to improve (Scripting or Tonality).
        Format this as a concise markdown summary.`;

        try {
            const stream = await sendMessageToGemini(chatSessionRef.current, feedbackPrompt);
            let feedbackText = '';
            for await (const chunk of stream) {
                if (chunk.text) feedbackText += chunk.text;
            }
            setFeedback(feedbackText);
        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="animate-fade-in h-full flex flex-col">
            {!selectedScenario ? (
                // Scenario Selection Screen
                <div className="max-w-6xl mx-auto w-full">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
                            <Bot className="text-indigo-600" size={32} /> The Dojo
                        </h2>
                        <p className="text-slate-500 mt-2">AI Telesales Simulator. Practice your script before dialing real leads.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SCENARIOS.map((scenario) => (
                            <div 
                                key={scenario.id} 
                                onClick={() => startSession(scenario)}
                                className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Phone size={64} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                            {scenario.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{scenario.title}</h3>
                                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{scenario.leadType}</span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        scenario.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                        scenario.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {scenario.difficulty}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm mb-4 min-h-[40px] leading-relaxed">{scenario.description}</p>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-500">
                                    <span className="font-bold text-indigo-600">Objective:</span> {scenario.objective}
                                </div>
                                <div className="mt-4 flex items-center text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                    Start Call <Play size={14} className="ml-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Active Roleplay Screen
                <div className="flex flex-col h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-xl relative max-w-5xl mx-auto w-full">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                {selectedScenario.icon}
                            </div>
                            <div>
                                <h3 className="font-bold flex items-center gap-2">
                                    {selectedScenario.title}
                                </h3>
                                <p className="text-xs text-slate-400 max-w-xl truncate">Obj: {selectedScenario.objective}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isSessionActive && (
                                <button 
                                    onClick={finishSession}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Square size={12} fill="currentColor" /> End Call
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedScenario(null)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                                Exit
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-gray-200'}`}>
                                        {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-slate-600" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-br-none' 
                                            : 'bg-white text-slate-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isThinking && (
                            <div className="flex justify-start animate-pulse">
                                <div className="flex flex-row items-center gap-2 bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">AI is replying...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 transition-all"
                                placeholder="Type your response..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isThinking}
                                autoFocus
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isThinking}
                                className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Feedback Overlay */}
                    {feedback && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
                                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Trophy className="text-yellow-400" /> Session Feedback
                                    </h3>
                                    <button onClick={() => setFeedback(null)} className="hover:text-gray-300">
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                                <div className="p-8 overflow-y-auto max-h-[60vh] prose prose-sm prose-indigo">
                                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base">
                                        {feedback}
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                    <button 
                                        onClick={() => setSelectedScenario(null)}
                                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        Back to Menu
                                    </button>
                                    <button 
                                        onClick={() => { setFeedback(null); startSession(selectedScenario!); }}
                                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TheDojo;
