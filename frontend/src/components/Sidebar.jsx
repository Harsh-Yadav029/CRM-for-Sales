import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Users,
  Briefcase,
  CheckSquare,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Plus,
  Calendar
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all duration-200 relative select-none uppercase tracking-wider font-sans ${
      isActive
        ? 'bg-white/10 text-white font-extrabold'
        : 'text-white/50 hover:text-white/95 hover:bg-white/5'
    } ${collapsed ? 'justify-center px-0' : ''}`;

  const activeBar = (isActive) =>
    isActive ? 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-gold before:rounded-r-full' : '';

  return (
    <aside
      className={`bg-ink fixed inset-y-0 left-0 flex flex-col z-20 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-60'
      } border-r border-white/5 shadow-md`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-md shrink-0">
            <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-display text-white tracking-wide uppercase font-black">Walk The Plan</span>
              <span className="text-[9px] font-bold text-white/30 tracking-wider font-label uppercase">Sales CRM</span>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/40 hover:text-white p-1 hover:bg-white/5 rounded-lg hidden md:block"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6 custom-scroll">
        {/* Core Performance Section */}
        <div className="space-y-1.5">
          {!collapsed && (
            <span className="px-4 text-[9px] font-extrabold uppercase tracking-widest text-white/35 block mb-2 font-mono">
              Core Performance
            </span>
          )}
          <NavLink to="/" end className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Home">
            <Home size={16} className="shrink-0" />
            {!collapsed && <span>Home</span>}
          </NavLink>

          <NavLink to="/deals" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Opportunities">
            <Briefcase size={16} className="shrink-0" />
            {!collapsed && <span>Opportunities</span>}
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Reports">
            <BarChart3 size={16} className="shrink-0" />
            {!collapsed && <span>Reports</span>}
          </NavLink>
        </div>

        {/* Sales Operations Section */}
        <div className="space-y-1.5">
          {!collapsed && (
            <span className="px-4 text-[9px] font-extrabold uppercase tracking-widest text-white/35 block mb-2 font-mono">
              Sales Operations
            </span>
          )}
          <NavLink to="/leads" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Leads">
            <Users size={16} className="shrink-0" />
            {!collapsed && <span>Leads</span>}
          </NavLink>

          <NavLink to="/tasks" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Tasks">
            <CheckSquare size={16} className="shrink-0" />
            {!collapsed && <span>Tasks</span>}
          </NavLink>

          <NavLink to="/calendar" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Calendar">
            <Calendar size={16} className="shrink-0" />
            {!collapsed && <span>Calendar</span>}
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => `${linkClass(isActive)} ${activeBar(isActive)}`} title="Settings">
            <Settings size={16} className="shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </nav>

      {/* Lower Actions Section */}
      <div className="p-4 border-t border-white/5 shrink-0 flex flex-col gap-4">
        {/* + New Lead Button */}
        <button
          onClick={() => navigate('/leads')}
          className={`w-full bg-gold hover:bg-gold/90 text-ink py-3.5 rounded-btn font-bold flex items-center justify-center gap-2 text-xs transition-all duration-200 ${
            collapsed ? 'px-0' : ''
          }`}
          title="New Lead"
        >
          <Plus size={14} className="shrink-0" />
          {!collapsed && <span className="uppercase tracking-wider">New Lead</span>}
        </button>

        {/* Footer Actions */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => alert('Opening Help Center...')}
            className={`flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-white/50 hover:text-white transition-all duration-200 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title="Help Center"
          >
            <HelpCircle size={16} className="shrink-0" />
            {!collapsed && <span>Help Center</span>}
          </button>

          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-red-400 hover:text-red-300 transition-all duration-200 ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
export { Sidebar };
