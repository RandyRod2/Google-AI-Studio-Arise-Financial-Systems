
import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User as UserIcon, Loader2, Sparkles, PlayCircle } from 'lucide-react';
import { MOCK_USERS } from '../services/mockData';
import { User } from '../types';
import { AriseLogo } from './AriseLogo';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Sign In State
    const [email, setEmail] = useState('randy@arise.com');
    const [password, setPassword] = useState('password');

    // Sign Up State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            const normalizedEmail = email.trim().toLowerCase();
            
            try {
                const savedUsersStr = localStorage.getItem('arise_users_overrides');
                if (savedUsersStr) {
                    const savedUsers = JSON.parse(savedUsersStr);
                    if (savedUsers[normalizedEmail]) {
                        onLogin(savedUsers[normalizedEmail]);
                        return;
                    }
                }
            } catch (e) {
                console.error("Error reading saved user data", e);
            }

            const user = MOCK_USERS.find(u => 
                u.email.toLowerCase() === normalizedEmail || 
                (normalizedEmail === 'alex@arise.com' && u.role === 'ADMIN')
            );

            if (user) {
                onLogin(user);
            } else {
                setError('Invalid email or password.');
                setIsLoading(false);
            }
        }, 800);
    };

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!newName || !newEmail || !newPassword) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            const newUser: User = {
                id: `u-${Date.now()}`,
                name: newName,
                email: newEmail,
                role: 'AGENT',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=random`
            };
            onLogin(newUser);
        }, 800);
    };

    const handleDemoLogin = () => {
        setIsDemoLoading(true);
        setTimeout(() => {
            const demoUser: User = {
                id: 'demo-admin',
                name: 'Demo Admin',
                email: 'demo@arise.com',
                role: 'AGENCY_OWNER', 
                avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Admin&background=0D9488&color=fff'
            };
            onLogin(demoUser);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[128px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[128px]"></div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-14 h-14 flex items-center justify-center">
                            <AriseLogo className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        </div>
                        <div className="text-center pt-1">
                            <h1 className="text-3xl font-bold text-white leading-none tracking-tight">
                                ARISE
                            </h1>
                            <p className="text-xs text-indigo-400 font-bold tracking-[0.2em] mt-1 uppercase">
                                Operating System
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden relative">
                        {/* Tabs */}
                        <div className="grid grid-cols-2 border-b border-slate-800">
                            <button 
                                onClick={() => { setActiveTab('signin'); setError(''); }}
                                className={`py-4 text-sm font-bold transition-all ${activeTab === 'signin' ? 'text-indigo-400 bg-slate-800/50 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => { setActiveTab('signup'); setError(''); }}
                                className={`py-4 text-sm font-bold transition-all ${activeTab === 'signup' ? 'text-indigo-400 bg-slate-800/50 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    {activeTab === 'signin' 
                                        ? 'Enter credentials to access your terminal.' 
                                        : 'Initialize a new agent profile.'}
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-900/20 text-red-400 text-xs rounded-lg font-medium text-center border border-red-900/50">
                                    {error}
                                </div>
                            )}

                            {activeTab === 'signin' ? (
                                <form onSubmit={handleSignIn} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-600"
                                                placeholder="agent@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                type="password"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-600"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || isDemoLoading}
                                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Authenticate'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-600"
                                                placeholder="John Doe"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-600"
                                                placeholder="agent@example.com"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                            <input
                                                type="password"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-slate-600"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || isDemoLoading}
                                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Initialize Account'}
                                    </button>
                                </form>
                            )}

                            <div className="mt-6 mb-2 text-center">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    Powered By ARISE Financial Systems™
                                </p>
                            </div>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-slate-900 text-slate-500">or explore the system</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleDemoLogin}
                                disabled={isLoading || isDemoLoading}
                                className="w-full bg-slate-800/50 border border-slate-700 text-indigo-400 font-bold py-3 rounded-xl hover:bg-slate-800 hover:border-indigo-500/50 hover:text-white transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                {isDemoLoading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Sparkles size={18} className="text-indigo-500 animate-pulse" />
                                        Launch Interactive Demo
                                        <PlayCircle size={18} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 text-center z-10 shrink-0">
                <p className="text-white font-bold text-xs uppercase tracking-wider">
                    © 2026 ARISE Financial Systems. All Rights Reserved. Secure Connection.
                </p>
            </div>
        </div>
    );
};

export default Login;
