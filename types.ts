
import React from 'react';

export type Role = 'ADMIN' | 'AGENCY_OWNER' | 'MANAGER' | 'AGENT' | 'RECRUIT' | 'STAFF';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial' | 'pending_invite';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export enum PolicyType {
  TERM = 'Term Life',
  WHOLE = 'Whole Life',
  IUL = 'IUL',
  ANNUITY = 'Annuity',
  FINAL_EXPENSE = 'Final Expense',
  HEALTH = 'Health'
}

export enum PolicyStatus {
  ACTIVE = 'Active',
  APPROVED = 'Approved',
  PENDING = 'Pending',
  EXPIRED = 'Expired',
  CANCELLED = 'Cancelled',
  LAPSED = 'Lapsed'
}

export enum PipelineStage {
  NEW_LEAD = 'New Lead',
  CONTACTED = 'Contacted',
  APPOINTMENT_SET = 'Appointment Set',
  APPLICATION_TAKEN = 'Application Approved',
  UNDERWRITING = 'Underwriting',
  ISSUED = 'Issued',
  RENEWAL_REVIEW = 'Renewal Review',
  NOT_INTERESTED = 'Not Interested',
  BAD_NUMBER = 'Bad Number'
}

export interface Policy {
  id: string;
  applicationId?: string;
  type: PolicyType;
  productName?: string;
  policyNumber: string;
  carrier: string;
  premium: number;
  coverageAmount: number;
  commission: number;
  commissionRate?: number;
  commissionType?: 'Advanced (Upfront)' | 'As Earned (Monthly)';
  advanceRate?: number;
  writingAgentId?: string;
  startDate: string;
  submittedDate?: string;
  draftDate?: string;
  endDate: string;
  status: PolicyStatus;
  isPaidOut?: boolean;
  documentUrl?: string;
}

export interface Beneficiary {
  id: string;
  clientId: string;
  name: string;
  relationship: string;
  type: 'Primary' | 'Contingent';
  percentage: number;
}

export interface Client {
  id: string;
  agentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address: string;
  policies: Policy[];
  notes: string;
  avatarUrl?: string;
  pipelineStage: PipelineStage;
  leadSource: string;
  leadType?: 'FEX' | 'MP' | 'IUL' | 'VET';
  lastContactDate: string;
  
  // Personal Identification
  ssn?: string;
  driversLicense?: string;
  height?: string;
  weight?: string;
  occupation?: string;

  // Beneficiary Information
  beneficiaries?: Beneficiary[];

  // Health Information
  healthConditions?: string;
  currentPrescriptions?: string;

  // Payment Information
  paymentMethod?: 'Bank Draft' | 'Credit Card';
  bankName?: string;
  routingNumber?: string;
  accountNumber?: string;
  cardNumber?: string;
  expirationDate?: string;
  cvv?: string;
  billingZipCode?: string;
  draftDate?: string;
}

export interface Application {
  id: string;
  clientId: string;
  clientName: string;
  carrier: string;
  product: string;
  policyType?: PolicyType;
  policyNumber?: string;
  submittedDate: string;
  policyStartDate?: string;
  premium: number;
  coverageAmount?: number;
  status: 'Submitted' | 'Underwriting' | 'Approved' | 'Issued' | 'Declined';
  notes: string;
  documentUrl?: string;
}

export interface Badge {
  icon: string;
  label: string;
  color: string;
  description?: string;
}

export interface TeamMember {
  id: string;
  parentId?: string;
  name: string;
  email: string;
  role: Role;
  production: number;
  activePolicies: number;
  avatarUrl: string;
  defaultCompLevel: number;
  carrierCompLevels?: Record<string, number>;
  badges?: Badge[];
}

export interface Recruit {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    stage: 'New' | 'Interview' | 'Licensing' | 'Onboarding' | 'Contracted';
    dateAdded: string;
    notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string;
  phone?: string;
  npn?: string;
}

export interface SaaSUser extends User {
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  joinDate: string;
  lastLogin: string;
  monthlyFee: number;
  agencyName?: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'POLICY' | 'CLIENT' | 'SYSTEM' | 'LEAD';
}

export interface Referral {
  id: string;
  referrerName: string;
  referredProspect: string;
  date: string;
  status: 'New' | 'Contacted' | 'Closed - Won' | 'Closed - Lost';
  rewardStatus: 'Pending' | 'Paid' | 'Ineligible';
}

export interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  author: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: string;
    time?: string;
    isGlobal?: boolean;
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'MANAGER_DASHBOARD'
  | 'PLATFORM_ADMIN' 
  | 'SECURITY_AUDIT'
  | 'QUOTER' 
  | 'LEAD_STORE'
  | 'THE_DOJO'
  | 'CARRIERS' 
  | 'PRODUCT_COMMISSION'
  | 'CLIENTS' 
  | 'BOOK_OF_BUSINESS'
  | 'PIPELINE' 
  | 'APPLICATIONS' 
  | 'TASKS' 
  | 'CALENDAR' 
  | 'FINANCIAL' 
  | 'GOALS'
  | 'COMPLIANCE'
  | 'TRAINING'
  | 'PERSISTENCY'
  | 'ANALYTICS'
  | 'REFERRALS'
  | 'ACTIVITY_FEED'
  | 'LEADERBOARD'
  | 'TEAMS'
  | 'RECRUITS'
  | 'OVERRIDES'
  | 'ROLES'
  | 'SETTINGS';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  npn?: string;
}

// --- Audit System Types ---

export interface AuditLog {
    id: string;
    timestamp: string;
    actorId: string;
    actorName: string;
    actorRole: Role;
    action: string;
    entity: string;
    details: string;
    riskScore: number; // 0-10
}

// --- Commission Engine Types ---

export interface CommissionRule {
  fyc: number;
  renewals: number;
  excess?: number;
  advanceMonths?: number;
  advanceCap?: number;
  advanceRate?: 'Paid as Earned' | '50%' | '75%' | '100%';
  chargebackPeriod?: '6mo' | '9mo' | '12mo';
}

export interface CommissionRegistry {
  [carrier: string]: {
    [product: string]: {
      [level: string]: CommissionRule;
    };
  };
}

// --- Dojo Types ---
export interface DojoMoment {
    text: string;
    suggestion: string;
    type: 'CRITIQUE' | 'WIN';
    timestamp: string;
    segmentIndex?: number;
}

export interface DojoGoldenRebuttals {
    objection: string;
    userResponse: string;
    eliteResponse: string;
    bridgeName: string;
}

export interface DojoScorecard {
    overall: number;
    rapport: number;
    qualifying: number;
    objectionHandling: number;
    closing: number;
    tonalityScore?: number;
    pacingScore?: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    moments: DojoMoment[];
    goldenRebuttals: DojoGoldenRebuttals[];
    controlTimeline: number[];
    transcriptSegments: string[];
}

// --- Competitive Update Types ---

export interface Duel {
    id: string;
    category: 'AGENT' | 'AGENCY';
    competitor1Id: string;
    competitor2Id: string;
    competitor1Name?: string;
    competitor2Name?: string;
    type: 'APPS' | 'PREMIUM';
    target: number;
    current1: number;
    current2: number;
    status: 'ACTIVE' | 'FINISHED';
}

// --- Revenue Forecast Types ---

export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'AT_RISK';

export interface ForecastPeriod {
  label: string;
  days: number;
  projectedPremium: number;
  confidence: ConfidenceBand;
  composition: {
    settled: number;
    weighted: number;
    velocity: number;
  };
}

export interface RevenueForecast {
  d7: ForecastPeriod;
  d30: ForecastPeriod;
  d90: ForecastPeriod;
}

/**
 * Fix: Added missing Expense interface which was imported in Financial.tsx but not defined.
 */
export interface Expense {
  id: string;
  category: string;
  date: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  frequency: 'Weekly' | 'Monthly' | 'Yearly';
  notes: string;
}

/**
 * Fix: Added missing OverrideRecord interface which was imported in Financial.tsx, ManagerDashboard.tsx, ManagerOverrides.tsx, and commissionService.ts.
 */
export interface OverrideRecord {
  id: string;
  policyId: string;
  writingAgentId: string;
  writingAgentName: string;
  managerId: string;
  managerName: string;
  amount: number;
  percentage: number;
  premium: number;
  carrier: string;
  product: string;
  timestamp: string;
}
