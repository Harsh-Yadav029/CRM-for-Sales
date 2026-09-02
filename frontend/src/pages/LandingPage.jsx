import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PhoneCall,
  Zap,
  MessageSquare,
  Calendar,
  BrainCircuit,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Play,
  X,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  TrendingUp,
  Compass,
  FileSpreadsheet,
  Check,
  ChevronDown,
  Layers,
  Globe2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const LandingPage = ({ showLoginOnInit = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // Modal & Auth state
  const [showAuthModal, setShowAuthModal] = useState(showLoginOnInit);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Interactive Product Showcase State
  const [activeTab, setActiveTab] = useState('voip'); // 'voip', 'pipeline', 'ai', 'vr'

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Sync modal state if navigating explicitly to /login
  useEffect(() => {
    if (showLoginOnInit || location.pathname === '/login') {
      setShowAuthModal(true);
    }
  }, [showLoginOnInit, location.pathname]);

  const handleOpenAuth = () => {
    if (user) {
      navigate('/');
    } else {
      setAuthError('');
      setShowAuthModal(true);
    }
  };

  const handleCloseAuth = () => {
    setShowAuthModal(false);
    if (location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await login(authForm.email, authForm.password);
      window.location.href = '/';
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
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
      console.error('Google Auth error:', err);
      setAuthError(err.response?.data?.message || 'Google Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fef9ee] text-[#1d1c16] font-sans antialiased selection:bg-[#e3a62f] selection:text-[#5b3e00]">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 1. STICKY TOP NAVIGATION HEADER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#fef9ee]/90 backdrop-blur-md border-b border-[#e7e2d8] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-xs border border-[#e7e2d8] bg-white">
              <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-display text-sm font-extrabold uppercase tracking-tight text-[#7e5700]">
                Walk The Plan
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#f8f3e9] text-[#7e5700] border border-[#e7e2d8]">
                CRM v2.4
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-[#5f5e5e]">
            <a href="#features" className="hover:text-[#7e5700] transition-colors">Features</a>
            <a href="#showcase" className="hover:text-[#7e5700] transition-colors">Live Showcase</a>
            <a href="#lifecycle" className="hover:text-[#7e5700] transition-colors">Deal Lifecycle</a>
            <a href="#security" className="hover:text-[#7e5700] transition-colors">Security</a>
            <a href="#faq" className="hover:text-[#7e5700] transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            {user ? (
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg bg-[#e3a62f] text-[#5b3e00] font-bold text-xs hover:bg-[#fbbb44] active:scale-98 transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <span>Go to Workspace</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleOpenAuth}
                className="px-4 py-2 rounded-lg bg-[#e3a62f] text-[#5b3e00] font-bold text-xs hover:bg-[#fbbb44] active:scale-98 transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <span>Sign In</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 2. HERO SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#fef9ee] via-[#f8f3e9] to-[#fef9ee]">
        {/* Subtle Architectural Grid background glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e7e2d840_1px,transparent_1px),linear-gradient(to_bottom,#e7e2d840_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-[#e7e2d8] bg-white text-[#7e5700] text-[11px] font-mono font-semibold tracking-wide shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-[#006e2d] animate-pulse"></span>
            <span>ARCHITECTURAL SALES ENGINE • TWILIO • NYLAS • GEMINI AI</span>
          </div>

          {/* Main Hero Title */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1d1c16] tracking-tight leading-[1.12] mb-6">
            Architectural Precision Meets{' '}
            <span className="text-[#7e5700] underline decoration-[#e3a62f] decoration-wavy decoration-2">
              High-Velocity Sales
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#5f5e5e] font-normal leading-relaxed mb-8">
            The bespoke CRM crafted for luxury interior design studios, architectural firms, and high-ticket sales teams. Drive prospects effortlessly from first blueprint inquiry to VR showroom walkthrough and signed contracts.
          </p>

          {/* Call to actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-10">
            <button
              onClick={handleOpenAuth}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#e3a62f] hover:bg-[#fbbb44] text-[#5b3e00] font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-95"
            >
              <span>Launch Studio CRM</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#showcase"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#e7e2d8] bg-white text-[#1d1c16] font-semibold text-xs sm:text-sm hover:bg-[#f8f3e9] transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Play size={14} className="text-[#7e5700] fill-[#7e5700]" />
              <span>Explore Live Showcase</span>
            </a>
          </div>

          {/* Feature Badge Ribbon */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] font-semibold text-[#5f5e5e]">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={15} className="text-[#006e2d]" />
              <span>In-Browser VoIP Telephony</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={15} className="text-[#006e2d]" />
              <span>Nylas Multi-Channel Sync</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={15} className="text-[#006e2d]" />
              <span>VR Showroom Calendar</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={15} className="text-[#006e2d]" />
              <span>Gemini AI Deal Scoring</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 3. INTERACTIVE PRODUCT SHOWCASE CONSOLE (HERO PREVIEW) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="showcase" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-6">
        <div className="bg-white border border-[#e7e2d8] rounded-2xl shadow-card overflow-hidden">
          {/* Showcase Control Bar */}
          <div className="bg-[#f8f3e9] border-b border-[#e7e2d8] px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#ba1a1a]/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#e3a62f] inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#006e2d] inline-block"></span>
              <span className="text-xs font-mono font-semibold text-[#7e5700] ml-2">walktheplan.crm/app/live-console</span>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center bg-white border border-[#e7e2d8] p-1 rounded-xl shadow-xs text-xs font-semibold">
              <button
                onClick={() => setActiveTab('voip')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === 'voip'
                    ? 'bg-[#e3a62f] text-[#5b3e00] shadow-xs font-bold'
                    : 'text-[#5f5e5e] hover:text-[#1d1c16]'
                }`}
              >
                <PhoneCall size={13} />
                <span>Twilio VoIP Dialer</span>
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === 'pipeline'
                    ? 'bg-[#e3a62f] text-[#5b3e00] shadow-xs font-bold'
                    : 'text-[#5f5e5e] hover:text-[#1d1c16]'
                }`}
              >
                <Layers size={13} />
                <span>Visual Kanban</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === 'ai'
                    ? 'bg-[#e3a62f] text-[#5b3e00] shadow-xs font-bold'
                    : 'text-[#5f5e5e] hover:text-[#1d1c16]'
                }`}
              >
                <Sparkles size={13} />
                <span>Gemini AI Copilot</span>
              </button>
              <button
                onClick={() => setActiveTab('vr')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === 'vr'
                    ? 'bg-[#e3a62f] text-[#5b3e00] shadow-xs font-bold'
                    : 'text-[#5f5e5e] hover:text-[#1d1c16]'
                }`}
              >
                <Calendar size={13} />
                <span>VR Showroom</span>
              </button>
            </div>
          </div>

          {/* Interactive Tab Viewport */}
          <div className="p-4 sm:p-8 bg-[#fdfaf4] min-h-[380px]">
            {/* TAB 1: VOIP DIALER */}
            {activeTab === 'voip' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {/* Active Call Card */}
                <div className="md:col-span-2 bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-4 border-b border-[#e7e2d8]">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] font-bold font-mono">
                          AK
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#1d1c16]">Arjun Kapoor</h4>
                          <p className="text-[11px] text-[#5f5e5e] font-mono">Penthouse Interior • DLF Magnolias (+91 98110 XXXXX)</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#006e2d]/10 text-[#006e2d] text-xs font-semibold font-mono flex items-center space-x-1 tabular-nums">
                        <span className="w-2 h-2 rounded-full bg-[#006e2d] animate-ping"></span>
                        <span>04:18 IN CALL</span>
                      </span>
                    </div>

                    {/* Audio Wave Visualizer Simulation */}
                    <div className="my-6 p-4 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 h-8">
                        {[40, 80, 55, 95, 30, 70, 85, 45, 100, 60, 35, 75, 90, 50, 65, 80, 40].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-[#e3a62f] rounded-full transition-all duration-300"
                            style={{ height: `${h}%` }}
                          ></span>
                        ))}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-semibold text-[#5f5e5e] uppercase">Audio Sentiment</span>
                        <p className="text-xs font-bold text-[#006e2d]">High Buying Intent (92%)</p>
                      </div>
                    </div>

                    {/* Live Transcript Snippet */}
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-[#e7e2d8]">
                        <span className="font-bold text-[#7e5700] font-mono">Prospect:</span> "We loved the 3D kitchen layout render. Can we schedule a VR walkthrough for Saturday morning?"
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#f8f3e9] border border-[#e7e2d8]">
                        <span className="font-bold text-[#1d1c16] font-mono">Sales Rep:</span> "Absolutely Arjun, I am locking in VR Studio Slot #2 at 11:00 AM right now."
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#e7e2d8]">
                    <span className="text-[11px] text-[#5f5e5e] font-medium">1-Click Automated Stage Move: <strong className="text-[#7e5700] font-bold">Demo Scheduled</strong></span>
                    <button className="px-4 py-2 rounded-lg bg-[#ba1a1a] text-white font-bold text-xs shadow-xs hover:bg-[#ba1a1a]/90 flex items-center space-x-1.5">
                      <PhoneCall size={13} className="rotate-[135deg]" />
                      <span>End & Log Call</span>
                    </button>
                  </div>
                </div>

                {/* Quick Disposition Panel */}
                <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 shadow-xs space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#7e5700]">Instant Call Dispositions</h4>
                  <div className="space-y-2 text-xs font-medium">
                    <button className="w-full text-left p-2.5 rounded-lg border border-[#e3a62f] bg-[#f8f3e9] font-bold text-[#7e5700] flex items-center justify-between">
                      <span>VR Walkthrough Confirmed</span>
                      <Check size={14} />
                    </button>
                    <button className="w-full text-left p-2.5 rounded-lg border border-[#e7e2d8] hover:bg-[#f8f3e9] text-[#5f5e5e] flex items-center justify-between">
                      <span>Follow-up with Revised CAD</span>
                    </button>
                    <button className="w-full text-left p-2.5 rounded-lg border border-[#e7e2d8] hover:bg-[#f8f3e9] text-[#5f5e5e] flex items-center justify-between">
                      <span>Commercial Quote Requested</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-[#f8f3e9] text-[11px] text-[#5f5e5e] space-y-1">
                    <p className="font-bold text-[#1d1c16]">Twilio WebRTC Stats</p>
                    <p className="font-mono tabular-nums">Latency: 28ms • Codec: Opus HD • Jitter: 0.2ms</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VISUAL KANBAN */}
            {activeTab === 'pipeline' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                {/* Column 1 */}
                <div className="bg-[#f8f3e9] border border-[#e7e2d8] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase text-[#7e5700] tracking-wide">Showroom Booked (3)</span>
                    <span className="font-mono text-xs font-bold text-[#5f5e5e] tabular-nums">₹48.5L</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white border border-[#e7e2d8] rounded-lg p-3 shadow-xs">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-xs text-[#1d1c16]">Villa 44 • Golf Course Ext</h5>
                        <span className="text-[10px] font-mono font-bold text-[#006e2d] tabular-nums">₹28.0L</span>
                      </div>
                      <p className="text-[10px] text-[#5f5e5e] mt-1">Lead: Vikram Malhotra • VR Slot Sat</p>
                    </div>
                    <div className="bg-white border border-[#e7e2d8] rounded-lg p-3 shadow-xs">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-xs text-[#1d1c16]">Modern Duplex • Worli</h5>
                        <span className="text-[10px] font-mono font-bold text-[#006e2d] tabular-nums">₹20.5L</span>
                      </div>
                      <p className="text-[10px] text-[#5f5e5e] mt-1">Lead: Sneha Rao • Blueprints Uploaded</p>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-[#f8f3e9] border border-[#e7e2d8] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase text-[#7e5700] tracking-wide">Proposal Sent (2)</span>
                    <span className="font-mono text-xs font-bold text-[#5f5e5e] tabular-nums">₹74.0L</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white border border-[#e3a62f] rounded-lg p-3 shadow-xs ring-1 ring-[#e3a62f]/30">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-xs text-[#1d1c16]">Sky Mansion • Bandra</h5>
                        <span className="text-[10px] font-mono font-bold text-[#006e2d] tabular-nums">₹52.0L</span>
                      </div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold bg-[#e3a62f]/20 text-[#7e5700]">
                        Quote #WTP-2026-084
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-[#f8f3e9] border border-[#e7e2d8] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase text-[#006e2d] tracking-wide">Closed Won (4)</span>
                    <span className="font-mono text-xs font-bold text-[#006e2d] tabular-nums">₹1.42 Cr</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white border border-[#e7e2d8] rounded-lg p-3 shadow-xs">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-xs text-[#1d1c16]">Heritage Suite • South Mumbai</h5>
                        <span className="text-[10px] font-mono font-bold text-[#006e2d] tabular-nums">₹68.0L</span>
                      </div>
                      <p className="text-[10px] text-[#006e2d] font-semibold mt-1">✓ Invoice #INV-102 Deposit Paid</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: GEMINI AI COPILOT */}
            {activeTab === 'ai' && (
              <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-[#e7e2d8]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700]">
                      <BrainCircuit size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1d1c16]">Gemini 2.5 Deal Intelligence</h4>
                      <p className="text-[10px] text-[#5f5e5e]">Real-time pipeline analysis & recommended next steps</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#006e2d]/10 text-[#006e2d] text-xs font-semibold tabular-nums">
                    Deal Health: 94/100
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] space-y-2">
                    <h5 className="font-bold text-[#7e5700] uppercase text-[10px] tracking-wider">Prospect Summary</h5>
                    <p className="text-[#5f5e5e] leading-relaxed font-normal">
                      Lead engaged across 3 emails and a 14-min VoIP call. Budget confirmed between ₹40L - ₹55L for a 4BHK architectural interior turnkey project. High emphasis on Italian marble and smart automation.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] space-y-2">
                    <h5 className="font-bold text-[#7e5700] uppercase text-[10px] tracking-wider">Recommended Action</h5>
                    <p className="text-[#1d1c16] font-semibold leading-relaxed">
                      👉 Send Revised 3D Walkthrough link before Thursday 4 PM. Client indicates decision readiness before weekend board review.
                    </p>
                    <button className="mt-2 px-3 py-1.5 rounded-lg bg-[#e3a62f] text-[#5b3e00] font-bold text-[11px] hover:bg-[#fbbb44]">
                      Draft Email with Gemini
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VR SHOWROOM */}
            {activeTab === 'vr' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                <div className="md:col-span-2 bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-[#e7e2d8]">
                    <h4 className="font-bold text-xs text-[#1d1c16] uppercase tracking-wider">VR Studio Appointment Calendar</h4>
                    <span className="text-[11px] font-mono text-[#7e5700] font-bold">October 2026</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg border border-[#e3a62f] bg-[#f8f3e9] text-center">
                      <span className="block text-[10px] font-semibold text-[#5f5e5e]">SAT, 10 OCT</span>
                      <p className="font-mono font-bold text-[#7e5700] text-sm my-1 tabular-nums">11:00 AM</p>
                      <span className="text-[9px] font-bold text-[#006e2d] bg-white px-2 py-0.5 rounded-full border border-[#e7e2d8]">BOOKED</span>
                    </div>
                    <div className="p-3 rounded-lg border border-[#e7e2d8] bg-white text-center hover:border-[#e3a62f] cursor-pointer">
                      <span className="block text-[10px] font-semibold text-[#5f5e5e]">SAT, 10 OCT</span>
                      <p className="font-mono font-bold text-[#1d1c16] text-sm my-1 tabular-nums">02:30 PM</p>
                      <span className="text-[9px] font-semibold text-[#5f5e5e] bg-[#f8f3e9] px-2 py-0.5 rounded-full">AVAILABLE</span>
                    </div>
                    <div className="p-3 rounded-lg border border-[#e7e2d8] bg-white text-center hover:border-[#e3a62f] cursor-pointer">
                      <span className="block text-[10px] font-semibold text-[#5f5e5e]">SUN, 11 OCT</span>
                      <p className="font-mono font-bold text-[#1d1c16] text-sm my-1 tabular-nums">04:00 PM</p>
                      <span className="text-[9px] font-semibold text-[#5f5e5e] bg-[#f8f3e9] px-2 py-0.5 rounded-full">AVAILABLE</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Compass size={16} className="text-[#7e5700]" />
                      <span>Blueprint CAD: <strong>magnolia_penthouse_v3.dwg</strong></span>
                    </div>
                    <span className="font-mono text-[10px] text-[#5f5e5e] tabular-nums">14.2 MB • Ready for Oculus Quest Pro</span>
                  </div>
                </div>

                <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 shadow-xs space-y-3">
                  <h4 className="font-bold text-xs uppercase text-[#7e5700]">Automated Triggers</h4>
                  <ul className="text-[11px] text-[#5f5e5e] space-y-2">
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 size={13} className="text-[#006e2d]" />
                      <span>Google Calendar / Outlook Sync</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 size={13} className="text-[#006e2d]" />
                      <span>WhatsApp Directions & Access Pass</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle2 size={13} className="text-[#006e2d]" />
                      <span>Sales Rep Reminder Task</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. KEY METRICS BENTO RIBBON */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 shadow-xs hover:translate-y-[-2px] transition-all">
            <p className="text-[10px] font-mono uppercase text-[#5f5e5e] font-semibold">Pipeline Orchestrated</p>
            <p className="text-2xl sm:text-3xl font-mono font-extrabold text-[#7e5700] mt-1 tabular-nums">₹180+ Cr</p>
            <span className="text-[11px] text-[#006e2d] font-semibold mt-1 inline-flex items-center space-x-1">
              <TrendingUp size={12} />
              <span>Across luxury projects</span>
            </span>
          </div>

          <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 shadow-xs hover:translate-y-[-2px] transition-all">
            <p className="text-[10px] font-mono uppercase text-[#5f5e5e] font-semibold">Close Velocity</p>
            <p className="text-2xl sm:text-3xl font-mono font-extrabold text-[#1d1c16] mt-1 tabular-nums">3.8x Faster</p>
            <span className="text-[11px] text-[#006e2d] font-semibold mt-1 inline-flex items-center space-x-1">
              <Zap size={12} />
              <span>With automated triggers</span>
            </span>
          </div>

          <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 shadow-xs hover:translate-y-[-2px] transition-all">
            <p className="text-[10px] font-mono uppercase text-[#5f5e5e] font-semibold">In-Browser VoIP Score</p>
            <p className="text-2xl sm:text-3xl font-mono font-extrabold text-[#7e5700] mt-1 tabular-nums">99.4%</p>
            <span className="text-[11px] text-[#5f5e5e] font-medium mt-1 inline-block">Zero hardware required</span>
          </div>

          <div className="bg-white border border-[#e7e2d8] rounded-xl p-5 shadow-xs hover:translate-y-[-2px] transition-all">
            <p className="text-[10px] font-mono uppercase text-[#5f5e5e] font-semibold">Studio Retention</p>
            <p className="text-2xl sm:text-3xl font-mono font-extrabold text-[#006e2d] mt-1 tabular-nums">98.2%</p>
            <span className="text-[11px] text-[#5f5e5e] font-medium mt-1 inline-block">Architecture & Design</span>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 5. STUDIO TOOLKIT (6 CORE MODULES) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#f8f3e9] border-y border-[#e7e2d8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#7e5700]">
              Complete Architectural CRM Suite
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1d1c16] tracking-tight mt-2">
              Engineered Specifically for High-Ticket Design Studios
            </h2>
            <p className="text-xs sm:text-sm text-[#5f5e5e] font-normal mt-2">
              Everything your sales team and project architects need to guide prospective buyers from initial inquiry to signed contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#e3a62f] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] mb-5 group-hover:bg-[#e3a62f] group-hover:text-[#5b3e00] transition-colors">
                <PhoneCall size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[#1d1c16] mb-2">Twilio In-Browser VoIP Telephony</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
                Make and receive high-definition phone calls with 1-click from lead cards. Automatically records call audio, disposition notes, and call duration logs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#e3a62f] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] mb-5 group-hover:bg-[#e3a62f] group-hover:text-[#5b3e00] transition-colors">
                <MessageSquare size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[#1d1c16] mb-2">Nylas Multi-Channel Communication</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
                Connect your Gmail, Outlook, WhatsApp, and SMS accounts into one unified client timeline. Never lose context between email threads and WhatsApp chats.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#e3a62f] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] mb-5 group-hover:bg-[#e3a62f] group-hover:text-[#5b3e00] transition-colors">
                <Calendar size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[#1d1c16] mb-2">VR Showroom & Blueprint Scheduler</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
                Schedule in-person design consultations or VR walkthrough slots. Attach DWG/CAD blueprints, 3D render files, and auto-dispatch calendar invites.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#e3a62f] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] mb-5 group-hover:bg-[#e3a62f] group-hover:text-[#5b3e00] transition-colors">
                <BrainCircuit size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[#1d1c16] mb-2">Gemini AI Deal Health Scoring</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
                Harness generative AI to analyze prospect interaction sentiment, generate concise lead summaries, and recommend the highest-probability next actions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#e3a62f] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] mb-5 group-hover:bg-[#e3a62f] group-hover:text-[#5b3e00] transition-colors">
                <Zap size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[#1d1c16] mb-2">Automated Stage Transitions</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
                Eliminate manual data entry. Deals auto-advance across your Kanban pipeline whenever outbound calls connect, showroom slots are reserved, or quotes are opened.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#e3a62f] transition-all group">
              <div className="w-11 h-11 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8] flex items-center justify-center text-[#7e5700] mb-5 group-hover:bg-[#e3a62f] group-hover:text-[#5b3e00] transition-colors">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-[#1d1c16] mb-2">Architectural Quotes & Invoicing</h3>
              <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
                Build itemized design deliverables, multi-milestone fee schedules, and GST compliant tax invoices with 1-click status updates and PDF exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 6. DEAL LIFECYCLE PROGRESSION (4 STEPS) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="lifecycle" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#7e5700]">
            The Architectural Deal Journey
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#1d1c16] tracking-tight mt-2">
            From Blueprint Inquiry to VR Walkthrough & Closed Contract
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs relative">
            <span className="font-mono text-3xl font-extrabold text-[#e3a62f]/60 block mb-2 tabular-nums">01</span>
            <h4 className="font-display font-bold text-sm text-[#1d1c16] mb-1">Inquiry Ingestion</h4>
            <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
              Auto-capture from web forms, WhatsApp intake, and property portals into your central lead repository.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs relative">
            <span className="font-mono text-3xl font-extrabold text-[#e3a62f]/60 block mb-2 tabular-nums">02</span>
            <h4 className="font-display font-bold text-sm text-[#1d1c16] mb-1">AI Scoring & VoIP Call</h4>
            <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
              Gemini calculates intent score. Sales rep executes in-browser phone call with one tap.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs relative">
            <span className="font-mono text-3xl font-extrabold text-[#e3a62f]/60 block mb-2 tabular-nums">03</span>
            <h4 className="font-display font-bold text-sm text-[#1d1c16] mb-1">VR Showroom Session</h4>
            <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
              Client experiences immersive 3D space. Blueprint revisions locked in real-time.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-[#e7e2d8] rounded-xl p-6 shadow-xs relative">
            <span className="font-mono text-3xl font-extrabold text-[#e3a62f]/60 block mb-2 tabular-nums">04</span>
            <h4 className="font-display font-bold text-sm text-[#1d1c16] mb-1">Contract & Milestone Invoicing</h4>
            <p className="text-xs text-[#5f5e5e] leading-relaxed font-normal">
              Proposal approved, milestone deposit generated, and deal automatically moves to Closed-Won.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 7. ENTERPRISE ARCHITECTURE & SECURITY */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="security" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white border border-[#e7e2d8] rounded-2xl p-6 sm:p-10 shadow-card">
          <div className="max-w-3xl">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#7e5700]">
              Built for Enterprise Reliability
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1d1c16] tracking-tight mt-2 mb-4">
              Bank-Grade Security, Role-Based Access Scoping & Real-Time Sync
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-5 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8]">
              <ShieldCheck size={24} className="text-[#7e5700] mb-3" />
              <h4 className="font-bold text-xs text-[#1d1c16] mb-1">Strict Lead Ownership (RBAC)</h4>
              <p className="text-[11px] text-[#5f5e5e] leading-relaxed font-normal">
                Sales representatives only view assigned prospects. Studio directors and managers enjoy global aggregate visibility.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8]">
              <Globe2 size={24} className="text-[#7e5700] mb-3" />
              <h4 className="font-bold text-xs text-[#1d1c16] mb-1">WebSocket Live Pipeline Sync</h4>
              <p className="text-[11px] text-[#5f5e5e] leading-relaxed font-normal">
                Deals update in real-time across multiple tabs and devices without needing manual page refreshes.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#f8f3e9] border border-[#e7e2d8]">
              <Lock size={24} className="text-[#7e5700] mb-3" />
              <h4 className="font-bold text-xs text-[#1d1c16] mb-1">Google OAuth SSO & JWT</h4>
              <p className="text-[11px] text-[#5f5e5e] leading-relaxed font-normal">
                One-click enterprise Google Workspace Single Sign-On with encrypted HttpOnly session handling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 8. FAQ SECTION */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#7e5700]">Got Questions?</span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1d1c16] tracking-tight mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Do I need any specialized hardware or desk phones for Twilio VoIP?',
              a: 'No hardware needed. Walk The Plan runs natively inside your web browser (Chrome, Edge, Safari) via WebRTC. Reps can use any standard headset or laptop microphone to make and receive calls.'
            },
            {
              q: 'How does Nylas multi-channel sync work with our studio emails?',
              a: 'Nylas securely connects to your studio Google Workspace or Microsoft 365 accounts. Email threads, WhatsApp responses, and SMS messages automatically attach to the corresponding client’s profile card in real-time.'
            },
            {
              q: 'Can we attach 3D blueprint CAD files to leads and VR showroom bookings?',
              a: 'Yes. You can attach DWG, PDF, and high-resolution 3D render files directly to deal cards and VR showroom appointments. These are instantly accessible during client walkthroughs.'
            },
            {
              q: 'Is our client financial and proposal data securely protected?',
              a: 'Absolutely. We enforce strict role-based access controls (RBAC), end-to-end encrypted sessions, Google SSO authentication, and automated daily cloud backups.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#e7e2d8] rounded-xl overflow-hidden shadow-xs cursor-pointer"
              onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
            >
              <div className="p-4 sm:p-5 flex justify-between items-center">
                <span className="font-bold text-xs sm:text-sm text-[#1d1c16]">{item.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-[#7e5700] transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 text-xs text-[#5f5e5e] font-normal leading-relaxed border-t border-[#e7e2d8] pt-3 bg-[#fdfaf4]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 9. FINAL BOTTOM CALL TO ACTION BANNER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#f8f3e9] border border-[#e7e2d8] rounded-2xl p-8 sm:p-14 text-center shadow-card relative overflow-hidden">
          {/* Subtle brand badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white border border-[#e7e2d8] text-[#7e5700] text-[11px] font-mono font-semibold mb-4 shadow-xs">
            <Sparkles size={12} className="text-[#e3a62f]" />
            <span>ACCELERATE YOUR ARCHITECTURAL PIPELINE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#1d1c16] tracking-tight max-w-2xl mx-auto mb-4">
            Ready to Transform Your Studio's Sales Velocity?
          </h2>

          <p className="text-xs sm:text-sm text-[#5f5e5e] font-normal max-w-xl mx-auto mb-8 leading-relaxed">
            Join luxury interior designers and architectural consultancies closing high-ticket deals with precision, live VoIP, and Gemini AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={handleOpenAuth}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#e3a62f] hover:bg-[#fbbb44] text-[#5b3e00] font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-95"
            >
              <span>Sign In to Studio</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 10. FOOTER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#e7e2d8] py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          {/* Brand Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-[#e7e2d8] shadow-xs">
              <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xs text-[#7e5700] uppercase tracking-wide">
                Walk The Plan CRM
              </span>
              <p className="text-[10px] text-[#5f5e5e] font-normal">Architectural & Interior Design Sales Platform</p>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-[11px] text-[#5f5e5e] font-normal">
            © {new Date().getFullYear()} Walk The Plan CRM. All rights reserved. Built for architectural precision.
          </div>

          {/* Links */}
          <div className="flex items-center space-x-6 text-xs font-semibold text-[#5f5e5e]">
            <a href="#features" className="hover:text-[#7e5700] transition-colors">Features</a>
            <a href="#showcase" className="hover:text-[#7e5700] transition-colors">Showcase</a>
            <button onClick={handleOpenAuth} className="hover:text-[#7e5700] transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </footer>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 11. AUTH POPUP MODAL (EXCLUSIVE TO SIGN IN) */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={handleCloseAuth}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#e7e2d8] bg-[#fef9ee] p-6 sm:p-8 shadow-2xl text-left relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e7e2d8] pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center border border-[#e7e2d8] bg-white shadow-xs">
                  <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#7e5700] uppercase">
                    Sign In to Workspace
                  </h3>
                  <p className="text-[10px] text-[#5f5e5e] font-mono">Walk The Plan Sales CRM</p>
                </div>
              </div>
              <button
                onClick={handleCloseAuth}
                className="text-[#5f5e5e] hover:text-[#1d1c16] transition-colors p-1.5 rounded-lg hover:bg-[#f8f3e9]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner if any */}
            {authError && (
              <div className="mb-4 rounded-lg bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 p-3 text-xs text-[#ba1a1a] font-bold">
                {authError}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl border border-[#e7e2d8] bg-white hover:bg-[#f8f3e9] text-[#1d1c16] font-semibold text-xs transition-all flex items-center justify-center space-x-2.5 mb-4 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>

            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-[#e7e2d8]"></div>
              <span className="px-3 text-[10px] text-[#5f5e5e] uppercase font-mono font-semibold">OR</span>
              <div className="flex-grow border-t border-[#e7e2d8]"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#5f5e5e] font-semibold mb-1">Studio Work Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3.5 text-[#5f5e5e]" />
                  <input
                    type="email"
                    required
                    placeholder="architect@walktheplan.in"
                    className="w-full rounded-xl border border-[#e7e2d8] bg-white pl-9 pr-4 py-2.5 text-xs text-[#1d1c16] placeholder-[#5f5e5e]/50 focus:border-[#e3a62f] focus:outline-none"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#5f5e5e] font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3.5 text-[#5f5e5e]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#e7e2d8] bg-white pl-9 pr-4 py-2.5 text-xs text-[#1d1c16] placeholder-[#5f5e5e]/50 focus:border-[#e3a62f] focus:outline-none"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-[#e3a62f] hover:bg-[#fbbb44] text-[#5b3e00] font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-xs mt-2 active:scale-98"
              >
                {authLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Admin Provisioning Note */}
            <div className="mt-5 text-center text-xs text-[#5f5e5e] border-t border-[#e7e2d8] pt-4 leading-relaxed">
              <span>Need an account? Contact your </span>
              <strong className="text-[#7e5700] font-semibold">Studio Administrator</strong>
              <span> to receive an invitation.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
