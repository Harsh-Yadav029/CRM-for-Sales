import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

const BillingCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'

  useEffect(() => {
    const processSimulation = async () => {
      const tenantId = searchParams.get('tenantId');
      const plan = searchParams.get('plan') || 'growth';

      if (!tenantId) {
        setStatus('error');
        return;
      }

      try {
        // Trigger the backend Stripe webhook simulation endpoint
        await api.post('/api/apikeys/../stripe/webhook', {
          type: 'checkout.session.completed',
          data: {
            object: {
              client_reference_id: tenantId,
              metadata: {
                plan: plan.toLowerCase()
              },
              customer: `cus_sim_${Date.now()}`
            }
          }
        });

        setStatus('success');
        
        // Force refresh user profile state mappings
        setTimeout(() => {
          window.location.href = '/billing';
        }, 2000);
      } catch (err) {
        console.error('Simulated webhook failed:', err);
        setStatus('error');
      }
    };

    processSimulation();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-8 space-y-6 shadow-2xl backdrop-blur-sm">
        {status === 'processing' && (
          <>
            <Loader2 className="animate-spin text-amber-500 mx-auto" size={40} />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verifying Payment</h3>
              <p className="text-xs text-slate-400">Processing secure simulated checkout session credentials...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="text-emerald-500 mx-auto" size={40} />
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Subscription Confirmed!</h3>
              <p className="text-xs text-slate-400">Your organization has been successfully upgraded. Redirecting to billing panel...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-3xl mx-auto">⚠️</div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Checkout Verification Failed</h3>
              <p className="text-xs text-slate-400">The checkout session key was invalid. Please contact support or try upgrading again.</p>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all"
            >
              Back to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BillingCallback;
export { BillingCallback };
