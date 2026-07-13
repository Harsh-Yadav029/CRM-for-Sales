import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Calendar, CheckSquare, Square, X, Trash2, Clock } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({ 
    title: '', 
    dueDate: new Date().toISOString().split('T')[0], 
    assignedTo: '', 
    leadId: '' 
  });

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/api/tasks');
      setTasks(data);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    api.get('/api/leads').then(r => setLeads(r.data)).catch(() => {});
    if (user?.role === 'admin') {
      api.get('/api/auth/salespeople').then(r => setSalespeople(r.data)).catch(() => {});
    }
  }, [user]);

  const toggleComplete = async (t) => {
    try {
      await api.put(`/api/tasks/${t._id}`, { completed: !t.completed });
      fetchTasks();
    } catch (e) {
      alert('Error updating task');
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      fetchTasks();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const body = { title: form.title, dueDate: form.dueDate };
      if (form.assignedTo) body.assignedTo = form.assignedTo;
      if (form.leadId) body.leadId = form.leadId;
      await api.post('/api/tasks', body);
      setShowModal(false);
      setForm({ 
        title: '', 
        dueDate: new Date().toISOString().split('T')[0], 
        assignedTo: '', 
        leadId: '' 
      });
      fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  // Grouping logic: Today, This Week, Later
  const getTaskGroup = (dueDateStr, completed) => {
    if (completed) return 'completed';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'today';
    if (diffDays <= 7) return 'week';
    return 'later';
  };

  const grouped = {
    today: tasks.filter(t => getTaskGroup(t.dueDate, t.completed) === 'today'),
    week: tasks.filter(t => getTaskGroup(t.dueDate, t.completed) === 'week'),
    later: tasks.filter(t => getTaskGroup(t.dueDate, t.completed) === 'later'),
    completed: tasks.filter(t => t.completed)
  };

  const TaskItemRow = ({ t }) => (
    <Card
      variant="flat"
      className="p-4 bg-white flex items-center justify-between hover:border-gold/30 transition-all group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={() => toggleComplete(t)} className="shrink-0 text-gold hover:opacity-80 transition-opacity">
          {t.completed ? (
            <CheckSquare size={18} className="fill-gold-soft text-gold" />
          ) : (
            <Square size={18} className="text-slate-400" />
          )}
        </button>
        <div className="min-w-0">
          <span className={`text-xs font-bold block truncate ${t.completed ? 'line-through text-slate-400 font-semibold' : 'text-ink'}`}>
            {t.title}
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
            Owner: {t.assignedTo?.name || 'You'} {t.leadId?.name ? ` • Associated Lead: ${t.leadId.name}` : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3 select-none">
        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-[#FAF9F6] border border-line px-2 py-0.5 rounded-btn font-mono">
          <Calendar size={11} />
          {new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <button 
          onClick={() => deleteTask(t._id)} 
          className="p-1 hover:bg-red-50 text-slate-450 hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Schedule & Execution</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Workspace Stops</h2>
          <p className="text-xs text-slate-500 mt-1">{tasks.filter(t => !t.completed).length} pending stops remaining</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grouped Pending Tasks */}
        <div className="lg:col-span-8 space-y-8">
          {/* Today's Tasks */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Clock size={13} className="text-gold" />
              <span>Today's Actions</span>
            </h3>
            {grouped.today.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-white border border-line rounded-card italic">
                All cleared for today!
              </div>
            ) : (
              <div className="space-y-2">
                {grouped.today.map(t => <TaskItemRow key={t._id} t={t} />)}
              </div>
            )}
          </div>

          {/* This Week */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Calendar size={13} className="text-gold" />
              <span>This Week</span>
            </h3>
            {grouped.week.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-white border border-line rounded-card italic">
                No stops scheduled this week.
              </div>
            ) : (
              <div className="space-y-2">
                {grouped.week.map(t => <TaskItemRow key={t._id} t={t} />)}
              </div>
            )}
          </div>

          {/* Later */}
          <div className="space-y-3">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Calendar size={13} className="text-slate-400" />
              <span>Later / Backlog</span>
            </h3>
            {grouped.later.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-white border border-line rounded-card italic">
                No long-term backlog stops.
              </div>
            ) : (
              <div className="space-y-2">
                {grouped.later.map(t => <TaskItemRow key={t._id} t={t} />)}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Completed Tasks */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 px-1">
            <CheckSquare size={13} className="text-emerald-500" />
            <span>Completed Stops</span>
          </h3>
          {grouped.completed.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 bg-white border border-line rounded-card italic">
              No tasks completed yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1.5 custom-scroll">
              {grouped.completed.map(t => <TaskItemRow key={t._id} t={t} />)}
            </div>
          )}
        </div>
      </div>

      {/* New Task Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">Schedule New Stop</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 font-sans">
              <Input
                label="Task Title"
                id="taskTitle"
                placeholder="E.g., Follow up with Alex"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <Input
                label="Due Date"
                id="taskDue"
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />

              <Select
                label="Link to Lead Profile"
                id="taskLead"
                value={form.leadId}
                onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                options={[
                  { value: '', label: 'None / General' },
                  ...leads.map(l => ({ value: l._id, label: `${l.name} (${l.company})` }))
                ]}
              />

              {user?.role === 'admin' && (
                <Select
                  label="Assign Executive"
                  id="taskAssign"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  options={[
                    { value: '', label: 'Myself' },
                    ...salespeople.map(s => ({ value: s._id, label: s.name }))
                  ]}
                />
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Schedule Task
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
