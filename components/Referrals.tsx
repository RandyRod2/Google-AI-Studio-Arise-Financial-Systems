
import React from 'react';
import { MOCK_REFERRALS } from '../services/mockData';
import { Users, Gift, ChevronRight } from 'lucide-react';

const Referrals: React.FC = () => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Referral Tracking</h2>
                <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                    <Gift size={16} /> Referral Program Active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                     <p className="text-sm text-slate-500">Total Referrals (YTD)</p>
                     <h3 className="text-3xl font-bold text-white mt-1">24</h3>
                 </div>
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                     <p className="text-sm text-slate-500">Closed - Won</p>
                     <h3 className="text-3xl font-bold text-green-400 mt-1">11</h3>
                 </div>
                 <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                     <p className="text-sm text-slate-500">Pending Rewards</p>
                     <h3 className="text-3xl font-bold text-indigo-400 mt-1">$450</h3>
                 </div>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                    <h3 className="font-bold text-slate-300">Referral Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-950/30 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-3">Referrer</th>
                                <th className="px-6 py-3">Prospect</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Reward</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {MOCK_REFERRALS.map((ref) => (
                                <tr key={ref.id} className="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 font-medium text-white">{ref.referrerName}</td>
                                    <td className="px-6 py-4 text-slate-400">{ref.referredProspect}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{ref.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                            ${ref.status === 'Closed - Won' ? 'bg-green-500/10 text-green-400' : 
                                              ref.status === 'New' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                            ${ref.rewardStatus === 'Paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                              ref.rewardStatus === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-500'}`}>
                                            {ref.rewardStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Referrals;
