import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { user } = useAuth();
  if (!user) return null;

  const linkClass = (isActive) =>
    `flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 gap-0.5 font-label ${
      isActive ? 'text-gold-dark font-extrabold' : 'text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-outline-variant/60 flex items-center justify-around z-40 md:hidden p-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span>Home</span>
      </NavLink>
      <NavLink to="/leads" className={({ isActive }) => linkClass(isActive)}>
        <span className="material-symbols-outlined text-[20px]">group</span>
        <span>Leads</span>
      </NavLink>
      <NavLink to="/deals" className={({ isActive }) => linkClass(isActive)}>
        <span className="material-symbols-outlined text-[20px]">handshake</span>
        <span>Deals</span>
      </NavLink>
      <NavLink to="/tasks" className={({ isActive }) => linkClass(isActive)}>
        <span className="material-symbols-outlined text-[20px]">assignment</span>
        <span>Tasks</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
        <span className="material-symbols-outlined text-[20px]">settings</span>
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
