import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Square, 
  X, 
  Trash2, 
  Clock, 
  Phone, 
  CalendarDays, 
  Layers, 
  Users, 
  FileText,
  User,
  List,
  Kanban as KanbanIcon,
  AlertTriangle,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';

const Tasks = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('type') || 'all';

  const setActiveTab = (newTab) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newTab === 'all') {
      nextParams.delete('type');
    } else {
      nextParams.set('type', newTab);
    }
    setSearchParams(nextParams);
  };
  
  // Date filter: 'all' | 'today' | 'week' | 'overdue'
  const [activeFilter, setActiveFilter] = useState('all');

  // View: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState('list');

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form autocomplete data
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [salespeople, setSalespeople] = useState([]);

  // Form state
  const [form, setForm] = useState({
    type: 'task', // task | meeting | call
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0], // for Task
    startTime: new Date().toISOString().slice(0, 16), // for Meeting/Call
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // for Meeting/Call
    priority: 'medium', // for Task
    relatedToModule: '', // 'Lead' | 'Contact' | 'Deal' | 'Account' | ''
    relatedToRecordId: '',
    assignedTo: '',
    location: '',
    conferenceLink: ''
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/activities', {
        params: {
          type: activeTab,
          filter: activeFilter
        }
      });
      setActivities(data);
    } catch (e) {
      console.error('Error fetching activities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeTab, activeFilter]);

  useEffect(() => {
    // Prefill data for related autocomplete
    api.get('/api/leads').then(r => setLeads(r.data)).catch(() => {});
    api.get('/api/contacts').then(r => setContacts(r.data)).catch(() => {});
    api.get('/api/companies').then(r => setAccounts(r.data)).catch(() => {});
    if (user?.role === 'admin' || user?.role === 'manager') {
      api.get('/api/auth/salespeople').then(r => setSalespeople(r.data)).catch(() => {});
    }
  }, [user]);

  const handleToggleComplete = async (activity) => {
    try {
      if (activity.activityType === 'task') {
        const newStatus = activity.status === 'completed' ? 'open' : 'completed';
        await api.put(`/api/tasks/${activity._id}`, { status: newStatus });
      } else {
        const newStatus = activity.status === 'completed' ? 'scheduled' : 'completed';
        await api.put(`/api/events/${activity._id}`, { status: newStatus });
      }
      fetchActivities();
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleDelete = async (activity) => {
    if (!confirm(`Delete this ${activity.activityType}?`)) return;
    try {
      if (activity.activityType === 'task') {
        await api.delete(`/api/tasks/${activity._id}`);
      } else {
        await api.delete(`/api/events/${activity._id}`);
      }
      fetchActivities();
    } catch (e) {
      console.error('Failed to delete activity:', e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const isTask = form.type === 'task';
      const endpoint = isTask ? '/api/tasks' : '/api/events';
      
      const payload = {
        type: form.type,
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo || undefined
      };

      if (form.relatedToModule && form.relatedToRecordId) {
        payload.relatedTo = {
          module: form.relatedToModule,
          recordId: form.relatedToRecordId
        };
      }

      if (isTask) {
        payload.dueDate = form.dueDate;
        payload.priority = form.priority;
      } else {
        payload.startTime = form.startTime;
        payload.endTime = form.endTime;
        payload.location = form.location;
        payload.conferenceLink = form.conferenceLink;
      }

      await api.post(endpoint, payload);
      setShowModal(false);
      
      // Reset form
      setForm({
        type: 'task',
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
        priority: 'medium',
        relatedToModule: '',
        relatedToRecordId: '',
        assignedTo: '',
        location: '',
        conferenceLink: ''
      });
      fetchActivities();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating activity');
    }
  };

  // Group activities into Open vs. Closed
  const openActivities = activities.filter(a => a.status === 'open' || a.status === 'scheduled');
  const closedActivities = activities.filter(a => a.status === 'completed' || a.status === 'cancelled');

  // Type Badges
  const getBadgeStyle = (type) => {
    if (type === 'task') return 'bg-[#E3A62F]/15 text-[#E3A62F]';
    if (type === 'meeting') return 'bg-[#4FBFA6]/15 text-[#4FBFA6]';
    return 'bg-[#E2705C]/15 text-[#E2705C]'; // call
  };

  const getBadgeIcon = (type) => {
    if (type === 'task') return <CheckSquare size={12} />;
    if (type === 'meeting') return <CalendarDays size={12} />;
    return <Phone size={12} />;
  };

  const ActivityRow = ({ activity }) => {
    const isCompleted = activity.status === 'completed' || activity.status === 'cancelled';
    const dateFormatted = activity.activityType === 'task'
      ? new Date(activity.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : `${new Date(activity.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${new Date(activity.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <Card
        variant="flat"
        className="p-4 bg-white flex items-center justify-between hover:border-gold/30 transition-all group"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <button 
            type="button" 
            onClick={() => handleToggleComplete(activity)} 
            className="shrink-0 text-slate-400 hover:text-gold transition-colors"
          >
            {isCompleted ? (
              <div className="w-5 h-5 rounded-full border border-gold bg-gold/10 flex items-center justify-center text-gold">
                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-slate-350 bg-white hover:border-gold transition-colors" />
            )}
          </button>

          <div className="min-w-0">
            <span className={`text-xs font-bold block truncate ${isCompleted ? 'line-through text-slate-400 font-semibold' : 'text-ink'}`}>
              {activity.title}
            </span>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 ${getBadgeStyle(activity.activityType)}`}>
                {getBadgeIcon(activity.activityType)}
                <span>{activity.activityType}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                {dateFormatted}
              </span>
              {activity.assignedTo && (
                <span className="text-[10px] text-slate-500 font-medium">
                  • Owner: {activity.assignedTo.name}
                </span>
              )}
              {activity.relatedTo?.module && activity.relatedTo?.recordId && (
                <span className="text-[9px] bg-slate-100 border border-line text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  {activity.relatedTo.module}: {activity.relatedTo.recordId.name || activity.relatedTo.recordId.company || 'Record'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          {activity.priority && (
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
              activity.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
              activity.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
              {activity.priority}
            </span>
          )}
          <button 
            onClick={() => handleDelete(activity)} 
            className="p-1.5 hover:bg-red-50 text-slate-450 hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-[#FAF9F6]">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Schedule & Execution</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Activities Command</h2>
          <p className="text-xs text-slate-500 mt-1">
            {openActivities.length} open activities remaining out of {activities.length} total stops
          </p>
        </div>

        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex border border-line bg-white p-0.5 rounded-lg mr-2 select-none">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-slate-450 hover:text-ink ${viewMode === 'list' ? 'bg-gold-soft text-gold font-bold' : ''}`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-slate-450 hover:text-ink ${viewMode === 'kanban' ? 'bg-gold-soft text-gold font-bold' : ''}`}
              title="Kanban View"
            >
              <KanbanIcon size={14} />
            </button>
          </div>

          <Button onClick={() => {
            setForm(prev => ({ ...prev, type: activeTab !== 'all' ? activeTab : 'task' }));
            setShowModal(true);
          }} icon={Plus}>
            New Activity
          </Button>
        </div>
      </div>

      {/* Tabs and Pill Filters row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        {/* tabs */}
        <div className="flex gap-1.5">
          {['all', 'task', 'meeting', 'call'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-btn transition-all ${
                activeTab === tab 
                  ? 'bg-ink text-white shadow-sm' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-line'
              }`}
            >
              {tab === 'all' ? 'All Activities' : `${tab}s`}
            </button>
          ))}
        </div>

        {/* pills */}
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'today', 'week', 'overdue'].map((pill) => (
            <button
              key={pill}
              onClick={() => setActiveFilter(pill)}
              className={`px-3 py-1.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded-full transition-all border ${
                activeFilter === pill 
                  ? 'bg-gold-soft border-gold text-gold-dark' 
                  : 'bg-white hover:bg-slate-50 text-slate-500 border-line'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : viewMode === 'list' ? (
        /* ────────────────── LIST VIEW ────────────────── */
        <div className="space-y-8">
          {/* Open Activities */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 px-1">
              <FolderOpen size={13} className="text-gold" />
              <span>Open Activities</span>
            </h3>
            {openActivities.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-white border border-line rounded-card italic">
                No open scheduled activities. Add an activity to start tracking!
              </div>
            ) : (
              <div className="space-y-2">
                {openActivities.map(a => <ActivityRow key={a._id} activity={a} />)}
              </div>
            )}
          </div>

          {/* Closed Activities */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 px-1">
              <CheckSquare size={13} className="text-emerald-500" />
              <span>Closed Activities</span>
            </h3>
            {closedActivities.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-white border border-line rounded-card italic">
                No closed or completed activities.
              </div>
            ) : (
              <div className="space-y-2">
                {closedActivities.map(a => <ActivityRow key={a._id} activity={a} />)}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ────────────────── KANBAN VIEW ────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Open / Scheduled Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white border border-line px-4 py-3 rounded-xl shadow-sm">
              <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                <span>Open / Scheduled</span>
              </h4>
              <span className="text-[10px] font-bold font-mono text-slate-450 bg-[#FAF9F6] border border-line px-2 py-0.5 rounded-full">
                {openActivities.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scroll">
              {openActivities.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 bg-white/40 border border-dashed border-line rounded-card italic">
                  No active items
                </div>
              ) : (
                openActivities.map(a => <ActivityRow key={a._id} activity={a} />)
              )}
            </div>
          </div>

          {/* Completed / Cancelled Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white border border-line px-4 py-3 rounded-xl shadow-sm">
              <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Completed / Cancelled</span>
              </h4>
              <span className="text-[10px] font-bold font-mono text-slate-450 bg-[#FAF9F6] border border-line px-2 py-0.5 rounded-full">
                {closedActivities.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scroll">
              {closedActivities.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 bg-white/40 border border-dashed border-line rounded-card italic">
                  No completed items
                </div>
              ) : (
                closedActivities.map(a => <ActivityRow key={a._id} activity={a} />)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick-Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">Schedule Activity</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll font-sans">
              
              {/* Type Selector */}
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
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`py-2 px-3 text-[10px] uppercase font-bold tracking-wider rounded-btn transition-all border ${
                        form.type === t.value
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
                id="actTitle"
                placeholder="E.g., Close contract agreement"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1 block">Description</label>
                <textarea
                  id="actDesc"
                  rows={2}
                  className="w-full bg-white border border-line rounded-input p-3 text-xs focus:ring-1 focus:ring-gold focus:border-gold"
                  placeholder="Notes, agenda, or call summary..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Conditional Fields: Task vs Meeting/Call */}
              {form.type === 'task' ? (
                <>
                  <Input
                    label="Due Date"
                    id="actDue"
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                  <Select
                    label="Priority"
                    id="actPriority"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
                      id="actStart"
                      type="datetime-local"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                    <Input
                      label="End Date & Time"
                      id="actEnd"
                      type="datetime-local"
                      required
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Location"
                    id="actLoc"
                    placeholder="E.g., Conference Room A, or Online"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                  <Input
                    label="Conference Link"
                    id="actConf"
                    placeholder="https://meet.google.com/..."
                    value={form.conferenceLink}
                    onChange={(e) => setForm({ ...form, conferenceLink: e.target.value })}
                  />
                </>
              )}

              {/* Related To Fields */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Related To Module"
                  id="actModule"
                  value={form.relatedToModule}
                  onChange={(e) => setForm({ ...form, relatedToModule: e.target.value, relatedToRecordId: '' })}
                  options={[
                    { value: '', label: 'None' },
                    { value: 'Lead', label: 'Lead' },
                    { value: 'Contact', label: 'Contact' },
                    { value: 'Account', label: 'Account' }
                  ]}
                />

                {form.relatedToModule === 'Lead' && (
                  <Select
                    label="Select Lead / Deal"
                    id="actLeadId"
                    value={form.relatedToRecordId}
                    onChange={(e) => setForm({ ...form, relatedToRecordId: e.target.value })}
                    options={[
                      { value: '', label: '-- Choose --' },
                      ...leads.map(l => ({ value: l._id, label: `${l.name} (${l.company})` }))
                    ]}
                  />
                )}

                {form.relatedToModule === 'Contact' && (
                  <Select
                    label="Select Contact"
                    id="actContactId"
                    value={form.relatedToRecordId}
                    onChange={(e) => setForm({ ...form, relatedToRecordId: e.target.value })}
                    options={[
                      { value: '', label: '-- Choose --' },
                      ...contacts.map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }))
                    ]}
                  />
                )}

                {form.relatedToModule === 'Account' && (
                  <Select
                    label="Select Account"
                    id="actAccountId"
                    value={form.relatedToRecordId}
                    onChange={(e) => setForm({ ...form, relatedToRecordId: e.target.value })}
                    options={[
                      { value: '', label: '-- Choose --' },
                      ...accounts.map(a => ({ value: a._id, label: a.name }))
                    ]}
                  />
                )}
              </div>

              {/* Assigned To (for Admin/Managers) */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Select
                  label="Assign Executive"
                  id="actAssign"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  options={[
                    { value: '', label: 'Assign to self' },
                    ...salespeople.map(s => ({ value: s._id, label: s.name }))
                  ]}
                />
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
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
    </div>
  );
};

export default Tasks;
export { Tasks };
