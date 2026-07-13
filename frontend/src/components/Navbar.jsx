import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-white border-b border-outline-variant/60 flex items-center justify-between px-6 shadow-nav transition-all duration-200">
      {/* Left section: Branding on mobile, Page Title on desktop */}
      <div className="flex items-center gap-3">
        {/* Mobile branding */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Walk The Plan Logo" className="w-5 h-5 object-contain" />
          </div>
          <h1 className="font-bold text-on-surface text-sm leading-none">Walk The Plan</h1>
        </div>
        
        {/* Desktop Title */}
        <h1 className="hidden md:block text-base md:text-lg font-bold text-on-surface tracking-tight">
          {title || 'Dashboard'}
        </h1>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Search trigger */}
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="h-9 px-3 flex items-center justify-center gap-2 rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:border-outline-variant transition-all text-xs font-semibold"
          title="Search (Ctrl+K)"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] text-on-surface-variant font-label tracking-tight border border-outline-variant/40">Ctrl+K</kbd>
        </button>

        {/* Global Search Overlay */}
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* Profile Avatar (Desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="h-5 w-px bg-outline-variant/60" />
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gold text-[#111111] flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-on-surface leading-none">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-on-surface-variant leading-none mt-[2px] capitalize font-label">{user?.role}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
