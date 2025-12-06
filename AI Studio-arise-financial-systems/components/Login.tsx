
import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Mail, User as UserIcon, Loader2, Sparkles, PlayCircle } from 'lucide-react';
import { MOCK_USERS } from '../services/mockData';
import { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Sign In State - Default to updated admin email
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
            const normalizedEmail = email.toLowerCase();
            
            // 1. Check for persisted overrides (Saved in Settings)
            try {
                const savedUsers = JSON.parse(localStorage.getItem('arise_users_overrides') || '{}');
                if (savedUsers[normalizedEmail]) {
                    onLogin(savedUsers[normalizedEmail]);
                    return;
                }
            } catch (e) {
                console.error("Error reading saved user data", e);
            }

            // 2. Fallback to Mock Data
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
            // Simulate account creation for demo
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
                role: 'AGENCY_OWNER', // Give high privileges to show all features
                avatarUrl: 'https://ui-avatars.com/api/?name=Demo+Admin&background=0D9488&color=fff'
            };
            onLogin(demoUser);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Shield className="text-white h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-900">
                            ARISE
                        </h1>
                        <p className="text-sm text-slate-500 font-medium tracking-wide">
                            FINANCIAL SYSTEMS
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden relative">
                    {/* Tabs */}
                    <div className="grid grid-cols-2 border-b border-gray-100">
                        <button 
                            onClick={() => { setActiveTab('signin'); setError(''); }}
                            className={`py-3 text-sm font-medium transition-colors ${activeTab === 'signin' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => { setActiveTab('signup'); setError(''); }}
                            className={`py-3 text-sm font-medium transition-colors ${activeTab === 'signup' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-800">
                                {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {activeTab === 'signin' 
                                    ? 'Enter your credentials to access your dashboard' 
                                    : 'Sign up to start tracking your book of business'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        {activeTab === 'signin' ? (
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900"
                                            placeholder="agent@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || isDemoLoading}
                                    className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900"
                                            placeholder="John Doe"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900"
                                            placeholder="agent@example.com"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900"
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
                                    className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign Up'}
                                </button>
                            </form>
                        )}

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-white text-slate-400">or explore the platform</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleDemoLogin}
                            disabled={isLoading || isDemoLoading}
                            className="w-full bg-teal-50 border border-teal-200 text-teal-700 font-bold py-3 rounded-xl hover:bg-teal-100 hover:border-teal-300 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            {isDemoLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Sparkles size={18} className="text-teal-600 animate-pulse" />
                                    Launch Interactive Demo
                                    <PlayCircle size={18} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-slate-400">
                    &copy; 2026 ARISE Financial Systems. Secure Agent Portal.
                </p>
            </div>
        </div>
    );
};

export default Login;
