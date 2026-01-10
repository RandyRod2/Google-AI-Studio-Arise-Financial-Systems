import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Settings, Shield, Menu, Sparkles, 
  BarChart3, CheckSquare, Calendar as CalendarIcon, DollarSign, GraduationCap, 
  Target, AlertOctagon, TrendingUp, Network, Layers, LogOut, Activity, Gift, PieChart,
  Lock, Percent, BookOpen, Globe, Calculator, ShoppingCart, Bot, Briefcase, UserPlus,
  ChevronDown, ChevronRight, Table2, ShieldCheck
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import { Header } from './components/Header';
import { Clients } from './components/Clients';
import BookOfBusiness from './components/BookOfBusiness';
import Copilot from './components/Copilot';
import Pipeline from './components/Pipeline';
import Applications from './components/Applications';
import Financial from './components/Financial';
import ManagerDashboard from './components/ManagerDashboard';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Goals from './components/Goals';
import Compliance from './components/Compliance';
import Training from './components/Training';
import Persistency from './components/Persistency';
import SettingsView from './components/Settings';
import Teams from './components/Teams';
import Login from './components/Login';
import ActivityFeed from './components/ActivityFeed';
import Referrals from './components/Referrals';
import Analytics from './components/Analytics';
import Leaderboard from './components/Leaderboard';
import ManagerOverrides from './components/ManagerOverrides';
import RoleManagement from './components/RoleManagement';
import PlatformAdmin from './components/PlatformAdmin';
import SecurityAudit from './components/SecurityAudit';
import Quoter from './components/Quoter';
import LeadStore from './components/LeadStore';
import Carriers from './components/Carriers';
import TheDojo from './components/TheDojo';
import Recruits from './components/Recruits';
import ProductCommission from './components/ProductCommission'; 
import { AriseLogo } from './components/AriseLogo';
import { ViewState, Client, Role, UserProfile, User, Application, Policy, PolicyStatus, PolicyType, PipelineStage, TeamMember } from './types';
import { MOCK_CLIENTS, MOCK_APPLICATIONS, MOCK_TEAM } from './services/mockData';
import { calculateCommissionExact } from './services/commissionService';

// Helper to get local date string YYYY-MM-DD
const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper to retrieve agent profile for commission calcs
const getAgentProfile = (userId: string): TeamMember => {
    try {
        const saved = localStorage.getItem('arise_team_members');
        const members = saved ? JSON.parse(saved) : MOCK_TEAM;
        return members.find((m: any) => m.id === userId) || MOCK_TEAM[0];
    } catch { return MOCK_TEAM[0]; }
};

// Extracted Navigation Components to prevent re-rendering issues
interface NavItemProps {
  view: ViewState;
  icon: React.ReactNode;
  label: string;
  special?: boolean;
  activeView: ViewState;
  onClick: (view: ViewState) => void;
  className?: string;
}

const NavItem: React.FC<NavItemProps> = ({ view, icon, label, special, activeView, onClick, className = '' }) => (
  <button
    onClick={() => onClick(view)}
    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${
      activeView === view 
        ? 'bg-indigo-500/20 text-indigo-300 font-medium shadow-[0_0_15px_rgba(99,102,241,0.15)] border border-indigo-500/30' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    } ${special ? 'bg-indigo-900/20 hover:bg-indigo-900/30 text-indigo-300 border border-indigo-500/20' : ''} ${className}`}
  >
    <div className={`${activeView === view ? 'text-indigo-400' : special ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
      {icon}
    </div>
    <span className="text-sm truncate">{label}</span>
  </button>
);

const NavSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</h3>
    {children}
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      try {
          const savedSession = localStorage.getItem('arise_active_session_v1');
          return savedSession ? JSON.parse(savedSession) : null;
      } catch (e) {
          console.error("Error restoring session:", e);
          return null;
      }
  });

  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [isCarrierManagementOpen, setIsCarrierManagementOpen] = useState(false);

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('arise_clients_v3');
      return saved ? JSON.parse(saved) : MOCK_CLIENTS;
    } catch (e) {
      console.error("Error loading clients:", e);
      return MOCK_CLIENTS;
    }
  });

  const [applications, setApplications] = useState<Application[]>(() => {
      try {
          const saved = localStorage.getItem('arise_applications_v1');
          return saved ? JSON.parse(saved) : MOCK_APPLICATIONS;
      } catch (e) {
          return MOCK_APPLICATIONS;
      }
  });

  useEffect(() => {
      if (currentUser) {
          try {
              localStorage.setItem('arise_active_session_v1', JSON.stringify(currentUser));
          } catch(e) {
              console.warn("Could not save session - quota exceeded?", e);
          }
      } else {
          localStorage.removeItem('arise_active_session_v1');
      }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('arise_clients_v3', JSON.stringify(clients));
    } catch (e) {
      console.error("Error saving clients:", e);
    }
  }, [clients]);

  useEffect(() => {
      localStorage.setItem('arise_applications_v1', JSON.stringify(applications));
  }, [applications]);

  // watchman background script for renewals and status updates
  useEffect(() => {
      const today = new Date();
      const todayStr = getLocalToday();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      let clientsChanged = false;
      let appsChanged = false;

      const updatedClients = clients.map(client => {
          let clientModified = false;
          let policyActivated = false;

          // 1. Automated Status Check (Activate Pending/Approved policies that reached start date)
          const updatedPolicies = client.policies.map(policy => {
              if ((policy.status === PolicyStatus.PENDING || policy.status === PolicyStatus.APPROVED) && policy.startDate && policy.startDate <= todayStr) {
                  clientModified = true;
                  policyActivated = true;
                  return { ...policy, status: PolicyStatus.ACTIVE, isPaidOut: true };
              }
              return policy;
          });

          // 2. Automated Retention Engine (The "Watchman")
          // Logic: If any policy is 30 days away from an annual anniversary, move to Renewal Review
          const isNearRenewal = client.policies.some(policy => {
              if (policy.status !== PolicyStatus.ACTIVE) return false;
              
              const startDate = new Date(policy.startDate);
              // Calculate the anniversary this year or next year
              const anniversary = new Date(startDate);
              anniversary.setFullYear(today.getFullYear());
              
              // If the anniversary for this year has passed, look at next year's anniversary
              if (anniversary < today) {
                  anniversary.setFullYear(today.getFullYear() + 1);
              }
              
              const diffTime = anniversary.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              return diffDays >= 0 && diffDays <= 30;
          });

          let newStage = client.pipelineStage;
          
          if (policyActivated) {
              if (client.pipelineStage === PipelineStage.APPLICATION_TAKEN || client.pipelineStage === PipelineStage.UNDERWRITING) {
                  newStage = PipelineStage.ISSUED;
                  clientModified = true;
              }
          }

          // Move to Renewal Review if flagged and not already in a service/review stage
          if (isNearRenewal && client.pipelineStage !== PipelineStage.RENEWAL_REVIEW) {
              newStage = PipelineStage.RENEWAL_REVIEW;
              clientModified = true;
          }

          if (clientModified) {
              clientsChanged = true;
              return { ...client, policies: updatedPolicies, pipelineStage: newStage };
          }
          return client;
      });

      const updatedApps = applications.map(app => {
          const client = updatedClients.find(c => c.id === app.clientId);
          if (!client) return app;

          const policy = client.policies.find(p => 
              (p.applicationId === app.id) || 
              (p.carrier === app.carrier && p.productName === app.product)
          );

          if (policy && policy.status === PolicyStatus.ACTIVE && app.status !== 'Issued') {
              appsChanged = true;
              return { ...app, status: 'Issued' };
          }
          return app;
      });

      if (clientsChanged) setClients(updatedClients);
      if (appsChanged) setApplications(updatedApps as Application[]);

  }, []);

  const userProfile: UserProfile = currentUser ? {
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || '(555) 123-4567',
      avatarUrl: currentUser.avatarUrl,
      npn: currentUser.npn
  } : { name: '', email: '', phone: '' };

  const visibleClients = currentUser 
      ? (['MANAGER', 'AGENCY_OWNER', 'ADMIN'].includes(currentUser.role) 
          ? clients 
          : clients.filter(client => client.agentId === currentUser.id))
      : [];
      
  const canViewManagement = currentUser && ['MANAGER', 'AGENCY_OWNER', 'ADMIN'].includes(currentUser.role);
  const isSuperAdmin = currentUser?.role === 'ADMIN';

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const mapProductToPolicyType = (productName: string): PolicyType => {
      const lower = productName.toLowerCase();
      if (lower.includes('iul') || lower.includes('indexed')) return PolicyType.IUL;
      if (lower.includes('whole')) return PolicyType.WHOLE;
      if (lower.includes('term')) return PolicyType.TERM;
      if (lower.includes('annuity')) return PolicyType.ANNUITY;
      if (lower.includes('final') || lower.includes('burial')) return PolicyType.FINAL_EXPENSE;
      if (lower.includes('health') || lower.includes('medicare')) return PolicyType.HEALTH;
      return PolicyType.TERM; 
  };

  const handleUpdateApplication = (updatedApp: Application) => {
      setApplications(prevApps => prevApps.map(app => 
          app.id === updatedApp.id ? updatedApp : app
      ));

      const clientIndex = clients.findIndex(c => c.id === updatedApp.clientId);
      if (clientIndex === -1) return;

      const agent = getAgentProfile(currentUser?.id || '');
      const compLevel = agent.carrierCompLevels?.[updatedApp.carrier] || agent.defaultCompLevel || 100;
      const { total: commissionAmt } = calculateCommissionExact(updatedApp.carrier, updatedApp.product, updatedApp.premium, compLevel);

      const client = clients[clientIndex];
      let updatedPolicies = [...client.policies];
      let shouldUpdateClient = false;

      const existingPolicyIndex = updatedPolicies.findIndex(p => p.applicationId === updatedApp.id);

      const newStatus = updatedApp.status === 'Declined' ? PolicyStatus.CANCELLED : 
                        updatedApp.status === 'Approved' ? PolicyStatus.APPROVED : 
                        updatedApp.status === 'Issued' ? PolicyStatus.ACTIVE :
                        PolicyStatus.PENDING;
      
      const isNowPaid = updatedApp.status === 'Issued';

      if (existingPolicyIndex > -1) {
          const existingPolicy = updatedPolicies[existingPolicyIndex];
          
          updatedPolicies[existingPolicyIndex] = {
              ...existingPolicy,
              carrier: updatedApp.carrier,
              productName: updatedApp.product,
              type: mapProductToPolicyType(updatedApp.product), 
              premium: updatedApp.premium,
              coverageAmount: updatedApp.coverageAmount || existingPolicy.coverageAmount,
              status: newStatus,
              isPaidOut: isNowPaid || existingPolicy.isPaidOut, 
              startDate: updatedApp.policyStartDate || existingPolicy.startDate, 
              submittedDate: updatedApp.submittedDate || existingPolicy.submittedDate,
              commission: commissionAmt 
          };
          shouldUpdateClient = true;
      } else if (updatedApp.status === 'Approved' || updatedApp.status === 'Issued') {
          const newPolicy: Policy = {
              id: `pol-${Date.now()}`,
              applicationId: updatedApp.id,
              type: mapProductToPolicyType(updatedApp.product),
              productName: updatedApp.product,
              policyNumber: updatedApp.policyNumber || 'PENDING-ISSUE', 
              carrier: updatedApp.carrier,
              premium: updatedApp.premium,
              coverageAmount: updatedApp.coverageAmount || 0,
              commission: commissionAmt,
              startDate: updatedApp.policyStartDate || getLocalToday(),
              submittedDate: updatedApp.submittedDate,
              endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString().split('T')[0],
              status: newStatus,
              isPaidOut: isNowPaid,
              documentUrl: updatedApp.documentUrl
          };
          updatedPolicies = [newPolicy, ...updatedPolicies];
          shouldUpdateClient = true;
      }

      let newStage = client.pipelineStage;
      
      if (updatedApp.status === 'Issued') {
          newStage = PipelineStage.ISSUED;
      } else if (updatedApp.status === 'Underwriting') {
          if (client.pipelineStage !== PipelineStage.ISSUED) {
              newStage = PipelineStage.UNDERWRITING;
          }
      } else if (updatedApp.status === 'Submitted') {
          if (client.pipelineStage === PipelineStage.NEW_LEAD || client.pipelineStage === PipelineStage.CONTACTED || client.pipelineStage === PipelineStage.APPOINTMENT_SET) {
              newStage = PipelineStage.APPLICATION_TAKEN;
          }
      }

      if (newStage !== client.pipelineStage) {
          shouldUpdateClient = true;
      }

      if (shouldUpdateClient) {
          const updatedClient = { 
              ...client, 
              policies: updatedPolicies, 
              pipelineStage: newStage 
          };
          
          const newClientsList = [...clients];
          newClientsList[clientIndex] = updatedClient;
          setClients(newClientsList);

          if (selectedClient && selectedClient.id === updatedClient.id) {
              setSelectedClient(updatedClient);
          }
      }
  };

  const handleDeleteApplication = (appId: string) => {
      if (window.confirm("Are you sure you want to delete this application?")) {
          setApplications(prev => prev.filter(a => a.id !== appId));
      }
  };

  const handleAddApplication = (newApp: Application) => {
      setApplications(prev => [newApp, ...prev]);
      handleUpdateApplication(newApp);
  };

  const handleClientUpdate = (updatedClients: Client[]) => {
      let appsToUpdate: Application[] = [];
      const newApps: Application[] = [];

      updatedClients.forEach(updatedClient => {
          const previousClient = clients.find(c => c.id === updatedClient.id);
          
          const isHighIntentStage = updatedClient.pipelineStage === PipelineStage.APPLICATION_TAKEN || updatedClient.pipelineStage === PipelineStage.UNDERWRITING;
          const policyCountIncreased = (updatedClient.policies.length > (previousClient?.policies.length || 0));
          
          if (previousClient && isHighIntentStage && policyCountIncreased) {
              const latestPolicy = updatedClient.policies[0];
              
              if (latestPolicy) {
                  let appStatus: Application['status'] = 'Submitted'; 
                  
                  if (latestPolicy.status === PolicyStatus.ACTIVE) {
                      appStatus = 'Issued';
                  } else if (latestPolicy.status === PolicyStatus.APPROVED) {
                      appStatus = 'Approved'; 
                  } else if (latestPolicy.status === PolicyStatus.CANCELLED) {
                      appStatus = 'Declined';
                  } else if (updatedClient.pipelineStage === PipelineStage.UNDERWRITING) {
                      appStatus = 'Underwriting';
                  }

                  const newApp: Application = {
                      id: `auto-app-${Date.now()}`,
                      clientId: updatedClient.id,
                      clientName: `${updatedClient.firstName} ${updatedClient.lastName}`,
                      carrier: latestPolicy.carrier,
                      product: latestPolicy.productName || 'Pending',
                      policyNumber: latestPolicy.policyNumber,
                      submittedDate: latestPolicy.submittedDate || getLocalToday(), 
                      policyStartDate: latestPolicy.startDate, 
                      premium: latestPolicy.premium,
                      coverageAmount: latestPolicy.coverageAmount,
                      status: appStatus,
                      notes: 'Auto-created from Pipeline Policy Capture.'
                  };
                  
                  newApps.push(newApp);
                  updatedClient.policies[0].applicationId = newApp.id;
              }
          }

          updatedClient.policies.forEach(policy => {
              if (policy.applicationId) {
                  const existingApp = applications.find(a => a.id === policy.applicationId);
                  if (existingApp) {
                      const hasChanged = 
                          existingApp.policyStartDate !== policy.startDate ||
                          existingApp.premium !== policy.premium ||
                          existingApp.carrier !== policy.carrier ||
                          existingApp.policyNumber !== policy.policyNumber ||
                          existingApp.submittedDate !== policy.submittedDate;

                      if (hasChanged) {
                           appsToUpdate.push({
                               ...existingApp,
                               policyStartDate: policy.startDate,
                               premium: policy.premium,
                               carrier: policy.carrier,
                               product: policy.productName || existingApp.product, 
                               policyNumber: policy.policyNumber,
                               submittedDate: policy.submittedDate || existingApp.submittedDate
                           });
                      }
                  }
              }
          });
      });
      
      if (newApps.length > 0 || appsToUpdate.length > 0) {
          setApplications(prev => {
              let next = [...prev];
              appsToUpdate.forEach(updated => {
                  const idx = next.findIndex(a => a.id === updated.id);
                  if (idx > -1) next[idx] = updated;
              });
              return [...newApps, ...next];
          });
      }

      setClients(updatedClients);
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      const managementRoles: Role[] = ['MANAGER', 'AGENCY_OWNER', 'ADMIN'];
      if (user.role === 'ADMIN') {
        setActiveView('PLATFORM_ADMIN');
      } else {
        setActiveView(managementRoles.includes(user.role) ? 'MANAGER_DASHBOARD' : 'DASHBOARD');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setSelectedClient(null);
      setActiveView('DASHBOARD');
      localStorage.removeItem('arise_active_session_v1');
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
  };

  const handleViewClientDetails = (client: Client) => {
      setSelectedClient(client);
      setActiveView('CLIENTS');
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
      if (!currentUser) return;

      const updatedUser = { ...currentUser, ...updatedProfile };
      setCurrentUser(updatedUser);

      try {
          const savedUsers = JSON.parse(localStorage.getItem('arise_users_overrides') || '{}');
          savedUsers[updatedUser.email.toLowerCase()] = updatedUser;
          localStorage.setItem('arise_users_overrides', JSON.stringify(savedUsers));
          
          localStorage.setItem('arise_active_session_v1', JSON.stringify(updatedUser));
      } catch (e) {
          console.error("Failed to save user profile to storage", e);
          throw e;
      }
  };

  const getCopilotContext = (): string => {
    let context = `User: ${currentUser?.name} (${currentUser?.role})\nCurrent View: ${activeView}`;
    if (selectedClient) {
        context += `\n\n--- SELECTED CLIENT DATA ---\n${JSON.stringify(selectedClient, null, 2)}`;
    }
    return context;
  };

  const handleNavClick = (view: ViewState) => {
    setActiveView(view);
    setSelectedClient(null);
    setIsSidebarOpen(false);
  };

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen w-full bg-transparent font-sans text-slate-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Glass Effect */}
      <aside className={`fixed lg:sticky top-0 h-screen z-30 w-64 bg-slate-900/70 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shrink-0 shadow-2xl lg:shadow-none`}>
        <div className="p-5 flex items-center space-x-3 border-b border-white/5 h-16 shrink-0 bg-white/5">
          <div className="flex-shrink-0">
            <AriseLogo className="w-8 h-8 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
          <div>
              <h1 className="text-xl font-bold text-white leading-none tracking-tight">ARISE</h1>
              <p className="text-[10px] text-indigo-400 font-bold tracking-widest mt-0.5 uppercase">Command Center</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
          {isSuperAdmin && (
             <NavSection title="Super Admin">
                <NavItem view="PLATFORM_ADMIN" icon={<Globe size={18} />} label="Platform Admin" activeView={activeView} onClick={handleNavClick} special={true} />
                <NavItem view="SECURITY_AUDIT" icon={<ShieldCheck size={18} />} label="Security Ledger" activeView={activeView} onClick={handleNavClick} special={true} />
             </NavSection>
          )}

          <NavSection title="Workspace">
             <NavItem view="DASHBOARD" icon={<LayoutDashboard size={18} />} label="My Dashboard" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="ACTIVITY_FEED" icon={<Activity size={18} />} label="Activity Log" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="CALENDAR" icon={<CalendarIcon size={18} />} label="Calendar" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="TASKS" icon={<CheckSquare size={18} />} label="Tasks" activeView={activeView} onClick={handleNavClick} />
             {canViewManagement && <NavItem view="MANAGER_DASHBOARD" icon={<LayoutDashboard size={18} />} label="Manager Hub" activeView={activeView} onClick={handleNavClick} />}
          </NavSection>

          <NavSection title="Sales & Service">
             <NavItem view="QUOTER" icon={<Calculator size={18} />} label="ARISE Smart Quoter" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="LEAD_STORE" icon={<ShoppingCart size={18} />} label="ARISE Leads" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="PIPELINE" icon={<Layers size={18} />} label="Leads Pipeline" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="CLIENTS" icon={<Users size={18} />} label="Contacts (CRM)" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="APPLICATIONS" icon={<FileText size={18} />} label="Applications" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="BOOK_OF_BUSINESS" icon={<BookOpen size={18} />} label="Policy Management" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="CARRIERS" icon={<Briefcase size={18} />} label="My Carriers" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="COMPLIANCE" icon={<AlertOctagon size={18} />} label="Compliance" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="TRAINING" icon={<GraduationCap size={18} />} label="ARISE University" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="REFERRALS" icon={<Gift size={18} />} label="Referrals" activeView={activeView} onClick={handleNavClick} />
          </NavSection>

          <NavSection title="Performance">
             <NavItem view="FINANCIAL" icon={<DollarSign size={18} />} label="Financials" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="ANALYTICS" icon={<PieChart size={18} />} label="Analytics" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="GOALS" icon={<Target size={18} />} label="Goals" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="LEADERBOARD" icon={<BarChart3 size={18} />} label="Leaderboard" activeView={activeView} onClick={handleNavClick} />
             <NavItem view="PERSISTENCY" icon={<TrendingUp size={18} />} label="Persistency Tracker" activeView={activeView} onClick={handleNavClick} />
          </NavSection>

          <NavSection title="Agency Management">
             <div className="mb-1">
                <button
                  onClick={() => setIsCarrierManagementOpen(!isCarrierManagementOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-slate-400 hover:bg-white/5 hover:text-slate-200 ${isCarrierManagementOpen ? 'bg-white/5 text-slate-200' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <Briefcase size={18} className="text-slate-500 group-hover:text-slate-300" />
                    <span className="text-sm truncate">Carrier Management</span>
                  </div>
                  {isCarrierManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {isCarrierManagementOpen && (
                  <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-1">
                    <NavItem view="CARRIERS" icon={<Briefcase size={16} />} label="Carrier Catalog" activeView={activeView} onClick={handleNavClick} />
                    <NavItem view="PRODUCT_COMMISSION" icon={<Table2 size={16} />} label="Product Commission" activeView={activeView} onClick={handleNavClick} />
                    <NavItem view="TEAMS" icon={<Network size={16} />} label="Agent Levels" activeView={activeView} onClick={handleNavClick} />
                  </div>
                )}
             </div>

             <NavItem view="TEAMS" icon={<Network size={18} />} label="My Team" activeView={activeView} onClick={handleNavClick} />
             {canViewManagement && <NavItem view="RECRUITS" icon={<UserPlus size={18} />} label="Recruiting" activeView={activeView} onClick={handleNavClick} />}
             {canViewManagement && <NavItem view="OVERRIDES" icon={<Percent size={18} />} label="Overrides" activeView={activeView} onClick={handleNavClick} />}
             {canViewManagement && <NavItem view="ROLES" icon={<Lock size={18} />} label="Role Management" activeView={activeView} onClick={handleNavClick} /> }
             <NavItem view="SETTINGS" icon={<Settings size={18} />} label="Settings" activeView={activeView} onClick={handleNavClick} />
          </NavSection>
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/5">
           <button 
             onClick={() => setIsCopilotOpen(true)}
             className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:bg-indigo-500 transition-all group relative overflow-hidden mb-3"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <Sparkles size={16} className="text-white relative z-10 animate-pulse" />
             <span className="font-bold text-sm relative z-10">Ask ARISE AI</span>
           </button>
           <p className="text-[10px] font-bold text-white text-center uppercase tracking-widest">
             Powered By ARISE Financial Systems™
           </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen w-full relative bg-transparent">
        
        <Header 
            user={currentUser} 
            activeView={activeView}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onNavigate={handleNavClick}
        />

        <div className="flex-1 p-4 lg:p-8 relative custom-scrollbar overflow-y-auto">
           <div className="w-full max-w-[1920px] mx-auto flex flex-col min-h-full">
              {activeView === 'DASHBOARD' && <Dashboard user={currentUser || undefined} onNavigate={handleNavClick} clients={visibleClients} />}
              {activeView === 'MANAGER_DASHBOARD' && <ManagerDashboard userProfile={userProfile} onNavigate={handleNavClick} />}
              {activeView === 'PLATFORM_ADMIN' && <PlatformAdmin currentUser={currentUser} />}
              {activeView === 'SECURITY_AUDIT' && <SecurityAudit />}
              
              {activeView === 'CLIENTS' && (
                <Clients 
                  clients={visibleClients} 
                  currentUser={currentUser}
                  onUpdateClients={handleClientUpdate}
                  onSelectClient={handleClientSelect} 
                  selectedClient={selectedClient} 
                />
              )}
              
              {activeView === 'PIPELINE' && (
                <Pipeline 
                  clients={visibleClients}
                  currentUserId={currentUser.id}
                  onUpdateClients={handleClientUpdate}
                />
              )}

              {activeView === 'APPLICATIONS' && (
                <Applications 
                  applications={applications} 
                  clients={visibleClients}
                  onUpdateApplication={handleUpdateApplication}
                  onAddApplication={handleAddApplication}
                  onDeleteApplication={handleDeleteApplication}
                />
              )}

              {activeView === 'BOOK_OF_BUSINESS' && (
                  <BookOfBusiness 
                    clients={visibleClients}
                    onUpdateClients={handleClientUpdate}
                    onViewClient={handleViewClientDetails}
                  />
              )}

              {activeView === 'THE_DOJO' && <TheDojo />}
              {activeView === 'QUOTER' && <Quoter />}
              {activeView === 'LEAD_STORE' && <LeadStore />}
              {activeView === 'CARRIERS' && <Carriers />}
              {activeView === 'PRODUCT_COMMISSION' && <ProductCommission currentUser={currentUser} />}
              {activeView === 'FINANCIAL' && <Financial clients={visibleClients} />}
              {activeView === 'TASKS' && <Tasks />}
              {activeView === 'CALENDAR' && <Calendar currentUser={currentUser || undefined} />}
              {activeView === 'GOALS' && <Goals />}
              {activeView === 'COMPLIANCE' && <Compliance />}
              {activeView === 'TRAINING' && <Training onNavigate={handleNavClick} />}
              {activeView === 'PERSISTENCY' && <Persistency clients={visibleClients} />}
              {activeView === 'ACTIVITY_FEED' && <ActivityFeed />}
              {activeView === 'REFERRALS' && <Referrals />}
              {activeView === 'ANALYTICS' && <Analytics clients={visibleClients} />}
              
              {activeView === 'SETTINGS' && (
                <SettingsView 
                  userProfile={userProfile} 
                  onSaveProfile={handleSaveProfile} 
                />
              )}
              
              {activeView === 'TEAMS' && <Teams userProfile={userProfile} currentUser={currentUser} />}
              {activeView === 'RECRUITS' && <Recruits />}
              {activeView === 'LEADERBOARD' && <Leaderboard />}
              {activeView === 'OVERRIDES' && <ManagerOverrides />}
              {activeView === 'ROLES' && <RoleManagement currentUser={currentUser} />}
           </div>
        </div>

        {!isCopilotOpen && (
             <button 
                onClick={() => setIsCopilotOpen(true)}
                className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl z-40 text-white animate-bounce"
             >
                <Sparkles size={24} />
             </button>
        )}
      </main>

      <Copilot 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
        contextData={getCopilotContext()}
      />
    </div>
  );
};

export default App;