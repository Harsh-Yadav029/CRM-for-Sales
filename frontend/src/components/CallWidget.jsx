import React, { useState, useEffect, useRef } from 'react';
import { X, PhoneCall, PhoneOff, Loader2 } from 'lucide-react';
import api from '../utils/api';

const formatDuration = (s) => {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const CallWidget = ({ lead, onClose, onSuccess }) => {
  const [callStatus, setCallStatus] = useState('ringing'); // 'ringing', 'connected', 'ended'
  const [timer, setTimer] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Simulate connection after 1.5 seconds
    const timeout = setTimeout(() => {
      setCallStatus('connected');
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const handleEndCall = async () => {
    setCallStatus('ended');
    setLoading(true);
    try {
      const { data } = await api.post('/api/communication/call', {
        leadId: lead._id,
        duration: timer,
        status: 'completed',
        notes: callNotes.trim() || `Outbound VoIP call session to ${lead.phone}`
      });
      onSuccess(data.lead);
      onClose();
    } catch (error) {
      alert('Failed to save call disposition log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-sm rounded-2xl border border-outline-variant/50 bg-white shadow-card overflow-hidden p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">VoIP Calling Widget</span>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Animated Calling Avatar */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-container border border-outline-variant/40 relative">
          <div className={`absolute inset-0 rounded-full bg-emerald-500/10 animate-ping ${callStatus === 'connected' ? 'hidden' : ''}`}></div>
          <PhoneCall className={`h-8 w-8 ${callStatus === 'connected' ? 'text-emerald-500' : 'text-primary animate-pulse'}`} />
        </div>

        <h3 className="mt-4 font-bold text-on-surface text-base">{lead.name}</h3>
        <p className="text-xs text-on-surface-variant mt-1">{lead.phone}</p>

        {/* Call Timer Display */}
        <div className="mt-6 flex flex-col items-center">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
            callStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gold/10 text-primary'
          }`}>
            {callStatus}
          </span>
          <span className="text-3xl font-mono font-semibold text-on-surface mt-3">
            {formatDuration(timer)}
          </span>
        </div>

        {/* Call disposition details input */}
        <div className="mt-6 text-left">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Call Disposition Notes</label>
          <textarea
            rows={3}
            placeholder="Document conversation details here..."
            className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
          />
        </div>

        <div className="mt-8">
          <button
            onClick={handleEndCall}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-on-surface hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <PhoneOff className="h-4 w-4" />
                End & Save Call
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWidget;
