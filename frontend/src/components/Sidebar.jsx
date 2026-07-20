import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import {
  Home,
  BarChart3,
  Users,
  UserCircle,
  Building2,
  Briefcase,
  CalendarDays,
  LogOut,
  MessageSquare,
  ChevronDown,
  Search,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Dashboard', to: '/', icon: Home },
    { label: 'Contacts', to: '/contacts', icon: UserCircle },
    { label: 'Leads', to: '/leads', icon: Users },
    { label: 'Pipeline', to: '/deals', icon: Briefcase },
    { label: 'Analytics', to: '/reports', icon: BarChart3 },
    { label: 'Calendar', to: '/calendar', icon: CalendarDays },
    { label: 'Comm Hub', to: '/communication-hub', icon: MessageSquare }
  ];

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-[#f8f3e9] border-r border-[#e7e2d8] flex flex-col p-4 space-y-2 z-50 select-none">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-6 px-1">
        <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center shadow-md">
          <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-display text-sm font-black text-[#7e5700] uppercase tracking-wide">Walk The Plan</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-250 ${
                active
                  ? 'bg-[#e3a62f] text-[#5b3e00] shadow-sm'
                  : 'text-[#5f5e5e] hover:bg-[#ede8de]'
              }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* New Lead Action Button */}
      <button
        onClick={() => navigate('/leads')}
        className="w-full py-2.5 bg-[#7e5700] text-white font-bold rounded-lg text-xs hover:brightness-105 active:scale-98 transition-all flex items-center justify-center space-x-2"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span>New Lead</span>
      </button>

      {/* Footer Settings / Support */}
      <div className="pt-4 border-t border-[#e7e2d8] space-y-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center space-x-3 px-3 py-2 text-[#5f5e5e] hover:bg-[#ede8de] rounded-lg text-xs font-bold text-left"
        >
          <Search size={16} />
          <span>Search (⌘K)</span>
        </button>
        <NavLink
          to="/settings"
          className={({ isActive: a }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-250 ${
              a ? 'bg-[#e3a62f] text-[#5b3e00]' : 'text-[#5f5e5e] hover:bg-[#ede8de]'
            }`
          }
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold text-left"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </aside>
  );
};

export default Sidebar;
export { Sidebar };
