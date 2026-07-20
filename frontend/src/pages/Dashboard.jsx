import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Download, 
  Plus, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  Briefcase,
  Layers,
  Sparkles,
  CalendarDays,
  ListTodo
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import AIChatDrawer from '../components/AIChatDrawer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BlueprintPath from '../components/BlueprintPath';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [wizard, setWizard] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, revRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/revenue')
      ]);
      setStats(statsRes.data);
      setRevenueData(revRes.data);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  const handleTaskToggle = async (taskId, currentStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { completed: !currentStatus });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update task state:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#e3a62f]" size={32} />
          <p className="text-xs text-[#5f5e5e] font-semibold uppercase tracking-wider">Syncing dashboard data...</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      title: 'Invite Team',
      desc: 'Add team members to collaborate on deals and track performance.',
      btnText: 'Invite Users',
      action: () => navigate('/settings')
    },
    {
      title: 'Configure Pipeline',
      desc: 'Set up your sales stages and start tracking deals.',
      btnText: 'Configure Stages',
      action: () => navigate('/deals')
    },
    {
      title: 'Add Leads',
      desc: 'Manually add prospects or import them to kickstart your pipeline.',
      btnText: 'Create Lead',
      action: () => navigate('/leads')
    },
    {
      title: 'Schedule Tasks',
      desc: 'Schedule calls, emails, and meetings to keep deals moving.',
      btnText: 'Schedule Task',
      action: () => navigate('/tasks')
    }
  ];

  const totalRevenue = stats?.wonRevenue || 0;
  const activeDeals = stats?.activeDeals || 0;
  const winRate = stats?.conversionRate || 0;
  const totalLeads = stats?.totalLeads || 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1d1c16] border border-[#e7e2d8] p-3 rounded-xl shadow-lg text-xs space-y-1 text-white">
          <p className="font-bold text-[#e7e2d8] uppercase tracking-wide">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="font-mono font-bold" style={{ color: p.color }}>
              {p.name}: {fmt(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans">
      
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-2xl font-black text-[#7e5700] uppercase tracking-wide">Executive Dashboard</h2>
          <p className="text-xs text-[#5f5e5e] mt-1">Welcome back, {user?.name || 'Alex Mercer'}. Here is what's happening with your pipeline today.</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white border border-[#e7e2d8] px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1 hover:bg-[#f8f3e9] active:scale-98 transition-all">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>Last 30 Days</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-white border border-[#e7e2d8] px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-1 hover:bg-[#f8f3e9] active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <p className="font-sans text-[10px] font-bold text-[#5f5e5e] mb-1 uppercase tracking-wider">Total Revenue Won</p>
          <p className="font-mono text-2xl font-bold text-[#7e5700] mb-2">{fmt(totalRevenue)}</p>
          {totalRevenue > 0 ? (
            <div className="flex items-center space-x-1 text-[#006e2d] font-bold text-xs">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+12.5% vs last month</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-[#5f5e5e] font-bold text-xs">
              <span className="material-symbols-outlined text-sm">trending_flat</span>
              <span>0% vs last month</span>
            </div>
          )}
        </div>

        {/* New Leads */}
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          </div>
          <p className="font-sans text-[10px] font-bold text-[#5f5e5e] mb-1 uppercase tracking-wider">Active Deals</p>
          <p className="font-mono text-2xl font-bold text-[#7e5700] mb-2">{activeDeals}</p>
          {activeDeals > 0 ? (
            <div className="flex items-center space-x-1 text-[#006e2d] font-bold text-xs">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+8.2% vs last month</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-[#5f5e5e] font-bold text-xs">
              <span className="material-symbols-outlined text-sm">trending_flat</span>
              <span>0% vs last month</span>
            </div>
          )}
        </div>

        {/* Win Rate */}
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all">
            <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <p className="font-sans text-[10px] font-bold text-[#5f5e5e] mb-1 uppercase tracking-wider">Conversion Rate</p>
          <p className="font-mono text-2xl font-bold text-[#7e5700] mb-2">{winRate}%</p>
          {winRate > 0 ? (
            <div className="flex items-center space-x-1 text-[#ba1a1a] font-bold text-xs">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span>-1.4% vs last month</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-[#5f5e5e] font-bold text-xs">
              <span className="material-symbols-outlined text-sm">trending_flat</span>
              <span>0% vs last month</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Data Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Trend */}
        <div className="lg:col-span-2 bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-[#1d1c16] uppercase tracking-wide">Sales Performance Trend</h3>
            <div className="flex space-x-4 text-xs font-bold uppercase text-[#5f5e5e]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-[#1d1c16] rounded-full"></span>
                <span>Pipeline</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-[#e3a62f] rounded-full"></span>
                <span>Won</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full mt-2">
            {revenueData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center border border-dashed border-[#e7e2d8] rounded-lg text-[#5f5e5e] italic text-xs">
                No revenue trends found. Add expected revenue to closed-won deals to visualize.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d1c16" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#1d1c16" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E3A62F" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#E3A62F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3ede3" vertical={false} />
                  <XAxis dataKey="month" stroke="#5f5e5e" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#5f5e5e" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => v >= 100000 ? `₹${v/100000}L` : v >= 1000 ? `₹${v/1000}k` : `₹${v}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="pipeline" 
                    name="Pipeline" 
                    stroke="#1d1c16" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorPipeline)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Won" 
                    stroke="#E3A62F" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Action checklist / Today's Tasks */}
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[#e7e2d8] pb-3">
              <h3 className="text-sm font-black text-[#1d1c16] uppercase tracking-wide flex items-center gap-1.5">
                <ListTodo size={16} className="text-[#5f5e5e]" />
                Action Plan
              </h3>
              <Link to="/tasks" className="text-[#e3a62f] font-bold text-xs uppercase hover:underline">Tasks</Link>
            </div>
            
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scroll pr-1">
              {stats?.todaysTasks && stats.todaysTasks.length > 0 ? (
                stats.todaysTasks.map((task) => (
                  <div 
                    key={task._id} 
                    className="flex items-start gap-3 p-3 border border-[#e7e2d8] bg-[#f8f3e9]/50 rounded-xl hover:border-slate-350 transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleTaskToggle(task._id, task.completed)}
                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                        task.completed 
                          ? 'bg-[#e3a62f] border-[#e3a62f] text-[#5b3e00]' 
                          : 'border-slate-300 bg-white hover:border-[#e3a62f]'
                      }`}
                    >
                      {task.completed && <span className="material-symbols-outlined text-[10px] font-bold">check</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold text-[#1d1c16] leading-tight transition-all ${task.completed ? 'line-through text-slate-450' : 'group-hover:text-[#7e5700]'}`}>
                        {task.title}
                      </p>
                      {task.leadId?.name && (
                        <p className="text-[9px] text-[#5f5e5e] mt-1 font-mono uppercase">
                          Lead: {task.leadId.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 border border-dashed border-[#e7e2d8] text-center text-xs text-[#5f5e5e] italic rounded-btn">
                  No action items scheduled today.
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate('/tasks')}
            className="w-full mt-4 py-2 border border-[#e7e2d8] rounded-lg text-xs font-bold text-[#7e5700] hover:bg-[#f8f3e9] transition-all"
          >
            Manage Checklist
          </button>
        </div>
      </div>

      {/* Onboarding Checklist Wizard */}
      {wizard && (
        <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-32 w-32 bg-[#e3a62f]/5 blur-3xl pointer-events-none rounded-full"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7e5700] bg-[#fbbb44]/15 px-2 py-0.5 rounded">Setup Assistant</span>
              <h2 className="text-sm font-black text-[#1d1c16] uppercase tracking-wide mt-1.5 font-display">Workspace Onboarding</h2>
              <p className="text-xs text-[#5f5e5e] mt-0.5">Complete these configuration milestones to unlock full pipeline automations.</p>
            </div>
            <button
              onClick={() => setWizard(false)}
              className="text-[9px] font-bold text-[#5f5e5e] hover:text-[#1d1c16] uppercase tracking-wider font-mono border border-[#e7e2d8] px-3 py-1 rounded-lg hover:bg-[#f8f3e9] transition-all"
            >
              Dismiss Setup
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 overflow-x-auto pb-2">
              <BlueprintPath
                steps={steps}
                currentStep={step}
                onStepClick={(idx) => setStep(idx)}
              />
            </div>

            <div className="lg:col-span-4 p-5 bg-[#f8f3e9] border border-[#e7e2d8] rounded-xl flex flex-col justify-between min-h-[140px] hover:border-slate-350 transition-all duration-200">
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#5f5e5e] font-mono">Current Goal {step + 1} of {steps.length}</span>
                <h4 className="text-xs font-bold text-[#1d1c16] uppercase tracking-wider mt-1">{steps[step].title}</h4>
                <p className="text-[11px] text-[#5f5e5e] mt-1.5 leading-relaxed">{steps[step].desc}</p>
              </div>
              <Button
                variant="primary"
                onClick={steps[step].action}
                className="w-fit mt-4 py-2 px-4 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider"
              >
                <span>{steps[step].btnText}</span>
                <ArrowRight size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compass AI Assistant Widget */}
      <div className="bg-[#f3ede3] border border-[#e7e2d8] rounded-xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <div className="w-12 h-12 bg-[#7e5700] rounded-xl flex items-center justify-center relative shadow-md">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#006e2d] rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h4 className="text-sm font-black text-[#7e5700] uppercase tracking-wide">Compass AI Insights</h4>
            <p className="text-xs text-[#504535] mt-0.5">"I've identified 3 high-probability upsell opportunities in your 'Negotiation' stage."</p>
          </div>
        </div>
        <button 
          onClick={() => setAiOpen(true)}
          className="bg-[#7e5700] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:brightness-105 active:scale-98 transition-all"
        >
          Review Insights
        </button>
      </div>

      <AIChatDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default Dashboard;
export { Dashboard };
