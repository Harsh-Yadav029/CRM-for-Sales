import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  Bot, 
  X, 
  CalendarDays, 
  AlertTriangle 
} from 'lucide-react';
import Timeline from '../components/Timeline';
import EmailComposer from '../components/EmailComposer';
import CallWidget from '../components/CallWidget';
import MessageComposer from '../components/MessageComposer';
import AIChatDrawer from '../components/AIChatDrawer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

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
  const [recordActivities, setRecordActivities] = useState({ open: [], closed: [] });
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Form state for activity quick-create
  const [activityForm, setActivityForm] = useState({
    type: 'task',
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    priority: 'medium',
    location: '',
    conferenceLink: ''
  });

  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

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

  const fetchRecordActivities = async () => {
    try {
      const { data } = await api.get(`/api/activities/related/Lead/${id}`);
      setRecordActivities(data);
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const { data } = await api.get('/api/custom-fields');
      setCustomFieldDefinitions(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchLead();
    fetchRecordActivities();
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

  const handleToggleActivity = async (act) => {
    try {
      if (act.activityType === 'task') {
        const newStatus = act.status === 'completed' ? 'open' : 'completed';
        await api.put(`/api/tasks/${act._id}`, { status: newStatus });
      } else {
        const newStatus = act.status === 'completed' ? 'scheduled' : 'completed';
        await api.put(`/api/events/${act._id}`, { status: newStatus });
      }
      fetchRecordActivities();
    } catch (e) {
      console.error('Failed to toggle activity state:', e);
    }
  };

  const handleDeleteActivity = async (act) => {
    if (!confirm(`Delete this ${act.activityType}?`)) return;
    try {
      if (act.activityType === 'task') {
        await api.delete(`/api/tasks/${act._id}`);
      } else {
        await api.delete(`/api/events/${act._id}`);
      }
      fetchRecordActivities();
    } catch (e) {
      console.error('Failed to delete activity:', e);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      const isTask = activityForm.type === 'task';
      const endpoint = isTask ? '/api/tasks' : '/api/events';
      
      const payload = {
        type: activityForm.type,
        title: activityForm.title,
        description: activityForm.description,
        relatedTo: {
          module: 'Lead',
          recordId: id
        }
      };

      if (isTask) {
        payload.dueDate = activityForm.dueDate;
        payload.priority = activityForm.priority;
      } else {
        payload.startTime = activityForm.startTime;
        payload.endTime = activityForm.endTime;
        payload.location = activityForm.location;
        payload.conferenceLink = activityForm.conferenceLink;
      }

      await api.post(endpoint, payload);
      setShowActivityModal(false);
      
      // Reset form
      setActivityForm({
        type: 'task',
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
        priority: 'medium',
        location: '',
        conferenceLink: ''
      });
      fetchRecordActivities();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating activity');
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

  // Timeline processing using recordActivities
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

  const openActivitiesTimeline = recordActivities.open.map((a) => ({
    type: a.activityType === 'task' ? 'task' : (a.activityType === 'meeting' ? 'meeting' : 'call'),
    title: a.activityType === 'task' ? 'Task Scheduled' : `${a.activityType.toUpperCase()}: ${a.title}`,
    desc: a.description || a.title,
    user: a.assignedTo?.name || 'You',
    date: new Date(a.date),
    icon: a.activityType === 'task' ? 'assignment' : (a.activityType === 'meeting' ? 'calendar' : 'phone'),
    duration: a.recordingDuration,
    recordingUrl: a.recordingUrl
  }));

  const closedActivitiesTimeline = recordActivities.closed.map((a) => ({
    type: a.activityType === 'task' ? 'task' : (a.activityType === 'meeting' ? 'meeting' : 'call'),
    title: a.activityType === 'task' ? 'Task Completed' : `${a.activityType.toUpperCase()}: ${a.title}`,
    desc: a.description || a.title,
    user: a.assignedTo?.name || 'You',
    date: new Date(a.date),
    icon: a.activityType === 'task' ? 'assignment' : (a.activityType === 'meeting' ? 'calendar' : 'phone'),
    duration: a.recordingDuration,
    recordingUrl: a.recordingUrl
  }));

  const sortedTimeline = [...notesTimeline, ...openActivitiesTimeline, ...closedActivitiesTimeline].sort((a, b) => b.date - a.date);

  const getBadgeStyle = (type) => {
    if (type === 'task') return 'bg-[#E3A62F]/15 text-[#E3A62F]';
    if (type === 'meeting') return 'bg-[#4FBFA6]/15 text-[#4FBFA6]';
    return 'bg-[#E2705C]/15 text-[#E2705C]';
  };

  const ActivityMiniRow = ({ act }) => {
    const isCompleted = act.status === 'completed' || act.status === 'cancelled';
    const dateFormatted = act.activityType === 'task'
      ? new Date(act.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : `${new Date(act.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${new Date(act.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <div className="flex items-start justify-between gap-3 p-3 bg-[#FAF9F6]/50 border border-line hover:border-gold/25 rounded-xl group transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <button 
            type="button" 
            onClick={() => handleToggleActivity(act)}
            className="shrink-0 text-slate-400 hover:text-gold transition-colors"
          >
            {isCompleted ? (
              <div className="w-4.5 h-4.5 rounded-full border border-gold bg-gold/10 flex items-center justify-center text-gold">
                <span className="material-symbols-outlined text-[10px] font-bold">check</span>
              </div>
            ) : (
              <div className="w-4.5 h-4.5 rounded-full border border-slate-350 bg-white hover:border-gold transition-colors" />
            )}
          </button>
          <div className="min-w-0">
            <p className={`text-xs font-bold truncate leading-tight ${isCompleted ? 'line-through text-slate-400 font-semibold' : 'text-ink'}`}>
              {act.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded leading-none ${getBadgeStyle(act.activityType)}`}>
                {act.activityType}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                {dateFormatted}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleDeleteActivity(act)} 
          className="p-1 hover:bg-red-50 text-slate-450 hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  };

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
          
          {/* Activities (Zoho style Open/Closed Activities lists) */}
          <Card variant="raised" className="p-6 bg-white">
            <div className="flex justify-between items-center pb-3 border-b border-line mb-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider">Activities Planner</h3>
              <button 
                onClick={() => setShowActivityModal(true)}
                className="flex items-center gap-1 text-[9px] font-extrabold uppercase bg-gold hover:bg-gold/90 text-ink px-2.5 py-1 rounded-btn tracking-wider font-mono shadow-sm transition-all"
              >
                <Plus size={11} />
                <span>Add Activity</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Open Activities */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">Open Activities</h4>
                {recordActivities.open.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic py-2">No open activities scheduled.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll pr-1">
                    {recordActivities.open.map(act => (
                      <ActivityMiniRow key={act._id} act={act} />
                    ))}
                  </div>
                )}
              </div>

              {/* Closed Activities */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">Closed Activities</h4>
                {recordActivities.closed.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic py-2">No closed activities logged.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll pr-1">
                    {recordActivities.closed.map(act => (
                      <ActivityMiniRow key={act._id} act={act} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

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

      {/* Record details Quick-Create Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs" onClick={() => setShowActivityModal(false)}>
          <div
            className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">Add Activity for {lead.name}</h3>
              <button onClick={() => setShowActivityModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scroll font-sans">
              
              {/* Type Select buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1.5 block">Activity Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'task', label: 'Task' },
                    { value: 'meeting', label: 'Meeting' },
                    { value: 'call', label: 'Call' }
                  ].map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setActivityForm({ ...activityForm, type: t.value })}
                      className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-btn transition-all border ${
                        activityForm.type === t.value
                          ? 'bg-ink text-white border-ink'
                          : 'bg-white border-line text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <Input
                label="Title"
                id="detActTitle"
                placeholder="E.g., Presentation proposal callback"
                required
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              />

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1 block">Description</label>
                <textarea
                  id="detActDesc"
                  rows={2}
                  className="w-full bg-white border border-line rounded-input p-3 text-xs focus:ring-1 focus:ring-gold focus:border-gold"
                  placeholder="Notes, agenda, or goals..."
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                />
              </div>

              {/* Conditional parameters */}
              {activityForm.type === 'task' ? (
                <>
                  <Input
                    label="Due Date"
                    id="detActDue"
                    type="date"
                    required
                    value={activityForm.dueDate}
                    onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                  />
                  <Select
                    label="Priority"
                    id="detActPriority"
                    value={activityForm.priority}
                    onChange={(e) => setActivityForm({ ...activityForm, priority: e.target.value })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' }
                    ]}
                  />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Start Date & Time"
                      id="detActStart"
                      type="datetime-local"
                      required
                      value={activityForm.startTime}
                      onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })}
                    />
                    <Input
                      label="End Date & Time"
                      id="detActEnd"
                      type="datetime-local"
                      required
                      value={activityForm.endTime}
                      onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Location"
                    id="detActLoc"
                    placeholder="E.g., Client Office, or Zoom"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                  />
                  <Input
                    label="Conference Link"
                    id="detActConf"
                    placeholder="https://meet.google.com/..."
                    value={activityForm.conferenceLink}
                    onChange={(e) => setActivityForm({ ...activityForm, conferenceLink: e.target.value })}
                  />
                </>
              )}

              {/* Locked relation identifier display */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1">Related Record</label>
                <div className="p-2.5 bg-slate-50 border border-line rounded-input text-xs text-slate-600 font-semibold font-mono flex items-center gap-1.5 uppercase">
                  <span>Lead:</span>
                  <span>{lead.name}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowActivityModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Activity
                </Button>
              </div>
            </form>
          </div>
        </div>
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
