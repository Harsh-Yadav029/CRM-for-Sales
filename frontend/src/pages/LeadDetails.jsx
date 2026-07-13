import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import Timeline from '../components/Timeline';
import EmailComposer from '../components/EmailComposer';
import CallWidget from '../components/CallWidget';
import MessageComposer from '../components/MessageComposer';
import AIChatDrawer from '../components/AIChatDrawer';

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

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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
        status: n.status,
        user: n.addedBy?.name || 'System',
        date: new Date(n.createdAt),
        icon: 'mail'
      };
    } else if (n.type === 'call') {
      return {
        type: 'call',
        title: 'Outbound Call Logged',
        desc: n.text,
        duration: n.duration,
        status: n.status,
        user: n.addedBy?.name || 'System',
        date: new Date(n.createdAt),
        icon: 'call'
      };
    } else if (n.text.includes('[Inbound SMS]') || n.text.includes('[Outbound SMS]')) {
      return {
        type: 'sms',
        title: n.text.includes('[Inbound SMS]') ? 'Inbound SMS Received' : 'Outbound SMS Sent',
        desc: n.text.replace(/\[Inbound SMS\]\s*|\[Outbound SMS\]\s*/g, ''),
        user: n.addedBy?.name || 'System',
        date: new Date(n.createdAt),
        icon: 'chat'
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
              onClick={() => setShowCallModal(true)}
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
              onClick={() => setShowSMSModal(true)}
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
              <Timeline timeline={sortedTimeline} />
            )}
          </div>
        </div>
      </div>

      {showEmailModal && (
        <EmailComposer
          lead={lead}
          onClose={() => setShowEmailModal(false)}
          onSuccess={(updatedLead) => {
            setLead(updatedLead);
            setActiveTab('history');
          }}
        />
      )}

      {showCallModal && (
        <CallWidget
          lead={lead}
          onClose={() => setShowCallModal(false)}
          onSuccess={(updatedLead) => {
            setLead(updatedLead);
            setActiveTab('history');
          }}
        />
      )}

      {showSMSModal && (
        <MessageComposer
          lead={lead}
          onClose={() => setShowSMSModal(false)}
          onSuccess={(updatedLead) => {
            setLead(updatedLead);
            setActiveTab('history');
          }}
        />
      )}

      {/* Floating Zia AI Chat Trigger Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all hover:scale-110 z-40 border border-amber-600/30"
        title="Consult Zia AI"
      >
        <span className="material-symbols-outlined text-[24px]">smart_toy</span>
      </button>

      <AIChatDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} leadId={id} />
    </div>
  );
};

export default LeadDetails;
