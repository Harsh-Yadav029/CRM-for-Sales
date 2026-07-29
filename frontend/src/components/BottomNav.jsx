import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Users, 
  Briefcase, 
  BarChart3, 
  MessageSquare, 
  Menu, 
  X, 
  UserCircle, 
  CalendarDays, 
  Settings, 
  ListTodo, 
  Building2, 
  Package, 
  FileText, 
  Receipt, 
  User 
} from 'lucide-react';

const BottomNav = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) return null;

  const linkClass = (isActive) =>
    `flex flex-col items-center justify-center flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all duration-200 gap-0.5 ${
      isActive ? 'text-[#7e5700] font-extrabold' : 'text-[#5f5e5e] hover:text-[#1d1c16]'
    }`;

  const allNavItems = [
    { label: 'Dashboard', to: '/', icon: Home },
    { label: 'Leads', to: '/leads', icon: Users },
    { label: 'Pipeline', to: '/deals', icon: Briefcase },
    { label: 'Analytics', to: '/reports', icon: BarChart3 },
    { label: 'Comm Hub', to: '/communication-hub', icon: MessageSquare },
    { label: 'Contacts', to: '/contacts', icon: UserCircle },
    { label: 'Calendar', to: '/calendar', icon: CalendarDays },
    { label: 'System Settings', to: '/settings', icon: Settings, roles: ['admin', 'manager'] },
    { label: 'My Profile', to: '/profile', icon: User }
  ];

  const visibleNavItems = allNavItems.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Drawer Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-[#e7e2d8] bg-[#f8f3e9]">
            <div className="flex items-center space-x-2">
              <img src="/1.png" alt="Walk The Plan Logo" className="w-7 h-7 object-cover rounded" />
              <h2 className="font-poppins text-sm font-bold text-[#7e5700] uppercase tracking-wide">Walk The Plan</h2>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 px-2">Navigation Menu</p>
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive ? 'bg-[#e3a62f] text-[#5b3e00] shadow-sm' : 'text-slate-700 hover:bg-[#f8f3e9]'
                  }`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-[#e7e2d8] flex items-center justify-around z-50 pointer-events-auto md:hidden p-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavLink to="/" end className={({ isActive }) => linkClass(isActive)}>
          <Home size={18} />
          <span className="truncate">Home</span>
        </NavLink>
        <NavLink to="/leads" className={({ isActive }) => linkClass(isActive)}>
          <Users size={18} />
          <span className="truncate">Leads</span>
        </NavLink>
        <NavLink to="/deals" className={({ isActive }) => linkClass(isActive)}>
          <Briefcase size={18} />
          <span className="truncate">Deals</span>
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => linkClass(isActive)}>
          <BarChart3 size={18} />
          <span className="truncate">Analytics</span>
        </NavLink>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#5f5e5e] hover:text-[#1d1c16] gap-0.5"
        >
          <Menu size={18} />
          <span className="truncate">Menu</span>
        </button>
      </nav>
    </>
  );
};

export default BottomNav;
