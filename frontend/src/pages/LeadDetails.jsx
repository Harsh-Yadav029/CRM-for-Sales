import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, X, Send, PhoneCall, PhoneOff } from 'lucide-react';

const STAGES = ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const stageColor = (s, active, currentStatus) => {
  if (currentStatus === 'Lost' && s === 'Lost') return 'bg-error text-white border-error';
  if (s === 'Won') return active ? 'bg-secondary text-white border-secondary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low';
  if (s === 'Lost') return active ? 'bg-error text-white border-error' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low';
  return active ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low';
};

const LeadDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'history'
  const [copied, setCopied] = useState(false);

  // Phase 1 Email Composer State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  // Phase 1 VoIP Call State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callStatus, setCallStatus] = useState('ringing'); // 'ringing', 'connected', 'ended'
  const [callTimer, setCallTimer] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const timerRef = useRef(null);

  const fetchLead = async () => {
    try {
      const { data } = await api.get(`/api/leads/${id}`);
      setLead(data);
    } catch (e) {
      console.error('Error fetching lead details:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/api/tasks');
      setTasks(data.filter((t) => t.leadId?._id === id || t.leadId === id));
    } catch (_) {}
  };

  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);
  const fetchCustomFields = async () => {
    try {
      const { data } = await api.get('/api/custom-fields');
      setCustomFieldDefinitions(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchLead();
    fetchTasks();
    fetchCustomFields();
  }, [id]);

  // Call simulation timers
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const updateStatus = async (status) => {
    try {
      await api.put(`/api/leads/${id}/status`, { status });
      setLead((prev) => (prev ? { ...prev, status } : null));
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleCopyEmail = () => {
    if (!lead?.email) return;
    navigator.clipboard.writeText(lead.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      const { data } = await api.post(`/api/leads/${id}/notes`, { text: noteText });
      setNoteText('');
      setLead(data);
    } catch (e) {
      alert('Error adding note');
    }
  };

  // Phase 1 Action: Email Composer Send
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.body.trim()) return;
    setEmailLoading(true);
    try {
      const { data } = await api.post('/api/communication/email', {
        leadId: lead._id,
        subject: emailForm.subject,
        body: emailForm.body
      });
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '' });
      setLead(data.lead);
      setActiveTab('history');
    } catch (err) {
      alert(err.response?.data?.message || 'Error dispatching email');
    } finally {
      setEmailLoading(false);
    }
  };

  // Phase 1 Action: VoIP Calling Initiator
  const startCall = () => {
    setCallTimer(0);
    setCallNotes('');
    setCallStatus('ringing');
    setShowCallModal(true);
    
    // Simulate auto-connecting after 2 seconds
    setTimeout(() => {
      setCallStatus('connected');
    }, 2000);
  };

  const endCall = async () => {
    setCallStatus('ended');
    try {
      const { data } = await api.post('/api/communication/call', {
        leadId: lead._id,
        duration: callTimer,
        status: 'completed',
        notes: callNotes.trim() || `Outbound VoIP call session to ${lead.phone}`
      });
      setLead(data.lead);
      setActiveTab('history');
    } catch (err) {
      alert('Error logging call details');
    } finally {
      setShowCallModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-center text-on-surface-variant font-medium">
        Lead not found.{' '}
        <Link to="/leads" className="text-primary hover:underline font-bold">
          Back to Leads
        </Link>
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(lead.status);
  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  // Formatted duration helper
  const formatDuration = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Parse rich activity timeline entries
  const notesTimeline = (lead.notes || []).map((n) => {
    if (n.type === 'email') {
      return {
        type: 'email',
        title: n.subject || 'Email Sent',
        desc: n.text,
        user: n.addedBy?.name || 'System',
        date: new Date(n.createdAt),
        icon: 'mail'
      };
    } else if (n.type === 'call') {
      return {
        type: 'call',
        title: 'Outbound Call Logged',
        desc: `${n.text} (${formatDuration(n.duration)} duration, Status: ${n.status})`,
        user: n.addedBy?.name || 'System',
        date: new Date(n.createdAt),
        icon: 'call'
      };
    } else {
      return {
        type: 'note',
        title: 'Note Added',
        desc: n.text,
        user: n.addedBy?.name || 'System',
        date: new Date(n.createdAt),
        icon: 'description'
      };
    }
  });

  const tasksTimeline = tasks.map((t) => ({
    type: 'task',
    title: t.completed ? 'Task Completed' : 'Task Scheduled',
    desc: t.title,
    user: t.assignedTo?.name || 'You',
    date: new Date(t.dueDate),
    icon: 'assignment'
  }));

  const sortedTimeline = [...notesTimeline, ...tasksTimeline].sort((a, b) => b.date - a.date);

  const getTimelineBulletBg = (type) => {
    if (type === 'call') return 'bg-secondary';
    if (type === 'email') return 'bg-tertiary';
    if (type === 'task') return 'bg-outline';
    return 'bg-primary';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Top action header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/leads')}
          className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-xl transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-base md:text-lg font-bold text-on-surface leading-tight">{lead.name}</h2>
          <p className="text-xs text-on-surface-variant">{lead.company}</p>
        </div>
      </div>

      {/* Profile Header Details Section */}
      <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-primary/20 bg-surface-container flex items-center justify-center text-primary font-bold text-lg uppercase shrink-0">
                {lead.name.slice(0, 2)}
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-on-surface leading-tight">{lead.name}</h2>
              <p className="text-xs md:text-sm text-on-surface-variant mt-0.5">{lead.company} • {lead.source}</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-0.5 rounded-full font-bold text-[10px]">
                  High Priority
                </span>
                <span className="bg-surface-container-high text-on-surface-variant px-3 py-0.5 rounded-full font-bold text-[10px]">
                  {lead.status} Stage
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startCall}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              Call Client
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant hover:bg-surface-container-low text-primary rounded-xl font-bold text-xs transition-all"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Send Email
            </button>
            <button
              onClick={() => alert(`Initiating communication with ${lead.name}`)}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant hover:bg-surface-container-low text-primary rounded-xl font-bold text-xs transition-all"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              Message
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Stage buttons trail */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Pipeline Stage progression</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm ${stageColor(s, i <= stageIdx || lead.status === s, lead.status)}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main details content layout */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar details */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Deal Value</h3>
            <div className="text-2xl font-extrabold text-on-surface">{fmt(lead.expectedRevenue)}</div>
            <p className="text-[10px] text-on-surface-variant mt-1">Expected Revenue Projection</p>
          </div>
          
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Company Info</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">corporate_fare</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-on-surface truncate">{lead.company}</div>
                <div className="text-[10px] text-on-surface-variant truncate">Cloud Infrastructure Client</div>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-outline-variant/60">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface-variant">Client Source</span>
                <span className="text-on-surface">{lead.source}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-on-surface-variant">Owner</span>
                <span className="text-on-surface">{lead.assignedTo?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Engagement Score</h3>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-[85%] rounded-full"></div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold text-secondary">Excellent Status</span>
              <span className="text-[10px] text-on-surface-variant font-medium">85% Activity</span>
            </div>
          </div>
        </aside>

        {/* Tabbed view details */}
        <div className="w-full lg:w-2/3 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {/* Tab buttons */}
          <div className="flex border-b border-outline-variant bg-surface-container-low/30">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'details' ? 'border-primary text-primary bg-white shadow-sm' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-center text-xs font-bold border-b-2 transition-all ${activeTab === 'history' ? 'border-primary text-primary bg-white shadow-sm' : 'border-transparent text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              History Timeline ({sortedTimeline.length})
            </button>
          </div>

          {/* Details Content tab */}
          <div className="p-5">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-outline mb-1 uppercase tracking-wider">Professional Email</label>
                    <div className="text-xs md:text-sm font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="truncate">{lead.email}</span>
                      <button 
                        onClick={handleCopyEmail}
                        className="p-1 hover:bg-surface-container rounded text-outline hover:text-primary transition-all"
                        title="Copy to Clipboard"
                      >
                        <span className="material-symbols-outlined text-sm">{copied ? 'done' : 'content_copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-outline mb-1 uppercase tracking-wider">Direct Phone</label>
                    <div className="text-xs md:text-sm font-semibold text-on-surface">{lead.phone}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-outline mb-1 uppercase tracking-wider">Lead Source</label>
                    <div className="text-xs md:text-sm font-semibold text-on-surface">{lead.source}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-outline mb-1 uppercase tracking-wider">Timezone</label>
                    <div className="text-xs md:text-sm font-semibold text-on-surface">IST (UTC+5:30)</div>
                  </div>
                </div>

                {customFieldDefinitions.length > 0 && (
                  <>
                    <hr className="border-outline-variant/60" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customFieldDefinitions.map((field) => {
                        const val = lead.customFields?.[field.fieldName];
                        return (
                          <div key={field._id}>
                            <label className="block text-[10px] font-extrabold text-outline mb-1 uppercase tracking-wider">
                              {field.fieldName}
                            </label>
                            <div className="text-xs md:text-sm font-semibold text-on-surface">
                              {val !== undefined && val !== null ? String(val) : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <hr className="border-outline-variant/60" />

                {/* Add Internal Notes section */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider">Internal Notes</label>
                  <form onSubmit={addNote} className="flex gap-2">
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a new note to this profile..."
                      className="flex-1 border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-low text-on-surface outline-none focus:border-primary transition-all"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Add Note
                    </button>
                  </form>

                  {/* Notes log */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scroll">
                    {(!lead.notes || lead.notes.length === 0) ? (
                      <p className="text-xs text-on-surface-variant/70 italic text-center py-4">No internal notes added yet.</p>
                    ) : (
                      lead.notes.filter(n => !n.type || n.type === 'note').slice().reverse().map((note, idx) => (
                        <div key={idx} className="p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/60">
                          <p className="text-xs text-on-surface font-medium leading-relaxed">{note.text}</p>
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-outline-variant/30 text-[9px] font-bold text-on-surface-variant uppercase">
                            <span>By: {note.addedBy?.name || 'System'}</span>
                            <span>{new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* History Timeline tab content */
              <div className="space-y-6">
                {sortedTimeline.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/70 italic text-center py-6">No historical actions logged for this lead.</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-outline-variant space-y-6">
                    {sortedTimeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        {/* Bullet indicator */}
                        <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-white ${getTimelineBulletBg(item.type)}`}></div>
                        
                        <div className="bg-surface-container-low/30 p-3.5 rounded-xl border border-outline-variant/60">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xs">{item.icon}</span>
                              {item.title}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{item.desc}</p>
                          <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase block mt-2">Action by: {item.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outgoing Email Composer Modal */}
      {showEmailModal && (
        <div 
          className="fixed inset-0 bg-on-background/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowEmailModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-outline-variant" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-bold text-sm md:text-base text-on-surface">Send Email to {lead.name}</h3>
              <button 
                onClick={() => setShowEmailModal(false)} 
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Subject</label>
                <input 
                  value={emailForm.subject} 
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} 
                  required 
                  placeholder="E.g., NexaCore Core License Proposal"
                  className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Email Body</label>
                <textarea 
                  value={emailForm.body} 
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} 
                  required 
                  rows={6}
                  placeholder="Type your email content here..."
                  className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)} 
                  className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={emailLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                >
                  {emailLoading ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VoIP Call Simulator Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-outline-variant p-6 text-center space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase shadow-sm">
                {lead.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-base text-on-surface">{lead.name}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{lead.phone}</p>
              </div>
            </div>

            <div className="py-4 bg-surface-container-low/40 rounded-xl border border-outline-variant/60 flex flex-col items-center justify-center space-y-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${callStatus === 'connected' ? 'text-secondary' : 'text-primary'}`}>
                {callStatus === 'ringing' ? 'Ringing Simulator...' : 'Call Active'}
              </span>
              <span className="text-2xl font-extrabold text-on-surface font-mono">
                {formatDuration(callTimer)}
              </span>
            </div>

            {callStatus === 'connected' && (
              <div className="text-left space-y-2">
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider">Call Notes</label>
                <textarea 
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Type important items discussed during the call..."
                  rows={3}
                  className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface outline-none resize-none"
                />
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button 
                onClick={endCall}
                className="w-14 h-14 bg-error hover:brightness-110 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
