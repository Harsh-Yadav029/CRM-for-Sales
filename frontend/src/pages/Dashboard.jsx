import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import QuotaWidget from '../components/QuotaWidget';
import AIChatDrawer from '../components/AIChatDrawer';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [wizard, setWizard] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/api/dashboard/stats');
      setStats(data);
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const steps = [
    {
      t: 'Invite your team',
      d: 'Add team members to collaborate on deals and track performance.',
      b: 'Invite Users',
      fn: () => navigate('/settings'),
      icon: 'group'
    },
    {
      t: 'Configure pipeline',
      d: 'Set up your sales stages and start tracking deals.',
      b: 'Go to Deals',
      fn: () => navigate('/deals'),
      icon: 'handshake'
    },
    {
      t: 'Create new leads',
      d: 'Manually add prospects or import them to kickstart your pipeline.',
      b: 'Add Lead',
      fn: () => navigate('/leads'),
      icon: 'person_add'
    },
    {
      t: 'Manage tasks',
      d: 'Schedule calls, emails, and meetings to keep deals moving forward.',
      b: 'Go to Tasks',
      fn: () => navigate('/tasks'),
      icon: 'assignment'
    }
  ];

  // Helper values
  const totalRevenue = stats?.wonRevenue || 0;
  const activeDeals = stats?.activeDeals || 0;
  const winRate = stats?.conversionRate || 0;
  const todaysTasksCount = stats?.todaysTasks?.length || 0;
  const recentLeads = stats?.recentLeads || [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Onboarding Wizard / Setup Banner */}
      {wizard && (
        <div className="bg-white rounded-xl border-2 border-on-surface overflow-hidden block-shadow-black">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 p-6 bg-surface-container-low border-r border-outline-variant flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider">Welcome, {user?.name?.split(' ')[0] || 'User'} </h2>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Let's get your Walk The Plan workspace ready for action.</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/leads')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline uppercase tracking-wide"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    Start adding leads
                  </button>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant/60 flex justify-between text-[11px] uppercase font-bold text-on-surface-variant">
                <span>Need help?</span>
                <Link to="/settings" className="text-primary hover:underline">Configure settings</Link>
              </div>
            </div>
            <div className="lg:col-span-8 p-6 relative">
              <button
                onClick={() => setWizard(false)}
                className="absolute top-4 right-4 text-[10px] font-bold text-on-surface-variant/60 hover:text-on-surface bg-surface-container-low hover:bg-surface-container px-3 py-1 border border-outline-variant transition-all uppercase"
              >
                Dismiss
              </button>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quick Setup</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5 mb-4">Complete these steps to optimize your CRM workflow</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`w-full flex items-center justify-between p-2.5 border text-left transition-all text-xs font-bold uppercase tracking-wide ${step === i ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}
                    >
                      <span className="truncate">{s.t}</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </button>
                  ))}
                </div>
                <div className="bg-surface-container-low p-4 border border-outline-variant flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-lg">{steps[step].icon}</span>
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide">{steps[step].t}</h4>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{steps[step].d}</p>
                  </div>
                  <button
                    onClick={steps[step].fn}
                    className="w-fit mt-3 bg-on-surface hover:bg-primary text-white text-xs font-bold px-4 py-2 transition-all block-shadow-black uppercase"
                  >
                    {steps[step].b}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Architecture & Construction</p>
          <h2 className="text-2xl md:text-3xl uppercase font-black text-on-surface tracking-tight">Sales Command Center</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => window.print()}
            className="bg-transparent border-2 border-on-surface px-6 py-2 text-xs font-bold uppercase transition-all hover:bg-on-surface hover:text-white flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="bg-on-surface text-white px-6 py-2 text-xs font-bold uppercase transition-all hover:bg-primary block-shadow flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Plan
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 relative group transition-all hover:border-primary">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary bg-primary/10 p-3 rounded-lg">payments</span>
            <span className="text-primary font-bold text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              +12.4%
            </span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Total Revenue</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface">{fmt(totalRevenue)}</h3>
          <div className="mt-4 pt-4 border-t border-surface-variant flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant">
            <span>Target: {fmt(2100000)}</span>
            <span className="text-primary font-black">118%</span>
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 relative group transition-all hover:border-primary">
          <div className="absolute top-0 left-0 w-1 h-full bg-on-surface"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-on-surface bg-secondary-container/30 p-3 rounded-lg">floor_lamp</span>
            <span className="text-on-surface-variant font-bold text-xs uppercase">Current Stage</span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Active Plans</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface">{activeDeals}</h3>
          <div className="mt-4 flex gap-1 h-1.5">
            <div className="flex-1 bg-primary"></div>
            <div className="flex-1 bg-primary"></div>
            <div className="flex-1 bg-primary"></div>
            <div className="flex-1 bg-surface-variant"></div>
            <div className="flex-1 bg-surface-variant"></div>
          </div>
          <p className="mt-2 text-[10px] uppercase font-bold text-on-surface-variant">60% Blueprint Finalization</p>
        </div>

        {/* Lead Conversion */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 relative group transition-all hover:border-primary">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary bg-primary/10 p-3 rounded-lg">groups</span>
            <span className="text-primary font-bold text-xs flex items-center gap-1 uppercase">
              <span className="material-symbols-outlined text-xs">keyboard_double_arrow_up</span>
              High Performance
            </span>
          </div>
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Lead Conversion</p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface">{winRate}%</h3>
          <div className="mt-4 pt-4 border-t border-surface-variant flex justify-between items-center text-[10px] uppercase font-bold text-on-surface-variant">
            <span>Prev Period: 28.1%</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Project Trajectory & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Trajectory Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-base md:text-lg uppercase font-black text-on-surface">Project Trajectory</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-on-surface"></span>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Acquisition</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary"></span>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Closure</span>
              </div>
            </div>
          </div>
          {/* Custom Dual Bar Chart */}
          <div className="relative h-64 flex items-end justify-between gap-4 border-b border-outline-variant pb-2 px-2">
            {[
              { label: 'MON', acq: '40%', cls: '20%' },
              { label: 'TUE', acq: '60%', cls: '35%' },
              { label: 'WED', acq: '80%', cls: '50%' },
              { label: 'THU', acq: '55%', cls: '70%' },
              { label: 'FRI', acq: '90%', cls: '65%' },
              { label: 'SAT', acq: '30%', cls: '15%' },
              { label: 'SUN', acq: '15%', cls: '5%' }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end gap-1.5 h-full">
                  <div className="w-4 md:w-6 bg-on-surface transition-all duration-1000" style={{ height: item.acq }}></div>
                  <div className="w-4 md:w-6 bg-primary transition-all duration-1000" style={{ height: item.cls }}></div>
                </div>
                <span className="text-[9px] font-extrabold text-outline mt-2">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quota & Tasks Sidebar */}
        <div className="space-y-6">
          <QuotaWidget />

          {/* Tasks Section */}
          <div className="bg-surface-container-lowest border border-outline-variant p-6">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-3">
              <h4 className="text-base uppercase font-black text-on-surface">Upcoming Tasks</h4>
              <Link to="/tasks" className="text-primary font-bold text-xs uppercase hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {stats?.todaysTasks && stats.todaysTasks.length > 0 ? (
                stats.todaysTasks.slice(0, 3).map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate('/tasks')}
                    className="p-4 border border-outline-variant hover:border-on-surface flex items-center justify-between group cursor-pointer transition-all bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 border border-outline-variant bg-surface-container-low flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-lg">call</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate max-w-[140px]">{task.title}</h3>
                        <p className="text-[10px] text-on-surface-variant font-medium">Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-all">check_circle</span>
                  </div>
                ))
              ) : (
                <div className="p-6 border border-outline-variant text-center text-xs text-on-surface-variant italic bg-white">
                  No tasks scheduled for today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Zia AI Chat Trigger Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all hover:scale-110 z-40 border border-amber-600/30"
        title="Consult Zia AI"
      >
        <span className="material-symbols-outlined text-[24px]">smart_toy</span>
      </button>

      <AIChatDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
};

export default Dashboard;
