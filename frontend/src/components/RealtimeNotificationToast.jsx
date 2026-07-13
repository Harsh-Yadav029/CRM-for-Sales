import React, { useState, useEffect } from 'react';
import { getSocket, initiateSocket } from '../utils/socket';
import { Bell, Info, X, MessageSquare, Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import api from '../utils/api';
import CallWidget from './CallWidget';

const RealtimeNotificationToast = () => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  
  const {
    incomingCall,
    setIncomingCall,
    setActiveCall,
    showCallWidget,
    setShowCallWidget,
    currentLead,
    setCurrentLead,
    currentEventId,
    setCurrentEventId
  } = useVoice() || {}; // Guard in case context is not available yet

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

  const handleAcceptIncoming = async () => {
    if (!incomingCall) return;
    try {
      const fromNumber = incomingCall.parameters.From || 'Unknown Caller';
      
      // 1. Create event for inbound call
      const { data: event } = await api.post('/api/events', {
        type: 'call',
        title: `Inbound Call from ${fromNumber}`,
        description: `Incoming call routed to Twilio identity`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60000), // temp
        direction: 'inbound',
        status: 'scheduled'
      });

      setCurrentEventId(event._id);

      // Attempt to find matching lead by phone suffix
      try {
        const sanitizedPhone = fromNumber.replace(/\D/g, '');
        const phoneSuffix = sanitizedPhone.slice(-10);
        if (phoneSuffix) {
          const { data: leads } = await api.get('/api/leads', { params: { search: phoneSuffix } });
          if (leads && leads.length > 0) {
            const leadData = leads[0];
            setCurrentLead(leadData);
            await api.put(`/api/events/${event._id}`, {
              relatedTo: {
                module: 'Lead',
                recordId: leadData._id
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to link inbound call to lead:', err);
      }

      incomingCall.accept();
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setShowCallWidget(true);
    } catch (err) {
      console.error('Accept call failed:', err);
    }
  };

  const handleDeclineIncoming = () => {
    if (incomingCall) {
      incomingCall.reject();
      setIncomingCall(null);
    }
  };

  const hasToasts = toasts.length > 0;
  const hasIncoming = !!incomingCall;
  const hasWidget = !!showCallWidget;

  if (!hasToasts && !hasIncoming && !hasWidget) return null;

  return (
    <>
      {/* Toast and Incoming Calls Area */}
      <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-xs md:max-w-sm pointer-events-none">
        
        {/* Incoming Call Banner */}
        {incomingCall && (
          <div className="pointer-events-auto flex flex-col gap-3 rounded-xl border border-gold/40 bg-white p-4 shadow-modal backdrop-blur-md animate-bounce">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/25 animate-pulse">
                <PhoneCall size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wide">Incoming Call...</h4>
                <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{incomingCall.parameters.From || 'Unknown Client'}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1 border-t border-line">
              <button
                onClick={handleDeclineIncoming}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-btn bg-red-500 hover:bg-red-400 text-white text-[9px] font-bold uppercase tracking-wider transition-all"
              >
                <PhoneOff size={10} />
                <span>Decline</span>
              </button>
              <button
                onClick={handleAcceptIncoming}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-btn bg-emerald-500 hover:bg-emerald-450 text-white text-[9px] font-bold uppercase tracking-wider transition-all"
              >
                <Phone size={10} />
                <span>Accept</span>
              </button>
            </div>
          </div>
        )}

        {/* Regular Notifications */}
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-outline-variant/50 bg-white/90 p-4 shadow-card backdrop-blur-md animate-slide-in"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              toast.type === 'lead'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-gold/10 text-primary border border-amber-500/20'
            }`}>
              {toast.type === 'lead' ? <MessageSquare size={14} /> : <Bell size={14} />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-on-surface leading-tight">{toast.title}</h4>
              <p className="text-[10px] text-on-surface-variant mt-1 leading-normal">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Global Call Control Widget Overlay */}
      {showCallWidget && (
        <CallWidget onClose={() => setShowCallWidget(false)} />
      )}
    </>
  );
};

export default RealtimeNotificationToast;
export { RealtimeNotificationToast };
