import React, { useState, useEffect, useRef } from 'react';
import { X, PhoneCall, PhoneOff, Loader2, Mic, MicOff } from 'lucide-react';
import api from '../utils/api';
import { useVoice } from '../context/VoiceContext';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Select from './ui/Select';

const formatDuration = (s) => {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const CallWidget = ({ lead, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { 
    device, 
    activeCall, 
    setActiveCall, 
    currentLead, 
    setCurrentLead,
    currentEventId,
    setCurrentEventId
  } = useVoice();

  const [callStatus, setCallStatus] = useState('connecting'); // 'connecting', 'ringing', 'in-progress', 'completed'
  const [timer, setTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Post-call disposition state
  const [showDisposition, setShowDisposition] = useState(false);
  const [disposition, setDisposition] = useState('interested');
  const [callNotes, setCallNotes] = useState('');

  const timerRef = useRef(null);
  const callRef = useRef(null);
  const eventIdRef = useRef(null);

  // Initialize lead data from prop if provided
  useEffect(() => {
    if (lead) {
      setCurrentLead(lead);
    }
  }, [lead]);

  const activeLead = lead || currentLead;

  // Outbound call initiation
  useEffect(() => {
    if (!device || !activeLead) return;

    // Check if we already have an active call (e.g., an incoming call was accepted)
    if (activeCall) {
      callRef.current = activeCall;
      setCallStatus('in-progress');
      setupCallListeners(activeCall);
      return;
    }

    const startOutboundCall = async () => {
      try {
        setCallStatus('connecting');

        // 1. Pre-create the Event record for outbound call
        const { data: event } = await api.post('/api/events', {
          type: 'call',
          title: `Outbound Call to ${activeLead.name}`,
          description: `Outbound VoIP call session to ${activeLead.phone}`,
          startTime: new Date(),
          endTime: new Date(Date.now() + 60000), // temp endTime
          direction: 'outbound',
          status: 'scheduled',
          relatedTo: {
            module: 'Lead',
            recordId: activeLead._id
          },
          assignedTo: user._id
        });

        eventIdRef.current = event._id;
        setCurrentEventId(event._id);

        // 2. Connect the Twilio Voice session
        const call = await device.connect({
          params: {
            number: activeLead.phone,
            eventId: event._id
          }
        });

        callRef.current = call;
        setActiveCall(call);
        setupCallListeners(call);
      } catch (err) {
        console.error('Outbound call initiation error:', err);
        setCallStatus('completed');
        setShowDisposition(true);
      }
    };

    startOutboundCall();

    return () => {
      // Don't auto-disconnect on unmount, wait for hangup or final save
    };
  }, [device, activeLead]);

  // Handle call listeners
  const setupCallListeners = (call) => {
    call.on('ringing', () => {
      setCallStatus('ringing');
    });

    call.on('accept', () => {
      setCallStatus('in-progress');
    });

    call.on('disconnect', () => {
      setCallStatus('completed');
      if (timerRef.current) clearInterval(timerRef.current);
      setShowDisposition(true);
    });

    call.on('reject', () => {
      setCallStatus('completed');
      if (timerRef.current) clearInterval(timerRef.current);
      setShowDisposition(true);
    });

    call.on('error', (error) => {
      console.error('Call SDK connection error:', error);
      setCallStatus('completed');
      if (timerRef.current) clearInterval(timerRef.current);
      setShowDisposition(true);
    });
  };

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'in-progress') {
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

  // Toggle Mute
  const handleToggleMute = () => {
    if (callRef.current) {
      const nextMute = !muted;
      callRef.current.mute(nextMute);
      setMuted(nextMute);
    }
  };

  // Hangup call
  const handleHangup = () => {
    if (callRef.current) {
      callRef.current.disconnect();
    } else {
      setCallStatus('completed');
      setShowDisposition(true);
    }
  };

  // Save disposition and notes
  const handleSaveDisposition = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const activeEventId = currentEventId || eventIdRef.current;
    try {
      if (activeEventId) {
        // Update the event record
        const { data: updatedEvent } = await api.put(`/api/events/${activeEventId}`, {
          disposition,
          description: callNotes.trim() || `Outbound VoIP call session to ${activeLead?.phone}`,
          status: 'completed',
          recordingDuration: timer,
          endTime: new Date()
        });

        // Trigger callbacks
        if (onSuccess) {
          onSuccess(updatedEvent);
        }
      } else {
        // Fallback: create event if it was missed
        const { data: newEvent } = await api.post('/api/events', {
          type: 'call',
          title: `Call to ${activeLead?.name || 'Client'}`,
          description: callNotes.trim(),
          startTime: new Date(Date.now() - timer * 1000),
          endTime: new Date(),
          direction: 'outbound',
          status: 'completed',
          disposition,
          recordingDuration: timer,
          relatedTo: activeLead ? {
            module: 'Lead',
            recordId: activeLead._id
          } : undefined
        });

        if (onSuccess) {
          onSuccess(newEvent);
        }
      }

      // Cleanup Voice states
      setActiveCall(null);
      setCurrentLead(null);
      setCurrentEventId(null);

      onClose();
    } catch (error) {
      console.error('Failed to log call disposition:', error);
      alert('Failed to save call disposition log.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={handleHangup}>
      <div 
        className="w-full max-w-sm rounded-2xl border border-line bg-white shadow-modal overflow-hidden p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">VoIP Call Control</span>
          <button onClick={handleHangup} className="text-slate-400 hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* 1. Live calling screen */}
        {!showDisposition ? (
          <>
            {/* Animated Gold Pulse Rings */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold-soft border border-gold/20 relative">
              {callStatus === 'in-progress' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping"></div>
                  <div className="absolute -inset-2 rounded-full border border-gold/10 animate-pulse"></div>
                </>
              )}
              <PhoneCall className={`h-8 w-8 ${callStatus === 'in-progress' ? 'text-gold' : 'text-slate-400 animate-pulse'}`} />
            </div>

            <h3 className="mt-4 font-bold text-ink text-base uppercase font-display">{activeLead?.name || 'Unknown Client'}</h3>
            <p className="text-xs text-slate-500 font-mono font-bold mt-1">{activeLead?.phone || 'No phone number'}</p>

            {/* Call State Display */}
            <div className="mt-6 flex flex-col items-center">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase ${
                callStatus === 'in-progress' ? 'bg-teal-500/10 text-teal-600' : 'bg-gold-soft text-gold'
              }`}>
                {callStatus}
              </span>
              <span className="text-3xl font-mono font-bold text-ink mt-3 select-none">
                {formatDuration(timer)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleToggleMute}
                className={`p-3.5 rounded-full border transition-all ${
                  muted 
                    ? 'bg-red-50 text-red-500 border-red-200' 
                    : 'bg-slate-50 text-slate-600 border-line hover:bg-slate-100'
                }`}
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              
              <button
                onClick={handleHangup}
                className="p-3.5 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-md transition-all hover:scale-105"
                title="Hang up"
              >
                <PhoneOff size={18} />
              </button>
            </div>
          </>
        ) : (
          /* 2. Mandatory Post-Call Disposition Form */
          <form onSubmit={handleSaveDisposition} className="text-left space-y-4 font-sans">
            <div className="text-center pb-2 border-b border-line">
              <h4 className="text-sm font-display font-black text-ink uppercase tracking-tight">Log Call Disposition</h4>
              <p className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-0.5">
                Call Duration: {formatDuration(timer)}
              </p>
            </div>

            <Select
              label="Call Disposition"
              id="callDisp"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              options={[
                { value: 'interested', label: 'Interested' },
                { value: 'no_answer', label: 'No Answer' },
                { value: 'call_back_later', label: 'Call Back Later' },
                { value: 'not_interested', label: 'Not Interested' },
                { value: 'wrong_number', label: 'Wrong Number' },
                { value: 'other', label: 'Other / Call notes' }
              ]}
            />

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">Call Notes</label>
              <textarea
                rows={3}
                placeholder="Document conversation details here..."
                className="w-full rounded-input border border-line bg-white px-3 py-2 text-xs text-ink placeholder-slate-450 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isSaving} className="w-full justify-center">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving Log...
                  </>
                ) : (
                  'Save and Close Widget'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CallWidget;
