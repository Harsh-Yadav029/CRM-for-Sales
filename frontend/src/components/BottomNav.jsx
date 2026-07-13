import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { user } = useAuth();
  if (!user) return null;

  const linkClass = (isActive) =>
    `flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 gap-0.5 ${
      isActive ? 'text-amber-500 font-extrabold' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-40 md:hidden p-1 backdrop-blur-md bg-opacity-95 shadow-lg">
      <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
        <span className="material-symbols-outlined text-[20px]">dashboard</span>
        <span>Dashboard</span>
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
