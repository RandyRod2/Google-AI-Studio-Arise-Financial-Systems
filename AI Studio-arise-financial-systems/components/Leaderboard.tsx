import React from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';

const Leaderboard: React.FC = () => {
    const sortedTeam = [...MOCK_TEAM].sort((a, b) => b.production - a.production);
    const topThree = sortedTeam.slice(0, 3);
    const restOfTeam = sortedTeam.slice(3);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Agency Leaderboard</h2>
                <p className="text-slate-500 mt-2">Top performers for October 2024</p>
            </div>

            {/* Podium */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-200 overflow-hidden mb-3 shadow-lg relative">
                        <img src={topThree[1].avatarUrl} alt={topThree[1].name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 w-full bg-slate-300 text-slate-800 text-[10px] font-bold text-center py-0.5">2nd</div>
                    </div>
                    <div className="bg-white p-4 rounded-t-xl border-t-4 border-slate-300 shadow-sm text-center w-40 h-40 flex flex-col justify-between">
                         <div>
                             <h3 className="font-bold text-slate-800 text-sm truncate">{topThree[1].name}</h3>
                             <p className="text-xs text-gray-500">{topThree[1].activePolicies} Policies</p>
                         </div>
                         <p className="text-lg font-bold text-slate-700">${topThree[1].production.toLocaleString()}</p>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 flex flex-col items-center z-10">
                     <div className="relative">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                            <Trophy size={32} className="text-yellow-400 drop-shadow-sm" />
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden mb-3 shadow-xl relative">
                            <img src={topThree[0].avatarUrl} alt={topThree[0].name} className="w-full h-full object-cover" />
                        </div>
                     </div>
                    <div className="bg-gradient-to-b from-yellow-50 to-white p-4 rounded-t-xl border-t-4 border-yellow-400 shadow-lg text-center w-48 h-52 flex flex-col justify-between">
                         <div>
                             <h3 className="font-bold text-slate-800 text-lg truncate">{topThree[0].name}</h3>
                             <div className="flex justify-center items-center gap-1 text-xs text-yellow-600 font-medium my-1">
                                 <Star size={12} fill="currentColor" /> Top Producer
                             </div>
                         </div>
                         <div>
                             <p className="text-2xl font-bold text-slate-800">${topThree[0].production.toLocaleString()}</p>
                             <p className="text-xs text-gray-500 mt-1">Total Premium</p>
                         </div>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-orange-200 overflow-hidden mb-3 shadow-lg relative">
                        <img src={topThree[2].avatarUrl} alt={topThree[2].name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 w-full bg-orange-200 text-orange-900 text-[10px] font-bold text-center py-0.5">3rd</div>
                    </div>
                    <div className="bg-white p-4 rounded-t-xl border-t-4 border-orange-300 shadow-sm text-center w-40 h-32 flex flex-col justify-between">
                         <div>
                             <h3 className="font-bold text-slate-800 text-sm truncate">{topThree[2].name}</h3>
                             <p className="text-xs text-gray-500">{topThree[2].activePolicies} Policies</p>
                         </div>
                         <p className="text-lg font-bold text-slate-700">${topThree[2].production.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl mx-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">Rank</th>
                            <th className="px-6 py-4">Agent</th>
                            <th className="px-6 py-4 text-center">Policies</th>
                            <th className="px-6 py-4 text-right">Production</th>
                            <th className="px-6 py-4 text-right">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {restOfTeam.map((agent, index) => (
                            <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-center font-bold text-slate-400">#{index + 4}</td>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <img src={agent.avatarUrl} alt={agent.name} className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                                    <span className="font-medium text-slate-700">{agent.name}</span>
                                </td>
                                <td className="px-6 py-4 text-center text-slate-600">{agent.activePolicies}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800">${agent.production.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center text-xs text-green-600 font-medium">
                                        <TrendingUp size={12} className="mr-1" /> +{Math.floor(Math.random() * 10)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;