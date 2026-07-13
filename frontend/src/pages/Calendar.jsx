import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Settings, X, Check, AlertTriangle, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Badge from '../components/ui/Badge';
import * as chrono from 'chrono-node';

const colorClasses = {
  gold: 'border-gold bg-gold-soft/80 text-[#705d00]',
  success: 'border-emerald-500 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-500 bg-amber-50 text-amber-700',
  danger: 'border-red-500 bg-red-50 text-red-700',
  neutral: 'border-slate-300 bg-[#FAF9F6] text-slate-700'
};

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('day'); // 'day', 'week', 'month'
  const [teamView, setTeamView] = useState(false);

  // Modal / Detail state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [smartAddText, setSmartAddText] = useState('');

  // Form state
  const [form, setForm] = useState({
    type: 'meeting',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    timezone: 'Asia/Kolkata',
    location: '',
    conferenceLink: '',
    colorTag: 'neutral',
    recurrence: { frequency: 'none', interval: 1, endDate: '' },
    participants: [],
    relatedTo: { module: 'Lead', recordId: '' }
  });

  // Supporting records
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [salespeople, setSalespeople] = useState([]);

  // Busy check state
  const [conflictWarning, setConflictWarning] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startRange = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString();
      const endRange = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString();

      let endpoint = '/api/events';
      if (teamView && ['admin', 'manager'].includes(user?.role)) {
        endpoint = '/api/events/team';
      }

      const { data } = await api.get(endpoint, {
        params: { from: startRange, to: endRange }
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [leadsRes, contRes, compRes] = await Promise.all([
        api.get('/api/leads'),
        api.get('/api/contacts'),
        api.get('/api/companies')
      ]);
      setLeads(leadsRes.data);
      setContacts(contRes.data);
      setCompanies(compRes.data);

      if (user?.role === 'admin' || user?.role === 'manager') {
        const teamRes = await api.get('/api/users');
        setSalespeople(teamRes.data.filter(u => u.isActive !== false));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, teamView]);

  useEffect(() => {
    fetchSupportingData();
  }, []);

  // Conflict availability checks
  useEffect(() => {
    const checkConflicts = async () => {
      if (!form.startTime || !form.endTime) {
        setConflictWarning(false);
        return;
      }
      const internalIds = form.participants
        .filter(p => p.userId)
        .map(p => p.userId);

      if (internalIds.length === 0) {
        setConflictWarning(false);
        return;
      }

      try {
        const { data } = await api.post('/api/events/availability', {
          userIds: internalIds,
          startTime: form.startTime,
          endTime: form.endTime
        });
        setConflictWarning(data.length > 0);
      } catch (_) {
        setConflictWarning(false);
      }
    };

    const timer = setTimeout(checkConflicts, 400);
    return () => clearTimeout(timer);
  }, [form.startTime, form.endTime, form.participants]);

  // NLP Smart Add Parser
  const handleSmartAdd = (e) => {
    e.preventDefault();
    if (!smartAddText.trim()) return;

    const results = chrono.parse(smartAddText);
    let parsedStart = new Date(Date.now() + 60 * 60 * 1000); // Default: 1 hour from now
    let parsedEnd = new Date(parsedStart.getTime() + 60 * 60 * 1000);

    if (results && results.length > 0) {
      const parsedDate = results[0].start.date();
      parsedStart = parsedDate;
      parsedEnd = new Date(parsedStart.getTime() + 60 * 60 * 1000);
    }

    setForm({
      type: 'meeting',
      title: smartAddText,
      description: 'Quick-add parsed: ' + smartAddText,
      startTime: new Date(parsedStart.getTime() - parsedStart.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      endTime: new Date(parsedEnd.getTime() - parsedEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      timezone: 'Asia/Kolkata',
      location: '',
      conferenceLink: '',
      colorTag: 'neutral',
      recurrence: { frequency: 'none', interval: 1, endDate: '' },
      participants: [],
      relatedTo: { module: 'Lead', recordId: '' }
    });

    setSmartAddText('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.relatedTo?.recordId) {
        delete payload.relatedTo;
      }
      if (payload.recurrence?.frequency === 'none') {
        delete payload.recurrence.endDate;
      }

      await api.post('/api/events', payload);
      setShowCreateModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule event');
    }
  };

  const handleUpdateRSVP = async (rsvpStatus) => {
    if (!selectedEvent) return;
    try {
      const updatedParticipants = selectedEvent.participants.map(p => {
        if (p.userId === user?._id || p.email === user?.email) {
          return { ...p, rsvpStatus };
        }
        return p;
      });

      const { data } = await api.put(`/api/events/${selectedEvent._id}`, {
        participants: updatedParticipants
      });
      setSelectedEvent(data);
      fetchEvents();
    } catch (_) {
      alert('Failed to update RSVP status');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this event?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      setShowDetailModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel event');
    }
  };

  // Helper date lists
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    const remainingGridSlots = 42 - days.length;
    for (let i = 1; i <= remainingGridSlots; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const monthDays = getDaysInMonth(currentDate);

  const getEventsForDay = (dateObj) => {
    return events.filter(e => {
      const start = new Date(e.startTime);
      return start.getDate() === dateObj.getDate() &&
             start.getMonth() === dateObj.getMonth() &&
             start.getFullYear() === dateObj.getFullYear();
    });
  };

  const formatDateHeader = (date) => {
    // e.g. "13 Jul 2026 Monday"
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${day} ${month} ${year} ${weekday}`;
  };

  // Switch navigation logic
  const handleNext = () => {
    if (activeView === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    } else if (activeView === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handlePrev = () => {
    if (activeView === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (activeView === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Day View Hours Slots definition
  const hours = [
    { label: '08:00 AM', value: 8 },
    { label: '09:00 AM', value: 9 },
    { label: '10:00 AM', value: 10 },
    { label: '11:00 AM', value: 11 },
    { label: '12:00 PM', value: 12 },
    { label: '01:00 PM', value: 13 },
    { label: '02:00 PM', value: 14 },
    { label: '03:00 PM', value: 15 },
    { label: '04:00 PM', value: 16 },
    { label: '05:00 PM', value: 17 },
    { label: '06:00 PM', value: 18 }
  ];

  const getWeekDays = (date) => {
    const currentDay = date.getDay();
    const sun = new Date(date.getTime() - currentDay * 24 * 60 * 60 * 1000);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(sun.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* 1. Header Layout */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-line select-none">
        <h1 className="text-lg font-bold text-ink">My Calendar</h1>

        {/* View Switcher Pill */}
        <div className="flex border border-line bg-[#F1F3F6] p-0.5 rounded-full text-xs font-semibold">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-4 py-1 rounded-full transition-all capitalize ${
                activeView === v ? 'bg-white text-ink shadow-sm font-bold' : 'text-slate-500 hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-2">
          {['admin', 'manager'].includes(user?.role) && (
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F6] border border-line rounded-btn text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-line bg-white text-gold h-3.5 w-3.5"
                checked={teamView}
                onChange={(e) => setTeamView(e.target.checked)}
              />
              <span>Team View</span>
            </label>
          )}

          <div className="relative">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 bg-[#3A57E8] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-[#2F46BD] transition-all"
            >
              <span>Create</span>
              <span className="text-[10px] opacity-80">▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-header Controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#FAF9F6] border-b border-line select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 border border-line bg-white rounded text-slate-500">
            <CalendarIcon size={16} />
          </div>
          <span className="text-base font-bold text-ink tracking-tight font-mono">
            {formatDateHeader(currentDate)}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white border border-line rounded-lg p-0.5 shadow-sm">
          <button onClick={handlePrev} className="p-1.5 hover:bg-[#F1F3F6] rounded text-slate-600 transition-all">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleToday} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-[#F1F3F6] rounded transition-all">
            Today
          </button>
          <button onClick={handleNext} className="p-1.5 hover:bg-[#F1F3F6] rounded text-slate-600 transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 3. Calendar Grid Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-gold" size={28} />
          </div>
        ) : (
          <>
            {/* DAY VIEW LAYOUT */}
            {activeView === 'day' && (
              <div className="flex flex-col h-full min-w-[700px]">
                {/* All-Day Bar */}
                <div className="flex border-b border-line select-none shrink-0">
                  <div className="w-24 px-4 py-2 border-r border-line bg-[#16A34A] text-white text-[10px] font-bold flex items-center justify-center">
                    All-Day (0)
                  </div>
                  <div className="flex-1 bg-stripes-gray h-9" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 10px, #ffffff 10px, #ffffff 20px)' }}></div>
                </div>

                {/* Day Hours Grid */}
                <div className="flex-1 relative">
                  {hours.map((h, i) => {
                    const dayEvents = getEventsForDay(currentDate);
                    const slotEvents = dayEvents.filter(e => {
                      const startHour = new Date(e.startTime).getHours();
                      return startHour === h.value;
                    });

                    return (
                      <div key={i} className="flex min-h-[70px] border-b border-line items-stretch">
                        {/* Hour Label */}
                        <div className="w-24 border-r border-line text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center bg-[#FAF9F6]/40 select-none">
                          {h.label}
                        </div>

                        {/* Hour Event Content Column */}
                        <div className="flex-1 p-2 relative flex gap-2 overflow-x-auto custom-scroll">
                          {slotEvents.map(e => (
                            <div
                              key={e._id}
                              onClick={() => {
                                setSelectedEvent(e);
                                setShowDetailModal(true);
                              }}
                              className={`flex-1 min-w-[150px] max-w-sm rounded border p-2 cursor-pointer transition-all hover:shadow-sm ${colorClasses[e.colorTag || 'neutral']}`}
                            >
                              <p className="text-[11px] font-extrabold uppercase tracking-tight">{e.title}</p>
                              <p className="text-[9px] font-bold opacity-75 font-mono mt-0.5">
                                {new Date(e.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - {new Date(e.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {e.location && <p className="text-[8px] mt-1 font-medium truncate">📍 {e.location}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW LAYOUT */}
            {activeView === 'week' && (
              <div className="flex flex-col min-w-[800px]">
                {/* Week Day Header columns */}
                <div className="flex border-b border-line bg-[#FAF9F6] select-none text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3">
                  <div className="w-24 border-r border-line"></div>
                  {weekDays.map((d, i) => {
                    const isToday = new Date().toDateString() === d.toDateString();
                    return (
                      <div key={i} className="flex-1 text-center border-r border-line last:border-0 flex flex-col items-center">
                        <span>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className={`mt-1 font-mono text-[13px] px-2 py-0.5 rounded-full ${isToday ? 'bg-gold text-ink font-bold' : 'text-slate-650'}`}>
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Week Hours Grid */}
                <div className="flex flex-col">
                  {hours.map((h, i) => (
                    <div key={i} className="flex min-h-[70px] border-b border-line items-stretch">
                      <div className="w-24 border-r border-line text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center bg-[#FAF9F6]/40 select-none">
                        {h.label}
                      </div>

                      {weekDays.map((d, idx) => {
                        const dayEvents = getEventsForDay(d);
                        const slotEvents = dayEvents.filter(e => {
                          const startHour = new Date(e.startTime).getHours();
                          return startHour === h.value;
                        });

                        return (
                          <div key={idx} className="flex-1 border-r border-line last:border-0 p-1 flex flex-col gap-1 overflow-y-auto max-h-[70px]">
                            {slotEvents.map(e => (
                              <div
                                key={e._id}
                                onClick={() => {
                                  setSelectedEvent(e);
                                  setShowDetailModal(true);
                                }}
                                className={`rounded border px-1.5 py-0.5 cursor-pointer truncate text-[9px] font-bold uppercase tracking-wide transition-all ${colorClasses[e.colorTag || 'neutral']}`}
                              >
                                {e.title}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MONTH VIEW GRID */}
            {activeView === 'month' && (
              <div className="flex flex-col min-w-[700px]">
                <div className="grid grid-cols-7 border-b border-line bg-[#FAF9F6] text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3 select-none">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-line border-b border-line">
                  {monthDays.map((slot, idx) => {
                    const dayEvents = getEventsForDay(slot.date);
                    const isToday = new Date().toDateString() === slot.date.toDateString();

                    return (
                      <div
                        key={idx}
                        className={`min-h-[110px] p-2 flex flex-col justify-between ${slot.isCurrentMonth ? 'bg-white' : 'bg-[#FAF9F6]/50 opacity-40'}`}
                      >
                        <div className="flex justify-between items-center select-none">
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${isToday ? 'bg-gold text-ink' : 'text-slate-650'}`}>
                            {slot.date.getDate()}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] custom-scroll">
                          {dayEvents.slice(0, 3).map(e => (
                            <div
                              key={e._id}
                              onClick={() => {
                                setSelectedEvent(e);
                                setShowDetailModal(true);
                              }}
                              className={`text-[9px] font-bold uppercase tracking-wide border-l-2 p-1 rounded-sm truncate cursor-pointer transition-all ${colorClasses[e.colorTag || 'neutral']}`}
                            >
                              {new Date(e.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] font-bold text-slate-400 block px-1">
                              + {dayEvents.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* NLP Smart Add Input Bar */}
      <div className="bg-[#FAF9F6] border-t border-line p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Smart Add: e.g. Call with Priya tomorrow at 3 PM..."
            value={smartAddText}
            onChange={(e) => setSmartAddText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSmartAdd(e);
            }}
            className="flex-grow bg-white border border-line rounded-input px-4 py-2 text-xs text-ink outline-none focus:border-gold transition-all"
          />
          <Button onClick={handleSmartAdd}>
            Quick Add
          </Button>
        </div>
      </div>

      {/* NEW EVENT FORM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs overflow-y-auto" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-lg rounded-modal border border-line bg-white shadow-modal my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">Schedule Action Stop</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 font-sans max-h-[80vh] overflow-y-auto custom-scroll">
              {conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-btn text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>Conflict alert: selected participant is busy during this time</span>
                </div>
              )}

              <Input
                label="Event Title"
                id="evtTitle"
                placeholder="e.g. Contract Review"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  id="evtType"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  options={[
                    { value: 'meeting', label: 'Meeting' },
                    { value: 'call', label: 'VoIP Call' },
                    { value: 'internal', label: 'Internal Review' }
                  ]}
                />

                <Select
                  label="Color Tag"
                  id="evtColor"
                  value={form.colorTag}
                  onChange={(e) => setForm({ ...form, colorTag: e.target.value })}
                  options={[
                    { value: 'neutral', label: 'Neutral Gray' },
                    { value: 'gold', label: 'Primary Gold' },
                    { value: 'success', label: 'Active Success' },
                    { value: 'warning', label: 'Pending Warning' },
                    { value: 'danger', label: 'Critical Action' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  id="evtStart"
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
                <Input
                  label="End Time"
                  id="evtEnd"
                  type="datetime-local"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Location (Free text)"
                  id="evtLoc"
                  placeholder="e.g. Conference Room A"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                <Input
                  label="Video Link (Zoom/Meet)"
                  id="evtMeet"
                  placeholder="e.g. https://meet.google.com"
                  value={form.conferenceLink}
                  onChange={(e) => setForm({ ...form, conferenceLink: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Link to CRM Module"
                  id="evtLinkModule"
                  value={form.relatedTo.module}
                  onChange={(e) => setForm({ ...form, relatedTo: { ...form.relatedTo, module: e.target.value } })}
                  options={[
                    { value: 'Lead', label: 'Leads & Opportunities' },
                    { value: 'Contact', label: 'Contacts' },
                    { value: 'Account', label: 'Companies' }
                  ]}
                />
                <Select
                  label="Record Association"
                  id="evtLinkRecord"
                  value={form.relatedTo.recordId}
                  onChange={(e) => setForm({ ...form, relatedTo: { ...form.relatedTo, recordId: e.target.value } })}
                  options={[
                    { value: '', label: 'None' },
                    ...(form.relatedTo.module === 'Lead' ? leads.map(l => ({ value: l._id, label: `${l.name} (${l.company})` })) :
                       form.relatedTo.module === 'Contact' ? contacts.map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` })) :
                       companies.map(c => ({ value: c._id, label: c.name })))
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-line pt-3">
                <Select
                  label="Recurrence Frequency"
                  id="evtRec"
                  value={form.recurrence.frequency}
                  onChange={(e) => setForm({ ...form, recurrence: { ...form.recurrence, frequency: e.target.value } })}
                  options={[
                    { value: 'none', label: 'No Recurrence' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ]}
                />
                {form.recurrence.frequency !== 'none' && (
                  <Input
                    label="Recurrence End Date"
                    id="evtRecEnd"
                    type="date"
                    required
                    value={form.recurrence.endDate}
                    onChange={(e) => setForm({ ...form, recurrence: { ...form.recurrence, endDate: e.target.value } })}
                  />
                )}
              </div>

              {salespeople.length > 0 && (
                <div className="space-y-2 border-t border-line pt-3">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Internal Attendees</span>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scroll p-1 border border-line rounded">
                    {salespeople.map(s => {
                      const isSelected = form.participants.some(p => p.userId === s._id);
                      return (
                        <label key={s._id} className="flex items-center gap-1.5 text-xs text-ink cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-line bg-white text-gold h-4.5 w-4.5"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({
                                  ...form,
                                  participants: [...form.participants, { userId: s._id, email: s.email, name: s.name, rsvpStatus: 'pending' }]
                                });
                              } else {
                                setForm({
                                  ...form,
                                  participants: form.participants.filter(p => p.userId !== s._id)
                                });
                              }
                            }}
                          />
                          <span>{s.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <Textarea
                label="Agenda Description"
                id="evtDesc"
                placeholder="Log calendar details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Schedule Stop
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT DETAIL DISPLAY MODAL */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs" onClick={() => setShowDetailModal(false)}>
          <div
            className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">{selectedEvent.title}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 font-sans text-xs text-ink">
              <div className="flex items-center gap-2 select-none">
                <Badge variant={selectedEvent.type === 'meeting' ? 'gold' : 'neutral'}>
                  {selectedEvent.type}
                </Badge>
                <Badge variant={selectedEvent.status === 'scheduled' ? 'success' : 'danger'}>
                  {selectedEvent.status}
                </Badge>
              </div>

              {selectedEvent.description && (
                <p className="text-slate-650 leading-relaxed bg-[#FAF9F6] p-3 rounded-card border border-line">{selectedEvent.description}</p>
              )}

              <div className="space-y-2 border-t border-line pt-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-mono font-bold">
                    {new Date(selectedEvent.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.conferenceLink && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <LinkIcon size={14} className="text-slate-400" />
                    <a href={selectedEvent.conferenceLink} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                      Join conference call
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-line pt-3 space-y-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">My RSVP Status</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateRSVP('accepted')}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-line rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold"
                  >
                    <Check size={12} /> Accept
                  </button>
                  <button
                    onClick={() => handleUpdateRSVP('declined')}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-line rounded bg-red-50 hover:bg-red-100 text-red-700 font-bold"
                  >
                    <X size={12} /> Decline
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-line pt-4">
                <span className="text-[10px] text-slate-400 font-bold font-mono uppercase">Assigned Rep: {selectedEvent.assignedTo?.name || 'You'}</span>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent._id)}
                  className="px-3 py-1.5 border border-line hover:border-red-200 text-slate-500 hover:text-danger rounded hover:bg-red-50 font-bold font-mono text-[10px] uppercase transition-all"
                >
                  Cancel Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
export { Calendar };
