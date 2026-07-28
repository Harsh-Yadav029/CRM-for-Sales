import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  Zap,
  MessageSquare,
  Calendar,
  BrainCircuit,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Star,
  Play,
  ChevronRight,
  Building2,
  Users,
  BarChart3,
  X,
  Loader2,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const LandingPage = ({ showLoginOnInit = false }) => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(showLoginOnInit);
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleOpenAuth = (register = false) => {
    if (user) {
      navigate('/');
    } else {
      setIsRegister(register);
      setAuthError('');
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegister) {
        const { data } = await api.post('/api/auth/register', {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: 'admin'
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        window.location.href = '/';
      } else {
        await login(authForm.email, authForm.password);
        window.location.href = '/';
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { data } = await api.post('/api/auth/google-login', { idToken });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      window.location.href = '/';
    } catch (err) {
      console.error("Google Auth error:", err);
      setAuthError(err.response?.data?.message || 'Google Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#ece1d3] font-sans selection:bg-[#e3a62f] selection:text-[#121212]">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION HEADER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#18130b]/80 backdrop-blur-md border-b border-[#504535]/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-[#e3a62f]/30 shadow-lg shadow-amber-500/10">
              <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-mono text-xs font-black uppercase tracking-widest text-[#ffc254]">Walk The Plan</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-[#d4c4af]">
            <a href="#features" className="hover:text-[#ffc254] transition-colors">Features</a>
            <a href="#solutions" className="hover:text-[#ffc254] transition-colors">Platform</a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-lg bg-[#e3a62f] text-[#422c00] font-bold text-xs hover:bg-[#ffc254] transition-all flex items-center space-x-2 shadow-md shadow-amber-500/20"
              >
                <span>Go to Workspace</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth(false)}
                  className="text-xs font-bold text-[#d4c4af] hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuth(true)}
                  className="px-5 py-2.5 rounded-lg bg-[#e3a62f] text-[#422c00] font-bold text-xs hover:bg-[#ffc254] transition-all flex items-center space-x-2 shadow-md shadow-amber-500/20"
                >
                  <span>Sign Up</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* HERO SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#e3a62f]/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-[#e3a62f]/30 bg-[#e3a62f]/10 text-[#ffc254] text-[11px] font-mono font-bold tracking-wider mb-6">
            <Zap size={12} className="animate-pulse text-[#ffc254]" />
            <span>POWERED BY TWILIO VOIP • NYLAS HUB • GEMINI AI</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#ece1d3] tracking-tight leading-[1.1] mb-6">
            Architectural Precision Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffc254] via-[#e3a62f] to-[#ffdeab]">Sales Velocity</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-base text-[#d4c4af] leading-relaxed mb-10">
            The next-generation CRM crafted for luxury interior design studios, architectural firms, and high-performance sales teams. Drive deals from first inquiry to VR walkthrough and closed contract.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleOpenAuth(false)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#e3a62f] text-[#422c00] font-extrabold text-sm hover:bg-[#ffc254] transition-all flex items-center justify-center space-x-3 shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <span>Launch Studio CRM</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-[#504535] bg-[#201b13]/60 text-[#ece1d3] font-bold text-sm hover:bg-[#2f2920] transition-all flex items-center justify-center space-x-2"
            >
              <Play size={14} className="text-[#ffc254]" />
              <span>Explore Features</span>
            </a>
          </div>

          {/* Hero Dashboard Graphic Mockup */}
          <div className="mt-16 rounded-2xl border border-[#504535]/80 bg-[#18130b] p-4 md:p-6 shadow-2xl shadow-black/80 relative group">
            <div className="flex items-center justify-between border-b border-[#504535]/40 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="text-[10px] font-mono text-[#9d8f7b] ml-2">walktheplan.in/dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-[#e3a62f]/20 text-[#ffc254] font-mono text-[10px] font-bold">LIVE VOIP ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="rounded-xl bg-[#201b13] p-4 border border-[#504535]/50">
                <span className="text-[10px] font-mono uppercase text-[#9d8f7b] font-bold">Active Prospects</span>
                <p className="text-2xl font-black text-[#ffc254] mt-1">₹4.2 Cr</p>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 inline-block">+18.4% this month</span>
              </div>
              <div className="rounded-xl bg-[#201b13] p-4 border border-[#504535]/50">
                <span className="text-[10px] font-mono uppercase text-[#9d8f7b] font-bold">Showroom Sessions</span>
                <p className="text-2xl font-black text-[#ece1d3] mt-1">32 Booked</p>
                <span className="text-[10px] text-[#9d8f7b] font-bold mt-1 inline-block">VR Studio Slot #4</span>
              </div>
              <div className="rounded-xl bg-[#201b13] p-4 border border-[#504535]/50">
                <span className="text-[10px] font-mono uppercase text-[#9d8f7b] font-bold">Automated Pipeline</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">100% Synced</p>
                <span className="text-[10px] text-[#9d8f7b] font-bold mt-1 inline-block">Auto-Stage Advancements</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* FEATURES SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-[#18130b] border-t border-[#504535]/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#ffc254]">Engineered for Conversion</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#ece1d3] tracking-tight mt-2">
              Everything Your Studio Needs to Close Deals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-[#504535]/60 bg-[#201b13] p-6 hover:border-[#e3a62f]/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#e3a62f]/10 border border-[#e3a62f]/30 flex items-center justify-center text-[#ffc254] mb-6 group-hover:scale-110 transition-transform">
                <PhoneCall size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#ece1d3] mb-2">Real-Time Twilio VoIP Calling</h3>
              <p className="text-xs text-[#d4c4af] leading-relaxed">
                Initiate in-browser phone calls directly from lead cards with automated call logs, disposition recording, and duration tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-[#504535]/60 bg-[#201b13] p-6 hover:border-[#e3a62f]/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#ece1d3] mb-2">Automated Stage Transitions</h3>
              <p className="text-xs text-[#d4c4af] leading-relaxed">
                Leads automatically advance from <i>New</i> to <i>Contacted</i> or <i>Demo Scheduled</i> as soon as emails, calls, or meetings occur.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-[#504535]/60 bg-[#201b13] p-6 hover:border-[#e3a62f]/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#ece1d3] mb-2">Nylas Communication Hub</h3>
              <p className="text-xs text-[#d4c4af] leading-relaxed">
                Synchronize email threads, SMS text messages, and WhatsApp conversations into one unified client timeline.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-[#504535]/60 bg-[#201b13] p-6 hover:border-[#e3a62f]/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#ece1d3] mb-2">VR Showroom Scheduling</h3>
              <p className="text-xs text-[#d4c4af] leading-relaxed">
                Book client walkthrough slots, attach blueprint CAD files, and auto-dispatch reminder tasks to sales representatives.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-[#504535]/60 bg-[#201b13] p-6 hover:border-[#e3a62f]/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <BrainCircuit size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#ece1d3] mb-2">Gemini AI Pipeline Summaries</h3>
              <p className="text-xs text-[#d4c4af] leading-relaxed">
                Instant AI-driven summaries of prospect sentiment, deal health, and recommended next actions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-[#504535]/60 bg-[#201b13] p-6 hover:border-[#e3a62f]/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-[#e3a62f]/10 border border-[#e3a62f]/30 flex items-center justify-center text-[#ffc254] mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#ece1d3] mb-2">Enterprise Security & RBAC</h3>
              <p className="text-xs text-[#d4c4af] leading-relaxed">
                Strict lead ownership scoping for reps, manager oversight, Google OAuth SSO, and audit logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* FOOTER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#504535]/40 py-12 px-6 bg-[#18130b]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-[#e3a62f]/30">
              <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-mono text-xs font-bold text-[#ffc254] uppercase tracking-wider">Walk The Plan CRM</span>
          </div>

          <div className="text-[11px] text-[#9d8f7b]">
            © {new Date().getFullYear()} Walk The Plan CRM. All rights reserved. Designed for Architectural & Sales Excellence.
          </div>

          <div className="flex items-center space-x-6 text-xs text-[#d4c4af]">
            <button onClick={() => handleOpenAuth(false)} className="hover:text-[#ffc254] transition-colors">Sign In</button>
            <a href="#features" className="hover:text-[#ffc254] transition-colors">Features</a>
          </div>
        </div>
      </footer>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* AUTH POPUP MODAL OVERLAY */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowAuthModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-[#504535] bg-[#18130b] p-6 md:p-8 shadow-2xl text-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Accent */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#e3a62f]/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-[#504535]/40 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-[#e3a62f]/30">
                  <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#ece1d3]">
                    {isRegister ? 'Create Studio Workspace' : 'Sign In to Studio CRM'}
                  </h3>
                  <p className="text-[10px] text-[#9d8f7b] font-mono">Walk The Plan Sales Platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[#9d8f7b] hover:text-[#ece1d3] transition-colors p-1 rounded-lg hover:bg-[#201b13]"
              >
                <X size={18} />
              </button>
            </div>

            {authError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 font-bold">
                {authError}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl border border-[#504535] bg-[#201b13] hover:bg-[#2f2920] text-[#ece1d3] font-bold text-xs transition-all flex items-center justify-center space-x-3 mb-4 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google SSO</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-[#504535]/40"></div>
              <span className="px-3 text-[10px] text-[#9d8f7b] uppercase font-mono font-bold">OR</span>
              <div className="flex-grow border-t border-[#504535]/40"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#9d8f7b] font-bold mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3 top-3 text-[#9d8f7b]" />
                    <input
                      type="text"
                      required
                      placeholder="Harsh Yadav"
                      className="w-full rounded-xl border border-[#504535] bg-[#201b13] pl-9 pr-4 py-2.5 text-xs text-[#ece1d3] placeholder-[#9d8f7b]/50 focus:border-[#e3a62f] focus:outline-none"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#9d8f7b] font-bold mb-1">Work Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-[#9d8f7b]" />
                  <input
                    type="email"
                    required
                    placeholder="rep@walktheplan.in"
                    className="w-full rounded-xl border border-[#504535] bg-[#201b13] pl-9 pr-4 py-2.5 text-xs text-[#ece1d3] placeholder-[#9d8f7b]/50 focus:border-[#e3a62f] focus:outline-none"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#9d8f7b] font-bold mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-[#9d8f7b]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#504535] bg-[#201b13] pl-9 pr-4 py-2.5 text-xs text-[#ece1d3] placeholder-[#9d8f7b]/50 focus:border-[#e3a62f] focus:outline-none"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-[#e3a62f] hover:bg-[#ffc254] text-[#422c00] font-extrabold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 mt-2"
              >
                {authLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? 'Create Account & Enter' : 'Sign In to Workspace'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-[#9d8f7b]">
              {isRegister ? (
                <span>
                  Already registered?{' '}
                  <button onClick={() => setIsRegister(false)} className="text-[#ffc254] font-bold hover:underline">
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New studio team?{' '}
                  <button onClick={() => setIsRegister(true)} className="text-[#ffc254] font-bold hover:underline">
                    Create Account
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
