import React, { useState, useEffect } from 'react';
import { getSocket, initiateSocket } from '../utils/socket';
import { Bell, Info, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RealtimeNotificationToast = () => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Open connection
    const socket = initiateSocket();
    if (!socket) return;

    const handleNotification = (payload) => {
      const newToast = {
        id: Date.now() + Math.random().toString(),
        title: payload.title || 'System Notification',
        message: payload.message || 'New update received',
        type: 'alert'
      };
      setToasts(prev => [newToast, ...prev]);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    const handleLeadCreated = (payload) => {
      const newToast = {
        id: Date.now() + Math.random().toString(),
        title: 'New Lead Captured',
        message: `Lead ${payload.name} from ${payload.company} added to pipeline`,
        type: 'lead'
      };
      setToasts(prev => [newToast, ...prev]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    socket.on('notification_received', handleNotification);
    socket.on('lead_created', handleLeadCreated);

    return () => {
      socket.off('notification_received', handleNotification);
      socket.off('lead_created', handleLeadCreated);
    };
  }, [user]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-xs md:max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md animate-slide-in"
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            toast.type === 'lead'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {toast.type === 'lead' ? <MessageSquare size={14} /> : <Bell size={14} />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white leading-tight">{toast.title}</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-white transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default RealtimeNotificationToast;
export { RealtimeNotificationToast };
