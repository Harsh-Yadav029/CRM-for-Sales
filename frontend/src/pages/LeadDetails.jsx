import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft, Mail, Phone, MessageSquare, Plus, Trash2, Clock, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import Timeline from '../components/Timeline';
import EmailComposer from '../components/EmailComposer';
import CallWidget from '../components/CallWidget';
import MessageComposer from '../components/MessageComposer';
import AIChatDrawer from '../components/AIChatDrawer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

const STAGES = ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

const stageColor = (s, active, currentStatus) => {
  if (currentStatus === 'Lost' && s === 'Lost') return 'bg-danger text-white border-danger';
  if (s === 'Won') return active ? 'bg-[#FAF9F6] border-gold text-[#705d00] font-bold' : 'border-line text-slate-500 hover:bg-gold-soft';
  if (s === 'Lost') return active ? 'bg-danger text-white border-danger' : 'border-line text-slate-500 hover:bg-gold-soft';
  return active ? 'bg-ink text-white border-ink' : 'border-line text-slate-500 hover:bg-gold-soft';
};

const LeadDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
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
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-center text-slate-500 font-medium font-sans">
        Lead not found.{' '}
        <Link to="/leads" className="text-gold hover:underline font-bold">
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Top action header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/leads')}
          className="p-2 text-slate-400 hover:text-ink hover:bg-gold-soft rounded-lg transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Opportunity Profile</span>
          <h1 className="text-3xl font-display font-black text-ink uppercase tracking-tight leading-none mt-1">
            {lead.name}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">{lead.company}</p>
        </div>
      </div>

      {/* Action triggers */}
      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => setShowCallModal(true)} icon={Phone}>
          Call Client
        </Button>
        <Button variant="secondary" onClick={() => setShowEmailModal(true)} icon={Mail}>
          Send Email
        </Button>
        <Button variant="secondary" onClick={() => setShowSMSModal(true)} icon={MessageSquare}>
          Message
        </Button>
      </div>

      {/* Pipeline Progression Stops */}
      <Card variant="flat" className="p-6 bg-white">
        <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider mb-4">Pipeline Stage progression</h3>
        <div className="flex items-center gap-2 flex-wrap select-none">
          {STAGES.map((s, i) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`px-4 py-2 rounded-full border text-[10px] uppercase font-bold tracking-wide transition-all shadow-sm ${stageColor(s, i <= stageIdx || lead.status === s, lead.status)}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Main details split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Timeline & Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Timeline */}
          <Card variant="raised" className="p-6 bg-white">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider mb-6 pb-2 border-b border-line">Activity Timeline ({sortedTimeline.length})</h3>
            <Timeline timeline={sortedTimeline} />
          </Card>

          {/* Add Internal Notes */}
          <Card variant="raised" className="p-6 bg-white">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider mb-4">Internal Notes</h3>
            <form onSubmit={addNote} className="flex gap-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log note text..."
                className="flex-1 border border-line rounded-input py-2.5 px-4 text-xs bg-white text-ink outline-none focus:border-gold transition-all"
              />
              <Button type="submit">
                Add Note
              </Button>
            </form>

            {/* Notes List */}
            <div className="mt-6 space-y-4 max-h-80 overflow-y-auto pr-1.5 custom-scroll">
              {(!lead.notes || lead.notes.length === 0) ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No internal notes logged.</p>
              ) : (
                lead.notes.filter(n => !n.type || n.type === 'note').slice().reverse().map((note, idx) => (
                  <div key={idx} className="p-4 bg-[#FAF9F6] border border-line rounded-card">
                    <p className="text-xs text-ink font-medium leading-relaxed">{note.text}</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-line text-[9px] font-bold text-slate-400 uppercase font-mono">
                      <span>By: {note.addedBy?.name || 'System'}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Values & Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Deal Value */}
          <Card variant="raised" className="p-6 bg-white">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Expected Revenue</h3>
            <div className="text-3xl font-bold font-mono text-ink tracking-tight mt-1">{fmt(lead.expectedRevenue)}</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase font-mono mt-1">Value Projection</p>
          </Card>

          {/* Customer Company Info */}
          <Card variant="raised" className="p-6 bg-white space-y-4">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Company</span>
                <span className="text-xs font-bold text-ink mt-0.5">{lead.company}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Email Address</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-bold text-ink truncate max-w-[180px]">{lead.email}</span>
                  <button onClick={handleCopyEmail} className="text-gold hover:text-gold/80 text-[10px] font-bold uppercase font-mono ml-1">
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Phone Number</span>
                <span className="text-xs font-bold text-ink mt-0.5">{lead.phone}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Acquisition Source</span>
                <span className="text-xs font-bold text-ink mt-0.5">{lead.source}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Assigned Executive</span>
                <span className="text-xs font-bold text-ink mt-0.5">{lead.assignedTo?.name || 'Unassigned'}</span>
              </div>
            </div>
          </Card>

          {/* Custom Lead Parameters */}
          {customFieldDefinitions.length > 0 && (
            <Card variant="flat" className="p-6 bg-white space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Custom Parameters</h3>
              <div className="space-y-3">
                {customFieldDefinitions.map((field) => {
                  const val = lead.customFields?.[field.fieldName];
                  return (
                    <div key={field._id} className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">{field.fieldName}</span>
                      <span className="text-xs font-bold text-ink mt-0.5">
                        {val !== undefined && val !== null ? String(val) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Engagement Score */}
          <Card variant="flat" className="p-6 bg-white space-y-3">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider">Engagement Level</h3>
            <div className="w-full h-2 bg-line rounded-full overflow-hidden">
              <div className="h-full bg-gold w-[85%] rounded-full"></div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono">
              <span>Excellent Standing</span>
              <span>85% Score</span>
            </div>
          </Card>
        </div>
      </div>

      {showEmailModal && (
        <EmailComposer
          lead={lead}
          onClose={() => setShowEmailModal(false)}
          onSuccess={(updatedLead) => {
            setLead(updatedLead);
          }}
        />
      )}

      {showCallModal && (
        <CallWidget
          lead={lead}
          onClose={() => setShowCallModal(false)}
          onSuccess={(updatedLead) => {
            setLead(updatedLead);
          }}
        />
      )}

      {showSMSModal && (
        <MessageComposer
          lead={lead}
          onClose={() => setShowSMSModal(false)}
          onSuccess={(updatedLead) => {
            setLead(updatedLead);
          }}
        />
      )}

      {/* Floating Zia AI Chat Trigger Button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-gold hover:bg-gold/90 text-ink flex items-center justify-center shadow-card-hover transition-all hover:scale-110 z-40 border border-gold/30"
        title="Consult Zia AI"
      >
        <Bot size={22} className="stroke-[2.5]" />
      </button>

      <AIChatDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} leadId={id} />
    </div>
  );
};

export default LeadDetails;
export { LeadDetails };
