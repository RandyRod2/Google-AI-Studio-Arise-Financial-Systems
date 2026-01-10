
import React, { useState, useEffect } from 'react';
import { MOCK_TRAINING } from '../services/mockData';
import { PlayCircle, CheckCircle, Award, X, Play, FileText, Clock, RotateCcw, Bot, BookOpen, Calendar, Users, ChevronRight, Zap } from 'lucide-react';
import TheDojo from './TheDojo';
import { CalendarEvent, ViewState } from '../types';

interface Course {
    id: string;
    title: string;
    duration: string;
    progress: number;
    category: string;
}

interface TrainingProps {
    onNavigate: (view: ViewState) => void;
}

const Training: React.FC<TrainingProps> = ({ onNavigate }) => {
    // Tab state
    const [activeTab, setActiveTab] = useState<'MODULES' | 'DOJO'>('MODULES');

    // Local state to manage progress
    const [courses, setCourses] = useState<Course[]>(MOCK_TRAINING);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Live Schedule state from Calendar storage
    const [liveEvents, setLiveEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        const savedEvents = localStorage.getItem('arise_calendar_events');
        if (savedEvents) {
            const parsed: CalendarEvent[] = JSON.parse(savedEvents);
            const today = new Date().toISOString().split('T')[0];
            const globalTrainings = parsed
                .filter(e => e.isGlobal && e.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 3);
            setLiveEvents(globalTrainings);
        }
    }, [activeTab]);

    // Derived stats
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const overallProgress = Math.round(courses.reduce((acc, curr) => acc + curr.progress, 0) / (totalCourses || 1));

    const handleCourseClick = (course: Course) => {
        setSelectedCourse(course);
        setIsPlaying(false);
    };

    const handleCompleteCourse = () => {
        if (selectedCourse) {
            setCourses(courses.map(c => 
                c.id === selectedCourse.id ? { ...c, progress: 100 } : c
            ));
            setSelectedCourse(null);
        }
    };

    const handleResetCourse = () => {
        if (selectedCourse) {
            setCourses(courses.map(c => 
                c.id === selectedCourse.id ? { ...c, progress: 0 } : c
            ));
        }
    };

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-white">ARISE University</h2>
                    <p className="text-slate-400 text-sm">Enhance your skills with training modules and AI roleplay.</p>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-sm">
                    <button
                        onClick={() => setActiveTab('MODULES')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            activeTab === 'MODULES' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <BookOpen size={16} /> Modules & Certs
                    </button>
                    <button
                        onClick={() => setActiveTab('DOJO')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            activeTab === 'DOJO' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <Bot size={16} /> ARISE Dojo
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: THE DOJO */}
            {activeTab === 'DOJO' && (
                <div className="flex-1 min-h-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <TheDojo />
                </div>
            )}

            {/* TAB CONTENT: MODULES */}
            {activeTab === 'MODULES' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
                    <div className="lg:col-span-3 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-white/5 shadow-sm w-full">
                            <div className="text-right whitespace-nowrap">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Overall Progress</p>
                                <p className="text-lg font-black text-indigo-400">{overallProgress}%</p>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                                    style={{ width: `${overallProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Course Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div 
                                    key={course.id} 
                                    onClick={() => handleCourseClick(course)}
                                    className="bg-slate-900 rounded-xl border border-white/5 shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-500/30 transition-all group cursor-pointer relative top-0 hover:-top-1"
                                >
                                    <div className="h-32 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-black"></div>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10"></div>
                                        <PlayCircle size={40} className="text-white opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-200 z-20" />
                                        {course.progress === 100 && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg z-20">
                                                <CheckCircle size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded font-bold z-20 flex items-center gap-1 uppercase tracking-tighter">
                                            <Clock size={10} /> {course.duration}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md mb-2 inline-block
                                            ${course.category === 'Product' ? 'bg-blue-500/10 text-blue-400' :
                                            course.category === 'Sales' ? 'bg-green-500/10 text-green-400' :
                                            course.category === 'Compliance' ? 'bg-red-500/10 text-red-400' :
                                            'bg-purple-500/10 text-purple-400'}`}>
                                            {course.category}
                                        </span>
                                        <h3 className="font-bold text-white mt-1 mb-3 line-clamp-2 h-10 text-sm leading-tight uppercase tracking-tight">{course.title}</h3>
                                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-2">
                                            <div className={`h-full transition-all duration-500 ${course.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${course.progress}%`}}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span>{course.progress === 100 ? 'Ready' : 'Progress'}</span>
                                            <span className={course.progress === 100 ? 'text-green-500' : 'text-slate-400'}>{course.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Certifications */}
                        <div className="bg-indigo-900/10 rounded-2xl p-6 border border-indigo-500/20">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Award className="text-yellow-500" /> Professional Credentials
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-4 bg-slate-900 border border-white/5 rounded-xl shadow-sm">
                                    <div className="w-12 h-12 bg-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center text-2xl border border-yellow-500/20">🏆</div>
                                    <div>
                                        <p className="font-black text-white text-sm uppercase tracking-tight">Top Producer 2023</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jan 2024 • Verified</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-900 border border-white/5 rounded-xl shadow-sm">
                                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center text-2xl border border-blue-500/20">🎓</div>
                                    <div>
                                        <p className="font-black text-white text-sm uppercase tracking-tight">IUL Master Class</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mar 2024 • Certified</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Live Schedule */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col h-auto">
                            <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest mb-6">
                                <Users size={16} className="text-indigo-400" /> Live Team Schedule
                            </h3>
                            
                            <div className="space-y-4">
                                {liveEvents.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500">
                                        <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No Live Sessions</p>
                                    </div>
                                ) : liveEvents.map(event => (
                                    <div key={event.id} className="bg-slate-950 p-4 rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                                <Zap size={10} className="animate-pulse" /> LIVE WEBINAR
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-600">{event.date}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-200 leading-tight mb-2">{event.title}</h4>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-slate-500" />
                                                <span className="text-[10px] font-bold text-slate-400">{event.time || 'TBD'}</span>
                                            </div>
                                            <button 
                                                onClick={() => onNavigate('CALENDAR')}
                                                className="p-1.5 bg-indigo-600 rounded-lg text-white hover:scale-105 transition-transform"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => onNavigate('CALENDAR')}
                                className="w-full mt-6 py-2 border border-dashed border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500/30 hover:text-indigo-400 transition-all"
                            >
                                View Full Calendar
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-2xl p-6 border border-indigo-500/20">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Study Hall</h4>
                            <p className="text-xs text-indigo-200 leading-relaxed opacity-80">
                                "Champions aren't made in the ring, they are merely recognized there. Your study time is where the paycheck is signed."
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Course Player Modal */}
            {selectedCourse && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-800">
                        {/* Video Player Area */}
                        <div className="aspect-video bg-black relative group flex items-center justify-center">
                            {!isPlaying ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    <button 
                                        onClick={() => setIsPlaying(true)}
                                        className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 hover:bg-white/20 transition-all shadow-2xl z-20 group-hover:shadow-indigo-500/50"
                                    >
                                        <Play size={40} fill="currentColor" className="ml-1" />
                                    </button>
                                    <div className="absolute bottom-6 left-6 right-6 z-20">
                                        <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-1 rounded mb-2 inline-block uppercase tracking-widest">
                                            {selectedCourse.category} Module
                                        </span>
                                        <h2 className="text-2xl font-black text-white shadow-sm uppercase tracking-tight">{selectedCourse.title}</h2>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-medium animate-pulse">Loading secure stream...</p>
                                </div>
                            )}
                            <button 
                                onClick={() => setSelectedCourse(null)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all z-30"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 bg-slate-900 flex flex-col md:flex-row gap-6 h-full overflow-y-auto">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-white">Course Description</h3>
                                    <div className="flex gap-2">
                                        <button className="text-slate-400 hover:text-indigo-400 p-1">
                                            <FileText size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    In this comprehensive training module, we will cover the essential strategies for success in the <b>{selectedCourse.category}</b> domain. 
                                    Mastering these concepts is crucial for your growth as an agent. This session includes real-world scenarios, compliance checks, and actionable sales scripts.
                                </p>
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase">Key Takeaways</h4>
                                    <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                                        <li>Understanding core policy mechanics</li>
                                        <li>Client needs analysis framework</li>
                                        <li>Compliance and ethical standards</li>
                                        <li>Closing techniques for modern agents</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="w-full md:w-72 space-y-4 border-l border-slate-800 pl-0 md:pl-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-300">Your Progress</span>
                                        <span className="text-xs font-bold text-indigo-400">{selectedCourse.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{width: `${selectedCourse.progress}%`}}></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {selectedCourse.progress === 100 ? (
                                        <button 
                                            disabled
                                            className="w-full py-3 bg-green-900/30 text-green-400 border border-green-500/30 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-default"
                                        >
                                            <CheckCircle size={18} /> Completed
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleCompleteCourse}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-900/50 transition-all active:scale-95"
                                        >
                                            Mark as Complete
                                        </button>
                                    )}
                                    
                                    {selectedCourse.progress > 0 && (
                                        <button 
                                            onClick={handleResetCourse}
                                            className="w-full py-2 text-slate-500 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <RotateCcw size={12} /> Reset Progress
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Training;
