
import { Client, PolicyType, PolicyStatus, PipelineStage, Application, TeamMember, User, ActivityItem, Referral, SaaSUser, SubscriptionStatus, SubscriptionPlan } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Randy Rodriguez',
    email: 'randy@arise.com',
    role: 'ADMIN', // Elevated to ADMIN (SaaS Owner)
    avatarUrl: 'https://picsum.photos/100/100?random=99'
  },
  {
    id: 'u2',
    name: 'Sarah Manager',
    email: 'sarah@arise.com',
    role: 'MANAGER',
    avatarUrl: 'https://picsum.photos/100/100?random=100'
  }
];

// --- SaaS Platform Generator (1000+ Users) ---
const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const agencies = ['Summit Life', 'Pinnacle Group', 'Legacy Builders', 'Freedom Financial', 'Apex Insurance', 'Horizon Agency', 'NextGen Life', 'Unity Protection', 'Vanguard', 'Elite Advisors'];

export const generateSaaSUsers = (count: number = 1250): SaaSUser[] => {
    const users: SaaSUser[] = [];
    
    // Add our Super Admin manually
    users.push({
        id: 'u1',
        name: 'Randy Rodriguez',
        email: 'randy@arise.com',
        role: 'ADMIN',
        avatarUrl: 'https://picsum.photos/100/100?random=99',
        status: 'active',
        plan: 'enterprise',
        joinDate: '2023-01-01',
        lastLogin: new Date().toISOString(),
        monthlyFee: 0,
        agencyName: 'Arise HQ'
    });

    for (let i = 0; i < count; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const roleRoll = Math.random();
        
        let role: any = 'AGENT';
        let plan: SubscriptionPlan = 'starter';
        let fee = 49;
        
        if (roleRoll > 0.95) {
             role = 'AGENCY_OWNER';
             plan = 'enterprise';
             fee = 299;
        } else if (roleRoll > 0.85) {
             role = 'MANAGER';
             plan = 'professional';
             fee = 99;
        }

        const statusRoll = Math.random();
        let status: SubscriptionStatus = 'active';
        if (statusRoll > 0.92) status = 'past_due';
        else if (statusRoll > 0.98) status = 'cancelled';
        else if (statusRoll > 0.88 && role === 'AGENT') status = 'trial';

        users.push({
            id: `user-${i}`,
            name: `${fn} ${ln}`,
            email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
            role: role,
            avatarUrl: `https://ui-avatars.com/api/?name=${fn}+${ln}&background=random`,
            status: status,
            plan: plan,
            joinDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
            lastLogin: new Date(Date.now() - Math.floor(Math.random() * 600000000)).toISOString(), // Recent login
            monthlyFee: fee,
            agencyName: agencies[Math.floor(Math.random() * agencies.length)]
        });
    }
    return users;
};
// ------------------------------------------

export const MOCK_CLIENTS: Client[] = [
  {
    id: 'c1',
    agentId: 'u1',
    firstName: 'James',
    lastName: 'Richardson',
    email: 'j.richardson@example.com',
    phone: '(555) 123-4567',
    address: '123 Maple Ave, Springfield, IL',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    notes: 'Preferred contact method is email. Interested in increasing IUL face amount next year.',
    pipelineStage: PipelineStage.ISSUED,
    leadSource: 'Referral',
    lastContactDate: '2024-03-10',
    policies: [
      {
        id: 'p1',
        type: PolicyType.IUL,
        policyNumber: 'IUL-8839202',
        carrier: 'Pacific Life',
        premium: 12000,
        coverageAmount: 500000,
        commission: 10800,
        startDate: '2023-05-15',
        endDate: '2093-05-15',
        status: PolicyStatus.ACTIVE,
        isPaidOut: true
      }
    ]
  },
  {
    id: 'c2',
    agentId: 'u1',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 's.connor@example.com',
    phone: '(555) 987-6543',
    address: '404 Terminator Ln, Los Angeles, CA',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    notes: 'High value client. Needs review of life insurance beneficiaries.',
    pipelineStage: PipelineStage.APPOINTMENT_SET,
    leadSource: 'Facebook Ad',
    lastContactDate: '2024-03-15',
    policies: []
  },
  {
    id: 'c3',
    agentId: 'u1',
    firstName: 'Robert',
    lastName: 'Vance',
    email: 'bob.vance@vancerefrigeration.com',
    phone: '(555) 222-3333',
    address: '100 Industrial Park, Scranton, PA',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    notes: 'Business owner. Look into key-man policies.',
    pipelineStage: PipelineStage.APPLICATION_TAKEN,
    leadSource: 'Networking',
    lastContactDate: '2024-03-14',
    policies: [
      {
        id: 'p4',
        type: PolicyType.TERM, // Changed from BUSINESS to TERM as Key Man is usually Term
        policyNumber: 'BUS-449201',
        carrier: 'Banner Life',
        premium: 5600,
        coverageAmount: 1000000,
        commission: 5040,
        startDate: '2023-11-01',
        endDate: '2043-11-01',
        status: PolicyStatus.ACTIVE,
        isPaidOut: true
      }
    ]
  },
  {
    id: 'c4',
    agentId: 'u2', // Different agent
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@example.com',
    phone: '(555) 444-5555',
    address: '888 Lucky St, San Francisco, CA',
    avatarUrl: 'https://picsum.photos/200/200?random=4',
    notes: 'Recently married, need to update last name on policies.',
    pipelineStage: PipelineStage.NEW_LEAD,
    leadSource: 'Website',
    lastContactDate: '2024-03-16',
    policies: []
  },
  {
    id: 'c5',
    agentId: 'u1',
    firstName: 'Michael',
    lastName: 'Scott',
    email: 'm.scott@dundermifflin.com',
    phone: '(555) 999-0000',
    address: '42 Condo Way, Scranton, PA',
    avatarUrl: 'https://picsum.photos/200/200?random=5',
    notes: 'Interested in Annuities for retirement.',
    pipelineStage: PipelineStage.CONTACTED,
    leadSource: 'Seminar',
    lastContactDate: '2024-03-12',
    policies: []
  },
  {
    id: 'c6',
    agentId: 'u1',
    firstName: 'Gary',
    lastName: 'Busey',
    email: 'gary@example.com',
    phone: '(555) 000-1111',
    address: '999 Hollywood Blvd, CA',
    avatarUrl: 'https://picsum.photos/200/200?random=6',
    notes: 'Policy lapsed due to non-payment.',
    pipelineStage: PipelineStage.ISSUED,
    leadSource: 'Internet',
    lastContactDate: '2023-12-01',
    policies: [
      {
        id: 'p-lapsed-1',
        type: PolicyType.TERM,
        policyNumber: 'TERM-9912',
        carrier: 'Americo',
        premium: 850,
        coverageAmount: 250000,
        commission: 900,
        startDate: '2023-06-01',
        endDate: '2043-06-01',
        status: PolicyStatus.LAPSED,
        isPaidOut: true
      }
    ]
  }
];

export const MOCK_APPLICATIONS: Application[] = [
    {
        id: 'app1',
        clientId: 'c3',
        clientName: 'Robert Vance',
        carrier: 'Nationwide',
        product: 'Key Person Term 20',
        submittedDate: '2024-03-14',
        premium: 2500,
        coverageAmount: 500000,
        status: 'Underwriting',
        notes: 'Waiting on APS'
    },
    {
        id: 'app2',
        clientId: 'c1',
        clientName: 'James Richardson',
        carrier: 'Allianz',
        product: '222 Annuity',
        submittedDate: '2024-03-01',
        premium: 250000,
        coverageAmount: 250000,
        status: 'Approved',
        notes: 'Delivery scheduled for Friday'
    },
    {
        id: 'app3',
        clientId: 'c5',
        clientName: 'Michael Scott',
        carrier: 'Ethos',
        product: 'Final Expense',
        submittedDate: '2024-03-10',
        premium: 1020,
        coverageAmount: 15000,
        status: 'Submitted',
        notes: 'Instant decision pending'
    }
];

export const MOCK_TEAM: TeamMember[] = [
    { id: 't1', name: 'Randy Rodriguez', email: 'randy@arise.com', role: 'ADMIN', production: 145000, activePolicies: 124, avatarUrl: 'https://picsum.photos/100/100?random=99' },
    { id: 't2', name: 'Dwight Schrute', email: 'dwight@arise.com', role: 'AGENCY_OWNER', production: 89000, activePolicies: 88, avatarUrl: 'https://picsum.photos/100/100?random=12' },
    { id: 't3', name: 'Jim Halpert', email: 'jim@arise.com', role: 'MANAGER', production: 72000, activePolicies: 65, avatarUrl: 'https://picsum.photos/100/100?random=13' },
    { id: 't4', name: 'Pam Beesly', email: 'pam@arise.com', role: 'AGENT', production: 45000, activePolicies: 42, avatarUrl: 'https://picsum.photos/100/100?random=14' },
    { id: 't5', name: 'Ryan Howard', email: 'ryan@arise.com', role: 'RECRUIT', production: 12000, activePolicies: 15, avatarUrl: 'https://picsum.photos/100/100?random=15' }
];

export const MOCK_TASKS = [
    { id: 't1', title: 'Follow up with Sarah Connor', dueDate: 'Today', priority: 'High', completed: false, type: 'Call' },
    { id: 't2', title: 'Submit Policy Review for Vance', dueDate: 'Tomorrow', priority: 'Medium', completed: false, type: 'Admin' },
    { id: 't3', title: 'Prepare Quote for Michael Scott', dueDate: 'Oct 24', priority: 'High', completed: true, type: 'Quote' },
    { id: 't4', title: 'Weekly Team Sync', dueDate: 'Oct 25', priority: 'Low', completed: false, type: 'Meeting' },
    { id: 't5', title: 'Renew E&O Insurance', dueDate: 'Nov 01', priority: 'High', completed: false, type: 'Compliance' },
];

export const MOCK_GOALS = [
    { id: 'g1', title: 'Monthly Premium', current: 24000, target: 40000, unit: '$' },
    { id: 'g2', title: 'Applications Submitted', current: 8, target: 15, unit: 'Apps' },
    { id: 'g3', title: 'Appointments Set', current: 12, target: 20, unit: 'Appts' },
    { id: 'g4', title: 'Recruits Onboarded', current: 1, target: 3, unit: 'Agents' },
];

export const MOCK_COMPLIANCE = [
    { id: 'l1', name: 'California Life License', type: 'License', status: 'Active', expiry: '2025-06-15' },
    { id: 'l2', name: 'Texas Life License', type: 'License', status: 'Expiring Soon', expiry: '2024-04-20' },
    { id: 'l3', name: 'E&O Insurance', type: 'Insurance', status: 'Active', expiry: '2024-11-01' },
    { id: 'l4', name: 'AML Training', type: 'Certification', status: 'Missing', expiry: '-' },
];

export const MOCK_TRAINING = [
    { id: 'tr1', title: 'Advanced IUL Strategies', duration: '45 min', progress: 100, category: 'Product' },
    { id: 'tr2', title: 'Overcoming Objections', duration: '30 min', progress: 60, category: 'Sales' },
    { id: 'tr3', title: 'Compliance 101', duration: '20 min', progress: 0, category: 'Compliance' },
    { id: 'tr4', title: 'Agency Builder Bootcamp', duration: '2 hours', progress: 15, category: 'Management' },
];

export const MOCK_PERSISTENCY = [
    { month: 'Month 1', rate: 100 },
    { month: 'Month 3', rate: 98 },
    { month: 'Month 6', rate: 95 },
    { month: 'Month 9', rate: 92 },
    { month: 'Month 13', rate: 91 },
];

export const MOCK_CARRIER_PERSISTENCY = [
    { carrier: 'Pacific Life', rate: 98.5, policies: 145 },
    { carrier: 'Allianz', rate: 96.2, policies: 89 },
    { carrier: 'Nationwide', rate: 92.4, policies: 56 },
    { carrier: 'Ethos', rate: 88.5, policies: 34 },
    { carrier: 'Americo', rate: 78.2, policies: 12 },
];

export const MOCK_ACTIVITIES: ActivityItem[] = [
    { id: 'a1', user: 'Randy Rodriguez', action: 'Created new policy for', target: 'James Richardson', timestamp: '2 hours ago', type: 'POLICY' },
    { id: 'a2', user: 'Randy Rodriguez', action: 'Added new lead', target: 'Sarah Connor', timestamp: '5 hours ago', type: 'LEAD' },
    { id: 'a3', user: 'System', action: 'Processed commission payment', target: '$12,450', timestamp: '1 day ago', type: 'SYSTEM' },
    { id: 'a4', user: 'Sarah Manager', action: 'Updated team goal', target: 'Q4 Recruitment', timestamp: '1 day ago', type: 'SYSTEM' },
    { id: 'a5', user: 'Randy Rodriguez', action: 'Completed task', target: 'Follow up with Michael', timestamp: '2 days ago', type: 'CLIENT' },
];

export const MOCK_REFERRALS: Referral[] = [
    { id: 'r1', referrerName: 'James Richardson', referredProspect: 'Tim Cook', date: '2024-10-01', status: 'Closed - Won', rewardStatus: 'Paid' },
    { id: 'r2', referrerName: 'Sarah Connor', referredProspect: 'Kyle Reese', date: '2024-10-05', status: 'New', rewardStatus: 'Pending' },
    { id: 'r3', referrerName: 'Robert Vance', referredProspect: 'Phyllis Lapin', date: '2024-10-10', status: 'Contacted', rewardStatus: 'Pending' },
];

export const generateRevenueData = () => {
  return [
    { name: 'Jan', revenue: 12400, commissions: 11000 },
    { name: 'Feb', revenue: 14500, commissions: 13000 },
    { name: 'Mar', revenue: 13800, commissions: 12500 },
    { name: 'Apr', revenue: 18200, commissions: 16000 },
    { name: 'May', revenue: 21500, commissions: 19000 },
    { name: 'Jun', revenue: 23400, commissions: 21000 },
    { name: 'Jul', revenue: 20100, commissions: 18000 },
    { name: 'Aug', revenue: 25600, commissions: 23000 },
    { name: 'Sep', revenue: 24200, commissions: 22000 },
    { name: 'Oct', revenue: 28900, commissions: 26000 },
    { name: 'Nov', revenue: 31200, commissions: 28000 },
    { name: 'Dec', revenue: 35000, commissions: 31000 },
  ];
};

export const generateProductMix = () => {
  return [
    { name: 'IUL', value: 45 },
    { name: 'Term Life', value: 25 },
    { name: 'Annuity', value: 20 },
    { name: 'Final Expense', value: 10 },
  ];
};

export const generatePolicyDistribution = () => {
  return [
    { name: 'IUL', value: 40 },
    { name: 'Term', value: 30 },
    { name: 'Annuity', value: 20 },
    { name: 'Other', value: 10 },
  ];
};
