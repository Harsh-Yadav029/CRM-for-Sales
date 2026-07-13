import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-paper font-sans">
      {/* Left Column: Register Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 md:p-12 bg-white border-r border-line">
        {/* Top Branding logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-md">
            <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-ink uppercase font-black text-sm tracking-wide">Walk The Plan</span>
        </div>

        {/* Center Panel: Form */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-display font-black text-ink tracking-tight uppercase">
              {token ? 'Join Your Team' : 'Create Organization'}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              {token 
                ? 'Complete registration to access your workspace' 
                : 'Launch your multi-tenant sales CRM instance'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-danger rounded-btn text-xs font-bold leading-normal">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 text-success rounded-btn text-xs font-bold flex items-center gap-2 leading-normal">
              <ShieldCheck size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              id="name"
              placeholder="John Doe"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="name@company.com"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            {!token && (
              <Input
                label="Company Name"
                id="tenantName"
                placeholder="Acme Corp"
                required
                value={form.tenantName}
                onChange={e => setForm({ ...form, tenantName: e.target.value })}
              />
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-line text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          <p>
            <span className="text-slate-400">Already registered? </span>
            <button onClick={() => navigate('/login')} className="text-gold hover:underline">
              Sign In
            </button>
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gold">Privacy</a>
            <a href="#" className="hover:text-gold">Support</a>
          </div>
        </div>
      </div>

      {/* Right Column: Blueprint Graphic Panel */}
      <div className="hidden lg:flex lg:col-span-7 bg-ink relative overflow-hidden flex flex-col justify-center p-16 select-none">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#E7E2D8_1px,transparent_1px),linear-gradient(to_bottom,#E7E2D8_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="absolute top-1/3 left-0 w-full h-px border-t border-dashed border-gold/15"></div>
        <div className="absolute top-2/3 left-0 w-full h-px border-t border-dashed border-gold/15"></div>
        <div className="absolute left-1/3 top-0 w-px h-full border-l border-dashed border-gold/15"></div>
        
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/25 rounded-full text-gold text-[10px] font-mono tracking-widest uppercase">
            <span>Enterprise System Blueprint</span>
          </div>
          
          <h2 className="text-4xl font-display font-black text-white uppercase leading-tight tracking-wide">
            Plan every deal.<br />
            Win every customer.
          </h2>
          
          <p className="text-sm text-white/50 leading-relaxed max-w-md font-sans">
            A premium structured CRM designed for architectural firms, custom building estimators, and complex enterprise pipeline closure paths.
          </p>
        </div>

        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 border border-gold/5 rounded-full flex items-center justify-center">
          <div className="w-80 h-80 border border-gold/5 rounded-full flex items-center justify-center">
            <div className="w-64 h-64 border border-gold/10 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
export { Signup };
