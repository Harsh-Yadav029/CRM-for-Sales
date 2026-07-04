import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const { data } = await api.post('/api/auth/register', { 
          name: form.name, 
          email: form.email, 
          password: form.password,
          role: 'admin'
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        window.location.href = '/';
      } else {
        await login(form.email, form.password);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary-container blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-secondary-container blur-[100px]"></div>
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Branding Section */}
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight" style={{ lineHeight: '32px' }}>SalesPro CRM</h1>
          <p className="text-xs text-on-surface-variant mt-1">Empowering high-velocity sales teams</p>
        </header>

        {/* Login Card */}
        <section className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-lg font-bold text-on-surface mb-6">
            {isRegister ? 'Setup System Admin' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-5 p-3.5 bg-error-container/20 border border-error-container text-on-error-container rounded-xl text-xs font-bold leading-normal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-on-surface-variant block ml-1" htmlFor="name">
                  Full Name
                </label>
                <div className="relative flex items-center rounded-lg border border-outline-variant bg-surface focus-within:border-primary transition-all duration-200">
                  <span className="material-symbols-outlined absolute left-4 text-outline text-lg">person</span>
                  <input 
                    className="w-full pl-11 pr-4 py-3 bg-transparent border-none rounded-lg text-xs md:text-sm focus:ring-0 focus:outline-none placeholder:text-outline-variant text-on-surface" 
                    id="name" 
                    placeholder="John Doe" 
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant block ml-1" htmlFor="email">
                Email
              </label>
              <div className="relative flex items-center rounded-lg border border-outline-variant bg-surface focus-within:border-primary transition-all duration-200">
                <span className="material-symbols-outlined absolute left-4 text-outline text-lg">mail</span>
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none rounded-lg text-xs md:text-sm focus:ring-0 focus:outline-none placeholder:text-outline-variant text-on-surface" 
                  id="email" 
                  placeholder="name@company.com" 
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                {!isRegister && (
                  <button 
                    type="button" 
                    onClick={() => alert('Please contact your administrator to reset credentials.')} 
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center rounded-lg border border-outline-variant bg-surface focus-within:border-primary transition-all duration-200">
                <span className="material-symbols-outlined absolute left-4 text-outline text-lg">lock</span>
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none rounded-lg text-xs md:text-sm focus:ring-0 focus:outline-none placeholder:text-outline-variant text-on-surface" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <button 
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold shadow-md hover:bg-primary-container transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 text-xs md:text-sm disabled:opacity-75" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={16} />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Setup Admin' : 'Sign In'}</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Social Provider Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
            <span className="relative px-4 bg-surface-container-lowest text-[11px] text-outline font-bold uppercase tracking-wider">Or continue with</span>
          </div>

          {/* Social Login Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => alert('Social authentication features are configured by System Administrator.')}
              className="flex items-center justify-center gap-2 py-3 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
              </svg>
              Google
            </button>
            <button 
              type="button"
              onClick={() => alert('Social authentication features are configured by System Administrator.')}
              className="flex items-center justify-center gap-2 py-3 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
              </svg>
              LinkedIn
            </button>
          </div>
        </section>

        {/* Footer Help */}
        <footer className="text-center space-y-3">
          <p className="text-xs text-on-surface-variant font-medium">
            {isRegister ? (
              <>
                Already configured?{' '}
                <button 
                  onClick={() => setIsRegister(false)} 
                  className="text-primary font-semibold hover:underline"
                >
                  Sign In instead
                </button>
              </>
            ) : (
              <>
                Bootstrap initial admin setup?{' '}
                <button 
                  onClick={() => setIsRegister(true)} 
                  className="text-primary font-semibold hover:underline"
                >
                  Create Admin Account
                </button>
              </>
            )}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a className="text-[11px] font-semibold text-outline hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
            <a className="text-[11px] font-semibold text-outline hover:text-primary transition-colors" href="#">Support</a>
            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
            <a className="text-[11px] font-semibold text-outline hover:text-primary transition-colors" href="#">Contact Sales</a>
          </div>
        </footer>
      </main>

      {/* Decoration Image - Asymmetric Placement */}
      <div className="hidden lg:block fixed right-12 bottom-12 w-64 h-64 opacity-20 pointer-events-none grayscale contrast-125 rotate-6">
        <img 
          className="w-full h-full object-contain" 
          alt="A sophisticated abstract 3D composition of interlocking geometric rings and crystal prisms, rendered in high-key lighting to reflect a professional corporate atmosphere." 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZq429Ds33n9BkoPk5ovyqdOxJKA0qutCThUj-xomxnCIanQ7otjxBcX7Es8Fsvqvg29akVDRaiOY72jQzHaam14wA3qH-Rq5oKyKUbwTf2HccFwHpEaQ-4L6BzNsQFOWcbtvtEuEMG-lT_MmA7UOq6X6gGBc449shsq8lxi5lpAjlkf8O0dV8P5Lwi0hJdtaRzt3Qq5dMjFsT7n3XwMmmGrb0o_Y4OXxqPfm_Uc8eR7QlyFnGO3P2wg"
        />
      </div>
    </div>
  );
};

export default Login;
