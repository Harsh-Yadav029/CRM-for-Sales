import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Calendar, User, HelpCircle, Settings } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const Navbar = ({ title }) => {
  const { user } = { user: JSON.parse(localStorage.getItem('user')) };
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
    <header className="w-full h-16 bg-white border-b border-[#e7e2d8] flex justify-between items-center px-8 sticky top-0 z-40 select-none">
      {/* Search Input Bar (Capsule style) */}
      <div 
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center bg-[#f8f3e9] border border-[#e7e2d8] rounded-full px-4 py-1.5 w-96 cursor-pointer hover:brightness-98 transition-all"
      >
        <Search size={16} className="text-[#5f5e5e] mr-2" />
        <span className="text-xs text-[#5f5e5e] font-medium">Search contacts, leads, or deals...</span>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Right User Actions */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 text-[#5f5e5e]">
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="hover:text-[#7e5700] transition-colors relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#e3a62f] border border-white" />
            )}
          </button>
          <button onClick={() => navigate('/calendar')} className="hover:text-[#7e5700] transition-colors">
            <Calendar size={18} />
          </button>
          <button onClick={() => navigate('/settings')} className="hover:text-[#7e5700] transition-colors">
            <Settings size={18} />
          </button>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-24 mt-48 w-64 bg-white border border-[#e7e2d8] rounded-xl shadow-lg p-4 space-y-3 z-50">
            <div className="flex justify-between items-center border-b border-[#e7e2d8] pb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#5f5e5e] font-mono">Notifications</h4>
              <button 
                onClick={() => setNotifications([])} 
                className="text-[9px] text-[#e3a62f] hover:underline font-bold uppercase font-mono"
              >
                Clear All
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-2">No new notifications</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scroll">
                {notifications.map((n) => (
                  <div key={n.id} className="text-[10px] text-[#1d1c16] font-medium leading-relaxed">
                    <p>{n.text}</p>
                    <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">{n.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Info */}
        <div className="flex items-center space-x-3 border-l border-[#e7e2d8] pl-6">
          <div className="text-right">
            <p className="text-xs font-bold text-[#1d1c16]">{activeUser?.name || 'Alex Mercer'}</p>
            <p className="text-[9px] text-[#5f5e5e] font-bold uppercase tracking-wider font-mono">{activeUser?.role || 'Executive VP'}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-[#e3a62f] bg-[#e3a62f] text-[#5b3e00] flex items-center justify-center font-black text-sm shadow-sm">
            {activeUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
export { Navbar };
