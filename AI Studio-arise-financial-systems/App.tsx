
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Settings, Shield, Menu, Sparkles, 
  BarChart3, CheckSquare, Calendar as CalendarIcon, DollarSign, GraduationCap, 
  Target, AlertOctagon, TrendingUp, Network, Layers, LogOut, Activity, Gift, PieChart,
  Lock, Percent, BookOpen, Globe, Calculator, ShoppingCart, Bot, Briefcase
} from 'lucide-react';
import Dashboard from './components/Dashboard';
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
import Quoter from './components/Quoter';
import LeadStore from './components/LeadStore';
import Carriers from './components/Carriers';
import TheDojo from './components/TheDojo';
import { ViewState, Client, Role, UserProfile, User, Application, Policy, PolicyStatus, PolicyType, PipelineStage } from './types';
import { MOCK_CLIENTS, MOCK_APPLICATIONS } from './services/mockData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  
  // Persistence: Clients
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('arise_clients_v3');
      return saved ? JSON.parse(saved) : MOCK_CLIENTS;
    } catch (e) {
      console.error("Error loading clients:", e);
      return MOCK_CLIENTS;
    }
  });

  // Persistence: Applications
  const [applications, setApplications] = useState<Application[]>(() => {
      try {
          const saved = localStorage.getItem('arise_applications_v1');
          return saved ? JSON.parse(saved) : MOCK_APPLICATIONS;
      } catch (e) {
          return MOCK_APPLICATIONS;
      }
  });

  // Save Clients to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('arise_clients_v3', JSON.stringify(clients));
    } catch (e) {
      console.error("Error saving clients:", e);
    }
  }, [clients]);

  // Save Applications to LocalStorage
  useEffect(() => {
      localStorage.setItem('arise_applications_v1', JSON.stringify(applications));
  }, [applications]);

  // Derived User Profile for components that need it
  const userProfile: UserProfile = currentUser ? {
      name: currentUser.name,
      email: currentUser.email,
      phone: '(555) 123-4567',
      avatarUrl: currentUser.avatarUrl
  } : { name: '', email: '', phone: '' };

  // Filter clients based on logged-in user
  // Managers, Agency Owners, and Admins can see all. Agents/Recruits only see theirs.
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

  // --- Helper: Map Product String to Policy Type Enum ---
  const mapProductToPolicyType = (productName: string): PolicyType => {
      const lower = productName.toLowerCase();
      if (lower.includes('iul') || lower.includes('indexed')) return PolicyType.IUL;
      if (lower.includes('whole')) return PolicyType.WHOLE;
      if (lower.includes('term')) return PolicyType.TERM;
      if (lower.includes('annuity')) return PolicyType.ANNUITY;
      if (lower.includes('final') || lower.includes('burial')) return PolicyType.FINAL_EXPENSE;
      if (lower.includes('health') || lower.includes('medicare')) return PolicyType.HEALTH;
      return PolicyType.TERM; // Default
  };

  // --- Core Sync Logic: Application -> Client/Policy ---
  const handleUpdateApplication = (updatedApp: Application) => {
      // 1. Update the Application Record
      setApplications(prevApps => prevApps.map(app => 
          app.id === updatedApp.id ? updatedApp : app
      ));

      // 2. Sync Data to Client's Policy List
      const clientIndex = clients.findIndex(c => c.id === updatedApp.clientId);
      if (clientIndex === -1) return;

      const client = clients[clientIndex];
      let updatedPolicies = [...client.policies];
      let shouldUpdateClient = false;

      // Check if a policy already exists that is linked to this application
      const existingPolicyIndex = updatedPolicies.findIndex(p => p.applicationId === updatedApp.id);

      if (existingPolicyIndex > -1) {
          // UPDATE EXISTING POLICY: Sync fields from Application
          const existingPolicy = updatedPolicies[existingPolicyIndex];
          const newStatus = updatedApp.status === 'Declined' ? PolicyStatus.CANCELLED : PolicyStatus.ACTIVE;
          const isNowPaid = updatedApp.status === 'Issued' ? true : existingPolicy.isPaidOut;

          updatedPolicies[existingPolicyIndex] = {
              ...existingPolicy,
              carrier: updatedApp.carrier,
              productName: updatedApp.product,
              type: mapProductToPolicyType(updatedApp.product), // Allow type to correct if product name changes
              premium: updatedApp.premium,
              coverageAmount: updatedApp.coverageAmount || existingPolicy.coverageAmount,
              status: newStatus,
              isPaidOut: isNowPaid,
              // Update comm if premium changed (simple recalc or keep existing if manually overridden?) 
              // We'll update it to keep sync tight.
              commission: updatedApp.premium * 0.9 
          };
          shouldUpdateClient = true;
      } else if (updatedApp.status === 'Approved' || updatedApp.status === 'Issued') {
          // CREATE NEW POLICY: If App is Approved/Issued but no policy exists yet
          const newPolicy: Policy = {
              id: `pol-${Date.now()}`,
              applicationId: updatedApp.id,
              type: mapProductToPolicyType(updatedApp.product),
              productName: updatedApp.product,
              policyNumber: 'PENDING-ISSUE', // Placeholder until user updates it
              carrier: updatedApp.carrier,
              premium: updatedApp.premium,
              coverageAmount: updatedApp.coverageAmount || 0,
              commission: updatedApp.premium * 0.9,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString().split('T')[0],
              status: PolicyStatus.ACTIVE,
              isPaidOut: updatedApp.status === 'Issued',
              documentUrl: updatedApp.documentUrl
          };
          updatedPolicies = [newPolicy, ...updatedPolicies];
          shouldUpdateClient = true;
      }

      // 3. Update Pipeline Stage based on App Status
      // Logic: Move forward, but usually don't move backward automatically unless necessary
      let newStage = client.pipelineStage;
      
      if (updatedApp.status === 'Issued') {
          newStage = PipelineStage.ISSUED;
      } else if (updatedApp.status === 'Underwriting') {
          // Only move to UW if not already Issued
          if (client.pipelineStage !== PipelineStage.ISSUED) {
              newStage = PipelineStage.UNDERWRITING;
          }
      } else if (updatedApp.status === 'Submitted') {
          // If we are just a Lead or Contacted, move to App Taken
          if (client.pipelineStage === PipelineStage.NEW_LEAD || client.pipelineStage === PipelineStage.CONTACTED || client.pipelineStage === PipelineStage.APPOINTMENT_SET) {
              newStage = PipelineStage.APPLICATION_TAKEN;
          }
      }

      if (newStage !== client.pipelineStage) {
          shouldUpdateClient = true;
      }

      // 4. Commit Changes
      if (shouldUpdateClient) {
          const updatedClient = { 
              ...client, 
              policies: updatedPolicies, 
              pipelineStage: newStage 
          };
          
          const newClientsList = [...clients];
          newClientsList[clientIndex] = updatedClient;
          setClients(newClientsList);

          // Update local view selection if looking at this client
          if (selectedClient && selectedClient.id === updatedClient.id) {
              setSelectedClient(updatedClient);
          }
      }
  };

  const handleDeleteApplication = (appId: string) => {
      if (window.confirm("Are you sure you want to delete this application?")) {
          setApplications(prev => prev.filter(a => a.id !== appId));
          // Note: We deliberately do NOT delete the linked policy automatically to prevent accidental data loss.
      }
  };

  const handleAddApplication = (newApp: Application) => {
      setApplications(prev => [newApp, ...prev]);
      // Trigger sync logic immediately to update pipeline stage if needed
      handleUpdateApplication(newApp);
  };

  // Pipeline stage drag-and-drop update
  const handleClientUpdate = (updatedClients: Client[]) => {
      // Check for stage changes to APPLICATION_TAKEN to auto-create Application
      updatedClients.forEach(updatedClient => {
          const previousClient = clients.find(c => c.id === updatedClient.id);
          
          if (previousClient && 
              previousClient.pipelineStage !== PipelineStage.APPLICATION_TAKEN && 
              updatedClient.pipelineStage === PipelineStage.APPLICATION_TAKEN) {
              
              // Create new application entry automatically
              const newApp: Application = {
                  id: `auto-app-${Date.now()}`,
                  clientId: updatedClient.id,
                  clientName: `${updatedClient.firstName} ${updatedClient.lastName}`,
                  carrier: 'Pending Carrier',
                  product: 'Pending Product',
                  submittedDate: new Date().toISOString().split('T')[0],
                  premium: 0,
                  coverageAmount: 0,
                  status: 'Submitted',
                  notes: 'Auto-created from Pipeline stage change.'
              };
              
              setApplications(prev => [newApp, ...prev]);
          }
      });
      
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
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
      if (!currentUser) return;

      const updatedUser = { ...currentUser, ...updatedProfile };
      setCurrentUser(updatedUser);

      try {
          const savedUsers = JSON.parse(localStorage.getItem('arise_users_overrides') || '{}');
          savedUsers[updatedUser.email.toLowerCase()] = updatedUser;
          localStorage.setItem('arise_users_overrides', JSON.stringify(savedUsers));
      } catch (e) {
          console.error("Failed to save user profile", e);
      }
  };

  const getCopilotContext = (): string => {
    let context = `User: ${currentUser?.name} (${currentUser?.role})\nCurrent View: ${activeView}`;
    if (selectedClient) {
        context += `\n\n--- SELECTED CLIENT DATA ---\n${JSON.stringify(selectedClient, null, 2)}`;
    }
    return context;
  };

  const NavItem = ({ view, icon, label, special }: { view: ViewState, icon: React.ReactNode, label: string, special?: boolean }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setSelectedClient(null);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${
        activeView === view 
          ? 'bg-indigo-600/10 text-indigo-600 font-medium' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      } ${special ? 'bg-indigo-900/5 hover:bg-indigo-900/10 text-indigo-800' : ''}`}
    >
      <div className={`${activeView === view ? 'text-indigo-600' : special ? 'text-indigo-800' : 'text-slate-400 group-hover:text-slate-600'}`}>
        {icon}
      </div>
      <span className="text-sm truncate">{label}</span>
    </button>
  );

  const NavSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shrink-0`}>
        <div className="p-5 flex items-center space-x-3 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
            <Shield className="text-white" size={18} />
          </div>
          <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">ARISE</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">FINANCIAL SYSTEMS</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {isSuperAdmin && (
             <NavSection title="Super Admin">
                <NavItem view="PLATFORM_ADMIN" icon={<Globe size={18} />} label="Platform Admin" special={true} />
             </NavSection>
          )}

          <NavSection title="Overview">
             {canViewManagement && <NavItem view="MANAGER_DASHBOARD" icon={<LayoutDashboard size={18} />} label="Manager Hub" />}
             <NavItem view="DASHBOARD" icon={<LayoutDashboard size={18} />} label="My Dashboard" />
             <NavItem view="ACTIVITY_FEED" icon={<Activity size={18} />} label="Activity Log" />
             <NavItem view="CALENDAR" icon={<CalendarIcon size={18} />} label="Calendar" />
          </NavSection>

          <NavSection title="Sales & Service">
             <NavItem view="QUOTER" icon={<Calculator size={18} />} label="Smart Quoter" />
             <NavItem view="LEAD_STORE" icon={<ShoppingCart size={18} />} label="Lead Store" />
             <NavItem view="PIPELINE" icon={<Layers size={18} />} label="Leads Pipeline" />
             <NavItem view="APPLICATIONS" icon={<FileText size={18} />} label="Applications" />
             <NavItem view="CLIENTS" icon={<Users size={18} />} label="Contacts (CRM)" />
             <NavItem view="CARRIERS" icon={<Briefcase size={18} />} label="My Carriers" />
             <NavItem view="BOOK_OF_BUSINESS" icon={<BookOpen size={18} />} label="Policy Management" />
             <NavItem view="REFERRALS" icon={<Gift size={18} />} label="Referrals" />
             <NavItem view="TASKS" icon={<CheckSquare size={18} />} label="Tasks" />
          </NavSection>

          <NavSection title="Performance">
             <NavItem view="FINANCIAL" icon={<DollarSign size={18} />} label="Financials" />
             <NavItem view="ANALYTICS" icon={<PieChart size={18} />} label="Analytics" />
             <NavItem view="GOALS" icon={<Target size={18} />} label="Goals" />
             <NavItem view="LEADERBOARD" icon={<BarChart3 size={18} />} label="Leaderboard" />
             <NavItem view="PERSISTENCY" icon={<TrendingUp size={18} />} label="Persistency" />
          </NavSection>

          <NavSection title="Agency">
             <NavItem view="TEAMS" icon={<Network size={18} />} label="My Team" />
             {canViewManagement && <NavItem view="OVERRIDES" icon={<Percent size={18} />} label="Overrides" />}
             {canViewManagement && <NavItem view="ROLES" icon={<Lock size={18} />} label="Role Management" />}
             <NavItem view="COMPLIANCE" icon={<AlertOctagon size={18} />} label="Compliance" />
             <NavItem view="TRAINING" icon={<GraduationCap size={18} />} label="Training LMS" />
             <NavItem view="SETTINGS" icon={<Settings size={18} />} label="Settings" />
          </NavSection>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-slate-50">
           <div className="flex items-center space-x-3 mb-4">
             <img src={currentUser.avatarUrl} className="w-9 h-9 rounded-full border border-gray-300 object-cover" alt="Profile" />
             <div className="flex-1 min-w-0">
               <p className="text-slate-800 text-sm font-medium truncate">{currentUser.name}</p>
               <div className="flex justify-between items-center">
                   <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide truncate max-w-[80px]">
                     {currentUser.role === 'ADMIN' ? 'SUPER ADMIN' : currentUser.role.replace('_', ' ')}
                   </span>
                   <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors" title="Sign Out">
                       <LogOut size={14} />
                   </button>
               </div>
             </div>
           </div>
           
           <button 
             onClick={() => setIsCopilotOpen(true)}
             className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-900 text-white shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all group"
           >
             <Sparkles size={16} className="text-indigo-300 group-hover:text-white animate-pulse" />
             <span className="font-medium text-sm">Ask ARISE AI</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="bg-white border-b border-gray-100 p-4 flex items-center justify-between lg:hidden z-10 shrink-0">
            <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Shield className="text-white" size={16} />
                </div>
                <span className="font-bold text-slate-800">ARISE</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 bg-slate-50 rounded-lg">
                <Menu size={24} />
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative bg-slate-50/50">
           {/* Use w-full and a larger max-width to fit screen better */}
           <div className="w-full max-w-[1920px] mx-auto h-full flex flex-col">
              {activeView === 'DASHBOARD' && <Dashboard />}
              {activeView === 'MANAGER_DASHBOARD' && <ManagerDashboard userProfile={userProfile} />}
              {activeView === 'PLATFORM_ADMIN' && <PlatformAdmin />}
              
              {activeView === 'CLIENTS' && (
                <Clients 
                  clients={visibleClients} 
                  currentUserId={currentUser.id}
                  onUpdateClients={setClients}
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
                    onUpdateClients={setClients}
                  />
              )}

              {activeView === 'THE_DOJO' && <TheDojo />}
              {activeView === 'QUOTER' && <Quoter />}
              {activeView === 'LEAD_STORE' && <LeadStore />}
              {activeView === 'CARRIERS' && <Carriers />}
              {activeView === 'FINANCIAL' && <Financial clients={visibleClients} />}
              {activeView === 'TASKS' && <Tasks />}
              {activeView === 'CALENDAR' && <Calendar />}
              {activeView === 'GOALS' && <Goals />}
              {activeView === 'COMPLIANCE' && <Compliance />}
              {activeView === 'TRAINING' && <Training />}
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
              
              {activeView === 'TEAMS' && <Teams userProfile={userProfile} />}
              {activeView === 'LEADERBOARD' && <Leaderboard />}
              {activeView === 'OVERRIDES' && <ManagerOverrides />}
              {activeView === 'ROLES' && <RoleManagement currentUser={currentUser} />}
           </div>
        </div>

        {!isCopilotOpen && (
             <button 
                onClick={() => setIsCopilotOpen(true)}
                className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl z-40 text-white"
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
