import React from 'react';
import { MOCK_REFERRALS } from '../services/mockData';
import { Users, Gift, ChevronRight } from 'lucide-react';

const Referrals: React.FC = () => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Referral Tracking</h2>
                <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Gift size={16} /> Referral Program Active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <p className="text-sm text-gray-500">Total Referrals (YTD)</p>
                     <h3 className="text-3xl font-bold text-slate-800 mt-1">24</h3>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <p className="text-sm text-gray-500">Closed - Won</p>
                     <h3 className="text-3xl font-bold text-green-600 mt-1">11</h3>
                 </div>
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                     <p className="text-sm text-gray-500">Pending Rewards</p>
                     <h3 className="text-3xl font-bold text-indigo-600 mt-1">$450</h3>
                 </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-slate-700">Referral Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Referrer</th>
                                <th className="px-6 py-3">Prospect</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Reward</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MOCK_REFERRALS.map((ref) => (
                                <tr key={ref.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 font-medium text-slate-900">{ref.referrerName}</td>
                                    <td className="px-6 py-4 text-slate-600">{ref.referredProspect}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{ref.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                            ${ref.status === 'Closed - Won' ? 'bg-green-100 text-green-700' : 
                                              ref.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {ref.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                            ${ref.rewardStatus === 'Paid' ? 'bg-green-50 text-green-600 border border-green-200' : 
                                              ref.rewardStatus === 'Pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'text-gray-400'}`}>
                                            {ref.rewardStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500" />
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