import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, User, Users, Sliders, Play, Shield, Key, Eye, EyeOff, LayoutGrid, CheckSquare, Trash2 } from 'lucide-react';
import PipelineSettings from '../components/PipelineSettings';
import BlueprintViewer from '../components/BlueprintViewer';
import SecurityLogs from '../components/SecurityLogs';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Badge from '../components/ui/Badge';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [salespeople, setSalespeople] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', role: 'rep' });
  const [regLoading, setRegLoading] = useState(false);
  const [regMsg, setRegMsg] = useState('');

  const [newFieldForm, setNewFieldForm] = useState({ fieldName: '', fieldType: 'text', optionsString: '' });
  const [fieldLoading, setFieldLoading] = useState(false);
  const [fieldMsg, setFieldMsg] = useState('');

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
      setCustomFields(Array.isArray(fieldResponse.data) ? fieldResponse.data : []);
      
      const workflowResponse = await api.get('/api/workflows');
      setWorkflows(Array.isArray(workflowResponse.data) ? workflowResponse.data : []);

      if (user?.role === 'admin' || user?.role === 'manager') {
        const teamResponse = await api.get('/api/users');
        setSalespeople(Array.isArray(teamResponse.data) ? teamResponse.data : []);
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
      setSalespeople(prev => (Array.isArray(prev) ? prev : []).map(s => s._id === id ? data : s));
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
      setRegForm({ name: '', email: '', password: '', role: 'rep' });
      const teamResponse = await api.get('/api/users');
      setSalespeople(Array.isArray(teamResponse.data) ? teamResponse.data : []);
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
    if (!confirm('Are you sure you want to remove this custom field?')) return;
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
      setWorkflowMsg('Workflow rule added successfully');
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
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  const navItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'team', label: 'Team Directory', icon: Users, gate: ['admin', 'manager'] },
    { id: 'pipeline', label: 'Pipeline Config', icon: Sliders, gate: ['admin'] },
    { id: 'fields', label: 'Custom Parameters', icon: LayoutGrid, gate: ['admin'] },
    { id: 'workflows', label: 'Automated Triggers', icon: Play, gate: ['admin'] },
    { id: 'security', label: 'Security & Logs', icon: Shield, gate: ['admin'] }
  ];

  const visibleNav = navItems.filter(item => !item.gate || item.gate.includes(user?.role));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Title */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">System Parameters</span>
        <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Control Console</h2>
        <p className="text-xs text-slate-500 mt-1">Configure profile data, pipeline controls, layout definitions, and rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sub-Navigation Menu */}
        <div className="lg:col-span-3 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-btn text-xs font-bold uppercase tracking-wider transition-all border ${active ? 'bg-ink border-ink text-white shadow-sm' : 'bg-white border-line text-slate-500 hover:bg-gold-soft hover:text-ink'}`}
              >
                <Icon size={14} className={active ? 'text-gold' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Details Panel */}
        <div className="lg:col-span-9 space-y-6">
          {/* PROFILE Tab */}
          {activeTab === 'profile' && (
            <Card variant="raised" className="p-6 bg-white space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Personal Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#FAF9F6] rounded-card border border-line">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-mono">Full Name</span>
                  <span className="text-xs font-bold text-ink">{user?.name}</span>
                </div>
                <div className="p-4 bg-[#FAF9F6] rounded-card border border-line">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-mono">Email Address</span>
                  <span className="text-xs font-bold text-ink truncate block">{user?.email}</span>
                </div>
                <div className="p-4 bg-[#FAF9F6] rounded-card border border-line">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-mono">Assigned Role</span>
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5 capitalize">
                    <Shield size={12} className="text-gold" />
                    {user?.role}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* TEAM Directory Tab */}
          {activeTab === 'team' && (user?.role === 'admin' || user?.role === 'manager') && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Team members list */}
                <div className="lg:col-span-7 space-y-4">
                  <Card variant="raised" className="p-6 bg-white">
                    <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line mb-4">Teammates</h3>
                    <div className="space-y-3">
                      {salespeople.map((s) => (
                        <div key={s._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FAF9F6] border border-line rounded-card gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gold-soft border border-gold/10 flex items-center justify-center text-gold font-bold text-xs uppercase shrink-0">
                              {s.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-ink block truncate">{s.name}</span>
                              <span className="text-[10px] text-slate-500 truncate block font-mono font-medium">{s.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 select-none">
                            <select
                              className="rounded-lg border border-line bg-white px-2 py-1 text-[10px] text-ink focus:outline-none disabled:opacity-75 font-mono font-bold uppercase tracking-wider"
                              value={s.role}
                              disabled={user?.role !== 'admin' || s._id === user?._id}
                              onChange={(e) => handleUpdateTeammateStatus(s._id, s.isActive, e.target.value)}
                            >
                              <option value="rep">Rep</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>

                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-line bg-white text-gold h-3.5 w-3.5"
                                checked={s.isActive !== false}
                                disabled={user?.role !== 'admin' || s._id === user?._id}
                                onChange={(e) => handleUpdateTeammateStatus(s._id, e.target.checked, s.role)}
                              />
                              <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                                {s.isActive !== false ? 'Active' : 'Locked'}
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Team enrollment form */}
                <div className="lg:col-span-5 space-y-4">
                  <Card variant="raised" className="p-6 bg-white">
                    <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line mb-4">Enroll Teammate</h3>
                    {regMsg && (
                      <div className="mb-4 text-xs font-mono font-bold uppercase p-2 border border-line bg-[#FAF9F6]">
                        {regMsg}
                      </div>
                    )}
                    <form onSubmit={handleRegister} className="space-y-4">
                      <Input
                        label="Full Name"
                        id="regName"
                        required
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      />
                      <Input
                        label="Email Address"
                        id="regEmail"
                        type="email"
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      />
                      <div className="relative">
                        <Input
                          label="Password"
                          id="regPassword"
                          type={showPw ? 'text' : 'password'}
                          required
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute right-3.5 top-[34px] text-slate-400 hover:text-ink"
                        >
                          {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <Select
                        label="Role Assignment"
                        id="regRole"
                        value={regForm.role}
                        onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                        options={[
                          { value: 'rep', label: 'Sales Executive (Rep)' },
                          { value: 'manager', label: 'Sales Manager' },
                          { value: 'admin', label: 'Administrator' }
                        ]}
                      />
                      <div className="flex justify-end pt-2">
                        <Button type="submit" loading={regLoading}>
                          Register User
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* PIPELINE Tab */}
          {activeTab === 'pipeline' && user?.role === 'admin' && (
            <div className="space-y-6">
              <PipelineSettings />
              <BlueprintViewer />
            </div>
          )}

          {/* CUSTOM FIELDS Tab */}
          {activeTab === 'fields' && user?.role === 'admin' && (
            <Card variant="raised" className="p-6 bg-white space-y-6">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Layout Builder & Custom fields</h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 p-4 bg-[#FAF9F6] border border-line rounded-card space-y-4">
                  <h4 className="text-xs font-bold text-ink uppercase font-mono tracking-wider">Define Parameter</h4>
                  {fieldMsg && (
                    <div className="p-2 text-[10px] font-mono font-bold border border-line bg-white">
                      {fieldMsg}
                    </div>
                  )}
                  <form onSubmit={handleCreateField} className="space-y-4">
                    <Input
                      label="Field Label"
                      id="fieldName"
                      required
                      placeholder="e.g. Contract Term"
                      value={newFieldForm.fieldName}
                      onChange={(e) => setNewFieldForm({ ...newFieldForm, fieldName: e.target.value })}
                    />
                    <Select
                      label="Field Type"
                      id="fieldType"
                      value={newFieldForm.fieldType}
                      onChange={(e) => setNewFieldForm({ ...newFieldForm, fieldType: e.target.value })}
                      options={[
                        { value: 'text', label: 'Text Input' },
                        { value: 'number', label: 'Number Input' },
                        { value: 'select', label: 'Dropdown Selector' },
                        { value: 'date', label: 'Date Input' }
                      ]}
                    />
                    {newFieldForm.fieldType === 'select' && (
                      <Input
                        label="Dropdown Options (Comma-separated)"
                        id="fieldOptions"
                        required
                        placeholder="Option A, Option B"
                        value={newFieldForm.optionsString}
                        onChange={(e) => setNewFieldForm({ ...newFieldForm, optionsString: e.target.value })}
                      />
                    )}
                    <div className="flex justify-end pt-2">
                      <Button type="submit" loading={fieldLoading}>
                        Create Parameter
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider px-1">Active Parameters ({customFields.length})</h4>
                  {customFields.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-10 bg-[#FAF9F6] rounded-card border border-line">
                      No custom fields added yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1.5 custom-scroll">
                      {customFields.map((field) => (
                        <div key={field._id} className="p-3 bg-[#FAF9F6] border border-line rounded-card flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-ink block truncate">{field.fieldName}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono block mt-1">
                              {field.fieldType} {field.options.length > 0 && `(${field.options.length} options)`}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteField(field._id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-danger rounded transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* WORKFLOWS AUTOMATION Tab */}
          {activeTab === 'workflows' && user?.role === 'admin' && (
            <Card variant="raised" className="p-6 bg-white space-y-6">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider pb-2 border-b border-line">Sales Automation Workflows</h3>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 p-4 bg-[#FAF9F6] border border-line rounded-card space-y-4">
                  <h4 className="text-xs font-bold text-ink uppercase font-mono tracking-wider">New Automation rule</h4>
                  {workflowMsg && (
                    <div className="p-2 text-[10px] font-mono font-bold border border-line bg-white">
                      {workflowMsg}
                    </div>
                  )}
                  <form onSubmit={handleCreateWorkflow} className="space-y-4">
                    <Input
                      label="Rule Description"
                      id="wfName"
                      required
                      placeholder="e.g. Action Item on Proposal"
                      value={newWorkflowForm.name}
                      onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, name: e.target.value })}
                    />
                    <Select
                      label="Pipeline Stage Update Trigger"
                      id="wfTrigger"
                      value={newWorkflowForm.triggerStage}
                      onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, triggerStage: e.target.value })}
                      options={['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map(stage => ({ value: stage, label: stage }))}
                    />
                    <Select
                      label="Automated Action Type"
                      id="wfAction"
                      value={newWorkflowForm.actionType}
                      onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, actionType: e.target.value })}
                      options={[
                        { value: 'task', label: 'Schedule Action Item' },
                        { value: 'email', label: 'Send Simulated Email' }
                      ]}
                    />
                    {newWorkflowForm.actionType === 'task' ? (
                      <Input
                        label="Action Item Description"
                        id="wfTask"
                        required
                        placeholder="Verify proposal receipt..."
                        value={newWorkflowForm.taskTitle}
                        onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, taskTitle: e.target.value })}
                      />
                    ) : (
                      <div className="space-y-4">
                        <Input
                          label="Email Subject"
                          id="wfSubject"
                          required
                          placeholder="Welcome message..."
                          value={newWorkflowForm.emailSubject}
                          onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, emailSubject: e.target.value })}
                        />
                        <Textarea
                          label="Email Body"
                          id="wfBody"
                          required
                          placeholder="Dear {name}, thank you..."
                          value={newWorkflowForm.emailBody}
                          onChange={(e) => setNewWorkflowForm({ ...newWorkflowForm, emailBody: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button type="submit" loading={workflowLoading}>
                        Instantiate Rule
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider px-1">Active Rules ({workflows.length})</h4>
                  {workflows.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-10 bg-[#FAF9F6] rounded-card border border-line">
                      No automation triggers active.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1.5 custom-scroll">
                      {workflows.map((w) => (
                        <div key={w._id} className="p-3.5 bg-[#FAF9F6] border border-line rounded-card flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-ink">{w.name}</span>
                              <Badge variant="gold">
                                WHEN: {w.triggerStage}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1.5">
                              {w.actionType === 'task' 
                                ? `Action: Create Task - "${w.taskTitle}"` 
                                : `Action: Send Email - "${w.emailSubject}"`
                              }
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteWorkflow(w._id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-danger rounded transition-all shrink-0 ml-2"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* SECURITY Log Tab */}
          {activeTab === 'security' && user?.role === 'admin' && (
            <RoleGate allow={['admin']}>
              <SecurityLogs />
            </RoleGate>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
export { Settings };
