import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [crmOpen, setCrmOpen] = useState(true);

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 relative ${
      isActive
        ? 'bg-white/10 text-white font-bold'
        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
    }`;

  const activeBar = (isActive) =>
    isActive ? 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-gold before:rounded-r-full' : '';

  return (
    <aside className="w-60 bg-[#111111] fixed inset-y-0 left-0 flex flex-col z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Walk The Plan Logo" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-sm font-extrabold text-white tracking-tight">Walk The Plan</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scroll">
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-white/30 font-label">Core</div>
          <NavLink to="/" end className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Leads</span>
          </NavLink>
          <NavLink to="/deals" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            <span>Deals</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            <span>Reports</span>
          </NavLink>
        </div>

        <div>
          <button 
            onClick={() => setCrmOpen(!crmOpen)} 
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white/50 transition-colors font-label"
          >
            <span>Workspace</span>
            <span className="material-symbols-outlined text-xs">
              {crmOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {crmOpen && (
            <div className="mt-1 space-y-1">
              <NavLink to="/tasks" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">assignment</span>
                <span>Tasks</span>
              </NavLink>
              <NavLink to="/accounts" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">store</span>
                <span>Accounts</span>
              </NavLink>
              <NavLink to="/contacts" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Contacts</span>
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                <span>Products</span>
              </NavLink>
              <NavLink to="/quotes" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">request_quote</span>
                <span>Quotes</span>
              </NavLink>
              <NavLink to="/invoices" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Invoices</span>
              </NavLink>
            </div>
          )}
        </div>

        <div>
          <div className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-white/30 font-label">System</div>
          <NavLink to="/settings" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <NavLink to="/developer-portal" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">terminal</span>
                <span>Developer Portal</span>
              </NavLink>
              <NavLink to="/billing" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`}>
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                <span>Billing & Plans</span>
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold text-[#111111] flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/50 capitalize font-medium font-label">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
        >
          <span className="material-symbols-outlined text-xs">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
