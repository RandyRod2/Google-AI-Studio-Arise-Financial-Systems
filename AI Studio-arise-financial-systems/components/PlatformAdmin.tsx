
import React, { useState, useMemo, useEffect } from 'react';
import { generateSaaSUsers } from '../services/mockData';
import { SaaSUser, Role, SubscriptionStatus, SubscriptionPlan } from '../types';
import { Search, Filter, MoreHorizontal, Shield, CreditCard, User, AlertCircle, TrendingUp, Users, DollarSign, Ban, CheckCircle, ChevronLeft, ChevronRight, Briefcase, X, Save, Mail, Building, Edit2, AlertTriangle, ArrowRight, Lock, Activity, Key, LogIn, Clock, Server, Database } from 'lucide-react';

const PlatformAdmin: React.FC = () => {
    // 1. Initialize Large Dataset (Simulating API fetch)
    const [users, setUsers] = useState<SaaSUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<SaaSUser | null>(null);
    const [editForm, setEditForm] = useState<Partial<SaaSUser>>({});

    // Mock Audit Log Data
    const [auditLog] = useState([
        { id: 1, action: 'Plan Upgrade', user: 'Sarah Connor', details: 'Upgraded to Enterprise', time: '2 mins ago', type: 'success' },
        { id: 2, action: 'Payment Failed', user: 'James Richardson', details: 'Card ending 4242 declined', time: '15 mins ago', type: 'error' },
        { id: 3, action: 'User Login', user: 'Randy Rodriguez', details: 'Successful login from IP 192.168.1.1', time: '1 hour ago', type: 'info' },
        { id: 4, action: 'New Subscription', user: 'Emily Chen', details: 'Started Professional Trial', time: '3 hours ago', type: 'success' },
        { id: 5, action: 'Password Reset', user: 'System Admin', details: 'Reset password for user #492', time: '5 hours ago', type: 'warning' },
    ]);

    useEffect(() => {
        // Simulate network delay for realism
        setTimeout(() => {
            setUsers(generateSaaSUsers(1250));
            setIsLoading(false);
        }, 800);
    }, []);

    // 2. Table State
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Reduced for cleaner look with the log below

    // 3. Derived Stats (Dynamic based on total user base)
    const stats = useMemo(() => {
        const totalMRR = users.reduce((sum, u) => sum + (u.status === 'active' ? u.monthlyFee : 0), 0);
        const activeUsers = users.filter(u => u.status === 'active').length;
        const pastDueUsers = users.filter(u => u.status === 'past_due').length;
        const cancelledUsers = users.filter(u => u.status === 'cancelled').length;
        const churnRate = users.length > 0 ? (cancelledUsers / users.length * 100).toFixed(1) : 0;

        return { totalMRR, activeUsers, pastDueUsers, churnRate };
    }, [users]);

    // 4. Filtering Logic
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.agencyName && user.agencyName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    // 5. Pagination Logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 6. Actions
    const openEditModal = (user: SaaSUser) => {
        setEditingUser(user);
        setEditForm({ ...user });
    };

    const handleSaveUser = () => {
        if (editingUser && editForm) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editForm } as SaaSUser : u));
            setEditingUser(null);
        }
    };

    const handleImpersonate = () => {
        alert(`Simulating login as ${editingUser?.name}. In a real app, this would switch your session.`);
    };

    const handleResetPassword = () => {
        alert(`Password reset email sent to ${editingUser?.email}.`);
    };

    // Quick Filter Action
    const applyQuickFilter = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1); // Reset to page 1 to ensure results are visible
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p>Loading Platform Data...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="text-indigo-600" /> Platform Administration
                    </h2>
                    <p className="text-slate-500 text-sm">Super Admin Console • Managing {users.length.toLocaleString()} total users</p>
                </div>
                <div className="flex gap-3">
                     <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-green-200 shadow-sm">
                        <div className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </div>
                        <span className="text-xs font-bold text-green-700">System Operational</span>
                     </div>
                     <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                         Export Data
                     </button>
                </div>
            </div>

            {/* Payment Failure Alert Banner */}
            {stats.pastDueUsers > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full text-red-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900">Payment Failures Detected</h3>
                            <p className="text-sm text-red-700">
                                There are <span className="font-bold">{stats.pastDueUsers}</span> accounts with failed payments this cycle. Immediate action required.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => applyQuickFilter('past_due')}
                        className="px-4 py-2 bg-white border border-red-200 text-red-700 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                        Review Failed Accounts <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={48} className="text-indigo-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total MRR</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">${stats.totalMRR.toLocaleString()}</h3>
                    <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
                        <TrendingUp size={12} className="mr-1" /> +8.4% this month
                    </p>
                </div>

                {/* Interactive Card: Active Subscribers */}
                <div 
                    onClick={() => applyQuickFilter('active')}
                    className={`bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]
                        ${statusFilter === 'active' ? 'border-l-4 border-l-blue-600 ring-1 ring-blue-100' : 'border-gray-100 hover:shadow-md'}`}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={48} className="text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Active Subscribers</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.activeUsers.toLocaleString()}</h3>
                    <p className="text-xs text-blue-600 mt-2 font-medium flex items-center">
                        Click to filter view <ChevronRight size={12} />
                    </p>
                </div>

                {/* Interactive Card: Past Due */}
                <div 
                    onClick={() => applyQuickFilter('past_due')}
                    className={`bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]
                        ${statusFilter === 'past_due' ? 'border-l-4 border-l-orange-500 ring-1 ring-orange-100' : 'border-gray-100 hover:shadow-md'}`}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={48} className="text-orange-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Past Due Accounts</p>
                    <h3 className="text-3xl font-bold text-orange-600 mt-1">{stats.pastDueUsers}</h3>
                    <p className="text-xs text-orange-600 mt-2 font-medium flex items-center">
                        ${(stats.pastDueUsers * 99).toLocaleString()} at risk <ChevronRight size={12} />
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ban size={48} className="text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Churn Rate</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.churnRate}%</h3>
                    <p className="text-xs text-gray-400 mt-2">
                        Industry Avg: 5.2%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main User Table Section */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search users & agencies..." 
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-none">
                                <select 
                                    className="w-full md:w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white cursor-pointer"
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="AGENCY_OWNER">Owner</option>
                                    <option value="AGENT">Agent</option>
                                </select>
                            </div>
                             <div className="relative flex-1 md:flex-none">
                                <select 
                                    className="w-full md:w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="past_due">Past Due</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            {(statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
                                <button 
                                    onClick={() => { setStatusFilter('ALL'); setRoleFilter('ALL'); setCurrentPage(1); }}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Clear Filters"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Billing</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                            No users found matching current filters.
                                        </td>
                                    </tr>
                                ) : paginatedUsers.map((user) => (
                                    <tr 
                                        key={user.id} 
                                        onClick={() => openEditModal(user)}
                                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} alt="" className="w-9 h-9 rounded-full bg-gray-200 object-cover" />
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                    {user.agencyName && <div className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5"><Briefcase size={10} /> {user.agencyName}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold uppercase tracking-wide 
                                                ${user.role === 'ADMIN' ? 'text-purple-600' : 
                                                  user.role === 'AGENCY_OWNER' ? 'text-slate-800' : 
                                                  user.role === 'MANAGER' ? 'text-indigo-600' : 'text-blue-600'}`}>
                                                {user.role === 'ADMIN' ? 'Super Admin' : user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                                ${user.status === 'active' ? 'bg-green-100 text-green-700' : 
                                                  user.status === 'past_due' ? 'bg-orange-100 text-orange-700' : 
                                                  user.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                                  'bg-gray-100 text-gray-500'}`}>
                                                {user.status === 'active' && <CheckCircle size={10} />}
                                                {user.status === 'past_due' && <AlertCircle size={10} />}
                                                {user.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-800">${user.monthlyFee}</div>
                                            <div className="text-[10px] text-gray-500 capitalize">{user.plan}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(user);
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2" 
                                                    title="Manage User"
                                                >
                                                    <span className="text-xs font-bold">Manage</span> <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            Showing <span className="font-bold text-slate-700">{filteredUsers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-slate-700">{filteredUsers.length}</span>
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-white border border-gray-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 bg-white border border-gray-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar: System Health & Audit Log */}
                <div className="space-y-6">
                    {/* System Health Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Activity size={16} className="text-indigo-600" /> System Health
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 flex items-center gap-2"><Server size={12}/> API Gateway</span>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 99.9% Up</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 flex items-center gap-2"><Database size={12}/> Database</span>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Healthy</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 flex items-center gap-2"><CreditCard size={12}/> Stripe Connect</span>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Connected</span>
                            </div>
                        </div>
                    </div>

                    {/* Audit Log */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Clock size={16} className="text-indigo-600" /> Recent Activity
                            </h3>
                            <button className="text-xs text-indigo-600 hover:underline">View All</button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {auditLog.map((log) => (
                                <div key={log.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            log.type === 'success' ? 'bg-green-100 text-green-700' : 
                                            log.type === 'error' ? 'bg-red-100 text-red-700' : 
                                            log.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.action}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{log.time}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800">{log.user}</p>
                                    <p className="text-xs text-gray-500">{log.details}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-200/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Edit2 size={18} className="text-indigo-600" /> Manage User
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto bg-white">
                            <div className="flex items-center gap-4 mb-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
                                <img src={editingUser.avatarUrl} className="w-16 h-16 rounded-full border-2 border-white shadow-sm" alt="Profile" />
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{editingUser.name}</h4>
                                    <p className="text-xs text-gray-500">{editingUser.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={handleImpersonate}
                                            className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                        >
                                            <LogIn size={10} /> Login As
                                        </button>
                                        <button 
                                            onClick={handleResetPassword}
                                            className="text-[10px] bg-white border border-gray-300 text-slate-600 px-2 py-1 rounded font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                                        >
                                            <Key size={10} /> Reset Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                            value={editForm.name || ''}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agency Name</label>
                                    <div className="relative">
                                        <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                            value={editForm.agencyName || ''}
                                            onChange={(e) => setEditForm({...editForm, agencyName: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="email" 
                                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editForm.email || ''}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Platform Role</label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select 
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({...editForm, role: e.target.value as Role})}
                                            disabled={editingUser.role === 'ADMIN' && editingUser.id === 'u1'} // Protect main admin
                                        >
                                            <option value="ADMIN">Super Admin</option>
                                            <option value="AGENCY_OWNER">Agency Owner</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="AGENT">Agent</option>
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Changing role updates permission levels immediately.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subscription Plan</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                        value={editForm.plan}
                                        onChange={(e) => setEditForm({...editForm, plan: e.target.value as SubscriptionPlan})}
                                    >
                                        <option value="starter">Starter</option>
                                        <option value="professional">Professional</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Status</label>
                                    <select 
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold
                                            ${editForm.status === 'active' ? 'text-green-700 border-green-200 bg-green-50' : 
                                              editForm.status === 'past_due' ? 'text-orange-700 border-orange-200 bg-orange-50' : 
                                              'text-gray-700 border-gray-200 bg-white'}`}
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({...editForm, status: e.target.value as SubscriptionStatus})}
                                    >
                                        <option value="active">Active</option>
                                        <option value="past_due">Suspended (Past Due)</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="trial">Trial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Fee ($)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                                    value={editForm.monthlyFee}
                                    onChange={(e) => setEditForm({...editForm, monthlyFee: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-100 rounded-b-xl flex gap-3 shrink-0">
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveUser}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformAdmin;
