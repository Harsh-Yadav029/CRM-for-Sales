import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Target, TrendingUp, AlertCircle, Award } from 'lucide-react';

const QuotaWidget = () => {
  const { user } = useAuth();
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current quarter and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor((now.getMonth() + 3) / 3);

  const fetchQuota = async () => {
    try {
      const { data } = await api.get('/api/quotas');
      // Filter for current user's quota in this quarter/year
      const activeQuota = data.find(
        q => (q.userId?._id === user?._id || q.userId === user?._id) &&
             q.year === currentYear &&
             q.quarter === currentQuarter
      );
      if (activeQuota) {
        setQuota(activeQuota);
      } else {
        // Fallback: calculate attained from leads if no explicit quota object
        const leadsRes = await api.get('/api/leads');
        const wonTotal = leadsRes.data
          .filter(l => l.status === 'Won' && (l.assignedTo?._id === user?._id || l.assignedTo === user?._id))
          .reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);
        
        setQuota({
          targetAmount: 500000, // Default target
          attainedAmount: wonTotal,
          year: currentYear,
          quarter: currentQuarter
        });
      }
    } catch (err) {
      console.error('Error fetching quota details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchQuota();
  }, [user]);

  if (loading) return null;
  if (!quota) return null;

  const pct = Math.min(100, Math.round((quota.attainedAmount / quota.targetAmount) * 100)) || 0;

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-500/10 blur-xl"></div>
      
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sales Quota Attainment</h4>
          <p className="text-[10px] text-slate-400">Quarter Q{quota.quarter} {quota.year}</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-xl font-extrabold text-white tracking-tight">{fmt(quota.attainedAmount)}</span>
        <span className="text-xs text-slate-400">target: {fmt(quota.targetAmount)}</span>
      </div>

      {/* Progress track */}
      <div className="mt-3">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
          <span>Attainment</span>
          <span className="text-amber-500 font-extrabold">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded bg-slate-950 overflow-hidden border border-slate-850">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded transition-all duration-500 shadow-md shadow-amber-500/10"
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-850 pt-3 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
        {pct >= 100 ? (
          <>
            <Award className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-400 font-bold">Target achieved! Outstanding performance!</span>
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span>Close {fmt(quota.targetAmount - quota.attainedAmount)} more to reach target</span>
          </>
        )}
      </div>
    </div>
  );
};

export default QuotaWidget;
