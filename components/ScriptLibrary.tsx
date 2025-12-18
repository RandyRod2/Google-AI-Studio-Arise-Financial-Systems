
import React, { useState } from 'react';
import { Heart, Home, TrendingUp, Flag, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

type ScriptType = 'FEX' | 'MP' | 'IUL' | 'VET';

interface ScriptSection {
    title: string;
    content: string;
}

interface ScriptDef {
    id: ScriptType;
    label: string;
    icon: React.ReactNode;
    color: string;
    sections: ScriptSection[];
}

const SCRIPTS: ScriptDef[] = [
    {
        id: 'FEX',
        label: 'Final Expense',
        icon: <Heart size={18} />,
        color: 'text-rose-600 bg-rose-50',
        sections: [
            {
                title: 'Opener (The Hook)',
                content: `Hi [Client Name], this is [Agent Name] calling about the request you sent in on Facebook about the state-regulated burial programs for Ohio residents.\n\nI’m just the field underwriter assigned to get that information out to you. Now, I have your age listed here as [Age], is that correct?`
            },
            {
                title: 'Discovery (The "Why")',
                content: `Perfect. Now, [Client Name], most folks I speak with send this in for one of two reasons: either they don't have any coverage and don't want to leave a burden on their kids, OR they have some insurance but want to make sure it’s enough.\n\nWhich bucket do you fall into?`
            },
            {
                title: 'Medical Qualifying',
                content: `Okay, understood. To see which discounts you qualify for, I need to ask a few health questions.\n\n1. Have you been hospitalized in the last 2 years?\n2. Are you currently taking any medications for your heart or lungs?\n3. Have you ever been diagnosed with diabetes?`
            },
            {
                title: 'The Close (Three Options)',
                content: `Based on your health, you qualify for our Preferred Plan. I have three options that fit the budget we discussed:\n\nOption 1: $10,000 coverage for $45/mo\nOption 2: $15,000 coverage for $65/mo\nOption 3: $20,000 coverage for $85/mo\n\nWhich of those three makes the most sense for you to leave to your daughter?`
            }
        ]
    },
    {
        id: 'MP',
        label: 'Mortgage Protection',
        icon: <Home size={18} />,
        color: 'text-blue-600 bg-blue-50',
        sections: [
            {
                title: 'Opener (Verification)',
                content: `Hello, is this [Client Name]? Hi [Client Name], this is [Agent Name] getting back to you about the mortgage protection request for your home at [Address].\n\nIt says here the loan amount is roughly $[Amount], is that right?`
            },
            {
                title: 'Objection Handling (Busy)',
                content: `(If "I'm busy"): "I completely understand, I'm super busy too. I'm not trying to sell you anything right now. I just need to verify a few things to see if you even qualify for the non-medical program. It takes 2 minutes. Do you have a moment, or should I call back at 5 PM?"`
            },
            {
                title: 'The Setup',
                content: `God forbid something happened to you yesterday, who would be responsible for paying the mortgage tomorrow? \n\nAnd how long could they pay it without your income?`
            },
            {
                title: 'Booking the Appointment',
                content: `Okay, my job is simple. I just shop the top 15 A-rated carriers to find the best rate for you. I'm going to be in your area on [Day].\n\nI have a slot at 2:00 PM or 4:00 PM. Which one works better to drop off this information?`
            }
        ]
    },
    {
        id: 'IUL',
        label: 'IUL / Wealth',
        icon: <TrendingUp size={18} />,
        color: 'text-emerald-600 bg-emerald-50',
        sections: [
            {
                title: 'Opener (Education)',
                content: `Hi [Name], this is [Agent]. You recently requested our guide on "Tax-Free Retirement" and how to protect your savings from market crashes.\n\nDid you get a chance to read the email I sent over?`
            },
            {
                title: 'Disturbing Questions',
                content: `Let me ask you—are you currently contributing to a 401(k) or IRA? \n\nDo you believe taxes are going to go UP or DOWN in the future? \n\n(Wait for "Up"). Exactly. So why are we deferring taxes to pay them later when they are higher?`
            },
            {
                title: 'The Pivot',
                content: `Most people think Life Insurance is just for when you die. But modern policies have "Living Benefits" that you can use while you are alive, tax-free. \n\nIf I could show you a way to grow your money without market risk, would you be open to a 15-minute Zoom call?`
            }
        ]
    },
    {
        id: 'VET',
        label: 'Veteran Benefits',
        icon: <Flag size={18} />,
        color: 'text-indigo-600 bg-indigo-50',
        sections: [
            {
                title: 'Opener (Authority)',
                content: `Hello [Name], this is [Agent] calling for the Veteran Benefits Division. I see here you served in the [Branch]? First off, thank you for your service.\n\nI'm calling to conduct your annual benefit review to see if you have any gaps in your final expense coverage.`
            },
            {
                title: 'Fact Finding',
                content: `Did you know that the standard VA death benefit is often less than $1,000? \n\nMost veterans I speak to are surprised by that. Do you currently have private coverage in place, or are you relying solely on the VA?`
            },
            {
                title: 'The Solution',
                content: `We have special programs specifically for Veterans that fill that gap. They are permanent, the price never goes up, and they pay out within 24 hours so your family isn't waiting on the government.\n\nLet me ask you a few questions to see if you qualify...`
            }
        ]
    }
];

export const ScriptLibrary: React.FC = () => {
    const [activeScript, setActiveScript] = useState<ScriptType>('FEX');
    const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(id);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const currentScript = SCRIPTS.find(s => s.id === activeScript);

    return (
        <div className="flex h-full flex-col md:flex-row bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-gray-100 flex-shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Script Library</h3>
                </div>
                <div className="p-2 space-y-1">
                    {SCRIPTS.map(script => (
                        <button
                            key={script.id}
                            onClick={() => setActiveScript(script.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                                activeScript === script.id 
                                    ? 'bg-white shadow-sm text-slate-900 ring-1 ring-gray-200' 
                                    : 'text-slate-500 hover:bg-white hover:text-slate-700'
                            }`}
                        >
                            <div className={`p-1.5 rounded-md ${script.color}`}>
                                {script.icon}
                            </div>
                            {script.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Script Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white h-[600px] md:h-auto">
                {currentScript && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className={`p-3 rounded-xl ${currentScript.color}`}>
                                {currentScript.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{currentScript.label} Script</h2>
                                <p className="text-sm text-gray-500">Official agency standard script.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {currentScript.sections.map((section, index) => (
                                <div key={index} className="group relative">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">{index + 1}</span>
                                        {section.title}
                                    </h4>
                                    <div className="bg-slate-50 p-5 rounded-xl border border-gray-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap hover:border-indigo-200 hover:shadow-sm transition-all relative">
                                        {section.content}
                                        
                                        <button 
                                            onClick={() => handleCopy(section.content, `${currentScript.id}-${index}`)}
                                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Copy section"
                                        >
                                            {copiedIndex === `${currentScript.id}-${index}` ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
