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
  Calendar as CalendarIcon, 
  Target, 
  Award, 
  Download, 
  Plus, 
  Bot, 
  CheckCircle2, 
  ArrowRight,
  Briefcase,
  Layers,
  Sparkles,
  Clock,
  CheckSquare,
  User,
  ExternalLink,
  ChevronRight,
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
  CartesianGrid, 
  Legend 
} from 'recharts';
import QuotaWidget from '../components/QuotaWidget';
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
          <Loader2 className="animate-spin text-gold" size={32} />
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Syncing dashboard data...</p>
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

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1 text-white">
          <p className="font-bold text-slate-350 uppercase tracking-wide">{label}</p>
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

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24 md:pb-8 font-sans">
      
      {/* Onboarding Checklist Wizard */}
      {wizard && (
        <Card variant="flat" className="p-6 bg-white border border-line shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-32 w-32 bg-gold/5 blur-3xl pointer-events-none rounded-full"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-gold bg-gold-soft px-2 py-0.5 rounded">Setup Assistant</span>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide mt-1.5 font-display">Workspace Checklist</h2>
              <p className="text-xs text-slate-500 mt-0.5">Complete these configuration milestones to unlock full pipeline automations.</p>
            </div>
            <button
              onClick={() => setWizard(false)}
              className="text-[9px] font-extrabold text-slate-400 hover:text-ink uppercase tracking-wider font-mono border border-line px-3 py-1 rounded-btn hover:bg-slate-55 transition-all"
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

            <div className="lg:col-span-4 p-5 bg-[#FAF9F6] border border-line rounded-card flex flex-col justify-between min-h-[140px] hover:border-slate-350 transition-all duration-200">
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">Current Goal {step + 1} of {steps.length}</span>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider mt-1">{steps[step].title}</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{steps[step].desc}</p>
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
        </Card>
      )}

      {/* Hero Header welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 p-4 border border-line rounded-2xl backdrop-blur-xs select-none">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-gold font-mono">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
          <h1 className="text-xl font-bold text-ink tracking-tight mt-1 flex items-center gap-2 font-display">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
            <Sparkles size={16} className="text-gold animate-pulse" />
          </h1>
        </div>
        <div className="flex gap-2.5">
          <Button 
            variant="secondary" 
            onClick={() => window.print()} 
            className="flex items-center gap-1.5 text-[11px] uppercase font-extrabold py-2 px-4 border border-line hover:bg-slate-55"
            icon={Download}
          >
            Export Sheet
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/leads')} 
            className="flex items-center gap-1.5 text-[11px] uppercase font-extrabold py-2 px-4 shadow-sm shadow-gold/10"
            icon={Plus}
          >
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Metrics, Charts, Deals lists */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* KPI Metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Won Revenue */}
            <Card variant="flat" className="p-5 relative overflow-hidden bg-white/50 border-line hover:border-slate-350 transition-all duration-200">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono block">Revenue Won</span>
              <h3 className="text-xl font-bold font-mono text-ink tracking-tight mt-2">{fmt(totalRevenue)}</h3>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100/50 w-fit px-1.5 py-0.5 rounded font-bold font-mono">
                <TrendingUp size={10} />
                <span>+12.4% vs last mo</span>
              </div>
            </Card>

            {/* Active pipeline volume */}
            <Card variant="flat" className="p-5 relative overflow-hidden bg-white/50 border-line hover:border-slate-350 transition-all duration-200">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono block">Pipeline Deals</span>
              <h3 className="text-xl font-bold font-mono text-ink tracking-tight mt-2">{activeDeals} deals</h3>
              <div className="mt-4 flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200/50 w-fit px-1.5 py-0.5 rounded font-bold font-mono uppercase text-[8px]">
                <span>{fmt(stats?.expectedRevenue || 0)} gross</span>
              </div>
            </Card>

            {/* Close rate */}
            <Card variant="flat" className="p-5 relative overflow-hidden bg-white/50 border-line hover:border-slate-350 transition-all duration-200">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono block">Conversion Rate</span>
              <h3 className="text-xl font-bold font-mono text-ink tracking-tight mt-2">{winRate}%</h3>
              <div className="mt-4 flex items-center gap-1 text-gold bg-gold-soft border border-gold/15 w-fit px-1.5 py-0.5 rounded font-bold font-mono text-[9px]">
                <span>Target 35%</span>
              </div>
            </Card>
          </div>

          {/* Revenue & Pipeline Trajectory */}
          <Card variant="raised" className="p-6 hover:shadow-card-hover transition-all duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-display">Revenue & Pipeline Trajectory</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Won deals value plotted against total pipeline estimations</p>
              </div>
              <div className="flex gap-3 text-[9px] font-bold uppercase text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span>Pipeline</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>Won</span>
                </div>
              </div>
            </div>

            <div className="h-60 w-full">
              {revenueData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center border border-dashed border-line rounded-lg text-slate-400 italic text-xs">
                  No revenue trends found. Add expected revenue to closed-won deals to visualize.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPipeline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F6" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
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
                      stroke="#6366f1" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorPipeline)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Won" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Deals Section */}
          <Card variant="raised" className="p-6 hover:shadow-card-hover transition-all duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-display">Active Pipeline Deals</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Top active opportunities currently in stages of execution</p>
              </div>
              <Link to="/deals" className="text-gold font-bold text-[10px] uppercase hover:underline font-mono flex items-center gap-0.5">
                <span>Pipeline Board</span>
                <ChevronRight size={12} />
              </Link>
            </div>
            
            {stats?.activeDealsList && stats.activeDealsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[9px] border-b border-line bg-[#FAF9F6]/50">
                      <th className="py-2.5 px-3">Deal / Company</th>
                      <th className="py-2.5 px-3">Pipeline Stage</th>
                      <th className="py-2.5 px-3 text-right">Value</th>
                      <th className="py-2.5 px-3 text-right">Assigned Rep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stats.activeDealsList.map((deal) => (
                      <tr 
                        key={deal._id} 
                        onClick={() => navigate(`/leads/${deal._id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <p className="font-bold text-ink hover:text-gold transition-colors">{deal.name}</p>
                          <p className="text-[10px] text-slate-400">{deal.company}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {deal.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          {fmt(deal.expectedRevenue || 0)}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-500">
                          {deal.assignedTo?.name || 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-line text-center text-xs text-slate-400 italic rounded-btn bg-[#FAF9F6]/50">
                No active deals in pipeline. Add some opportunities to display.
              </div>
            )}
          </Card>

          {/* Deals Closing This Month */}
          <Card variant="raised" className="p-6 hover:shadow-card-hover transition-all duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-display">Deals Closing This Month</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">High-probability accounts nearing the closing stages</p>
              </div>
              <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Closure Scope
              </span>
            </div>

            {stats?.dealsClosingThisMonth && stats.dealsClosingThisMonth.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.dealsClosingThisMonth.map((deal) => (
                  <div 
                    key={deal._id}
                    onClick={() => navigate(`/leads/${deal._id}`)}
                    className="p-4 border border-line hover:border-gold/30 rounded-xl bg-[#FAF9F6]/40 cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-ink hover:text-gold transition-colors">{deal.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{deal.company}</p>
                      <span className="inline-block mt-2 text-[8px] font-extrabold uppercase bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded">
                        {deal.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-slate-900 font-mono">{fmt(deal.expectedRevenue || 0)}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{deal.assignedTo?.name?.split(' ')[0] || 'Unassigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-line text-center text-xs text-slate-400 italic rounded-btn bg-[#FAF9F6]/50">
                No deals marked for closing this month. Advance deals to Negotiation or Proposal Sent to track.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Meetings, Today Leads, Action Plan, Quota */}
        <div className="lg:col-span-4 space-y-6">
          
          <QuotaWidget />

          {/* Action Plan for Today Checklists */}
          <Card variant="raised" className="p-5 hover:shadow-card-hover transition-all duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 font-display">
                <ListTodo size={14} className="text-slate-400" />
                Action Plan for Today
              </h4>
              <Link to="/tasks" className="text-gold font-bold text-[10px] uppercase hover:underline font-mono">Tasks</Link>
            </div>
            
            <div className="space-y-2.5">
              {stats?.todaysTasks && stats.todaysTasks.length > 0 ? (
                stats.todaysTasks.map((task) => (
                  <div 
                    key={task._id} 
                    className="flex items-start gap-3 p-3 border border-line bg-[#FAF9F6]/50 rounded-xl hover:border-slate-300 transition-all group"
                  >
                    <button
                      type="button"
                      onClick={() => handleTaskToggle(task._id, task.completed)}
                      className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                        task.completed 
                          ? 'bg-gold border-gold text-ink' 
                          : 'border-slate-300 bg-white hover:border-gold'
                      }`}
                    >
                      {task.completed && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold text-ink leading-tight transition-all ${task.completed ? 'line-through text-slate-400' : 'group-hover:text-gold'}`}>
                        {task.title}
                      </p>
                      {task.leadId?.name && (
                        <p className="text-[9px] text-slate-400 mt-1 font-mono uppercase">
                          Lead: {task.leadId.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 border border-dashed border-line text-center text-xs text-slate-400 italic rounded-btn bg-[#FAF9F6]/30">
                  No action items scheduled today.
                </div>
              )}
            </div>
          </Card>

          {/* Meetings in a Day Section */}
          <Card variant="raised" className="p-5 hover:shadow-card-hover transition-all duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 font-display">
                <CalendarDays size={14} className="text-slate-400" />
                Meetings Today
              </h4>
              <Link to="/calendar" className="text-gold font-bold text-[10px] uppercase hover:underline font-mono">Open Cal</Link>
            </div>

            <div className="space-y-3">
              {stats?.todayMeetings && stats.todayMeetings.length > 0 ? (
                stats.todayMeetings.map((meeting) => (
                  <div 
                    key={meeting._id}
                    onClick={() => navigate('/calendar')}
                    className="p-3 border border-line bg-[#FAF9F6]/40 hover:bg-[#FAF9F6] cursor-pointer rounded-xl hover:border-slate-350 transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-ink">{meeting.title}</h4>
                      <span className="text-[8px] bg-slate-800 text-slate-300 font-mono font-bold px-1.5 py-0.5 rounded shrink-0">
                        {new Date(meeting.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    {meeting.location && <p className="text-[9px] text-slate-500 mt-1">📍 {meeting.location}</p>}
                    <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Rep: {meeting.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 border border-dashed border-line text-center text-xs text-slate-400 italic rounded-btn bg-[#FAF9F6]/30">
                  No meetings scheduled today.
                </div>
              )}
            </div>
          </Card>

          {/* Today's Leads Section */}
          <Card variant="raised" className="p-5 hover:shadow-card-hover transition-all duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Users size={14} className="text-slate-400" />
                Today Leads
              </h4>
              <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono font-bold px-2 py-0.5 rounded shrink-0">
                {stats?.todayLeads?.length || 0} New
              </span>
            </div>

            <div className="space-y-3">
              {stats?.todayLeads && stats.todayLeads.length > 0 ? (
                stats.todayLeads.map((lead) => (
                  <div 
                    key={lead._id}
                    onClick={() => navigate(`/leads/${lead._id}`)}
                    className="p-3 border border-line hover:border-gold/30 bg-[#FAF9F6]/40 hover:bg-[#FAF9F6] cursor-pointer rounded-xl transition-all flex justify-between items-center"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-ink truncate">{lead.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{lead.company}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono font-medium shrink-0">
                      {lead.source}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 border border-dashed border-line text-center text-xs text-slate-400 italic rounded-btn bg-[#FAF9F6]/30">
                  No leads added today.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Zia AI Chat Trigger Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-gold hover:bg-gold/90 text-ink flex items-center justify-center shadow-card-hover transition-all hover:scale-110 z-40 border border-gold/30"
        title="Consult Zia AI"
      >
        <Bot size={22} className="stroke-[2.5]" />
      </button>

      <AIChatDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default Dashboard;
export { Dashboard };
