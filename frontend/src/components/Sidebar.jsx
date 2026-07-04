import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [crmOpen, setCrmOpen] = useState(true);

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-surface-container text-primary font-bold shadow-sm'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
    }`;

  return (
    <aside className="w-60 bg-surface-container-lowest border-r border-outline-variant fixed inset-y-0 left-0 flex flex-col z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-outline-variant shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">S</div>
        <span className="text-base font-extrabold text-primary tracking-tight">SalesPro CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scroll">
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant/50">Core</div>
          <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => linkClass(isActive)}>
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Leads</span>
          </NavLink>
          <NavLink to="/deals" className={({ isActive }) => linkClass(isActive)}>
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            <span>Deals</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => linkClass(isActive)}>
            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
            <span>Reports</span>
          </NavLink>
        </div>

        <div>
          <button 
            onClick={() => setCrmOpen(!crmOpen)} 
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant/50 hover:text-primary transition-colors"
          >
            <span>Workspace</span>
            <span className="material-symbols-outlined text-xs">
              {crmOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {crmOpen && (
            <div className="mt-1 space-y-1">
              <NavLink to="/tasks" className={({ isActive }) => linkClass(isActive)}>
                <span className="material-symbols-outlined text-[18px]">assignment</span>
                <span>Tasks</span>
              </NavLink>
            </div>
          )}
        </div>

        <div>
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant/50">System</div>
          <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-outline-variant shrink-0 bg-surface-container-low/30">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-on-surface truncate">{user?.name}</p>
            <p className="text-[10px] text-on-surface-variant capitalize font-medium">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-error border border-error/20 hover:bg-error-container hover:border-error-container transition-all"
        >
          <span className="material-symbols-outlined text-xs">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
