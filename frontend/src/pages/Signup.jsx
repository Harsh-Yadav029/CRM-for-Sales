import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Loader2, ShieldCheck, Building2, UserPlus } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If registering via an invite token, email is pre-determined or we collect it
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password
      };

      if (token) {
        payload.token = token;
      } else {
        payload.tenantName = form.tenantName || `${form.name}'s Organization`;
      }

      const { data } = await api.post('/api/auth/register', payload);

      // Save token to localStorage (matches AuthContext logic)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId
      }));

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-container px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-outline-variant/50 bg-white/50 p-8 shadow-card backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-primary">
            {token ? <UserPlus className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-on-surface">
            {token ? 'Join Your Team' : 'Create Organization'}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {token 
              ? 'Complete registration to access your workspace' 
              : 'Launch your multi-tenant sales CRM instance'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Full Name</label>
              <input
                type="text"
                required
                className="relative mt-1 block w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Email Address</label>
              <input
                type="email"
                required
                className="relative mt-1 block w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="relative mt-1 block w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {!token && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Company Name</label>
                <input
                  type="text"
                  required
                  className="relative mt-1 block w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
                  placeholder="Acme Corp"
                  value={form.tenantName}
                  onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#111111] hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                token ? 'Join Organization' : 'Create Organization'
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-on-surface-variant">Already registered? </span>
            <button
              type="button"
              className="font-medium text-primary hover:text-primary"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
