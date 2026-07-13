import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Check, Loader2, CreditCard, Sparkles, Building, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import RoleGate from '../components/RoleGate';

const Billing = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('Starter');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBillingStatus = async () => {
    try {
      // Fetch active tenant profile to see current plan status
      const { data } = await api.get('/api/users');
      // Look up current user's role/tenant context
      const self = data.find(u => u._id === user?._id);
      if (self) {
        // Just fallback to check what backend has (for simplicity, we can fetch from an api that returns active tenant organization)
      }
      
      // Let's call /api/health or get tenant info to check active plan
      const response = await api.get('/api/health'); // contains MongoDB status, etc
      // We can also make a quick GET to retrieve tenant information
      const tenantRes = await api.get('/api/users'); // Or similar
      // Let's check from localStorage first
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      // For high fidelity, let's request tenant subscription level directly
      // In our backend, User schema has tenantId. Let's do a simple heuristic check, or fetch the user's tenant plan
      setCurrentPlan(user?.tenantId?.subscriptionLevel || 'Starter');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const handleUpgrade = async (planName) => {
    setActionLoading(planName);
    try {
      const { data } = await api.post('/api/stripe/create-checkout-session', { plan: planName.toLowerCase() });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upgrade checkout initialization failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    setActionLoading('portal');
    try {
      const { data } = await api.post('/api/stripe/create-portal-session');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Portal navigation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const plans = [
    {
      name: 'Starter',
      price: '₹0',
      description: 'Core pipeline tools for small rep teams',
      features: ['Up to 5 teammates', 'Standard Deal Pipelines', 'Activity Logs', 'VoIP call logs'],
      icon: Zap,
      color: 'border-outline-variant/50 bg-white/20'
    },
    {
      name: 'Growth',
      price: '₹2,999',
      description: 'Scalable automation features for expanding teams',
      features: ['Unlimited Teammates', 'Multi-Pipeline Switcher', 'Visual Workflow Blueprint customizer', 'Export business reports'],
      icon: Building,
      color: 'border-amber-500/30 bg-gold/5',
      badge: 'Popular'
    },
    {
      name: 'Enterprise',
      price: '₹9,999',
      description: 'Maximum AI assistance and custom layouts',
      features: ['Custom fields configuration', 'Global Search Cmd+K drawer', 'Zia AI Gemini assistant integration', 'Developer API key portal access'],
      icon: Sparkles,
      color: 'border-blue-500/30 bg-blue-500/5',
      badge: 'Advanced'
    }
  ];

  return (
    <RoleGate allow={['admin']}>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Organization Billing</h2>
            <p className="text-xs text-on-surface-variant">Manage tenant-level product subscription tiers and invoices</p>
          </div>

          <button
            onClick={handlePortal}
            disabled={actionLoading !== null}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface hover:text-on-surface px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50"
          >
            {actionLoading === 'portal' ? <Loader2 className="animate-spin" size={13} /> : <CreditCard size={14} />}
            Customer Billing Portal
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const Icon = plan.icon;
            const isActive = currentPlan.toLowerCase() === plan.name.toLowerCase();

            return (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col justify-between relative transition-all duration-200 hover:-translate-y-1 ${plan.color}`}
              >
                {plan.badge && (
                  <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    plan.badge === 'Popular' ? 'bg-gold/20 text-primary' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                      <Icon size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">{plan.name}</h3>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-on-surface">{plan.price}</span>
                      <span className="text-[10px] text-on-surface-variant">/ month</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-normal">{plan.description}</p>
                  </div>

                  <ul className="space-y-2 pt-3 border-t border-outline-variant/40">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-[10px] text-on-surface">
                        <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isActive ? (
                    <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-850 text-on-surface-variant text-xs font-bold border border-outline-variant/50">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Active Organization Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold hover:brightness-105 text-[#111111] text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {actionLoading === plan.name ? (
                        <Loader2 className="animate-spin" size={13} />
                      ) : (
                        <>
                          Subscribe {plan.name}
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RoleGate>
  );
};

export default Billing;
export { Billing };
