
import React, { useState } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { Trophy, Medal, Star, TrendingUp, Calendar } from 'lucide-react';

type TimeFrame = 'WEEKLY' | 'MONTHLY' | 'YTD';

const Leaderboard: React.FC = () => {
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('MONTHLY');

    // Calculate production based on time frame
    // MOCK_TEAM production is assumed to be YTD
    const getProduction = (baseProduction: number) => {
        switch (timeFrame) {
            case 'WEEKLY': return Math.round(baseProduction / 52);
            case 'MONTHLY': return Math.round(baseProduction / 12);
            case 'YTD': return baseProduction;
            default: return baseProduction;
        }
    };

    const sortedTeam = MOCK_TEAM.map(member => ({
        ...member,
        displayProduction: getProduction(member.production)
    })).sort((a, b) => b.displayProduction - a.displayProduction);

    const topThree = sortedTeam.slice(0, 3);
    const restOfTeam = sortedTeam.slice(3);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Agency Leaderboard</h2>
                    <p className="text-slate-400 mt-2">Top performers rankings</p>
                </div>

                {/* Time Frame Toggles */}
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-sm flex">
                    {(['WEEKLY', 'MONTHLY', 'YTD'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                                timeFrame === tf 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {tf === 'WEEKLY' ? 'Weekly' : tf === 'MONTHLY' ? 'Monthly' : 'Year to Date'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Podium */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12">
                {/* 2nd Place */}
                <div className="order-2 md:order-1 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-600 overflow-hidden mb-3 shadow-lg relative">
                        <img src={topThree[1].avatarUrl} alt={topThree[1].name} className="w-full h-full object-cover grayscale-[0.2]" />
                        <div className="absolute bottom-0 w-full bg-slate-600 text-white text-[10px] font-bold text-center py-0.5">2nd</div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-t-xl border-t-4 border-slate-600 shadow-sm text-center w-40 h-40 flex flex-col justify-between border-x border-b border-slate-800">
                         <div>
                             <h3 className="font-bold text-white text-sm truncate">{topThree[1].name}</h3>
                             <p className="text-xs text-slate-400">{topThree[1].activePolicies} Policies</p>
                         </div>
                         <p className="text-lg font-bold text-slate-200">${topThree[1].displayProduction.toLocaleString()}</p>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="order-1 md:order-2 flex flex-col items-center z-10">
                     <div className="relative">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                            <Trophy size={32} className="text-yellow-400 drop-shadow-sm animate-bounce" />
                        </div>
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden mb-3 shadow-xl relative bg-yellow-400/10">
                            <img src={topThree[0].avatarUrl} alt={topThree[0].name} className="w-full h-full object-cover" />
                        </div>
                     </div>
                    <div className="bg-gradient-to-b from-yellow-500/10 to-slate-900 p-4 rounded-t-xl border-t-4 border-yellow-400 shadow-lg text-center w-48 h-52 flex flex-col justify-between border-x border-b border-slate-800">
                         <div>
                             <h3 className="font-bold text-white text-lg truncate">{topThree[0].name}</h3>
                             <div className="flex justify-center items-center gap-1 text-xs text-yellow-400 font-medium my-1">
                                 <Star size={12} fill="currentColor" /> Top Producer
                             </div>
                         </div>
                         <div>
                             <p className="text-2xl font-bold text-white">${topThree[0].displayProduction.toLocaleString()}</p>
                             <p className="text-xs text-slate-400 mt-1">Total Premium</p>
                         </div>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-orange-700 overflow-hidden mb-3 shadow-lg relative">
                        <img src={topThree[2].avatarUrl} alt={topThree[2].name} className="w-full h-full object-cover grayscale-[0.2]" />
                        <div className="absolute bottom-0 w-full bg-orange-700 text-white text-[10px] font-bold text-center py-0.5">3rd</div>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-t-xl border-t-4 border-orange-700 shadow-sm text-center w-40 h-32 flex flex-col justify-between border-x border-b border-slate-800">
                         <div>
                             <h3 className="font-bold text-white text-sm truncate">{topThree[2].name}</h3>
                             <p className="text-xs text-slate-400">{topThree[2].activePolicies} Policies</p>
                         </div>
                         <p className="text-lg font-bold text-slate-200">${topThree[2].displayProduction.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden max-w-4xl mx-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-950/50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">Rank</th>
                            <th className="px-6 py-4">Agent</th>
                            <th className="px-6 py-4 text-center">Policies</th>
                            <th className="px-6 py-4 text-right">Production</th>
                            <th className="px-6 py-4 text-right">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {restOfTeam.map((agent, index) => (
                            <tr key={agent.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 text-center font-bold text-slate-500">#{index + 4}</td>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <img src={agent.avatarUrl} alt={agent.name} className="w-8 h-8 rounded-full object-cover bg-slate-800 border border-slate-700" />
                                    <span className="font-medium text-slate-200">{agent.name}</span>
                                </td>
                                <td className="px-6 py-4 text-center text-slate-400">{agent.activePolicies}</td>
                                <td className="px-6 py-4 text-right font-bold text-white">${agent.displayProduction.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center text-xs text-green-400 font-medium">
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
