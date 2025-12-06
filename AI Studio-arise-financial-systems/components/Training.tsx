
import React, { useState } from 'react';
import { MOCK_TRAINING } from '../services/mockData';
import { PlayCircle, CheckCircle, Award, X, Play, FileText, Clock, RotateCcw, Bot, BookOpen } from 'lucide-react';
import TheDojo from './TheDojo';

interface Course {
    id: string;
    title: string;
    duration: string;
    progress: number;
    category: string;
}

const Training: React.FC = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState<'MODULES' | 'DOJO'>('MODULES');

    // Local state to manage progress
    const [courses, setCourses] = useState<Course[]>(MOCK_TRAINING);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Derived stats
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const overallProgress = Math.round(courses.reduce((acc, curr) => acc + curr.progress, 0) / totalCourses);

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
                    <h2 className="text-2xl font-bold text-slate-800">Learning Center</h2>
                    <p className="text-slate-500 text-sm">Enhance your skills with training modules and AI roleplay.</p>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setActiveTab('MODULES')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            activeTab === 'MODULES' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:bg-gray-50'
                        }`}
                    >
                        <BookOpen size={16} /> Modules & Certs
                    </button>
                    <button
                        onClick={() => setActiveTab('DOJO')}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
                            activeTab === 'DOJO' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:bg-gray-50'
                        }`}
                    >
                        <Bot size={16} /> The Dojo
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: THE DOJO */}
            {activeTab === 'DOJO' && (
                <div className="flex-1 min-h-0 bg-slate-100 rounded-xl border border-gray-200 overflow-hidden">
                    <TheDojo />
                </div>
            )}

            {/* TAB CONTENT: MODULES */}
            {activeTab === 'MODULES' && (
                <div className="space-y-6 flex-1 overflow-y-auto">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-full">
                        <div className="text-right whitespace-nowrap">
                            <p className="text-xs text-gray-500 font-medium">Overall Progress</p>
                            <p className="text-lg font-bold text-indigo-600">{overallProgress}%</p>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                                style={{ width: `${overallProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {courses.map((course) => (
                            <div 
                                key={course.id} 
                                onClick={() => handleCourseClick(course)}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all group cursor-pointer relative top-0 hover:-top-1"
                            >
                                <div className="h-36 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                                    {/* Mock Thumbnail Background */}
                                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black"></div>
                                    
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10"></div>
                                    <PlayCircle size={48} className="text-white opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-200 z-20" />
                                    
                                    {course.progress === 100 && (
                                        <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-20">
                                            <CheckCircle size={16} strokeWidth={3} />
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-medium z-20 flex items-center gap-1">
                                        <Clock size={10} /> {course.duration}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block
                                        ${course.category === 'Product' ? 'bg-blue-50 text-blue-600' :
                                        course.category === 'Sales' ? 'bg-green-50 text-green-600' :
                                        course.category === 'Compliance' ? 'bg-red-50 text-red-600' :
                                        'bg-purple-50 text-purple-600'}`}>
                                        {course.category}
                                    </span>
                                    <h3 className="font-bold text-slate-800 mt-1 mb-2 line-clamp-2 h-10 text-sm leading-relaxed">{course.title}</h3>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full transition-all duration-500 ${course.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${course.progress}%`}}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>{course.progress === 100 ? 'Completed' : course.progress === 0 ? 'Not Started' : 'In Progress'}</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Certifications */}
                    <div className="mt-8 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Award className="text-yellow-500" /> Your Certifications
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm min-w-[240px]">
                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xl shadow-inner">🏆</div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">Top Producer 2023</p>
                                    <p className="text-xs text-gray-500">Issued Jan 2024</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm min-w-[240px]">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-inner">🎓</div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">IUL Master Class</p>
                                    <p className="text-xs text-gray-500">Issued Mar 2024</p>
                                </div>
                            </div>
                            {completedCourses === totalCourses && totalCourses > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-white border border-green-200 rounded-xl shadow-sm min-w-[240px] animate-fade-in">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl shadow-inner">🌟</div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Agency All-Star</p>
                                        <p className="text-xs text-gray-500">Issued Just Now</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Course Player Modal */}
            {selectedCourse && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Video Player Area */}
                        <div className="aspect-video bg-black relative group flex items-center justify-center">
                            {!isPlaying ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    <button 
                                        onClick={() => setIsPlaying(true)}
                                        className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:scale-110 hover:bg-white/30 transition-all shadow-2xl z-20 group-hover:shadow-indigo-500/50"
                                    >
                                        <Play size={40} fill="currentColor" className="ml-1" />
                                    </button>
                                    <div className="absolute bottom-6 left-6 right-6 z-20">
                                        <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-1 rounded mb-2 inline-block">
                                            {selectedCourse.category} Module
                                        </span>
                                        <h2 className="text-2xl font-bold text-white shadow-sm">{selectedCourse.title}</h2>
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
                        <div className="p-6 bg-white flex flex-col md:flex-row gap-6 h-full overflow-y-auto">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg text-slate-800">Course Description</h3>
                                    <div className="flex gap-2">
                                        <button className="text-slate-400 hover:text-indigo-600 p-1">
                                            <FileText size={18} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    In this comprehensive training module, we will cover the essential strategies for success in the <b>{selectedCourse.category}</b> domain. 
                                    Mastering these concepts is crucial for your growth as an agent. This session includes real-world scenarios, compliance checks, and actionable sales scripts.
                                </p>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Key Takeaways</h4>
                                    <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                                        <li>Understanding core policy mechanics</li>
                                        <li>Client needs analysis framework</li>
                                        <li>Compliance and ethical standards</li>
                                        <li>Closing techniques for modern agents</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="w-full md:w-72 space-y-4 border-l border-gray-100 pl-0 md:pl-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-700">Your Progress</span>
                                        <span className="text-xs font-bold text-indigo-600">{selectedCourse.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{width: `${selectedCourse.progress}%`}}></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {selectedCourse.progress === 100 ? (
                                        <button 
                                            disabled
                                            className="w-full py-3 bg-green-100 text-green-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-default"
                                        >
                                            <CheckCircle size={18} /> Completed
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleCompleteCourse}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                                        >
                                            Mark as Complete
                                        </button>
                                    )}
                                    
                                    {selectedCourse.progress > 0 && (
                                        <button 
                                            onClick={handleResetCourse}
                                            className="w-full py-2 text-gray-400 hover:text-red-500 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
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
