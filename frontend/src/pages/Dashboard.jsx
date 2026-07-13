import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Sparkles, TrendingUp, Users, DollarSign, Calendar, Target, Award, Download, Plus, Bot } from 'lucide-react';
import QuotaWidget from '../components/QuotaWidget';
import AIChatDrawer from '../components/AIChatDrawer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BlueprintPath from '../components/BlueprintPath';

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
        <Loader2 className="animate-spin text-gold" size={28} />
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

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24 md:pb-8 font-sans">
      {/* Onboarding Wizard / Blueprint Path Stops */}
      {wizard && (
        <Card variant="flat" className="p-6 bg-white border border-line">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-display font-black text-ink uppercase tracking-wider">Workspace Blueprint Checklist</h2>
              <p className="text-xs text-slate-500 mt-1">Complete these setup steps to optimize your pipeline execution.</p>
            </div>
            <button
              onClick={() => setWizard(false)}
              className="text-[10px] font-bold text-slate-400 hover:text-ink uppercase tracking-wider font-mono border border-line px-2.5 py-1 rounded-btn hover:bg-gold-soft transition-all"
            >
              Dismiss Setup
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Blueprint path visualization */}
            <div className="lg:col-span-8 overflow-x-auto pb-2">
              <BlueprintPath
                steps={steps}
                currentStep={step}
                onStepClick={(idx) => setStep(idx)}
              />
            </div>

            {/* active stop details */}
            <div className="lg:col-span-4 p-5 bg-[#FAF9F6] border border-line rounded-card flex flex-col justify-between min-h-[140px]">
              <div>
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">{steps[step].title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{steps[step].desc}</p>
              </div>
              <Button
                variant="primary"
                onClick={steps[step].action}
                className="w-fit mt-4 py-2 px-4"
              >
                <span>{steps[step].btnText}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Page Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Mission Control</span>
          <h1 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Sales Command Center</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => window.print()} icon={Download}>
            Export Report
          </Button>
          <Button variant="primary" onClick={() => navigate('/leads')} icon={Plus}>
            New Opportunity
          </Button>
        </div>
      </div>

      {/* KPI Grid - Hero / supporting stat variation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue - HERO Stat */}
        <Card variant="raised" className="p-6 md:col-span-1 border-l-4 border-l-gold relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Total Revenue Won</span>
            <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">+12.4%</span>
          </div>
          <h3 className="text-3xl font-bold font-mono text-ink tracking-tight">{fmt(totalRevenue)}</h3>
          <div className="mt-6 pt-4 border-t border-line flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 font-mono">
            <span>Quota Target: {fmt(2100000)}</span>
            <span className="text-gold font-black">118% Achieved</span>
          </div>
        </Card>

        {/* Active Deals - Supporting stat */}
        <Card variant="flat" className="p-6 relative overflow-hidden group">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-2">Active Execution Pipeline</span>
          <h3 className="text-2xl font-bold font-mono text-ink tracking-tight">{activeDeals} opportunities</h3>
          <div className="mt-6 flex gap-1 h-1">
            <div className="flex-1 bg-gold rounded-full"></div>
            <div className="flex-1 bg-gold rounded-full"></div>
            <div className="flex-1 bg-gold rounded-full"></div>
            <div className="flex-1 bg-line rounded-full"></div>
            <div className="flex-1 bg-line rounded-full"></div>
          </div>
          <p className="mt-3 text-[10px] uppercase font-bold text-slate-400 font-mono">60% blueprints finalized</p>
        </Card>

        {/* Conversion rate */}
        <Card variant="flat" className="p-6 relative overflow-hidden group">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-2">Close Conversion Rate</span>
          <h3 className="text-2xl font-bold font-mono text-ink tracking-tight">{winRate}%</h3>
          <div className="mt-6 pt-4 border-t border-line text-[10px] uppercase font-bold text-slate-400 font-mono">
            <span>Previous Quarter: 28.1%</span>
          </div>
        </Card>
      </div>

      {/* Main Charts & Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Trajectory Chart */}
        <Card variant="raised" className="lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider">Project Trajectory</h4>
            <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-line rounded-full"></span>
                <span>Acquisition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-gold rounded-full"></span>
                <span>Closure</span>
              </div>
            </div>
          </div>

          <div className="relative h-64 flex items-end justify-between gap-4 border-b border-line pb-2 px-2 font-mono">
            {[
              { label: 'MON', acq: '40%', cls: '20%' },
              { label: 'TUE', acq: '60%', cls: '35%' },
              { label: 'WED', acq: '80%', cls: '50%' },
              { label: 'THU', acq: '55%', cls: '70%' },
              { label: 'FRI', acq: '90%', cls: '65%' },
              { label: 'SAT', acq: '30%', cls: '15%' },
              { label: 'SUN', acq: '15%', cls: '5%' }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-[80%]">
                  <div className="w-3 bg-line rounded-t-sm transition-all duration-1000" style={{ height: item.acq }}></div>
                  <div className="w-3 bg-gold rounded-t-sm transition-all duration-1000" style={{ height: item.cls }}></div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 mt-2">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quota & Tasks Sidebar */}
        <div className="space-y-6">
          <QuotaWidget />

          {/* Tasks Section */}
          <Card variant="raised" className="p-6">
            <div className="flex justify-between items-center mb-4 border-b border-line pb-3">
              <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider">Upcoming Stops</h4>
              <Link to="/tasks" className="text-gold font-bold text-xs uppercase hover:underline font-mono">View All</Link>
            </div>
            <div className="space-y-3">
              {stats?.todaysTasks && stats.todaysTasks.length > 0 ? (
                stats.todaysTasks.slice(0, 3).map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate('/tasks')}
                    className="p-4 border border-line hover:border-gold/30 flex items-center justify-between group cursor-pointer transition-all bg-[#FAF9F6] rounded-btn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold-soft flex items-center justify-center text-gold rounded-lg">
                        <span className="material-symbols-outlined text-sm font-bold">call</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-ink group-hover:text-gold transition-colors truncate max-w-[140px]">{task.title}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-gold transition-all">check_circle</span>
                  </div>
                ))
              ) : (
                <div className="p-6 border border-dashed border-line text-center text-xs text-slate-400 italic rounded-btn">
                  No tasks scheduled.
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
