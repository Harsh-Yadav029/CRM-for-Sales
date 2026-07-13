import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, X, Check, Bell, MapPin, Video, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Textarea from '../components/ui/Textarea';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 13)); // July 13 2026 as root starting point
  const [viewMode, setViewMode] = useState('Month'); // Month, Week, Day, Agenda
  const [showTeamCalendar, setShowTeamCalendar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Smart Add Input
  const [smartAddText, setSmartAddText] = useState('');

  // Form State
  const [form, setForm] = useState({
    title: '',
    type: 'meeting',
    description: '',
    startTime: '',
    endTime: '',
    timezone: 'Asia/Kolkata',
    relatedModule: 'Lead',
    relatedRecordId: '',
    assignedTo: user?._id || '',
    participants: [],
    location: '',
    conferenceLink: '',
    colorTag: 'gold',
    recurrenceFreq: 'none',
    recurrenceInterval: 1,
    recurrenceEndDate: ''
  });

  // Busy check warnings state
  const [busyWarnings, setBusyWarnings] = useState({});

  // Participant form sub-state
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', userId: '' });

  const fetchData = async () => {
    try {
      const [leadsRes, contactsRes, companiesRes] = await Promise.all([
        api.get('/api/leads'),
        api.get('/api/contacts'),
        api.get('/api/companies')
      ]);
      setLeads(leadsRes.data);
      setContacts(contactsRes.data);
      setCompanies(companiesRes.data);

      if (user?.role === 'admin' || user?.role === 'manager') {
        const teamRes = await api.get('/api/auth/salespeople');
        setTeamMembers(teamRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEvents = async () => {
    try {
      const endpoint = showTeamCalendar ? '/api/events/team' : '/api/events';
      const { data } = await api.get(endpoint);
      setEvents(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [showTeamCalendar]);

  const handlePrev = () => {
    if (viewMode === 'Month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (viewMode === 'Week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'Month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (viewMode === 'Week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
    }
  };

  // Availability Check Trigger
  const triggerAvailabilityCheck = async (updatedParticipants = form.participants, start = form.startTime, end = form.endTime) => {
    if (!start || !end) return;
    const internalUserIds = updatedParticipants
      .map(p => p.userId)
      .filter(Boolean);

    if (internalUserIds.length === 0) {
      setBusyWarnings({});
      return;
    }

    try {
      const { data } = await api.post('/api/events/availability', {
        userIds: internalUserIds,
        startTime: start,
        endTime: end
      });
      // Map user ID to busy status
      const warnings = {};
      data.forEach(busy => {
        warnings[busy.userId] = `Busy: "${busy.title}"`;
      });
      setBusyWarnings(warnings);
    } catch (_) {}
  };

  // Add Participant logic
  const handleAddParticipant = () => {
    if (!newParticipant.name.trim() || !newParticipant.email.trim()) return;
    const updated = [...form.participants, { ...newParticipant, rsvpStatus: 'pending' }];
    setForm(prev => ({ ...prev, participants: updated }));
    setNewParticipant({ name: '', email: '', userId: '' });
    triggerAvailabilityCheck(updated);
  };

  const handleRemoveParticipant = (idx) => {
    const updated = form.participants.filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, participants: updated }));
    triggerAvailabilityCheck(updated);
  };

  // Smart Add NLP Parser
  const handleSmartAddSubmit = (e) => {
    e.preventDefault();
    if (!smartAddText.trim()) return;

    const text = smartAddText.toLowerCase();
    let title = 'Meeting';
    let type = 'meeting';
    let minutesOffset = 0;
    let hour = 15; // default 3pm

    // Simple robust regex parsing
    if (text.includes('call')) {
      type = 'call';
      title = 'Call';
    } else if (text.includes('internal') || text.includes('review') || text.includes('sync')) {
      type = 'internal';
      title = 'Internal Sync';
    }

    // Extracting subject context: e.g. "Call with Priya"
    const matchWith = smartAddText.match(/(?:call|meeting|sync|review)\s+(?:with|regarding|for)\s+([a-zA-Z0-9\s]+?)(?:tomorrow|today|at|on|$)/i);
    if (matchWith && matchWith[1]) {
      title = `${type.toUpperCase()}: ${matchWith[1].trim()}`;
    } else {
      title = smartAddText;
    }

    // Date estimation
    if (text.includes('tomorrow')) {
      minutesOffset = 24 * 60;
    }

    // Time estimation
    const matchTime = text.match(/(\d+)(?:\s*)(am|pm)/i);
    if (matchTime) {
      let val = parseInt(matchTime[1]);
      const ampm = matchTime[2].toLowerCase();
      if (ampm === 'pm' && val < 12) val += 12;
      if (ampm === 'am' && val === 12) val = 0;
      hour = val;
    }

    const start = new Date();
    start.setDate(start.getDate() + (minutesOffset ? 1 : 0));
    start.setHours(hour, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setForm({
      title,
      type,
      description: `Smart Added: "${smartAddText}"`,
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
      timezone: 'Asia/Kolkata',
      relatedModule: 'Lead',
      relatedRecordId: '',
      assignedTo: user?._id || '',
      participants: [],
      location: '',
      conferenceLink: '',
      colorTag: 'gold',
      recurrenceFreq: 'none',
      recurrenceInterval: 1,
      recurrenceEndDate: ''
    });

    setSmartAddText('');
    setBusyWarnings({});
    setShowCreateModal(true);
  };

  const handleOpenCreateCell = (date) => {
    const start = new Date(date);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);

    setForm({
      title: '',
      type: 'meeting',
      description: '',
      startTime: start.toISOString().slice(0, 16),
      endTime: end.toISOString().slice(0, 16),
      timezone: 'Asia/Kolkata',
      relatedModule: 'Lead',
      relatedRecordId: '',
      assignedTo: user?._id || '',
      participants: [],
      location: '',
      conferenceLink: '',
      colorTag: 'gold',
      recurrenceFreq: 'none',
      recurrenceInterval: 1,
      recurrenceEndDate: ''
    });
    setBusyWarnings({});
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        timezone: form.timezone,
        location: form.location,
        conferenceLink: form.conferenceLink,
        colorTag: form.colorTag,
        assignedTo: form.assignedTo || user?._id,
        participants: form.participants,
        recurrence: {
          frequency: form.recurrenceFreq,
          interval: form.recurrenceInterval,
          endDate: form.recurrenceEndDate ? new Date(form.recurrenceEndDate).toISOString() : undefined
        }
      };

      if (form.relatedRecordId) {
        payload.relatedTo = {
          module: form.relatedModule,
          recordId: form.relatedRecordId
        };
      }

      const { data } = await api.post('/api/events', payload);
      setEvents(prev => [...prev, data]);
      setShowCreateModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleOpenDetail = (evt) => {
    setSelectedEvent(evt);
    setShowDetailModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Revoke/cancel this event?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
      setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
    }
  };

  // Rendering Helpers
  const getDaysInMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({ dayNum: prevMonthDays - i, monthOffset: -1, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= totalDays; i++) {
      grid.push({ dayNum: i, monthOffset: 0, date: new Date(year, month, i) });
    }
    const totalCells = Math.ceil(grid.length / 7) * 7;
    const nextDaysCount = totalCells - grid.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      grid.push({ dayNum: i, monthOffset: 1, date: new Date(year, month + 1, i) });
    }
    return grid;
  };

  const monthGrid = getDaysInMonthGrid();
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Search Filter
  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const colorClasses = {
    gold: 'bg-gold-soft border-gold/25 text-[#705d00]',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-red-50 border-red-200 text-red-750',
    neutral: 'bg-[#FAF9F6] border-line text-slate-600'
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden font-sans bg-paper">
      {/* 1. Left Sidebar Navigation */}
      <div className="w-64 bg-[#121212] text-slate-100 flex flex-col justify-between shrink-0 h-full border-r border-white/5">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-gold" />
            <span className="text-xs font-display font-black uppercase tracking-wider text-white">Scheduling Console</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1c1c] text-xs border border-white/5 rounded-lg py-2 pl-8 pr-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
          </div>

          <div className="space-y-1 pt-2">
            <button className="w-full text-left px-3 py-2 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-white">
              My Calendar
            </button>
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 cursor-pointer hover:text-white transition-all uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={showTeamCalendar}
                  onChange={(e) => setShowTeamCalendar(e.target.checked)}
                  className="rounded border-white/15 bg-white/5 text-gold focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                />
                <span>Overlay Team View</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Calendar Panel */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Sub-Header bar controls */}
        <div className="bg-white border-b border-line px-6 py-3.5 flex flex-wrap items-center justify-between shrink-0 gap-4">
          {/* Smart Add NLP Text Input */}
          <form onSubmit={handleSmartAddSubmit} className="flex-grow max-w-md relative">
            <input
              type="text"
              placeholder="Smart Add: e.g. Call with Priya tomorrow 3pm"
              value={smartAddText}
              onChange={(e) => setSmartAddText(e.target.value)}
              className="w-full bg-[#F1F3F6] text-xs border border-transparent rounded-lg py-2 pl-4 pr-10 text-ink placeholder-slate-400 focus:outline-none focus:border-gold"
            />
            <button type="submit" className="absolute right-2.5 top-2.5 text-gold hover:text-gold/80 text-[10px] font-bold uppercase font-mono">
              Add
            </button>
          </form>

          {/* Selector switch */}
          <div className="flex border border-line p-0.5 bg-[#FAF9F6] rounded-full text-[10px] font-bold uppercase tracking-wider font-mono select-none">
            {['Month', 'Week', 'Day', 'Agenda'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-full ${viewMode === mode ? 'bg-ink text-white' : 'text-slate-500 hover:text-ink'}`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-line bg-white rounded-lg p-1">
              <button onClick={handlePrev} className="p-1 hover:bg-[#FAF9F6] rounded text-slate-500"><ChevronLeft size={14} /></button>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-650 px-1">{currentMonthName} {currentYear}</span>
              <button onClick={handleNext} className="p-1 hover:bg-[#FAF9F6] rounded text-slate-500"><ChevronRight size={14} /></button>
            </div>
            <Button onClick={() => handleOpenCreateCell(new Date())} icon={Plus}>
              Create Event
            </Button>
          </div>
        </div>

        {/* Dynamically Swap Calendar Views */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6">
          {/* A. MONTH VIEW */}
          {viewMode === 'Month' && (
            <div className="min-w-[800px] h-full flex flex-col bg-white border border-line rounded-modal overflow-hidden">
              <div className="grid grid-cols-7 bg-[#FAF9F6] border-b border-line text-center text-[10px] font-mono font-bold py-2.5 text-slate-500 uppercase tracking-wider">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className={day === 'SAT' || day === 'SUN' ? 'text-red-500' : ''}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-line">
                {monthGrid.map((cell, idx) => {
                  const cellStr = cell.date.toISOString().split('T')[0];
                  const cellEvents = filteredEvents.filter(e => new Date(e.startTime).toISOString().split('T')[0] === cellStr);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleOpenCreateCell(cell.date)}
                      className={`min-h-[100px] p-2 flex flex-col justify-between hover:bg-gold-soft/10 cursor-pointer transition-all ${cell.monthOffset === 0 ? '' : 'bg-[#FAF9F6]/40'}`}
                    >
                      <span className="text-[10px] font-mono font-bold text-slate-600">
                        {cell.dayNum}
                      </span>
                      <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] custom-scroll">
                        {cellEvents.map(evt => (
                          <div
                            key={evt._id}
                            onClick={(e) => { e.stopPropagation(); handleOpenDetail(evt); }}
                            className={`text-[9px] font-bold p-1 rounded-sm border truncate font-mono uppercase tracking-tight ${colorClasses[evt.colorTag] || colorClasses.neutral}`}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* B. WEEK VIEW */}
          {viewMode === 'Week' && (
            <div className="bg-white border border-line rounded-modal overflow-hidden p-4 space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Weekly Planner Grid</h3>
              <div className="grid grid-cols-7 gap-3">
                {DAYS_OF_WEEK.map((day, idx) => {
                  const date = new Date(currentDate);
                  const dayOffset = (idx - ((date.getDay() + 6) % 7));
                  date.setDate(date.getDate() + dayOffset);
                  const dateStr = date.toISOString().split('T')[0];
                  const cellEvents = filteredEvents.filter(e => new Date(e.startTime).toISOString().split('T')[0] === dateStr);

                  return (
                    <div key={day} className="p-3 bg-[#FAF9F6] border border-line rounded-card min-h-[300px] flex flex-col justify-between">
                      <div className="border-b border-line pb-1.5 text-center font-mono select-none">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">{day}</span>
                        <span className="text-xs font-bold text-ink mt-0.5 block">{date.getDate()}</span>
                      </div>
                      <div className="flex-1 space-y-2 mt-3 overflow-y-auto max-h-[220px] custom-scroll">
                        {cellEvents.map(evt => (
                          <div
                            key={evt._id}
                            onClick={() => handleOpenDetail(evt)}
                            className={`text-[9px] font-bold p-1.5 rounded border leading-snug cursor-pointer font-mono uppercase truncate ${colorClasses[evt.colorTag] || colorClasses.neutral}`}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. DAY VIEW */}
          {viewMode === 'Day' && (
            <div className="bg-white border border-line rounded-modal p-6 max-w-3xl mx-auto space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">
                Schedule Details: {currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </h3>
              <div className="divide-y divide-line">
                {filteredEvents.filter(e => new Date(e.startTime).toDateString() === currentDate.toDateString()).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No events scheduled on this day.</p>
                ) : (
                  filteredEvents.filter(e => new Date(e.startTime).toDateString() === currentDate.toDateString()).map(evt => (
                    <div
                      key={evt._id}
                      onClick={() => handleOpenDetail(evt)}
                      className="py-3 flex justify-between items-center hover:bg-gold-soft/10 px-2.5 rounded-lg cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold text-gold">
                          {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-ink block">{evt.title}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">{evt.type}</span>
                        </div>
                      </div>
                      <Badge variant={evt.colorTag}>
                        {evt.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* D. AGENDA VIEW */}
          {viewMode === 'Agenda' && (
            <div className="bg-white border border-line rounded-modal p-6 max-w-4xl mx-auto space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Upcoming Agenda Timeline</h3>
              <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-8 text-center">No upcoming scheduled stops.</p>
                ) : (
                  filteredEvents.map(evt => (
                    <div
                      key={evt._id}
                      onClick={() => handleOpenDetail(evt)}
                      className="p-4 bg-[#FAF9F6] border border-line rounded-card flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:border-gold/30 transition-all"
                    >
                      <div>
                        <span className="text-xs font-bold text-ink">{evt.title}</span>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase font-bold">
                          {new Date(evt.startTime).toLocaleDateString([], { day: 'numeric', month: 'short' })} • {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={evt.colorTag}>{evt.type}</Badge>
                        <Badge variant="neutral">{evt.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule Event">
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans max-h-[75vh] overflow-y-auto pr-1.5 custom-scroll">
          <Input
            label="Event Title *"
            id="eventTitleInput"
            required
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Event Type"
              id="eventTypeInput"
              value={form.type}
              onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
              options={[
                { value: 'meeting', label: 'Meeting' },
                { value: 'call', label: 'Call Session' },
                { value: 'internal', label: 'Internal Task' }
              ]}
            />
            <Select
              label="Color Tag"
              id="eventColorInput"
              value={form.colorTag}
              onChange={(e) => setForm(prev => ({ ...prev, colorTag: e.target.value }))}
              options={[
                { value: 'gold', label: 'Gold' },
                { value: 'success', label: 'Green (Success)' },
                { value: 'warning', label: 'Yellow (Warning)' },
                { value: 'danger', label: 'Red (Danger)' },
                { value: 'neutral', label: 'Gray (Neutral)' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              id="eventStartInput"
              type="datetime-local"
              required
              value={form.startTime}
              onChange={(e) => {
                setForm(prev => ({ ...prev, startTime: e.target.value }));
                triggerAvailabilityCheck(form.participants, e.target.value, form.endTime);
              }}
            />
            <Input
              label="End Time *"
              id="eventEndInput"
              type="datetime-local"
              required
              value={form.endTime}
              onChange={(e) => {
                setForm(prev => ({ ...prev, endTime: e.target.value }));
                triggerAvailabilityCheck(form.participants, form.startTime, e.target.value);
              }}
            />
          </div>

          {/* Related record link */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-1">
              <Select
                label="Related Module"
                id="relatedModuleInput"
                value={form.relatedModule}
                onChange={(e) => setForm(prev => ({ ...prev, relatedModule: e.target.value, relatedRecordId: '' }))}
                options={[
                  { value: 'Lead', label: 'Lead' },
                  { value: 'Contact', label: 'Contact' },
                  { value: 'Account', label: 'Company (Account)' }
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Select
                label="Select Linked Record"
                id="relatedRecordInput"
                value={form.relatedRecordId}
                onChange={(e) => setForm(prev => ({ ...prev, relatedRecordId: e.target.value }))}
                options={[
                  { value: '', label: 'None (Unlinked)' },
                  ...(form.relatedModule === 'Lead' ? leads.map(l => ({ value: l._id, label: `${l.name} (${l.company})` })) : []),
                  ...(form.relatedModule === 'Contact' ? contacts.map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` })) : []),
                  ...(form.relatedModule === 'Account' ? companies.map(comp => ({ value: comp._id, label: comp.name })) : [])
                ]}
              />
            </div>
          </div>

          {/* Participants section */}
          <div className="space-y-2.5 border-t border-line pt-3.5">
            <h4 className="text-[10px] font-display font-black text-ink uppercase tracking-wider">Event Participants</h4>
            
            {/* Quick add participant */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label="Internal Participant"
                  id="internalPartSelect"
                  value={newParticipant.userId}
                  onChange={(e) => {
                    const match = teamMembers.find(t => t._id === e.target.value);
                    if (match) {
                      setNewParticipant({ name: match.name, email: match.email, userId: match._id });
                    }
                  }}
                  options={[
                    { value: '', label: 'Select teammate...' },
                    ...teamMembers.map(t => ({ value: t._id, label: `${t.name} (${t.role})` }))
                  ]}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Name / Email"
                  id="partNameEmail"
                  placeholder="name@company.com"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value.split('@')[0], email: e.target.value }))}
                />
              </div>
              <button
                type="button"
                onClick={handleAddParticipant}
                className="px-3.5 py-2.5 bg-[#FAF9F6] border border-line rounded-input text-xs font-bold text-ink hover:bg-gold-soft"
              >
                Add
              </button>
            </div>

            {/* Selected list */}
            <div className="space-y-2 mt-2">
              {form.participants.map((p, idx) => {
                const isBusy = p.userId && busyWarnings[p.userId];
                return (
                  <div key={idx} className="flex justify-between items-center p-2.5 bg-[#FAF9F6] border border-line rounded-card text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-ink">{p.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono font-medium">{p.email}</span>
                      
                      {/* Conflict Busy Warning Badge */}
                      {isBusy && (
                        <div className="flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mt-1 w-max font-bold font-mono">
                          <AlertTriangle size={10} />
                          <span>{busyWarnings[p.userId]}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="text-danger font-bold hover:underline text-[10px] uppercase font-mono"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <Input
            label="Location (Physical / Address)"
            id="eventLocationInput"
            value={form.location}
            onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
          />

          <Input
            label="Conference Link (Zoom / Meet)"
            id="eventConfInput"
            value={form.conferenceLink}
            onChange={(e) => setForm(prev => ({ ...prev, conferenceLink: e.target.value }))}
          />

          <Textarea
            label="Agenda Description"
            id="eventDescInput"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Stop Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAIL VIEW MODAL */}
      {selectedEvent && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Event Details">
          <div className="space-y-4 font-sans text-xs text-ink leading-relaxed">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Title</span>
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight mt-0.5">{selectedEvent.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Scheduled Time</span>
                <p className="font-bold text-ink mt-0.5">
                  {new Date(selectedEvent.startTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Type</span>
                <p className="font-bold text-gold uppercase tracking-wider font-mono mt-0.5">{selectedEvent.type}</p>
              </div>
            </div>

            {selectedEvent.description && (
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Description / Agenda</span>
                <p className="p-3 bg-[#FAF9F6] border border-line rounded-card mt-1 text-slate-700 leading-normal">{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent.location && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-700">{selectedEvent.location}</span>
              </div>
            )}

            {selectedEvent.conferenceLink && (
              <div className="flex items-center gap-2">
                <Video size={14} className="text-slate-400 shrink-0" />
                <a
                  href={selectedEvent.conferenceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-gold hover:underline truncate max-w-sm"
                >
                  Join Meeting URL
                </a>
              </div>
            )}

            {selectedEvent.relatedTo && selectedEvent.relatedTo.recordId && (
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Linked Record</span>
                <p className="font-bold text-ink mt-0.5 uppercase tracking-wide">
                  {selectedEvent.relatedTo.module}: #{selectedEvent.relatedTo.recordId.slice(-6).toUpperCase()}
                </p>
              </div>
            )}

            <div className="space-y-2 border-t border-line pt-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Participants</span>
              {selectedEvent.participants.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No external invitees registered.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvent.participants.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-[#FAF9F6] border border-line rounded-card">
                      <div>
                        <span className="font-bold text-ink block">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono font-medium block">{p.email}</span>
                      </div>
                      <Badge variant={p.rsvpStatus === 'accepted' ? 'success' : p.rsvpStatus === 'declined' ? 'danger' : 'neutral'}>
                        {p.rsvpStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-line">
              <button
                onClick={() => handleDeleteEvent(selectedEvent._id)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-danger border border-red-200 rounded-btn text-xs font-bold uppercase tracking-wider font-mono"
              >
                Cancel Event
              </button>
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Calendar;
export { Calendar };
