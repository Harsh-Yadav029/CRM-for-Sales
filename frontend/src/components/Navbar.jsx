import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Calendar, User } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const Navbar = ({ title }) => {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) }; // Fallback/direct read or context
  const { user: authUser } = useAuth();
  const activeUser = authUser || user;
  
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New lead assigned: NexaCore Solutions', time: '5m ago' },
    { id: 2, text: 'Proposal review scheduled with Alex', time: '1h ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

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
    <header className="w-full h-16 sticky top-0 z-40 bg-white border-b border-line flex items-center justify-between px-6 transition-all duration-200">
      {/* Left section: Branding on mobile, Page Title on desktop */}
      <div className="flex items-center gap-3">
        {/* Mobile branding */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-md">
            <img src="/1.png" alt="Walk The Plan Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-ink uppercase font-black text-xs tracking-wider">Walk The Plan</h1>
        </div>
        
        {/* Desktop Title */}
        <h1 className="hidden md:block text-base font-display font-black text-ink uppercase tracking-tight">
          {title || 'Home'}
        </h1>
      </div>

      {/* Right section: Search & Actions */}
      <div className="flex items-center gap-4 relative">
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center bg-[#F1F3F6] border border-transparent hover:border-line rounded-lg px-3 py-1.5 w-44 sm:w-60 cursor-pointer transition-all select-none"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Search size={14} className="stroke-[2.5]" />
            <span className="text-[11px] font-bold text-slate-500/80">Search records</span>
          </div>
        </div>

        {/* Global Search Overlay */}
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Calendar scheduler option */}
          <button 
            onClick={() => navigate('/calendar')}
            className="p-2 text-slate-400 hover:text-ink hover:bg-[#F1F3F6] rounded-lg transition-all"
            title="Calendar"
          >
            <Calendar size={16} />
          </button>

          {/* Notifications bell button */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-ink hover:bg-[#F1F3F6] rounded-lg transition-all relative"
              title="Notifications"
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-gold border border-white" />
              )}
            </button>

            {/* Notification dropdown popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-line rounded-modal shadow-modal p-4 space-y-3 z-50">
                <div className="flex justify-between items-center border-b border-line pb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Notifications</h4>
                  <button 
                    onClick={() => setNotifications([])} 
                    className="text-[9px] text-gold hover:underline font-bold uppercase font-mono"
                  >
                    Clear All
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2">No new notifications</p>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scroll">
                    {notifications.map((n) => (
                      <div key={n.id} className="text-[10px] text-ink font-medium leading-relaxed">
                        <p>{n.text}</p>
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{n.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Avatar & Navigation Link */}
        <div className="flex items-center gap-2 pl-2 border-l border-line">
          <button 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
            title="Profile & Settings"
          >
            <div className="w-8 h-8 rounded-full bg-gold text-ink flex items-center justify-center font-black font-display text-xs border border-gold/20 shadow-sm">
              {activeUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block select-none leading-none">
              <p className="text-xs font-bold text-ink leading-none">{activeUser?.name?.split(' ')[0]}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">{activeUser?.role || 'User'}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
export { Navbar };
