
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle, CheckSquare, Plus, X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { MOCK_TASKS, MOCK_COMPLIANCE } from '../services/mockData';

interface CalendarEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: string;
    time?: string;
}

const Calendar: React.FC = () => {
    // State for Date Navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    
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

        // Default Initialization (Run once if no save found)
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
                // Approximate for demo if static date provided
                dateStr = `2024-10-${t.dueDate.split(' ')[1]}`;
            } else {
                dateStr = today.toISOString().split('T')[0];
            }

            return {
                id: t.id,
                title: t.title,
                date: dateStr,
                type: t.type,
                time: '10:00'
            };
        });

        MOCK_COMPLIANCE.forEach(c => {
             if (c.expiry && c.expiry.includes('-')) {
                 initialEvents.push({
                     id: c.id,
                     title: `Expiring: ${c.name}`,
                     date: c.expiry,
                     type: 'Compliance',
                     time: '00:00'
                 });
             }
        });

        return initialEvents;
    });
    
    // State for Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ 
        title: '', 
        date: new Date().toISOString().split('T')[0], 
        time: '09:00',
        type: 'Meeting' 
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
        if (!newEvent.title || !newEvent.date) return;

        const event: CalendarEvent = {
            id: Date.now().toString(),
            title: newEvent.title,
            date: newEvent.date,
            type: newEvent.type,
            time: newEvent.time
        };

        setEvents([...events, event]);
        setIsAddModalOpen(false);
        // Reset form but keep date for convenience if adding multiple
        setNewEvent(prev => ({ 
            ...prev,
            title: '', 
            time: '09:00',
            type: 'Meeting' 
        }));
    };

    const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Delete this event?")) {
            setEvents(events.filter(ev => ev.id !== id));
        }
    };

    // Helper to generate the grid days
    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const calendarGrid = [];
        
        // Previous month padding
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.push(null);
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            calendarGrid.push({ day: i, dateStr });
        }

        // Fill remaining cells to maintain grid structure (6 rows max usually cover all months)
        const totalCells = 42; 
        while (calendarGrid.length < totalCells) {
            calendarGrid.push(null);
        }

        return calendarGrid;
    };

    const calendarGrid = getCalendarDays();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().split('T')[0];

    // Filter events for the side list (Upcoming from today onwards)
    const upcomingEvents = events
        .filter(e => e.date >= todayStr)
        .sort((a, b) => {
            if (a.date === b.date) return (a.time || '').localeCompare(b.time || '');
            return a.date.localeCompare(b.date);
        })
        .slice(0, 5);

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
                        onClick={() => setIsAddModalOpen(true)}
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
                                        {dayEvents.length > 0 && (
                                            <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">{dayEvents.length} items</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto mt-1 custom-scrollbar">
                                        {dayEvents.map(event => (
                                            <div 
                                                key={event.id} 
                                                className={`group px-2 py-1 text-[10px] rounded border-l-2 truncate font-medium cursor-pointer transition-all hover:opacity-100 opacity-90 relative
                                                ${event.type === 'Meeting' ? 'bg-indigo-900/30 text-indigo-300 border-indigo-500' : 
                                                  event.type === 'Call' ? 'bg-green-900/30 text-green-400 border-green-500' : 
                                                  event.type === 'Compliance' ? 'bg-red-900/30 text-red-400 border-red-500' :
                                                  'bg-slate-800 text-slate-300 border-slate-600'}`}
                                                title={event.title}
                                            >
                                                {event.time && event.time !== '00:00' ? <span className="opacity-75 mr-1">{event.time}</span> : ''}
                                                {event.title}
                                                
                                                <button 
                                                    onClick={(e) => handleDeleteEvent(event.id, e)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:block p-0.5 bg-slate-900/50 rounded hover:bg-slate-900 text-red-400"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        ))}
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
                            <Clock size={16} className="text-indigo-500" /> Upcoming
                        </h3>
                        <div className="space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No upcoming events scheduled.</p>
                            ) : upcomingEvents.map(event => (
                                <div key={event.id} className={`border-l-4 pl-3 py-1 relative group ${event.type === 'Meeting' ? 'border-indigo-500' : event.type === 'Call' ? 'border-green-500' : 'border-slate-600'}`}>
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-bold text-slate-200 line-clamp-1">{event.title}</p>
                                        <button 
                                            onClick={(e) => handleDeleteEvent(event.id, e)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1 font-medium text-slate-400">
                                            {event.date === todayStr ? 'Today' : new Date(event.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {event.type === 'Meeting' ? <MapPin size={12} /> : event.type === 'Call' ? <CheckSquare size={12} /> : <AlertCircle size={12} />} 
                                            {event.type}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                     
                     <div className="bg-orange-900/10 p-5 rounded-xl border border-orange-900/30">
                        <h3 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                            <AlertCircle size={16}/> Compliance Watch
                        </h3>
                        {events.filter(e => e.type === 'Compliance').slice(0, 3).map(c => (
                            <div key={c.id} className="text-xs text-orange-300 mb-2 pb-2 border-b border-orange-900/30 last:border-0 last:pb-0 last:mb-0">
                                <b>{c.title}</b> due on {c.date}.
                            </div>
                        ))}
                        {events.filter(e => e.type === 'Compliance').length === 0 && (
                            <p className="text-xs text-orange-700 opacity-70">No compliance alerts for this period.</p>
                        )}
                     </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-xl w-full max-w-md ring-1 ring-white/10 animate-fade-in border border-slate-800">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <CalendarIcon size={18} className="text-indigo-500" /> New Event
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                                <input 
                                    type="text"
                                    autoFocus
                                    className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                    placeholder="e.g. Client Review with John"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                                    <input 
                                        type="time"
                                        className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white [color-scheme:dark]"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-950 text-white"
                                    value={newEvent.type}
                                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                                >
                                    <option value="Meeting">Meeting</option>
                                    <option value="Call">Call</option>
                                    <option value="Task">Task</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Deadline">Deadline</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleCreateEvent}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Add to Calendar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
