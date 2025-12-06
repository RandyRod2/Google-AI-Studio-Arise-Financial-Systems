
import React from 'react';

export type Role = 'ADMIN' | 'AGENCY_OWNER' | 'MANAGER' | 'AGENT' | 'RECRUIT';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial';
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
  PENDING = 'Pending',
  EXPIRED = 'Expired',
  CANCELLED = 'Cancelled',
  LAPSED = 'Lapsed'
}

export enum PipelineStage {
  NEW_LEAD = 'New Lead',
  CONTACTED = 'Contacted',
  APPOINTMENT_SET = 'Appointment Set',
  APPLICATION_TAKEN = 'App Taken',
  UNDERWRITING = 'Underwriting',
  ISSUED = 'Issued'
}

export interface Policy {
  id: string;
  applicationId?: string; // ID of the application that generated this policy
  type: PolicyType;
  productName?: string; // Specific product name
  policyNumber: string;
  carrier: string;
  premium: number; // Annual Premium
  coverageAmount: number; // Face Amount
  commission: number;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  isPaidOut?: boolean;
  documentUrl?: string; // URL/Base64 of the original application document
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
  lastContactDate: string;
}

export interface Application {
  id: string;
  clientId: string;
  clientName: string;
  carrier: string;
  product: string;
  policyNumber?: string; // Added field
  submittedDate: string;
  premium: number;
  coverageAmount?: number;
  status: 'Submitted' | 'Underwriting' | 'Approved' | 'Issued' | 'Declined';
  notes: string;
  documentUrl?: string; // URL/Base64 of the uploaded application document
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  production: number;
  activePolicies: number;
  avatarUrl: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string;
}

// Extended interface for Super Admin view
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

export type ViewState = 
  | 'DASHBOARD' 
  | 'MANAGER_DASHBOARD'
  | 'PLATFORM_ADMIN' 
  | 'QUOTER' 
  | 'LEAD_STORE'
  | 'THE_DOJO'
  | 'CARRIERS' // New View
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
  phone: string;
  avatarUrl?: string;
}
