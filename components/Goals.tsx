
import React, { useState, useEffect } from 'react';
import { MOCK_GOALS } from '../services/mockData';
import { Target, TrendingUp, Edit2, X, Check, Calendar, BarChart3, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type GoalPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface Goal {
    id: string;
    title: string;
    current: number;
    target: number;
    unit: string;
}

const Goals: React.FC = () => {
    // Initialize goals for all periods
    const [allGoals, setAllGoals] = useState<Record<GoalPeriod, Goal[]>>(() => {
        const saved = localStorage.getItem('arise_goals_v2');
        if (saved) return JSON.parse(saved);

        // Generate defaults based on MOCK_GOALS (assumed Monthly)
        const monthly = MOCK_GOALS;
        const weekly = monthly.map(g => ({
            ...g, 
            id: `w-${g.id}`,
            current: Math.round(g.current / 4),
            target: Math.round(g.target / 4)
        }));
        const yearly = monthly.map(g => ({
            ...g, 
            id: `y-${g.id}`,
            current: Math.round(g.current * 12), // Mocking YTD/Yearly projection
            target: Math.round(g.target * 12)
        }));

        return {
            WEEKLY: weekly,
            MONTHLY: monthly,
            YEARLY: yearly
        };
    });

    const [activePeriod, setActivePeriod] = useState<GoalPeriod>('MONTHLY');
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Use strings for edit values to avoid "stable 0" issue and allow empty inputs
    const [editValues, setEditValues] = useState({ current: '', target: '' });
    
    // Add Goal Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', target: '', current: '', unit: '$' });

    useEffect(() => {
        localStorage.setItem('arise_goals_v2', JSON.stringify(allGoals));
    }, [allGoals]);

    const handleEditClick = (goal: Goal) => {
        setEditingId(goal.id);
        // Convert to string on open so user sees current value but can clear it
        setEditValues({ current: goal.current.toString(), target: goal.target.toString() });
    };

    const handleSave = (id: string) => {
        // Parse back to numbers on save
        const currentVal = parseFloat(editValues.current) || 0;
        const targetVal = parseFloat(editValues.target) || 0;

        const updatedGoals = allGoals[activePeriod].map((g) => 
            g.id === id ? { ...g, current: currentVal, target: targetVal } : g
        );
        
        setAllGoals(prev => ({
            ...prev,
            [activePeriod]: updatedGoals
        }));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this goal?")) {
            setAllGoals(prev => ({
                ...prev,
                [activePeriod]: prev[activePeriod].filter(g => g.id !== id)
            }));
        }
    };

    const handleAddGoal = () => {
        if (!newGoal.title || !newGoal.target) return;

        const goal: Goal = {
            id: `g-${Date.now()}`,
            title: newGoal.title,
            current: Number(newGoal.current) || 0,
            target: Number(newGoal.target),
            unit: newGoal.unit
        };

        setAllGoals(prev => ({
            ...prev,
            [activePeriod]: [...prev[activePeriod], goal]
        }));

        setIsAddModalOpen(false);
        setNewGoal({ title: '', target: '', current: '', unit: '$' });
    };

    const currentGoals = allGoals[activePeriod];

    // Class to hide browser default number spinners and force dark background
    const numberInputClass = "w-full border border-slate-700 rounded p-1.5 text-center font-bold text-white bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (
        <div className="animate-fade-in space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Financial Goals</h2>
                    <p className="text-slate-400 text-sm">Track your performance against {activePeriod.toLowerCase()} targets.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-sm flex">
                        {(['WEEKLY', 'MONTHLY', 'YEARLY'] as GoalPeriod[]).map((period) => (
                            <button
                                key={period}
                                onClick={() => setActivePeriod(period)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                    activePeriod === period 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                        title="Add New Goal"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentGoals.map((goal, index) => {
                    const percentage = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
                    const data = [
                        { name: 'Completed', value: goal.current },
                        { name: 'Remaining', value: Math.max(0, goal.target - goal.current) }
                    ];
                    const COLORS = ['#6366f1', '#1e293b'];
                    const isEditing = editingId === goal.id;

                    return (
                        <div key={goal.id} className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                             {!isEditing && (
                                 <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                                     <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${percentage}%`}}></div>
                                 </div>
                             )}
                             
                             {!isEditing && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={() => handleEditClick(goal)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-full hover:bg-slate-800"
                                        title="Edit Goal"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(goal.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-800"
                                        title="Delete Goal"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                             )}

                             <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wide mt-2">{goal.title}</h3>
                             
                             {isEditing ? (
                                 <div className="flex-1 flex flex-col justify-center items-center w-full gap-3 py-4 animate-fade-in">
                                     <div className="w-full">
                                         <label className="text-xs text-slate-500 font-medium block mb-1">Current</label>
                                         <input 
                                            type="number" 
                                            className={numberInputClass}
                                            value={editValues.current}
                                            onChange={(e) => setEditValues({...editValues, current: e.target.value})}
                                            autoFocus
                                         />
                                     </div>
                                     <div className="w-full">
                                         <label className="text-xs text-slate-500 font-medium block mb-1">Target</label>
                                         <input 
                                            type="number" 
                                            className={numberInputClass}
                                            value={editValues.target}
                                            onChange={(e) => setEditValues({...editValues, target: e.target.value})}
                                         />
                                     </div>
                                     <div className="flex gap-2 mt-2 w-full">
                                         <button onClick={() => setEditingId(null)} className="flex-1 p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-colors">
                                            <X size={16} className="mx-auto" />
                                         </button>
                                         <button onClick={() => handleSave(goal.id)} className="flex-1 p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                                            <Check size={16} className="mx-auto" />
                                         </button>
                                     </div>
                                 </div>
                             ) : (
                                 <>
                                    <div className="h-32 w-32 my-4 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={35}
                                                    outerRadius={45}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                            <span className="text-xl font-bold text-white">{percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl font-bold text-white">
                                            {goal.unit === '$' ? `$${goal.current.toLocaleString()}` : goal.current}
                                        </span>
                                        <span className="text-slate-500 text-sm">/ {goal.unit === '$' ? `$${goal.target.toLocaleString()}` : goal.target}</span>
                                    </div>
                                    {percentage >= 100 && (
                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-bold animate-pulse border border-green-500/20">Goal Hit!</span>
                                    )}
                                 </>
                             )}
                        </div>
                    );
                })}
            </div>

            {/* Bonus Section */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 border border-indigo-500/30">
                <div>
                    <h3 className="text-2xl font-bold mb-2">
                        {activePeriod === 'WEEKLY' ? 'Weekly Sprint Bonus' : activePeriod === 'MONTHLY' ? 'Monthly Pace Bonus' : 'Annual President\'s Club'}
                    </h3>
                    <p className="text-indigo-200 max-w-xl">
                        {activePeriod === 'WEEKLY' 
                            ? "Close 2 more apps this week to unlock the $500 fast start bonus."
                            : activePeriod === 'MONTHLY'
                            ? "You are on track to hit the 'Elite Producer' bonus tier for October."
                            : "Only $16,000 more in premium needed to qualify for the President's Club Trip to Cabo."}
                    </p>
                </div>
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0 border border-white/20">
                    <Target size={32} className="text-white" />
                </div>
            </div>

            {/* Add Goal Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm ring-1 ring-white/10 animate-fade-in overflow-hidden border border-slate-800">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Target size={18} className="text-indigo-500" /> New {activePeriod.toLowerCase()} Goal
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Goal Title</label>
                                <input 
                                    type="text"
                                    autoFocus
                                    className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white placeholder-slate-600"
                                    placeholder="e.g. Total Appointments"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target</label>
                                    <input 
                                        type="number"
                                        className={numberInputClass}
                                        placeholder="100"
                                        value={newGoal.target}
                                        onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current</label>
                                    <input 
                                        type="number"
                                        className={numberInputClass}
                                        placeholder="0"
                                        value={newGoal.current}
                                        onChange={(e) => setNewGoal({...newGoal, current: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                    value={newGoal.unit}
                                    onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                                >
                                    <option value="$">Currency ($)</option>
                                    <option value="Apps">Applications</option>
                                    <option value="Appts">Appointments</option>
                                    <option value="Calls">Calls</option>
                                    <option value="Recruits">Recruits</option>
                                    <option value="Units">Generic Units</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleAddGoal}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm mt-2"
                            >
                                Create Goal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
