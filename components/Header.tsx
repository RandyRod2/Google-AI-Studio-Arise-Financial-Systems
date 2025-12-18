
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, LogOut, Settings, User, ChevronDown, CheckCircle2, AlertCircle, Info, Search, X, Trash2 } from 'lucide-react';
import { User as UserType, ViewState } from '../types';

interface HeaderProps {
    user: UserType;
    activeView: ViewState;
    onLogout: () => void;
    onToggleSidebar: () => void;
    onNavigate: (view: ViewState) => void;
}

const INITIAL_NOTIFICATIONS = [
    { id: 1, text: "New lead assigned: John Doe", time: "2m ago", type: 'info', read: false },
    { id: 2, text: "Policy for Sarah Connor issued", time: "1h ago", type: 'success', read: false },
    { id: 3, text: "License expiring in 30 days", time: "1d ago", type: 'warning', read: false },
];

export const Header: React.FC<HeaderProps> = ({ user, activeView, onLogout, onToggleSidebar, onNavigate }) => {
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifMenuRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserOpen(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleDismiss = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleNotificationClick = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const getViewTitle = (view: ViewState) => {
        switch (view) {
            case 'DASHBOARD': return 'My Dashboard';
            case 'MANAGER_DASHBOARD': return 'Manager Hub';
            case 'PLATFORM_ADMIN': return 'Platform Admin';
            default: 
                return view.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    return (
        <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/5 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
            {/* Left: Mobile Menu & Title */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onToggleSidebar} 
                    className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-xl font-bold text-white tracking-tight text-shadow-sm">
                    {getViewTitle(activeView)}
                </h1>
            </div>

            {/* Spacer to push right elements */}
            <div className="flex-1"></div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2 lg:gap-4">
                
                {/* Notifications */}
                <div className="relative" ref={notifMenuRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                {/* Optional: Count number inside if larger */}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in origin-top-right ring-1 ring-white/10">
                            <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[10px] font-bold bg-indigo-500 text-white px-1.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-slate-500">
                                        No new notifications.
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleNotificationClick(notif.id)}
                                            className={`p-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex gap-3 transition-colors cursor-pointer group relative ${!notif.read ? 'bg-indigo-500/5' : ''}`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 ${
                                                notif.type === 'success' ? 'text-green-500' : 
                                                notif.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                                            }`}>
                                                {notif.type === 'success' ? <CheckCircle2 size={16} /> : 
                                                 notif.type === 'warning' ? <AlertCircle size={16} /> : <Info size={16} />}
                                            </div>
                                            <div className="flex-1 pr-6">
                                                <p className={`text-sm font-medium leading-tight ${!notif.read ? 'text-white' : 'text-slate-400'}`}>
                                                    {notif.text}
                                                </p>
                                                <p className="text-xs text-slate-600 mt-1">{notif.time}</p>
                                            </div>
                                            {!notif.read && (
                                                <div className="absolute right-3 top-4 w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            )}
                                            <button 
                                                onClick={(e) => handleDismiss(notif.id, e)}
                                                className="absolute right-2 top-2 p-1 text-slate-600 hover:text-slate-300 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                title="Dismiss"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-white/5 text-center bg-white/5">
                                <button onClick={() => { onNavigate('TASKS'); setIsNotifOpen(false); }} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">View My Task</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

                {/* User Profile */}
                <div className="relative" ref={userMenuRef}>
                    <button 
                        onClick={() => setIsUserOpen(!isUserOpen)}
                        className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded-lg transition-colors group"
                    >
                        <img 
                            src={user.avatarUrl} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-indigo-500 transition-colors" 
                        />
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-bold text-slate-200 leading-none group-hover:text-white">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5 group-hover:text-indigo-400 transition-colors">
                                {user.role.replace('_', ' ')}
                            </p>
                        </div>
                        <ChevronDown size={14} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </button>

                    {isUserOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in origin-top-right ring-1 ring-white/10">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <p className="text-sm font-bold text-white">Signed in as</p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            </div>
                            <div className="p-1">
                                <button 
                                    onClick={() => { onNavigate('SETTINGS'); setIsUserOpen(false); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                >
                                    <Settings size={16} /> Profile Settings
                                </button>
                            </div>
                            <div className="border-t border-white/5 p-1">
                                <button 
                                    onClick={onLogout}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
