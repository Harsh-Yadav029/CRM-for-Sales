import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Calendar, CheckSquare, Square, X, Trash2 } from 'lucide-react';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', dueDate: '', assignedTo: '', leadId: '' });

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
      setForm({ title: '', dueDate: '', assignedTo: '', leadId: '' });
      fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || 'Error creating task');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  const TaskCard = ({ t }) => (
    <div className="flex items-center justify-between p-4 bg-white border border-outline-variant rounded-xl hover:shadow-sm transition-shadow group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={() => toggleComplete(t)} className="shrink-0 text-primary">
          {t.completed ? (
            <span className="material-symbols-outlined font-bold text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_box</span>
          ) : (
            <span className="material-symbols-outlined text-outline hover:text-primary">check_box_outline_blank</span>
          )}
        </button>
        <div className="min-w-0">
          <span className={`text-xs font-bold block truncate ${t.completed ? 'line-through text-on-surface-variant/60 font-semibold' : 'text-on-surface'}`}>
            {t.title}
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Owner: {t.assignedTo?.name || 'You'} {t.leadId?.name ? ` • Associated Lead: ${t.leadId.name}` : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-lg border border-outline-variant/35">
          <Calendar size={11} />
          {new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        <button 
          onClick={() => deleteTask(t._id)} 
          className="p-1 hover:bg-error-container text-on-surface-variant hover:text-error rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-bold text-on-surface">Tasks</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">{pending.length} pending • {completed.length} completed</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary flex items-center gap-1.5 bg-gold hover:brightness-105 text-[#111111] text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
        >
          <Plus size={14} /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending tasks */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider px-1">Pending ({pending.length})</h3>
          {pending.length === 0 ? (
            <div className="text-center py-10 text-xs text-on-surface-variant bg-white rounded-xl border border-outline-variant italic">
              All tasks cleared!
            </div>
          ) : (
            pending.map(t => <TaskCard key={t._id} t={t} />)
          )}
        </div>
        
        {/* Completed tasks */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider px-1">Completed ({completed.length})</h3>
          {completed.length === 0 ? (
            <div className="text-center py-10 text-xs text-on-surface-variant bg-white rounded-xl border border-outline-variant italic">
              No tasks completed yet.
            </div>
          ) : (
            completed.map(t => <TaskCard key={t._id} t={t} />)
          )}
        </div>
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-modal w-full max-w-md overflow-hidden border border-outline-variant/50" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-bold text-sm md:text-base text-on-surface">Schedule New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Task Title</label>
                <input 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  required 
                  placeholder="E.g., Follow up with Alex"
                  className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} 
                  required 
                  className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Link to Lead Profile</label>
                <select 
                  value={form.leadId} 
                  onChange={(e) => setForm({ ...form, leadId: e.target.value })} 
                  className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                >
                  <option value="">None / General</option>
                  {leads.map(l => <option key={l._id} value={l._id}>{l.name} ({l.company})</option>)}
                </select>
              </div>

              {user?.role === 'admin' && (
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Assign Executive</label>
                  <select 
                    value={form.assignedTo} 
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} 
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  >
                    <option value="">Myself</option>
                    {salespeople.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-4 py-2 bg-gold hover:brightness-105 text-[#111111] rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  Schedule Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
