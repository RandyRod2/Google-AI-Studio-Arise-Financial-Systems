
import React from 'react';
import { ShoppingCart, ExternalLink, Users, Target, Clock, ShieldCheck, Heart, TrendingUp, Home, Flag } from 'lucide-react';

const LeadStore: React.FC = () => {
    const LEAD_PLATFORM_URL = "https://www.ariseinsuranceleads.com/";

    const openLeadPlatform = () => {
        window.open(LEAD_PLATFORM_URL, '_blank');
    };

    const LEAD_TYPES = [
        {
            id: 'fex',
            title: 'FEX',
            subtitle: 'Final Expense / Burial Insurance Leads',
            basePrice: 18,
            icon: <Heart size={24} />,
            colorClass: 'bg-rose-500/10 text-rose-400',
            borderColor: 'bg-rose-500',
            options: [
                { name: 'Core', price: 18, desc: 'Instant form leads - quick delivery' },
                { name: 'Hybrid', price: 22, desc: 'Mix of Core & Pro leads' },
                { name: 'Pro', price: 27, desc: 'Landing page leads - higher intent' }
            ]
        },
        {
            id: 'iul',
            title: 'IUL',
            subtitle: 'Indexed Universal Life Insurance Leads',
            basePrice: 30,
            icon: <TrendingUp size={24} />,
            colorClass: 'bg-emerald-500/10 text-emerald-400',
            borderColor: 'bg-emerald-500',
            options: [
                { name: 'Core', price: 30, desc: 'Instant form leads - quick delivery' },
                { name: 'Hybrid', price: 37, desc: 'Mix of Core & Pro leads' },
                { name: 'Pro', price: 45, desc: 'Landing page leads - higher intent' }
            ]
        },
        {
            id: 'mp',
            title: 'Mortgage Protection',
            subtitle: 'Mortgage Protection Insurance Leads',
            basePrice: 29,
            icon: <Home size={24} />,
            colorClass: 'bg-blue-500/10 text-blue-400',
            borderColor: 'bg-blue-500',
            options: [
                { name: 'Core', price: 29, desc: 'Instant form leads - quick delivery' },
                { name: 'Hybrid', price: 34, desc: 'Mix of Core & Pro leads' },
                { name: 'Pro', price: 40, desc: 'Landing page leads - higher intent' }
            ]
        },
        {
            id: 'vet',
            title: 'Veteran',
            subtitle: 'Veteran Life Insurance Leads',
            basePrice: 23,
            icon: <Flag size={24} />,
            colorClass: 'bg-indigo-500/10 text-indigo-400',
            borderColor: 'bg-indigo-500',
            options: [
                { name: 'Core', price: 23, desc: 'Instant form leads - quick delivery' },
                { name: 'Hybrid', price: 30, desc: 'Mix of Core & Pro leads' },
                { name: 'Pro', price: 40, desc: 'Landing page leads - higher intent' }
            ]
        }
    ];

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            {/* Header / Hero */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden border border-slate-700">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">High-Intent Exclusive Leads</h2>
                    <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                        Fuel your pipeline with real-time, verified prospects. Choose from Final Expense, IUL, Mortgage Protection, and Veteran specific leads.
                    </p>
                    <button 
                        onClick={openLeadPlatform}
                        className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-bold text-sm md:text-base hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <ShoppingCart size={20} /> Access Lead Marketplace <ExternalLink size={16} />
                    </button>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full opacity-20 blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                <Target className="absolute right-10 top-1/2 -translate-y-1/2 text-white opacity-5 w-48 h-48" />
            </div>

            {/* Categories */}
            <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users size={20} className="text-indigo-500" /> Featured Lead Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {LEAD_TYPES.map((lead) => (
                        <div key={lead.id} className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col hover:border-indigo-500/30">
                            <div className={`h-1.5 ${lead.borderColor}`}></div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${lead.colorClass}`}>
                                        {lead.icon}
                                    </div>
                                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-full border border-slate-700">
                                        From ${lead.basePrice}
                                    </span>
                                </div>
                                
                                <h4 className="text-lg font-bold text-white mb-1">{lead.title}</h4>
                                <p className="text-slate-400 text-xs mb-5 h-8">{lead.subtitle}</p>
                                
                                <div className="space-y-3 mb-6 bg-slate-950 rounded-lg p-3 border border-slate-800 flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Available Options</p>
                                    {lead.options.map((opt) => (
                                        <div key={opt.name} className="text-sm border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                                    opt.name === 'Pro' ? 'bg-indigo-900/30 text-indigo-400' : 
                                                    opt.name === 'Hybrid' ? 'bg-purple-900/30 text-purple-400' :
                                                    'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {opt.name}
                                                </span>
                                                <span className="font-bold text-slate-200">${opt.price}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">{opt.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={openLeadPlatform} className="w-full mt-auto py-2.5 bg-slate-900 border-2 border-indigo-500/20 text-indigo-400 rounded-lg font-bold text-sm hover:border-indigo-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                    Order Now <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white">Why Arise Leads?</h3>
                    <p className="text-slate-400 mt-1">Built for agents who demand quality and consistency.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-indigo-500/10 rounded-full shadow-sm mb-3 text-indigo-400">
                            <ShieldCheck size={24} />
                        </div>
                        <h4 className="font-bold text-white mb-1">100% Verified</h4>
                        <p className="text-sm text-slate-400">Every lead is scrubbed for accuracy and TCPA compliance before delivery.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-indigo-500/10 rounded-full shadow-sm mb-3 text-indigo-400">
                            <Clock size={24} />
                        </div>
                        <h4 className="font-bold text-white mb-1">Real-Time Delivery</h4>
                        <p className="text-sm text-slate-400">Leads are delivered to your CRM seconds after the prospect clicks submit.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-indigo-500/10 rounded-full shadow-sm mb-3 text-indigo-400">
                            <Target size={24} />
                        </div>
                        <h4 className="font-bold text-white mb-1">Replacement Policy</h4>
                        <p className="text-sm text-slate-400">Bad number? Disconnected? We replace invalid leads within 48 hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadStore;
