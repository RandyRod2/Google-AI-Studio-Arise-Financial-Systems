
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_TEAM } from '../services/mockData';
import { Shield, Check, Search, MoreHorizontal, Lock, Users, AlertCircle, Edit2, Trash2, X, Save, User as UserIcon, Layers, Settings, Eye, Plus, AlertTriangle } from 'lucide-react';
import { Role, User } from '../types';

interface RoleManagementProps {
    currentUser: User | null;
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
    RECRUIT: ['view_personal_fin'],
    STAFF: ['view_all_clients', 'edit_clients', 'view_roster']
};

const RoleManagement: React.FC<RoleManagementProps> = ({ currentUser }) => {
    // Access Check: Allow ADMIN, AGENCY_OWNER, MANAGER, and STAFF
    const hasAccess = currentUser && ['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'STAFF'].includes(currentUser.role);

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <div className="p-4 bg-red-900/20 rounded-full mb-4 border border-red-500/20">
                    <AlertTriangle className="text-red-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white">Access Denied</h3>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState<'USERS' | 'PERMISSIONS'>('USERS');
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState(MOCK_TEAM);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // Permission State
    const [rolePermissions, setRolePermissions] = useState(INITIAL_ROLE_PERMISSIONS);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Custom Role State
    const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

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
        if (currentUser?.name === editingUser.name && selectedRole !== 'ADMIN') {
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
        setHasUnsavedChanges(false);
        setToastMessage("Permission matrix updated successfully");
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleCreateRole = () => {
        if(!newRoleName.trim()) return;
        setToastMessage(`New role "${newRoleName}" created successfully.`);
        setTimeout(() => setToastMessage(null), 3000);
        setIsCreateRoleModalOpen(false);
        setNewRoleName('');
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: Role) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'AGENCY_OWNER': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'AGENT': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'STAFF': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
            case 'RECRUIT': return 'bg-slate-700 text-slate-300 border-slate-600';
            default: return 'bg-slate-700 text-slate-300 border-slate-600';
        }
    };

    return (
        <div className="animate-fade-in space-y-6 relative h-full">
            {/* Success Toast */}
            {toastMessage && (
                <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-white/10 flex items-center gap-2 animate-fade-in backdrop-blur-md">
                    <Check size={16} className="text-green-400" />
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Role Management</h2>
                    <p className="text-slate-400 text-sm">Manage user assignments and configure access permissions.</p>
                </div>
                
                {/* Tabs */}
                <div className="bg-slate-900/60 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-sm flex">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'USERS' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <Users size={16} /> User Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('PERMISSIONS')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'PERMISSIONS' 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <Lock size={16} /> Permissions & Roles
                    </button>
                </div>
            </div>

            {/* Content Switcher */}
            {activeTab === 'USERS' ? (
                /* ---------------- USERS TAB ---------------- */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-sm">
                            <h3 className="font-bold text-white">Active Users</h3>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    className="pl-10 pr-4 py-2 w-full border border-slate-700 bg-slate-950/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 transition-colors"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-visible">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 border-b border-white/5 text-xs font-semibold text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Access Level</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map((user) => {
                                        const isMe = currentUser?.name === user.name;
                                        return (
                                            <tr key={user.id} className={`hover:bg-white/5 transition-colors ${isMe ? 'bg-indigo-500/10' : ''}`}>
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden relative">
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                        {isMe && <div className="absolute inset-0 bg-indigo-500/20 ring-1 ring-inset ring-indigo-500 rounded-full"></div>}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-white block">{user.name}</span>
                                                        {isMe && <span className="text-[10px] text-indigo-400 font-bold uppercase">It's You</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-slate-400">
                                                        {user.role === 'ADMIN' ? 'Full System Access' : 
                                                         user.role === 'AGENCY_OWNER' ? 'Agency Management' :
                                                         user.role === 'MANAGER' ? 'Team & Reports' : 
                                                         user.role === 'STAFF' ? 'Administrative Support' :
                                                         user.role === 'RECRUIT' ? 'Training Access' :
                                                         'Basic Access'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right relative">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpenId(menuOpenId === user.id ? null : user.id);
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${menuOpenId === user.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                                                    >
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                    
                                                    {/* Action Menu Dropdown */}
                                                    {menuOpenId === user.id && (
                                                        <div 
                                                            ref={menuRef}
                                                            className="absolute right-8 top-8 w-48 bg-slate-900 rounded-xl shadow-xl border border-white/10 z-50 animate-fade-in overflow-hidden ring-1 ring-black"
                                                        >
                                                            <div className="p-2 border-b border-white/5 bg-white/5">
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2">Actions</p>
                                                            </div>
                                                            <div className="p-1">
                                                                <button 
                                                                    onClick={() => openEditModal(user)}
                                                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-lg transition-colors"
                                                                >
                                                                    <Edit2 size={14} /> Edit Role
                                                                </button>
                                                                {!isMe && (
                                                                    <button 
                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                        <div className="bg-indigo-900/40 text-white p-6 rounded-xl shadow-lg relative overflow-hidden border border-indigo-500/30">
                             <div className="relative z-10">
                                <Shield className="w-8 h-8 text-indigo-400 mb-4" />
                                <h3 className="font-bold text-lg mb-2">Role Definitions</h3>
                                <div className="space-y-4 text-sm text-indigo-200">
                                    <div>
                                        <strong className="text-white block mb-0.5">Agency Owner</strong>
                                        Full control over their specific agency tenant, financials, and team.
                                    </div>
                                    <div>
                                        <strong className="text-white block mb-0.5">Manager</strong>
                                        Can view data for Agents assigned to them. Cannot access Agency settings.
                                    </div>
                                    <div>
                                        <strong className="text-white block mb-0.5">Staff</strong>
                                        Support role for data entry and client updates. Limited access to financials.
                                    </div>
                                    <div>
                                        <strong className="text-white block mb-0.5">Agent</strong>
                                        Restricted to their own Book of Business, CRM, and Pipeline.
                                    </div>
                                    <div>
                                        <strong className="text-white block mb-0.5">Recruit</strong>
                                        Entry-level access. Can view training materials and onboarding tasks only.
                                    </div>
                                </div>
                             </div>
                             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-sm">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Lock size={16} className="text-slate-400" /> Recent Changes
                            </h3>
                            <div className="space-y-3 text-xs">
                                 <div className="flex justify-between text-slate-400">
                                     <span>Changed role for Ryan Howard</span>
                                     <span>Just now</span>
                                 </div>
                                 <div className="flex justify-between text-slate-400">
                                     <span>New Agent account created</span>
                                     <span>1d ago</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ---------------- PERMISSIONS TAB ---------------- */
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/5 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white">Global Permission Matrix</h3>
                            <p className="text-xs text-slate-400 mt-1">Configure what features each role can access.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsCreateRoleModalOpen(true)}
                                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold rounded-lg hover:bg-slate-700 shadow-sm flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Create Custom Role
                            </button>
                            {hasUnsavedChanges && (
                                <button 
                                    onClick={savePermissions}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-colors animate-fade-in"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b border-r border-white/5 bg-slate-950/30 min-w-[250px] sticky left-0 z-10">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Permission / Capability</span>
                                    </th>
                                    {(['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'AGENT', 'RECRUIT', 'STAFF'] as Role[]).map(role => (
                                        <th key={role} className="p-4 border-b border-white/5 bg-slate-900/20 text-center min-w-[120px]">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getRoleBadgeColor(role)}`}>
                                                    {role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-950/20">
                                            <td colSpan={7} className="px-4 py-2 text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                                <Layers size={12} /> {category}
                                            </td>
                                        </tr>
                                        {perms.map(perm => (
                                            <tr key={perm.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-3 border-r border-white/5 text-sm font-medium text-slate-300 sticky left-0 bg-slate-900 group-hover:bg-slate-800 transition-colors">
                                                    {perm.label}
                                                </td>
                                                {(['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'AGENT', 'RECRUIT', 'STAFF'] as Role[]).map(role => {
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
                                                                    className={`w-5 h-5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 transition-all cursor-pointer ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            {/* Create Role Modal */}
            {isCreateRoleModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden border border-slate-800 ring-1 ring-white/10">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Plus size={18} className="text-indigo-500" /> Create Custom Role
                            </h3>
                            <button onClick={() => setIsCreateRoleModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Role Name</label>
                            <input 
                                type="text"
                                autoFocus
                                placeholder="e.g. Compliance Officer"
                                className="w-full px-4 py-2 border border-slate-700 bg-slate-950 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mb-6">
                                New roles will start with default "Agent" permissions. You can configure them in the matrix after creation.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsCreateRoleModalOpen(false)}
                                    className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreateRole}
                                    disabled={!newRoleName.trim()}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    Create Role
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Role Modal */}
            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden transform transition-all scale-100 border border-slate-800 ring-1 ring-white/10">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Shield size={18} className="text-indigo-500" /> Edit User Role
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <img src={editingUser.avatarUrl} className="w-16 h-16 rounded-full border border-slate-700 object-cover" alt="" />
                                <div>
                                    <h4 className="text-lg font-bold text-white">{editingUser.name}</h4>
                                    <p className="text-sm text-slate-400">{editingUser.role.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Assign New Role</label>
                                    <div className="space-y-2">
                                        {(['ADMIN', 'AGENCY_OWNER', 'MANAGER', 'AGENT', 'RECRUIT', 'STAFF'] as Role[]).map((role) => (
                                            <label 
                                                key={role} 
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                                    selectedRole === role 
                                                        ? 'border-indigo-500 bg-indigo-500/10' 
                                                        : 'border-slate-700 hover:border-slate-500'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="role" 
                                                    value={role} 
                                                    checked={selectedRole === role}
                                                    onChange={() => setSelectedRole(role)}
                                                    className="w-4 h-4 text-indigo-500 border-slate-600 focus:ring-indigo-500 bg-slate-950"
                                                />
                                                <span className="ml-3 text-sm font-medium text-slate-300">
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
                                    className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-colors"
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
