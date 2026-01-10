
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, CheckSquare, Plus, X, Calendar as CalendarIcon, Trash2, Users, Save, Edit2 } from 'lucide-react';
import { MOCK_TASKS, MOCK_COMPLIANCE } from '../services/mockData';
import { CalendarEvent, User } from '../types';

interface CalendarProps {
    currentUser?: User;
}

const Calendar: React.FC<CalendarProps> = ({ currentUser }) => {
    // State for Date Navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const canManageGlobal = currentUser && ['ADMIN', 'AGENCY_OWNER', 'STAFF'].includes(currentUser.role);

    // Initialize Events from Local Storage or Mock Data
    const [events, setEvents] = useState<CalendarEvent[]>(() => {
        try {
            const saved = localStorage.getItem('arise_calendar_events');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Error loading calendar events", e);
        }

        // Default Initialization
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const initialEvents: CalendarEvent[] = MOCK_TASKS.map(t => {
            let dateStr = '';
            if (t.dueDate === 'Today') {
                dateStr = today.toISOString().split('T')[0];
            } else if (t.dueDate === 'Tomorrow') {
                dateStr = tomorrow.toISOString().split('T')[0];
            } else if (t.dueDate.includes('Oct')) {
                dateStr = `2024-10-${t.dueDate.split(' ')[1]}`;
            } else {
                dateStr = today.toISOString().split('T')[0];
            }

            return {
                id: t.id,
                title: t.title,
                date: dateStr,
                type: t.type,
                time: '10:00',
                isGlobal: false
            };
        });

        // Add some mock global training events
        const nextWed = new Date(today);
        nextWed.setDate(today.getDate() + (3 - today.getDay() + 7) % 7);
        const nextWedStr = nextWed.toISOString().split('T')[0];

        initialEvents.push({
            id: 'team-training-1',
            title: 'Team Workshop: Advanced IUL',
            date: nextWedStr,
            time: '14:00',
            type: 'Training',
            isGlobal: true
        });

        MOCK_COMPLIANCE.forEach(c => {
             if (c.expiry && c.expiry.includes('-')) {
                 initialEvents.push({
                     id: c.id,
                     title: `Expiring: ${c.name}`,
                     date: c.expiry,
                     type: 'Compliance',
                     time: '00:00',
                     isGlobal: false
                 });
             }
        });

        return initialEvents;
    });
    
    // State for Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formState, setFormState] = useState({ 
        title: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '09:00',
        type: 'Meeting',
        isGlobal: false
    });

    // Persist events whenever they change
    useEffect(() => {
        localStorage.setItem('arise_calendar_events', JSON.stringify(events));
    }, [events]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleCreateEvent = () => {
        if (!formState.title || !formState.date) return;

        if (editingId) {
            setEvents(events.map(ev => ev.id === editingId ? {
                ...ev,
                title: formState.title,
                date: formState.date,
                type: formState.type,
                time: formState.time,
                isGlobal: formState.isGlobal
            } : ev));
            setEditingId(null);
        } else {
            const event: CalendarEvent = {
                id: Date.now().toString(),
                title: formState.title,
                date: formState.date,
                type: formState.type,
                time: formState.time,
                isGlobal: formState.isGlobal
            };
            setEvents([...events, event]);
        }
        
        setIsAddModalOpen(false);
        setFormState({ 
            title: '', 
            date: new Date().toISOString().split('T')[0],
            time: '09:00', 
            type: 'Meeting',
            isGlobal: false
        });
    };

    const handleEditEvent = (ev: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        if (ev.isGlobal && !canManageGlobal) {
            alert("Only admins/staff can edit Team Events.");
            return;
        }
        setEditingId(ev.id);
        setFormState({
            title: ev.title,
            date: ev.date,
            time: ev.time || '09:00',
            type: ev.type || 'Meeting',
            isGlobal: !!ev.isGlobal
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteEvent = (id: string, isGlobal: boolean | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGlobal && !canManageGlobal) {
            alert("Only admins/staff can delete Team Events.");
            return;
        }
        if (window.confirm("Delete this event?")) {
            setEvents(events.filter(ev => ev.id !== id));
        }
    };

    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarGrid = [];
        for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            calendarGrid.push({ day: i, dateStr });
        }
        while (calendarGrid.length < 42) calendarGrid.push(null);
        return calendarGrid;
    };

    const calendarGrid = getCalendarDays();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingEvents = events
        .filter(e => e.date >= todayStr)
        .sort((a, b) => {
            if (a.date === b.date) return (a.time || '').localeCompare(b.time || '');
            return a.date.localeCompare(b.date);
        })
        .slice(0, 10);

    return (
        <div className="animate-fade-in space-y-6 relative h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">Calendar</h2>
                    <p className="text-sm text-slate-400">Manage your schedule, tasks, and deadlines.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={goToToday}
                        className="px-3 py-1 text-xs font-bold bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800"
                    >
                        Today
                    </button>
                    <div className="flex items-center bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shadow-sm">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-white w-40 text-center select-none">
                            {monthName}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => { setIsAddModalOpen(true); setEditingId(null); setFormState({title:'', date: todayStr, time:'09:00', type:'Meeting', isGlobal:false}); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Add Event</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Calendar Grid */}
                <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-auto">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/50 shrink-0">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>
                    
                    {/* Grid Cells */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                        {calendarGrid.map((cell, index) => {
                            if (!cell) {
                                return <div key={`empty-${index}`} className="bg-slate-950/30 border-b border-r border-slate-800 last:border-r-0"></div>;
                            }

                            const dayEvents = events.filter(e => e.date === cell.dateStr);
                            const isToday = cell.dateStr === todayStr;

                            return (
                                <div key={cell.dateStr} className={`border-b border-r border-slate-800 p-2 relative flex flex-col gap-1 hover:bg-slate-800/30 transition-colors last:border-r-0 ${isToday ? 'bg-indigo-900/10' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}>
                                            {cell.day}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto mt-1 custom-scrollbar">
                                        {dayEvents.map(event => {
                                            const canEditEvent = !event.isGlobal || canManageGlobal;
                                            return (
                                                <div 
                                                    key={event.id} 
                                                    onClick={(e) => handleEditEvent(event, e)}
                                                    className={`group px-2 py-1 text-[10px] rounded border-l-2 truncate font-medium cursor-pointer transition-all hover:opacity-100 opacity-90 relative
                                                    ${event.isGlobal ? 'bg-purple-900/30 text-purple-300 border-purple-500' : 
                                                    event.type === 'Meeting' ? 'bg-indigo-900/30 text-indigo-300 border-indigo-500' : 
                                                    event.type === 'Call' ? 'bg-green-900/30 text-green-400 border-green-500' : 
                                                    event.type === 'Compliance' ? 'bg-red-900/30 text-red-400 border-red-500' :
                                                    'bg-slate-800 text-slate-300 border-slate-600'}`}
                                                    title={event.title}
                                                >
                                                    {event.isGlobal && <Users size={8} className="inline mr-1" />}
                                                    {event.time && event.time !== '00:00' ? <span className="opacity-75 mr-1">{event.time}</span> : ''}
                                                    {event.title}
                                                    
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                                                        {canEditEvent && (
                                                            <button 
                                                                onClick={(e) => handleEditEvent(event, e)}
                                                                className={`p-0.5 bg-slate-900/80 rounded hover:bg-slate-900 text-indigo-400`}
                                                            >
                                                                <Edit2 size={10} />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={(e) => handleDeleteEvent(event.id, event.isGlobal, e)}
                                                            className={`p-0.5 bg-slate-900/80 rounded hover:bg-slate-900 text-red-400`}
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar: Upcoming & Alerts */}
                <div className="space-y-6 overflow-y-auto custom-scrollbar lg:h-auto">
                     <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Clock size={16} className="text-indigo-500" /> Upcoming Schedule
                        </h3>
                        <div className="space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No upcoming events scheduled.</p>
                            ) : upcomingEvents.map(event => {
                                const canEditEvent = !event.isGlobal || canManageGlobal;
                                return (
                                    <div key={event.id} className={`border-l-4 pl-3 py-1 relative group ${event.isGlobal ? 'border-purple-500' : event.type === 'Meeting' ? 'border-indigo-500' : event.type === 'Call' ? 'border-green-500' : 'border-slate-600'}`}>
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-200 line-clamp-1">{event.title}</p>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canEditEvent && (
                                                    <button 
                                                        onClick={(e) => handleEditEvent(event, e)}
                                                        className="text-slate-500 hover:text-indigo-400"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => handleDeleteEvent(event.id, event.isGlobal, e)}
                                                    className="text-slate-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1 font-medium text-slate-400">
                                                {event.date === todayStr ? 'Today' : new Date(event.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                            </span>
                                            <span className={`flex items-center gap-1 font-bold ${event.isGlobal ? 'text-purple-400' : ''}`}>
                                                {event.isGlobal ? <Users size={12} /> : event.type === 'Meeting' ? <MapPin size={12} /> : <CheckSquare size={12} />} 
                                                {event.isGlobal ? 'TEAM' : event.type}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     </div>
                </div>
            </div>

            {/* Create / Edit Event Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-md ring-1 ring-white/10 animate-fade-in border border-slate-800">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <CalendarIcon size={18} className="text-indigo-500" /> {editingId ? 'Edit Event' : 'New Event'}
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {canManageGlobal && (
                                <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 mb-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                            checked={formState.isGlobal}
                                            onChange={e => setFormState({...formState, isGlobal: e.target.checked})}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-indigo-300">Team Announcement / Global Event</span>
                                            <span className="text-[10px] text-slate-500">Visible to all agents in the agency.</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                                <input 
                                    type="text"
                                    autoFocus
                                    className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                    placeholder="e.g. Client Review with John"
                                    value={formState.title}
                                    onChange={(e) => setFormState({...formState, title: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={formState.date}
                                        onChange={(e) => setFormState({...formState, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                                    <input 
                                        type="time"
                                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={formState.time}
                                        onChange={(e) => setFormState({...formState, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            {!formState.isGlobal && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Type</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                        value={formState.type}
                                        onChange={(e) => setFormState({...formState, type: e.target.value})}
                                    >
                                        <option value="Meeting">Meeting</option>
                                        <option value="Call">Call</option>
                                        <option value="Task">Task</option>
                                        <option value="Personal">Personal</option>
                                        <option value="Deadline">Deadline</option>
                                    </select>
                                </div>
                            )}

                            <button 
                                onClick={handleCreateEvent}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                {editingId ? 'Save Changes' : (formState.isGlobal ? 'Post Team Event' : 'Add to Calendar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
