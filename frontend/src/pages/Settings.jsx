import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import PipelineSettings from '../components/PipelineSettings';
import BlueprintViewer from '../components/BlueprintViewer';
import SecurityLogs from '../components/SecurityLogs';
import RoleGate from '../components/RoleGate';

const Settings = () => {
  const { user } = useAuth();
  const [salespeople, setSalespeople] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', role: 'sales' });
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState('');

  // Custom Fields Layout Builder state
  const [newFieldForm, setNewFieldForm] = useState({ fieldName: '', fieldType: 'text', optionsString: '' });
  const [fieldLoading, setFieldLoading] = useState(false);
  const [fieldMsg, setFieldMsg] = useState('');

  // Phase 3 Workflows & Automation state
  const [newWorkflowForm, setNewWorkflowForm] = useState({
    name: '',
    triggerStage: 'New',
    actionType: 'task',
    taskTitle: '',
    emailSubject: '',
    emailBody: ''
  });
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowMsg, setWorkflowMsg] = useState('');

  const fetchSettingsData = async () => {
    try {
      const fieldResponse = await api.get('/api/custom-fields');
      setCustomFields(fieldResponse.data);
      
      const workflowResponse = await api.get('/api/workflows');
      setWorkflows(workflowResponse.data);

      if (user?.role === 'admin' || user?.role === 'manager') {
        const teamResponse = await api.get('/api/users');
        setSalespeople(teamResponse.data);
      }
    } catch (e) {
      console.error('Error fetching settings configs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, [user]);

  const handleUpdateTeammateStatus = async (id, isActive, role) => {
    try {
      const { data } = await api.put(`/api/users/${id}/status`, { isActive, role });
      setSalespeople(prev => prev.map(s => s._id === id ? data : s));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegMsg('');
    try {
      await api.post('/api/auth/register', regForm);
      setRegMsg('User created successfully');
      setRegForm({ name: '', email: '', password: '', role: 'sales' });
      const teamResponse = await api.get('/api/users');
      setSalespeople(teamResponse.data);
    } catch (err) {
      setRegMsg(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    if (!newFieldForm.fieldName.trim()) return;
    setFieldLoading(true);
    setFieldMsg('');
    try {
      const options = newFieldForm.optionsString.split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      const { data } = await api.post('/api/custom-fields', {
        fieldName: newFieldForm.fieldName,
        fieldType: newFieldForm.fieldType,
        options
      });
      
      setFieldMsg('Custom field added successfully');
      setNewFieldForm({ fieldName: '', fieldType: 'text', optionsString: '' });
      setCustomFields(prev => [...prev, data]);
    } catch (err) {
      setFieldMsg(err.response?.data?.message || 'Failed to add custom field');
    } finally {
      setFieldLoading(false);
    }
  };

  const handleDeleteField = async (id) => {
    if (!confirm('Are you sure you want to remove this custom field? Existing values on lead profiles will not be shown.')) return;
    try {
      await api.delete(`/api/custom-fields/${id}`);
      setCustomFields(prev => prev.filter(field => field._id !== id));
    } catch (e) {
      alert('Delete custom field failed');
    }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!newWorkflowForm.name.trim()) return;
    setWorkflowLoading(true);
    setWorkflowMsg('');
    try {
      const { data } = await api.post('/api/workflows', newWorkflowForm);
      setWorkflowMsg('Workflow trigger rule added successfully');
      setNewWorkflowForm({
        name: '',
        triggerStage: 'New',
        actionType: 'task',
        taskTitle: '',
        emailSubject: '',
        emailBody: ''
      });
      setWorkflows(prev => [...prev, data]);
    } catch (err) {
      setWorkflowMsg(err.response?.data?.message || 'Failed to create workflow rule');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await api.delete(`/api/workflows/${id}`);
      setWorkflows(prev => prev.filter(w => w._id !== id));
    } catch (e) {
      alert('Delete workflow failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Profile Details Card */}
      <div className="bg-white shadow-card rounded-2xl border border-outline-variant/50 p-5 shadow-card space-y-4">
        <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base">account_circle</span>
          Personal Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40">
            <span className="text-[10px] font-extrabold text-on-surface-variant/70 uppercase block mb-1">Full Name</span>
            <span className="text-xs md:text-sm font-bold text-on-surface">{user?.name}</span>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40">
            <span className="text-[10px] font-extrabold text-on-surface-variant/70 uppercase block mb-1">Email Address</span>
            <span className="text-xs md:text-sm font-bold text-on-surface">{user?.email}</span>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40">
            <span className="text-[10px] font-extrabold text-on-surface-variant/70 uppercase block mb-1">Assigned Role</span>
            <span className="text-xs md:text-sm font-bold text-on-surface flex items-center gap-1.5 capitalize">
              <span className="material-symbols-outlined text-base text-primary">shield</span>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="space-y-6">
          {/* Custom Fields Layout Builder Section */}
          <div className="bg-white shadow-card rounded-2xl border border-outline-variant/50 p-5 shadow-card space-y-4">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">dashboard_customize</span>
              Layout Builder & Custom Fields
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Creator form */}
              <div className="lg:col-span-5 p-4 bg-surface-container-low border border-outline-variant/50 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-on-surface">Define Custom Parameter</h4>
                
                {fieldMsg && (
                  <div className={`p-2.5 rounded-lg text-[11px] font-bold border ${fieldMsg.includes('success') ? 'bg-secondary/15 border-secondary/20 text-secondary' : 'bg-error-container/20 border-error/30 text-error'}`}>
                    {fieldMsg}
                  </div>
                )}

                <form onSubmit={handleCreateField} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Field Label Name</label>
                    <input 
                      value={newFieldForm.fieldName}
                      onChange={(e) => setNewFieldForm({ ...newFieldForm, fieldName: e.target.value })}
                      required
                      placeholder="E.g., Contract Term"
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Field Input Type</label>
                    <select 
                      value={newFieldForm.fieldType}
                      onChange={(e) => setNewFieldForm({ ...newFieldForm, fieldType: e.target.value })}
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    >
                      <option value="text">Text Input</option>
                      <option value="number">Number Input</option>
                      <option value="select">Dropdown Selector</option>
                      <option value="date">Date Input</option>
                    </select>
                  </div>
                  
                  {newFieldForm.fieldType === 'select' && (
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Dropdown Options (Comma-separated)</label>
                      <input 
                        value={newFieldForm.optionsString}
                        onChange={(e) => setNewFieldForm({ ...newFieldForm, optionsString: e.target.value })}
                        required
                        placeholder="Option A, Option B, Option C"
                        className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      disabled={fieldLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:brightness-105 text-on-surface rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      {fieldLoading && <Loader2 className="animate-spin" size={12} />}
                      Create Custom Field
                    </button>
                  </div>
                </form>
              </div>

              {/* View/Delete Active fields */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-xs font-bold text-on-surface px-1">Active Custom Fields ({customFields.length})</h4>
                {customFields.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic text-center py-8 border border-dashed border-outline-variant/50 rounded-xl bg-background">
                    No custom fields configured yet. Create one on the left.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scroll">
                    {customFields.map((field) => (
                      <div key={field._id} className="p-3 bg-surface-container-low border border-outline-variant/50 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-on-surface block leading-tight">{field.fieldName}</span>
                          <span className="text-[10px] text-on-surface-variant/85 font-semibold capitalize uppercase tracking-wider block mt-1">
                            Type: {field.fieldType} {field.options.length > 0 && `(${field.options.length} options)`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteField(field._id)}
                          className="p-1.5 hover:bg-red-50 text-on-surface-variant hover:text-red-450 rounded-lg transition-all"
                          title="Delete Custom Field Definition"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase 3: Sales Automation Rules builder section */}
          <div className="bg-white shadow-card rounded-2xl border border-outline-variant/50 p-5 shadow-card space-y-4">
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">alt_route</span>
              Sales Workflow Rules & Automation
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Rules creator form */}
              <div className="lg:col-span-5 p-4 bg-surface-container-low border border-outline-variant/50 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-on-surface">Instantiate New Workflow Trigger</h4>
                
                {workflowMsg && (
                  <div className={`p-2.5 rounded-lg text-[11px] font-bold border ${workflowMsg.includes('successfully') ? 'bg-secondary/15 border-secondary/20 text-secondary' : 'bg-error-container/20 border-error/30 text-error'}`}>
                    {workflowMsg}
                  </div>
                )}

                <form onSubmit={handleCreateWorkflow} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Rule Name</label>
                    <input 
                      value={newWorkflowForm.name}
                      onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, name: e.target.value })}
                      required
                      placeholder="E.g., Automated Proposal Task"
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">When Status Stage is Updated to</label>
                    <select 
                      value={newWorkflowForm.triggerStage}
                      onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, triggerStage: e.target.value })}
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    >
                      {['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Automated Action</label>
                    <select 
                      value={newWorkflowForm.actionType}
                      onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, actionType: e.target.value })}
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    >
                      <option value="task">Create Scheduled Task</option>
                      <option value="email">Send Simulated Email</option>
                    </select>
                  </div>

                  {newWorkflowForm.actionType === 'task' ? (
                    <div>
                      <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Task Title to Schedule</label>
                      <input 
                        value={newWorkflowForm.taskTitle}
                        onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, taskTitle: e.target.value })}
                        required
                        placeholder="E.g., Call client to verify proposal receipt"
                        className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Email Subject</label>
                        <input 
                          value={newWorkflowForm.emailSubject}
                          onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, emailSubject: e.target.value })}
                          required
                          placeholder="Welcome to NexaCore Solutions!"
                          className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Email Body (use {"{name}"} or {"{company}"} placeholders)</label>
                        <textarea 
                          value={newWorkflowForm.emailBody}
                          onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, emailBody: e.target.value })}
                          required
                          rows={3}
                          placeholder="Dear {name}, thank you for choosing {company}."
                          className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      disabled={workflowLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:brightness-105 text-on-surface rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      {workflowLoading && <Loader2 className="animate-spin" size={12} />}
                      Create Workflow Rule
                    </button>
                  </div>
                </form>
              </div>

              {/* View/Delete Active Rules */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-xs font-bold text-on-surface px-1">Active Rules ({workflows.length})</h4>
                {workflows.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic text-center py-8 border border-dashed border-outline-variant/50 rounded-xl bg-background">
                    No automation rules configured. Define one on the left.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scroll">
                    {workflows.map((w) => (
                      <div key={w._id} className="p-3.5 bg-surface-container-low border border-outline-variant/50 rounded-xl flex items-start justify-between shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-on-surface leading-tight">{w.name}</span>
                            <span className="bg-primary/20 text-primary text-[9px] font-extrabold uppercase px-2 py-0.5 border border-primary/25 rounded-full">
                              When: {w.triggerStage}
                            </span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant/85 font-medium mt-1.5 leading-relaxed">
                            {w.actionType === 'task' 
                              ? `Action: Create Task - "${w.taskTitle}"` 
                              : `Action: Send Email - "${w.emailSubject}"`
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteWorkflow(w._id)}
                          className="p-1.5 hover:bg-red-50 text-on-surface-variant hover:text-red-600 rounded-lg transition-all shrink-0 ml-2"
                          title="Delete Workflow Rule"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <PipelineSettings />

          <BlueprintViewer />

          <RoleGate allow={['admin']}>
            <SecurityLogs />
          </RoleGate>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Register New User Card */}
            <div className="bg-white shadow-card rounded-2xl border border-outline-variant/50 p-5 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Register New User
                </h3>
                
                {regMsg && (
                  <div className={`mb-4 p-3 rounded-xl text-xs font-bold border ${regMsg.includes('success') ? 'bg-secondary/15 border-secondary/20 text-secondary' : 'bg-error-container/20 border-error/30 text-error'}`}>
                    {regMsg}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Full Name</label>
                    <input 
                      value={regForm.name} 
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} 
                      required 
                      placeholder="E.g., Jane Smith"
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Email</label>
                    <input 
                      type="email" 
                      value={regForm.email} 
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} 
                      required 
                      placeholder="email@company.com"
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showPw ? 'text' : 'password'} 
                        value={regForm.password} 
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} 
                        required 
                        placeholder="••••••••"
                        className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 pr-10 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPw(!showPw)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-base">{showPw ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase mb-1">Role</label>
                    <select 
                      value={regForm.role} 
                      onChange={(e) => setRegForm({ ...regForm, role: e.target.value })} 
                      className="w-full border border-outline-variant/50 rounded-xl py-2 px-3 text-xs bg-surface-container focus:border-primary transition-colors text-on-surface"
                    >
                      <option value="sales">Sales Executive</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end pt-3">
                    <button 
                      type="submit" 
                      disabled={regLoading} 
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:brightness-105 text-on-surface rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
                    >
                      {regLoading && <Loader2 className="animate-spin" size={13} />}
                      Register User
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Team Members List Card */}
            <div className="bg-white shadow-card rounded-2xl border border-outline-variant/50 p-5 shadow-card">
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">groups</span>
                Team Members
              </h3>
              
              {salespeople.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic text-center py-6">No team members registered yet</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scroll">
                  {salespeople.map((s) => (
                    <div key={s._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {s.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-on-surface block truncate">{s.name}</span>
                          <span className="text-[10px] text-on-surface-variant truncate block">{s.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Edit Role Select */}
                        <select
                          className="rounded-lg border border-outline-variant/50 bg-surface-container px-2 py-1 text-[10px] text-on-surface focus:outline-none disabled:opacity-75 font-semibold uppercase"
                          value={s.role}
                          disabled={user?.role !== 'admin' || s._id === user?._id}
                          onChange={(e) => handleUpdateTeammateStatus(s._id, s.isActive, e.target.value)}
                        >
                          <option value="rep">Representative</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Active/Inactive checkbox Toggle */}
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant/50 bg-surface-container text-primary h-3.5 w-3.5"
                            checked={s.isActive !== false}
                            disabled={user?.role !== 'admin' || s._id === user?._id}
                            onChange={(e) => handleUpdateTeammateStatus(s._id, e.target.checked, s.role)}
                          />
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase">
                            {s.isActive !== false ? 'Active' : 'Locked'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
