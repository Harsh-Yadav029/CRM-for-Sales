import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, Phone, Mail, MessageSquare, Plus, X, Calendar, 
  FileText, Star, BrainCircuit, AlertTriangle, CheckSquare, 
  Send, ShieldAlert, Award, ArrowUpRight, TrendingUp 
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';

const CommunicationHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active client scoping
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientType, setSelectedClientType] = useState('Lead');

  // Page stats and details
  const [timeline, setTimeline] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [notes, setNotes] = useState([]);

  // Modals state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Forms state
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', receiver: '' });
  const [callForm, setCallForm] = useState({ duration: 60, status: 'completed', notes: '' });
  const [meetForm, setMeetForm] = useState({ meetingType: 'Consultation', date: '', time: '', location: '', conferenceLink: '', notes: '', agenda: '' });
  const [noteForm, setNoteForm] = useState({ type: 'Sales', text: '' });
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, feedbackType: 'VR Experience', comments: '', revisionRequests: '' });

  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data } = await api.get('/api/leads');
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0]._id);
          setSelectedClientType('Lead');
        }
      } catch (err) {
        console.error('Failed to load prospects list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch client details when selectedClientId changes
  useEffect(() => {
    if (!selectedClientId) return;

    const fetchClientLogs = async () => {
      try {
        const [timeRes, aiRes, noteRes, feedbackRes] = await Promise.all([
          api.get(`/api/timeline?clientId=${selectedClientId}&clientType=${selectedClientType}`),
          api.get(`/api/ai-summary?clientId=${selectedClientId}&clientType=${selectedClientType}`),
          api.get(`/api/notes?clientId=${selectedClientId}&clientType=${selectedClientType}`),
          api.get('/api/feedback')
        ]);
        setTimeline(timeRes.data);
        setAiSummary(aiRes.data);
        setNotes(noteRes.data);
        // Filter feedbacks matching selected client email or phone if possible
        const clientObj = clients.find(c => c._id === selectedClientId);
        if (clientObj) {
          setEmailForm(prev => ({ ...prev, receiver: clientObj.email }));
          const filteredFeedback = feedbackRes.data.filter(fb => fb.clientId === selectedClientId);
          setFeedbacks(filteredFeedback);
        }
      } catch (err) {
        console.error('Failed to fetch hub details:', err);
      }
    };

    fetchClientLogs();
  }, [selectedClientId, selectedClientType, clients]);

  const activeClient = clients.find(c => c._id === selectedClientId);

  // Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/emails', {
        ...emailForm,
        clientId: selectedClientId,
        clientType: selectedClientType
      });
      setShowEmailModal(false);
      setEmailForm({ subject: '', body: '', receiver: activeClient?.email || '' });
      // Refresh
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Call Submit
  const handleCallSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/calls', {
        ...callForm,
        clientId: selectedClientId,
        clientType: selectedClientType
      });
      setShowCallModal(false);
      setCallForm({ duration: 60, status: 'completed', notes: '' });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Meeting Submit
  const handleMeetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/meetings', {
        ...meetForm,
        clientId: selectedClientId,
        clientType: selectedClientType
      });
      setShowMeetModal(false);
      setMeetForm({ meetingType: 'Consultation', date: '', time: '', location: '', conferenceLink: '', notes: '', agenda: '' });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Note Submit
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/notes', {
        ...noteForm,
        clientId: selectedClientId,
        clientType: selectedClientType
      });
      setShowNoteModal(false);
      setNoteForm({ type: 'Sales', text: '' });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Feedback Submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const revisions = feedbackForm.revisionRequests ? feedbackForm.revisionRequests.split(',').map(r => r.trim()) : [];
      await api.post('/api/feedback', {
        ...feedbackForm,
        revisionRequests: revisions,
        clientId: selectedClientId,
        clientType: selectedClientType
      });
      setShowFeedbackModal(false);
      setFeedbackForm({ rating: 5, feedbackType: 'VR Experience', comments: '', revisionRequests: '' });
      triggerRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerRefresh = async () => {
    const timeRes = await api.get(`/api/timeline?clientId=${selectedClientId}&clientType=${selectedClientType}`);
    const aiRes = await api.get(`/api/ai-summary?clientId=${selectedClientId}&clientType=${selectedClientType}`);
    const noteRes = await api.get(`/api/notes?clientId=${selectedClientId}&clientType=${selectedClientType}`);
    const feedbackRes = await api.get('/api/feedback');
    setTimeline(timeRes.data);
    setAiSummary(aiRes.data);
    setNotes(noteRes.data);
    const filteredFeedback = feedbackRes.data.filter(fb => fb.clientId === selectedClientId);
    setFeedbacks(filteredFeedback);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      
      {/* Title & Client Scope selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/60 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Walk The Plan OS</span>
          <h1 className="text-3xl font-display font-black text-ink uppercase tracking-tight leading-none mt-1">
            Communication Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">Single source of truth for all client interactions, schedules, and approvals.</p>
        </div>

        {/* Client selector dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-450 uppercase font-mono">Scoping Client:</span>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSelectedClientType('Lead');
            }}
            className="bg-white border border-line/60 rounded-btn text-xs font-bold text-ink py-2 px-3 focus:outline-none focus:border-gold transition-premium"
          >
            {clients.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Today's Quick Triggers */}
      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => setShowCallModal(true)} icon={Phone}>
          Log Call Notes
        </Button>
        <Button variant="secondary" onClick={() => setShowEmailModal(true)} icon={Mail}>
          Send Email Draft
        </Button>
        <Button variant="secondary" onClick={() => setShowMeetModal(true)} icon={Calendar}>
          Schedule Meeting
        </Button>
        <Button variant="secondary" onClick={() => setShowNoteModal(true)} icon={FileText}>
          Add Internal Note
        </Button>
        <Button variant="secondary" onClick={() => setShowFeedbackModal(true)} icon={Star}>
          Record Feedback
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Timeline Feed */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="raised" className="p-6 bg-white">
            <h2 className="text-xs font-display font-black text-ink uppercase tracking-wider mb-6 pb-2 border-b border-line/60">
              Communication Timeline
            </h2>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-12">No activities logged on this client timeline yet.</p>
            ) : (
              <div className="space-y-6 pl-4 border-l-2 border-line/60 relative">
                {timeline.map((item, idx) => {
                  const getTimelineIcon = (type) => {
                    if (type.includes('Email')) return <Mail size={12} className="text-gold" />;
                    if (type.includes('WhatsApp')) return <MessageSquare size={12} className="text-emerald-500" />;
                    if (type.includes('Call')) return <Phone size={12} className="text-blue-500" />;
                    if (type.includes('Meeting')) return <Calendar size={12} className="text-[#4FBFA6]" />;
                    return <FileText size={12} className="text-slate-550" />;
                  };

                  return (
                    <div key={item._id || idx} className="relative pl-6 pb-6 last:pb-0">
                      {/* Node Bullet */}
                      <div className="absolute -left-[31px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white shadow-sm z-10">
                        {getTimelineIcon(item.activityType)}
                      </div>

                      <div className="bg-paper border border-line/40 rounded-card p-4 hover:border-gold/20 transition-premium">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-ink uppercase tracking-wide">
                            {item.activityType}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp || item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-650 leading-relaxed whitespace-pre-line">
                          {item.description}
                        </p>
                        {item.userId && (
                          <div className="mt-3 text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                            Logged by: {item.userId.name} ({item.userId.role})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: AI Copilot & Internal notes */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Copilot Card */}
          <Card variant="raised" className="p-6 bg-white border border-line/60 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-28 w-28 bg-gold/5 blur-3xl pointer-events-none rounded-full"></div>
            
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-line/60">
              <BrainCircuit size={16} className="text-gold animate-pulse" />
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider">AI Summary Copilot</h3>
            </div>

            {aiSummary ? (
              <div className="space-y-4 text-xs font-sans text-ink">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-paper rounded-card border border-line/40 flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Health Score</span>
                    <span className="text-base font-extrabold text-ink mt-0.5">{aiSummary.projectHealthScore}%</span>
                  </div>
                  <div className="p-3 bg-paper rounded-card border border-line/40 flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Delay Risk</span>
                    <span className={`text-base font-extrabold mt-0.5 ${aiSummary.delayPrediction === 'High Risk' ? 'text-danger' : 'text-emerald-600'}`}>{aiSummary.delayPrediction}</span>
                  </div>
                </div>

                <div className="p-3 bg-gold-soft/30 rounded-card border border-gold/15 flex flex-col">
                  <span className="text-[9px] font-bold text-gold uppercase font-mono">Next Best Action</span>
                  <span className="text-xs font-bold text-[#705d00] mt-1">{aiSummary.nextBestAction || aiSummary.nextAction}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Meeting Summaries</span>
                  <p className="text-slate-650 bg-paper p-3 rounded-card border border-line/45 italic leading-relaxed text-[11px]">
                    "{aiSummary.meetingSummary}"
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-line/40">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Executive Suggestions:</span>
                  {aiSummary.executiveSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <span className="text-gold">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No AI insights generated yet.</p>
            )}
          </Card>

          {/* Internal Notes widget */}
          <Card variant="raised" className="p-6 bg-white space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-line/60">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider">Internal Notes</h3>
              <span className="text-[9px] bg-ink text-white font-mono font-bold px-1.5 py-0.5 rounded">RESTRICTED</span>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No internal notes added on this client.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scroll pr-1">
                {notes.map(n => (
                  <div key={n._id} className="p-3 bg-[#FAF9F6] border border-line/40 rounded-card flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-extrabold uppercase px-1 py-0.5 bg-gold-soft text-[#705d00] rounded">
                        {n.type} Note
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {n.userId?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed font-sans">{n.text}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Client Feedback Widget */}
          <Card variant="raised" className="p-6 bg-white space-y-4">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line/60">Client Feedbacks</h3>
            {feedbacks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No feedback entries recorded for this client.</p>
            ) : (
              <div className="space-y-3">
                {feedbacks.map(f => (
                  <div key={f._id} className="p-3 border border-line/60 rounded-card bg-paper space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{f.feedbackType}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} className={i < f.rating ? "fill-gold text-gold" : "text-slate-300"} />
                        ))}
                      </div>
                    </div>
                    {f.comments && <p className="text-xs text-slate-650 italic">"{f.comments}"</p>}
                    {f.revisionRequests.length > 0 && (
                      <div className="text-[10px] bg-red-50 text-red-700 border border-red-100 rounded-btn p-2">
                        <span className="font-extrabold block uppercase text-[8px] tracking-wider mb-1">Revisions requested:</span>
                        {f.revisionRequests.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL SHEET VIEWFORMS
          ───────────────────────────────────────────────────────────────────────────── */}

      {/* EMAIL DRAFT MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 bg-paper px-6 py-4">
              <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight">Draft Email Client</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-ink"><X size={18} /></button>
            </div>
            <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
              <Input
                label="Receiver Address"
                id="emailTo"
                type="email"
                required
                value={emailForm.receiver}
                onChange={e => setEmailForm({ ...emailForm, receiver: e.target.value })}
              />
              <Input
                label="Subject Line"
                id="emailSub"
                required
                placeholder="e.g. WalkThePlan VR Onboarding Demo"
                value={emailForm.subject}
                onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
              <Textarea
                label="Email Body content"
                id="emailBody"
                required
                placeholder="Write your email body..."
                value={emailForm.body}
                onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
              />
              <div className="flex justify-end gap-3 border-t border-line/60 pt-4">
                <Button variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
                <Button type="submit" icon={Send}>Dispatch Email</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALL LOG MODAL */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 bg-paper px-6 py-4">
              <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight">Log VoIP Call details</h3>
              <button onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-ink"><X size={18} /></button>
            </div>
            <form onSubmit={handleCallSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (seconds)"
                  id="callDur"
                  type="number"
                  required
                  value={callForm.duration}
                  onChange={e => setCallForm({ ...callForm, duration: parseInt(e.target.value) })}
                />
                <Select
                  label="Call Status Result"
                  id="callStat"
                  value={callForm.status}
                  onChange={e => setCallForm({ ...callForm, status: e.target.value })}
                  options={[
                    { value: 'completed', label: 'Answered / Completed' },
                    { value: 'missed', label: 'Missed Call' },
                    { value: 'busy', label: 'Busy tone' },
                    { value: 'no-answer', label: 'No Answer' }
                  ]}
                />
              </div>
              <Textarea
                label="Call Discussion Notes"
                id="callNotes"
                required
                placeholder="Client preferences, project constraints..."
                value={callForm.notes}
                onChange={e => setCallForm({ ...callForm, notes: e.target.value })}
              />
              <div className="flex justify-end gap-3 border-t border-line/60 pt-4">
                <Button variant="secondary" onClick={() => setShowCallModal(false)}>Cancel</Button>
                <Button type="submit">Log Call</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEETING SCHEDULER MODAL */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 bg-paper px-6 py-4">
              <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight">Schedule CRM Action Stop</h3>
              <button onClick={() => setShowMeetModal(false)} className="text-slate-400 hover:text-ink"><X size={18} /></button>
            </div>
            <form onSubmit={handleMeetSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scroll">
              <Select
                label="Meeting Type category"
                id="meetType"
                value={meetForm.meetingType}
                onChange={e => setMeetForm({ ...meetForm, meetingType: e.target.value })}
                options={[
                  { value: 'Consultation', label: 'Consultation' },
                  { value: 'Client Meeting', label: 'Client Meeting' },
                  { value: 'Design Discussion', label: 'Design Discussion' },
                  { value: 'VR Session', label: 'VR Session Walkthrough' },
                  { value: 'AR Session', label: 'AR Session Demonstration' },
                  { value: 'Construction Consultation', label: 'Construction Consultation' }
                ]}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  id="meetDate"
                  type="date"
                  required
                  value={meetForm.date}
                  onChange={e => setMeetForm({ ...meetForm, date: e.target.value })}
                />
                <Input
                  label="Time Slot"
                  id="meetTime"
                  type="text"
                  placeholder="e.g. 3:00 PM"
                  required
                  value={meetForm.time}
                  onChange={e => setMeetForm({ ...meetForm, time: e.target.value })}
                />
              </div>
              <Input
                label="Conference Link (Google Meet/Zoom)"
                id="meetLink"
                placeholder="e.g. https://meet.google.com/abc"
                value={meetForm.conferenceLink}
                onChange={e => setMeetForm({ ...meetForm, conferenceLink: e.target.value })}
              />
              <Input
                label="Meeting Location"
                id="meetLoc"
                placeholder="e.g. Showroom Cabin 2"
                value={meetForm.location}
                onChange={e => setMeetForm({ ...meetForm, location: e.target.value })}
              />
              <Textarea
                label="Meeting Agenda & Description"
                id="meetAgenda"
                value={meetForm.agenda}
                onChange={e => setMeetForm({ ...meetForm, agenda: e.target.value })}
              />
              <div className="flex justify-end gap-3 border-t border-line/60 pt-4">
                <Button variant="secondary" onClick={() => setShowMeetModal(false)}>Cancel</Button>
                <Button type="submit">Schedule Stop</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERNAL NOTE MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 bg-paper px-6 py-4">
              <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight">Add Restricted Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-ink"><X size={18} /></button>
            </div>
            <form onSubmit={handleNoteSubmit} className="p-6 space-y-4">
              <Select
                label="Access Tier Note Type"
                id="noteType"
                value={noteForm.type}
                onChange={e => setNoteForm({ ...noteForm, type: e.target.value })}
                options={[
                  { value: 'Sales', label: 'Sales Notes' },
                  { value: 'Architect', label: 'Architect Notes' },
                  { value: 'Project', label: 'Project Notes' },
                  { value: 'Manager', label: 'Manager Notes' },
                  { value: 'Support', label: 'Support Notes' }
                ]}
              />
              <Textarea
                label="Note Content"
                id="noteText"
                required
                placeholder="Internal client preferrences, drawings feedback..."
                value={noteForm.text}
                onChange={e => setNoteForm({ ...noteForm, text: e.target.value })}
              />
              <div className="flex justify-end gap-3 border-t border-line/60 pt-4">
                <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Cancel</Button>
                <Button type="submit">Create Note</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT FEEDBACK RECORDING MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/60 bg-paper px-6 py-4">
              <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight">Record Client Feedback</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-ink"><X size={18} /></button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Rating (1-5 Stars)"
                  id="fbRate"
                  value={feedbackForm.rating}
                  onChange={e => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value) })}
                  options={[
                    { value: '5', label: '5 Stars - Outstanding' },
                    { value: '4', label: '4 Stars - Good' },
                    { value: '3', label: '3 Stars - Neutral' },
                    { value: '2', label: '2 Stars - Poor' },
                    { value: '1', label: '1 Star - Critical' }
                  ]}
                />
                <Select
                  label="Feedback Category"
                  id="fbType"
                  value={feedbackForm.feedbackType}
                  onChange={e => setFeedbackForm({ ...feedbackForm, feedbackType: e.target.value })}
                  options={[
                    { value: 'VR Experience', label: 'VR Walkthrough' },
                    { value: 'AR Experience', label: 'AR Demo' },
                    { value: 'Designs', label: 'Design layouts' },
                    { value: 'Meetings', label: 'Consultations' },
                    { value: 'Services', label: 'Offered Services' },
                    { value: 'Project Completion', label: 'Final Delivery' }
                  ]}
                />
              </div>
              <Input
                label="Revisions Requested (Comma separated list)"
                id="fbRev"
                placeholder="e.g. Larger living room, move cabinet"
                value={feedbackForm.revisionRequests}
                onChange={e => setFeedbackForm({ ...feedbackForm, revisionRequests: e.target.value })}
              />
              <Textarea
                label="Comments & Suggestions"
                id="fbComments"
                placeholder="Client experience summary..."
                value={feedbackForm.comments}
                onChange={e => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
              />
              <div className="flex justify-end gap-3 border-t border-line/60 pt-4">
                <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
                <Button type="submit">Submit Feedback</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CommunicationHub;
export { CommunicationHub };
