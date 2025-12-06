
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
            basePrice: 20,
            icon: <Heart size={24} />,
            colorClass: 'bg-rose-50 text-rose-600',
            borderColor: 'bg-rose-500',
            options: [
                { name: 'Core', price: 20, desc: 'Instant form leads - quick delivery' },
                { name: 'Pro', price: 27, desc: 'Landing page leads - higher intent' }
            ]
        },
        {
            id: 'iul',
            title: 'IUL',
            subtitle: 'Indexed Universal Life Insurance Leads',
            basePrice: 30,
            icon: <TrendingUp size={24} />,
            colorClass: 'bg-emerald-50 text-emerald-600',
            borderColor: 'bg-emerald-500',
            options: [
                { name: 'Core', price: 30, desc: 'Instant form leads - quick delivery' },
                { name: 'Pro', price: 45, desc: 'Landing page leads - higher intent' }
            ]
        },
        {
            id: 'mp',
            title: 'Mortgage Protection',
            subtitle: 'Mortgage Protection Insurance Leads',
            basePrice: 29,
            icon: <Home size={24} />,
            colorClass: 'bg-blue-50 text-blue-600',
            borderColor: 'bg-blue-500',
            options: [
                { name: 'Core', price: 29, desc: 'Instant form leads - quick delivery' },
                { name: 'Pro', price: 40, desc: 'Landing page leads - higher intent' }
            ]
        },
        {
            id: 'vet',
            title: 'Veteran',
            subtitle: 'Veteran Life Insurance Leads',
            basePrice: 23,
            icon: <Flag size={24} />,
            colorClass: 'bg-indigo-50 text-indigo-600',
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
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
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
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Users size={20} className="text-indigo-600" /> Featured Lead Types
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {LEAD_TYPES.map((lead) => (
                        <div key={lead.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                            <div className={`h-1.5 ${lead.borderColor}`}></div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${lead.colorClass}`}>
                                        {lead.icon}
                                    </div>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                                        From ${lead.basePrice}
                                    </span>
                                </div>
                                
                                <h4 className="text-lg font-bold text-slate-800 mb-1">{lead.title}</h4>
                                <p className="text-slate-500 text-xs mb-5 h-8">{lead.subtitle}</p>
                                
                                <div className="space-y-3 mb-6 bg-slate-50 rounded-lg p-3 border border-slate-100 flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Available Options</p>
                                    {lead.options.map((opt) => (
                                        <div key={opt.name} className="text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                                    opt.name === 'Pro' ? 'bg-indigo-100 text-indigo-700' : 
                                                    opt.name === 'Hybrid' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-200 text-gray-700'
                                                }`}>
                                                    {opt.name}
                                                </span>
                                                <span className="font-bold text-slate-800">${opt.price}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-tight">{opt.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={openLeadPlatform} className="w-full mt-auto py-2.5 bg-white border-2 border-indigo-50 text-indigo-600 rounded-lg font-bold text-sm hover:border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                                    Order Now <ExternalLink size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-800">Why Arise Leads?</h3>
                    <p className="text-slate-500">Built for agents who demand quality and consistency.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 text-indigo-600">
                            <ShieldCheck size={24} />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">100% Verified</h4>
                        <p className="text-sm text-slate-500">Every lead is scrubbed for accuracy and TCPA compliance before delivery.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 text-indigo-600">
                            <Clock size={24} />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">Real-Time Delivery</h4>
                        <p className="text-sm text-slate-500">Leads are delivered to your CRM seconds after the prospect clicks submit.</p>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3 text-indigo-600">
                            <Target size={24} />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">Replacement Policy</h4>
                        <p className="text-sm text-slate-500">Bad number? Disconnected? We replace invalid leads within 48 hours.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadStore;
