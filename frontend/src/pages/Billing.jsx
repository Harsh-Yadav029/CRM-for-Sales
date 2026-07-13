import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Check, Loader2, CreditCard, Sparkles, Building, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Billing = () => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('Starter');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBillingStatus = async () => {
    try {
      const response = await api.get('/api/health');
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
      color: 'bg-white hover:border-gold/30'
    },
    {
      name: 'Growth',
      price: '₹2,999',
      description: 'Scalable automation features for expanding teams',
      features: ['Unlimited Teammates', 'Multi-Pipeline Switcher', 'Visual Workflow Blueprint customizer', 'Export business reports'],
      icon: Building,
      color: 'bg-white hover:border-gold/30',
      badge: 'Popular'
    },
    {
      name: 'Enterprise',
      price: '₹9,999',
      description: 'Maximum AI assistance and custom layouts',
      features: ['Custom fields configuration', 'Global Search Cmd+K drawer', 'Zia AI Gemini assistant integration', 'Developer API key portal access'],
      icon: Sparkles,
      color: 'bg-white hover:border-gold/30',
      badge: 'Advanced'
    }
  ];

  return (
    <RoleGate allow={['admin']}>
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Subscription Plans</span>
            <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Tenant Billing</h2>
            <p className="text-xs text-slate-500 mt-1">Manage tenant-level product subscription tiers and invoices</p>
          </div>

          <Button
            variant="secondary"
            onClick={handlePortal}
            loading={actionLoading === 'portal'}
            icon={CreditCard}
          >
            Customer Billing Portal
          </Button>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const Icon = plan.icon;
            const isActive = currentPlan.toLowerCase() === plan.name.toLowerCase();

            return (
              <Card
                key={plan.name}
                variant="raised"
                className={`p-6 flex flex-col justify-between relative transition-all duration-200 hover:-translate-y-1 ${plan.color}`}
              >
                {plan.badge && (
                  <div className="absolute top-6 right-6">
                    <Badge variant={plan.badge === 'Popular' ? 'gold' : 'neutral'}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-gold-soft flex items-center justify-center text-gold">
                      <Icon size={16} />
                    </div>
                    <h3 className="text-sm font-display font-black text-ink uppercase tracking-wider">{plan.name}</h3>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-3xl font-black text-ink">{plan.price}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">/ month</span>
                    </div>
                    <p className="text-xs text-slate-650 mt-1.5 leading-normal">{plan.description}</p>
                  </div>

                  <ul className="space-y-2 pt-3.5 border-t border-line">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-ink">
                        <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isActive ? (
                    <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-btn bg-[#FAF9F6] text-slate-500 text-xs font-mono font-bold border border-line uppercase select-none">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Active Organization Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={actionLoading !== null}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-btn bg-gold hover:bg-gold/95 text-ink text-xs font-bold transition-all disabled:opacity-50 select-none uppercase tracking-wide"
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
              </Card>
            );
          })}
        </div>
      </div>
    </RoleGate>
  );
};

export default Billing;
export { Billing };
