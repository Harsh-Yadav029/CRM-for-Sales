import React, { useState, useEffect } from 'react';
import { getSocket, initiateSocket } from '../utils/socket';
import { Bell, Info, X, MessageSquare, Phone, PhoneCall, PhoneOff, Mail, Calendar, CheckCircle2, UserPlus } from 'lucide-react';
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

    const addToast = (title, message, type = 'info') => {
      const newToast = {
        id: Date.now() + Math.random().toString(),
        title,
        message,
        type
      };
      setToasts(prev => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    const handleNotification = (payload) => {
      addToast(payload.title || 'System Notification', payload.message || 'New update received', 'alert');
    };

    const handleLeadCreated = (payload) => {
      addToast('New Lead Captured', `Lead ${payload.name || ''} ${payload.company ? `from ${payload.company}` : ''} added to pipeline`, 'lead');
    };

    const handleLeadUpdated = (payload) => {
      addToast('Lead Record Updated', `Lead ${payload.name || 'prospect'} status changed to ${payload.status || 'updated'}`, 'lead');
    };

    const handleSmsSent = (payload) => {
      addToast('SMS Message Dispatched', `SMS sent to ${payload.to || 'recipient'}: "${payload.message || ''}"`, 'sms');
    };

    const handleSmsReceived = (payload) => {
      addToast('New SMS Received 💬', `From ${payload.from || 'client'}: "${payload.message || ''}"`, 'sms');
    };

    const handleEmailSent = (payload) => {
      addToast('Email Dispatched ✉️', `Sent to ${payload.to || 'recipient'}: "${payload.subject || ''}"`, 'email');
    };

    const handleWhatsappSent = (payload) => {
      addToast('WhatsApp Sent 💬', `Sent to ${payload.to || 'client'}: "${payload.message || ''}"`, 'whatsapp');
    };

    const handleCallLogged = (payload) => {
      addToast('Call Logged 📞', `${payload.executive || 'Rep'} logged call (${payload.status || 'completed'}): ${payload.notes || ''}`, 'call');
    };

    const handleMeetingScheduled = (payload) => {
      addToast('Meeting Scheduled 📅', `${payload.meetingType || 'Consultation'} scheduled on ${new Date(payload.date).toLocaleDateString()}`, 'meeting');
    };

    socket.on('notification_received', handleNotification);
    socket.on('lead_created', handleLeadCreated);
    socket.on('lead_updated', handleLeadUpdated);
    socket.on('sms_sent', handleSmsSent);
    socket.on('sms_received', handleSmsReceived);
    socket.on('email_sent', handleEmailSent);
    socket.on('whatsapp_sent', handleWhatsappSent);
    socket.on('call_logged', handleCallLogged);
    socket.on('meeting_scheduled', handleMeetingScheduled);

    return () => {
      socket.off('notification_received', handleNotification);
      socket.off('lead_created', handleLeadCreated);
      socket.off('lead_updated', handleLeadUpdated);
      socket.off('sms_sent', handleSmsSent);
      socket.off('sms_received', handleSmsReceived);
      socket.off('email_sent', handleEmailSent);
      socket.off('whatsapp_sent', handleWhatsappSent);
      socket.off('call_logged', handleCallLogged);
      socket.off('meeting_scheduled', handleMeetingScheduled);
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
              toast.type === 'sms' || toast.type === 'whatsapp'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : toast.type === 'email'
                ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                : toast.type === 'call'
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                : toast.type === 'meeting'
                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                : toast.type === 'lead'
                ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                : 'bg-gold/10 text-primary border border-amber-500/20'
            }`}>
              {toast.type === 'sms' || toast.type === 'whatsapp' ? (
                <MessageSquare size={14} />
              ) : toast.type === 'email' ? (
                <Mail size={14} />
              ) : toast.type === 'call' ? (
                <Phone size={14} />
              ) : toast.type === 'meeting' ? (
                <Calendar size={14} />
              ) : toast.type === 'lead' ? (
                <UserPlus size={14} />
              ) : (
                <Bell size={14} />
              )}
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
