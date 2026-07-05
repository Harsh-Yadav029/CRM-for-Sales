import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-surface border-b border-outline-variant flex items-center justify-between px-6 transition-all duration-200">
      {/* Left section: Branding on mobile, Page Title on desktop */}
      <div className="flex items-center gap-3">
        {/* Mobile branding */}
        <div className="flex md:hidden items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
            <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
          </div>
          <h1 className="font-bold text-primary text-base leading-none">LeadStack CRM</h1>
        </div>
        
        {/* Desktop Title */}
        <h1 className="hidden md:block font-headline-md text-base md:text-lg font-bold text-on-surface">
          {title || 'Dashboard'}
        </h1>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Search trigger */}
        <button 
          onClick={() => navigate('/leads')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-primary hover:bg-surface-container hover:scale-105 active:scale-95 transition-all"
          title="Search / Actions"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Profile Avatar (Desktop only since it is already visible on Mobile menu/sidebar) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="h-5 w-px bg-outline-variant" />
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-on-surface leading-none">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-on-surface-variant leading-none mt-[2px] capitalize">{user?.role}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
