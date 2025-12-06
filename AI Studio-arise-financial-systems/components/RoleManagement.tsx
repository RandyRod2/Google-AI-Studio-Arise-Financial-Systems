
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { Shield, Check, Search, MoreHorizontal, Lock, Users, AlertCircle, Edit2, Trash2, X, Save, User as UserIcon, Layers, Settings, Eye } from 'lucide-react';
import { Role, User } from '../types';

interface RoleManagementProps {
    currentUser: User;
}

// Define available permissions and their categories
const PERMISSION_CATEGORIES = {
    CRM: [
        { id: 'view_all_clients', label: 'View All Clients (Global)' },
        { id: 'edit_clients', label: 'Edit Client Profiles' },
        { id: 'delete_clients', label: 'Delete Clients' },
        { id: 'export_data', label: 'Export CRM Data' },
    ],
    Financials: [
        { id: 'view_personal_fin', label: 'View Personal Revenue' },
        { id: 'view_team_fin', label: 'View Team Revenue & Overrides' },
        { id: 'manage_expenses', label: 'Manage Expenses' },
        { id: 'view_agency_pnl', label: 'View Agency P&L' },
    ],
    Team: [
        { id: 'view_roster', label: 'View Team Roster' },
        { id: 'recruit_manage', label: 'Manage Recruits' },
        { id: 'edit_roles', label: 'Assign Roles' },
        { id: 'view_performance', label: 'View Performance Reports' },
    ],
    System: [
        { id: 'access_settings', label: 'Access Global Settings' },
        { id: 'view_audit_log', label: 'View Security Audit Logs' },
        { id: 'manage_billing', label: 'Manage SaaS Billing' },
    ]
};

// Initial state for the matrix
const INITIAL_ROLE_PERMISSIONS: Record<Role, string[]> = {
    ADMIN: ['view_all_clients', 'edit_clients', 'delete_clients', 'export_data', 'view_personal_fin', 'view_team_fin', 'manage_expenses', 'view_agency_pnl', 'view_roster', 'recruit_manage', 'edit_roles', 'view_performance', 'access_settings', 'view_audit_log', 'manage_billing'],
    AGENCY_OWNER: ['view_all_clients', 'edit_clients', 'delete_clients', 'export_data', 'view_personal_fin', 'view_team_fin', 'manage_expenses', 'view_agency_pnl', 'view_roster', 'recruit_manage', 'edit_roles', 'view_performance', 'access_settings', 'manage_billing'],
    MANAGER: ['view_all_clients', 'edit_clients', 'export_data', 'view_personal_fin', 'view_team_fin', 'view_roster', 'recruit_manage', 'view_performance'],
    AGENT: ['edit_clients', 'view_personal_fin'],
    RECRUIT: ['view_personal_fin']
};

const RoleManagement: React.FC<RoleManagementProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'USERS' | 'PERMISSIONS'>('USERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState(MOCK_TEAM);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // Permission State
    const [rolePermissions, setRolePermissions] = useState(INITIAL_ROLE_PERMISSIONS);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Action Menu State
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    
    // Edit Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role>('AGENT');

    // Click outside to close menu
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setSelectedRole(user.role);
        setMenuOpenId(null);
    };

    const handleSaveRole = () => {
        if (!editingUser) return;

        // Prevent self-demotion check
        if (currentUser.name === editingUser.name && selectedRole !== 'ADMIN') {
             alert("You cannot demote your own account from the admin panel.");
             return;
        }

        setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u));
        
        // Show success feedback
        const roleDisplay = selectedRole === 'ADMIN' ? 'Super Admin' : selectedRole;
        setToastMessage(`Updated ${editingUser.name}'s role to ${roleDisplay}`);
        setTimeout(() => setToastMessage(null), 3000);
        
        setEditingUser(null);
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm("Are you sure you want to remove this user from the organization?")) {
            setUsers(users.filter(u => u.id !== userId));
            setMenuOpenId(null);
            setToastMessage("User removed successfully");
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const togglePermission = (role: Role, permissionId: string) => {
        setRolePermissions(prev => {
            const currentPerms = prev[role];
            const hasPerm = currentPerms.includes(permissionId);
            const newPerms = hasPerm 
                ? currentPerms.filter(p => p !== permissionId)
                : [...currentPerms, permissionId];
            
            return { ...prev, [role]: newPerms };
        });
        setHasUnsavedChanges(true);
    };

    const savePermissions = () => {
        // In a real app, this would save to the backend
        setHasUnsavedChanges(false);
        setToastMessage("Permission matrix updated successfully");
        setTimeout(() => setToastMessage(null), 3000);
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: Role) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'AGENCY_OWNER': return 'bg-slate-800 text-slate-100 border-slate-700';
            case 'MANAGER': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'AGENT': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="animate-fade-in space-y-6 relative h-full">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
                    <Check size={16} className="text-green-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Role Management</h2>
                    <p className="text-slate-500 text-sm">Manage user assignments and configure access permissions.</p>
                </div>
                
                {/* Tabs */}
                <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'USERS' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:bg-gray-50'
                        }`}
                    >
                        <Users size={16} /> User Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('PERMISSIONS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'PERMISSIONS' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-500 hover:bg-gray-50'
                        }`}
                    >
                        <Lock size={16} /> Permissions Configuration
                    </button>
                </div>
            </div>

            {/* Content Switcher */}
            {activeTab === 'USERS' ? (
                /* ---------------- USERS TAB ---------------- */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-slate-800">Active Users</h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Access Level</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => {
                                        const isMe = currentUser.name === user.name;
                                        return (
                                            <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${isMe ? 'bg-indigo-50/20' : ''}`}>
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden relative">
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                        {isMe && <div className="absolute inset-0 bg-indigo-500/20 ring-1 ring-inset ring-indigo-500 rounded-full"></div>}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-slate-800 block">{user.name}</span>
                                                        {isMe && <span className="text-[10px] text-indigo-600 font-bold uppercase">It's You</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-gray-500">
                                                        {user.role === 'ADMIN' ? 'Full System Access' : 
                                                         user.role === 'AGENCY_OWNER' ? 'Agency Management' :
                                                         user.role === 'MANAGER' ? 'Team & Reports' : 
                                                         'Basic Access'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpenId(menuOpenId === user.id ? null : user.id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${menuOpenId === user.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                    
                                                    {/* Action Menu Dropdown */}
                                                    {menuOpenId === user.id && (
                                                        <div 
                                                            ref={menuRef}
                                                            className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden"
                                                        >
                                                            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2">Actions</p>
                                                            </div>
                                                            <div className="p-1">
                                                                <button 
                                                                    onClick={() => openEditModal(user)}
                                                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                                                                >
                                                                    <Edit2 size={14} /> Edit Role
                                                                </button>
                                                                {!isMe && (
                                                                    <button 
                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 size={14} /> Remove User
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                             <div className="relative z-10">
                                <Shield className="w-8 h-8 text-indigo-300 mb-4" />
                                <h3 className="font-bold text-lg mb-2">Role Definitions</h3>
                                <div className="space-y-4 text-sm text-indigo-100">
                                    <div>
                                        <strong className="text-white block mb-0.5">Agency Owner</strong>
                                        Full control over their specific agency tenant, financials, and team.
                                    </div>
                                    <div>
                                        <strong className="text-white block mb-0.5">Manager</strong>
                                        Can view data for Agents assigned to them. Cannot access Agency settings.
                                    </div>
                                    <div>
                                        <strong className="text-white block mb-0.5">Agent</strong>
                                        Restricted to their own Book of Business, CRM, and Pipeline.
                                    </div>
                                </div>
                             </div>
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Lock size={16} className="text-gray-400" /> Recent Changes
                            </h3>
                            <div className="space-y-3 text-xs">
                                 <div className="flex justify-between text-gray-500">
                                     <span>Changed role for Ryan Howard</span>
                                     <span>Just now</span>
                                 </div>
                                 <div className="flex justify-between text-gray-500">
                                     <span>New Agent account created</span>
                                     <span>1d ago</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ---------------- PERMISSIONS TAB ---------------- */
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800">Global Permission Matrix</h3>
                            <p className="text-xs text-slate-500 mt-1">Configure what features each role can access.</p>
                        </div>
                        {hasUnsavedChanges && (
                            <div className="flex items-center gap-3 animate-fade-in">
                                <span className="text-xs text-orange-600 font-medium italic">Unsaved changes</span>
                                <button 
                                    onClick={savePermissions}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-colors"
                                >
                                    <Save size={16} /> Save Configuration
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b border-r border-gray-100 bg-gray-50/50 min-w-[250px] sticky left-0 z-10">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Permission / Capability</span>
                                    </th>
                                    {(['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'AGENT', 'RECRUIT'] as Role[]).map(role => (
                                        <th key={role} className="p-4 border-b border-gray-100 text-center min-w-[120px]">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getRoleBadgeColor(role)}`}>
                                                    {role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-50/50">
                                            <td colSpan={6} className="px-4 py-2 text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                                                <Layers size={12} /> {category}
                                            </td>
                                        </tr>
                                        {perms.map(perm => (
                                            <tr key={perm.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-4 py-3 border-r border-gray-50 text-sm font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50">
                                                    {perm.label}
                                                </td>
                                                {(['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'AGENT', 'RECRUIT'] as Role[]).map(role => {
                                                    const isChecked = rolePermissions[role].includes(perm.id);
                                                    const isAdmin = role === 'ADMIN'; // Lock admin permissions usually
                                                    
                                                    return (
                                                        <td key={`${role}-${perm.id}`} className="p-3 text-center">
                                                            <div className="flex justify-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isChecked}
                                                                    disabled={isAdmin}
                                                                    onChange={() => togglePermission(role, perm.id)}
                                                                    className={`w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Role Modal (Same as before) */}
            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden transform transition-all scale-100">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Shield size={18} className="text-indigo-600" /> Edit User Role
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={editingUser.avatarUrl} className="w-16 h-16 rounded-full border border-gray-200" alt="" />
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800">{editingUser.name}</h4>
                                    <p className="text-sm text-gray-500">{editingUser.role.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign New Role</label>
                                    <div className="space-y-2">
                                        {(['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'AGENT', 'RECRUIT'] as Role[]).map((role) => (
                                            <label 
                                                key={role} 
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedRole === role 
                                                        ? 'border-indigo-600 bg-indigo-50' 
                                                        : 'border-gray-200 hover:border-indigo-300'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="role" 
                                                    value={role} 
                                                    checked={selectedRole === role}
                                                    onChange={() => setSelectedRole(role)}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                                />
                                                <span className="ml-3 text-sm font-medium text-slate-700">
                                                    {role === 'ADMIN' ? 'Super Admin' : 
                                                     role === 'AGENCY_OWNER' ? 'Agency Owner' :
                                                     role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button 
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveRole}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
