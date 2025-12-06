import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { generateRevenueData, generatePolicyDistribution } from '../services/mockData';
import { StatCardProps } from '../types';
import { DollarSign, Users, FileCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const revenueData = generateRevenueData();
const policyData = generatePolicyDistribution();
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-2">{value}</h3>
      </div>
      <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
        {icon}
      </div>
    </div>
    {trend && (
      <div className={`mt-4 flex items-center text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        <span>{trendUp ? '↑' : '↓'} {trend}</span>
        <span className="text-gray-400 ml-1">vs last month</span>
      </div>
    )}
  </div>
);

// Collapsible Section Wrapper
const DashboardSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div 
                className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <button className="text-gray-500">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>
            {isOpen && (
                <div className="p-6 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="$248,500" 
          trend="12.5%" 
          trendUp={true} 
          icon={<DollarSign size={20} />} 
        />
        <StatCard 
          title="Active Policies" 
          value="1,234" 
          trend="3.2%" 
          trendUp={true} 
          icon={<FileCheck size={20} />} 
        />
        <StatCard 
          title="Total Clients" 
          value="856" 
          trend="0.8%" 
          trendUp={true} 
          icon={<Users size={20} />} 
        />
        <StatCard 
          title="Pending Claims" 
          value="23" 
          trend="5.1%" 
          trendUp={false} 
          icon={<AlertCircle size={20} />} 
        />
      </div>

      <DashboardSection title="Revenue & Performance Overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-gray-500 mb-4">Revenue Trend</h4>
              <div className="h-80 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-4">Portfolio Mix</h4>
              <div className="h-80 w-full relative min-w-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={policyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {policyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-slate-800">1.2k</span>
                    <span className="text-xs text-gray-500">Policies</span>
                 </div>
              </div>
            </div>
          </div>
      </DashboardSection>
    </div>
  );
};

export default Dashboard;