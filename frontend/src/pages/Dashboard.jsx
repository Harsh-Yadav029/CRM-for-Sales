import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [wizard, setWizard] = useState(true);

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
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 p-6 bg-gradient-to-br from-surface-container-low to-surface-container-high/40 border-r border-outline-variant flex flex-col justify-between">
              <div>
                <h2 className="text-base md:text-lg font-bold text-on-surface">Welcome, {user?.name?.split(' ')[0] || 'User'} </h2>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">Let's get your CRM ready for action.</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/leads')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    Start adding leads
                  </button>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-outline-variant/60 flex justify-between text-[11px]">
                <span className="text-on-surface-variant">Need help?</span>
                <Link to="/settings" className="text-primary font-semibold hover:underline">Configure settings</Link>
              </div>
            </div>
            <div className="lg:col-span-8 p-6 relative">
              <button
                onClick={() => setWizard(false)}
                className="absolute top-4 right-4 text-[10px] font-bold text-on-surface-variant/60 hover:text-on-surface bg-surface-container-low hover:bg-surface-container px-3 py-1 rounded-xl transition-all"
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
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all text-xs font-semibold ${step === i ? 'border-primary bg-surface-container-low text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}
                    >
                      <span className="truncate">{s.t}</span>
                      <span className="material-symbols-outlined text-xs">chevron_right</span>
                    </button>
                  ))}
                </div>
                <div className="bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary text-lg">{steps[step].icon}</span>
                      <h4 className="text-xs font-bold text-on-surface">{steps[step].t}</h4>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{steps[step].d}</p>
                  </div>
                  <button
                    onClick={steps[step].fn}
                    className="w-fit mt-3 bg-primary hover:brightness-110 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                  >
                    {steps[step].b}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Section: Bento Style */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="col-span-2 bg-surface-container-low p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between min-h-[130px]">
          <div>
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Total Revenue</span>
            <div className="font-display-lg text-2xl md:text-3xl font-extrabold text-primary mt-1">{fmt(totalRevenue)}</div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-secondary font-semibold text-xs">
            <span className="material-symbols-outlined text-base">trending_up</span>
            <span>All-time closed wins</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Active Deals</span>
            <div className="font-headline-lg text-2xl font-extrabold text-on-surface mt-1">{activeDeals}</div>
          </div>
          <div className="h-1.5 w-full bg-surface-variant rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-secondary w-3/4 rounded-full"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Win Rate</span>
            <div className="font-headline-lg text-2xl font-extrabold text-on-surface mt-1">{winRate}%</div>
          </div>
          <div className="h-1.5 w-full bg-surface-variant rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-primary w-1/4 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Sales Activity Outreach Performance */}
      <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-title-lg text-base md:text-lg font-bold text-on-surface">Sales Activity</h2>
            <p className="font-body-md text-xs text-on-surface-variant">Daily outreach performance metrics</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span className="font-label-sm text-xs text-on-surface-variant">Calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-xs text-on-surface-variant">Emails</span>
            </div>
          </div>
        </div>

        {/* Visual custom double-bar chart */}
        <div className="flex items-end justify-between h-40 gap-3 px-2 pt-4">
          {[
            { day: 'M', calls: '60%', emails: '40%' },
            { day: 'T', calls: '80%', emails: '50%' },
            { day: 'W', calls: '45%', emails: '70%' },
            { day: 'T', calls: '90%', emails: '30%' },
            { day: 'F', calls: '55%', emails: '85%' },
            { day: 'S', calls: '20%', emails: '15%' },
            { day: 'S', calls: '10%', emails: '5%' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2 w-full items-center">
              <div className="flex gap-[3px] items-end h-28 w-full justify-center">
                <div className="bg-primary w-2.5 rounded-t-sm transition-all duration-1000" style={{ height: item.calls }}></div>
                <div className="bg-secondary w-2.5 rounded-t-sm transition-all duration-1000" style={{ height: item.emails }}></div>
              </div>
              <span className="text-xs font-semibold text-outline">{item.day}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tasks and Wins: Asymmetric Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming Tasks */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-title-lg text-base md:text-lg font-bold text-on-surface">Upcoming Tasks</h2>
            <Link to="/tasks" className="text-primary font-semibold text-xs flex items-center gap-1">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.todaysTasks && stats.todaysTasks.length > 0 ? (
              stats.todaysTasks.slice(0, 3).map((task) => (
                <div
                  key={task._id}
                  onClick={() => navigate('/tasks')}
                  className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center justify-between group hover:border-primary transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">call</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs md:text-sm text-on-surface group-hover:text-primary transition-colors">{task.title}</h3>
                      <p className="text-[10px] text-on-surface-variant">Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-all">check_circle</span>
                </div>
              ))
            ) : (
              <div className="bg-white p-6 border border-outline-variant rounded-xl text-center text-xs text-on-surface-variant italic">
                No tasks scheduled for today.
              </div>
            )}
          </div>
        </section>

        {/* Recent Wins Feed */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="font-title-lg text-base md:text-lg font-bold text-on-surface">Recent Wins</h2>
          <div className="relative pl-6 border-l-2 border-outline-variant space-y-6">
            {recentLeads.filter(l => l.status === 'Won').length > 0 ? (
              recentLeads.filter(l => l.status === 'Won').slice(0, 2).map((lead, idx) => (
                <div key={lead._id} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-white"></div>
                  <div className="bg-secondary-container/10 p-4 rounded-xl border border-secondary-container/20">
                    <h4 className="text-[10px] text-on-secondary-container font-extrabold uppercase tracking-wider">Closed Won</h4>
                    <p className="text-xs md:text-sm font-bold text-on-surface mt-1">{lead.company}</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-secondary-container/10">
                      <span className="text-secondary font-extrabold text-sm">{fmt(lead.expectedRevenue)}</span>
                      <span className="text-on-surface-variant text-[10px]">{lead.name}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Visual elegant fallback with static mockups since there are no Won deals yet */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-white"></div>
                  <div className="bg-secondary-container/10 p-4 rounded-xl border border-secondary-container/20">
                    <h4 className="text-[10px] text-on-secondary-container font-extrabold uppercase tracking-wider">Closed Won</h4>
                    <p className="text-xs md:text-sm font-bold text-on-surface mt-1">Acme Corp Series B</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-secondary-container/10">
                      <span className="text-secondary font-extrabold text-sm">{fmt(1200000)}</span>
                      <span className="text-on-surface-variant text-[10px]">Active Pipeline</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white"></div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <h4 className="text-[10px] text-primary font-extrabold uppercase tracking-wider">Contract Signed</h4>
                    <p className="text-xs md:text-sm font-bold text-on-surface mt-1">Global Logistics Ltd</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-outline-variant/60">
                      <span className="text-primary font-extrabold text-sm">{fmt(850000)}</span>
                      <span className="text-on-surface-variant text-[10px]">Yesterday</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
