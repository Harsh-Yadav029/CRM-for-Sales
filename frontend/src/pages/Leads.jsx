import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, Shield, Settings, Import, Filter, X, Loader2, ArrowRight } from 'lucide-react';
import ImportWizardModal from '../components/ImportWizardModal';
import { CardSkeleton } from '../components/Skeletons';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const STATUS = ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Other'];

const statusColorVariant = (s) =>
  ({
    New: 'neutral',
    Contacted: 'neutral',
    'Demo Scheduled': 'gold',
    'Proposal Sent': 'warning',
    Negotiation: 'warning',
    Won: 'success',
    Lost: 'danger'
  }[s] || 'neutral');

const calculateScore = (status) => {
  const scores = {
    'New': 45,
    'Contacted': 62,
    'Demo Scheduled': 75,
    'Proposal Sent': 88,
    'Negotiation': 94,
    'Won': 100,
    'Lost': 12
  };
  return scores[status] || 50;
};

const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Website',
    expectedRevenue: 0,
    status: 'New',
    assignedTo: '',
    customFields: {}
  });

  const fetchLeads = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/api/leads', { params });
      setLeads(data);
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const { data } = await api.get('/api/custom-fields');
      setCustomFieldDefinitions(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCustomFields();
    if (user?.role === 'admin') {
      api.get('/api/auth/salespeople')
        .then((r) => setSalespeople(r.data))
        .catch(() => {});
    }
  }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      source: 'Website',
      expectedRevenue: 0,
      status: 'New',
      assignedTo: '',
      customFields: {}
    });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditing(l);
    const leadCustomFields = {};
    if (l.customFields) {
      Object.keys(l.customFields).forEach((key) => {
        leadCustomFields[key] = l.customFields[key];
      });
    }

    setForm({
      name: l.name,
      company: l.company,
      email: l.email,
      phone: l.phone,
      source: l.source,
      expectedRevenue: l.expectedRevenue || 0,
      status: l.status,
      assignedTo: l.assignedTo?._id || '',
      customFields: leadCustomFields
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/api/leads/${editing._id}`, form);
      } else {
        await api.post('/api/leads', form);
      }
      setShowModal(false);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving lead');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.delete(`/api/leads/${id}`);
      fetchLeads();
    } catch (e) {
      alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  const getPriorityTier = (score) => {
    if (score >= 85) return 'Tier 1 Priority';
    if (score >= 60) return 'Tier 2 Priority';
    return 'Standard Priority';
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Pipeline Management</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1.5">Leads Inventory</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
            Track and manage high-potential architectural partnerships and construction site projects.
          </p>
        </div>
        <Button onClick={openCreate} icon={Plus}>
          Capture New Lead
        </Button>
      </div>

      {/* Filter and search trail */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-xl">
          <Input
            id="leadSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads, companies, or lead scores..."
            icon={Search}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar select-none">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-btn border transition-all ${
              statusFilter === '' ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink hover:bg-gold-soft'
            }`}
          >
            All
          </button>
          {['New', 'Contacted', 'Proposal Sent', 'Won'].map((stage) => (
            <button
              key={stage}
              onClick={() => setStatusFilter(stage)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-btn border transition-all ${
                statusFilter === stage ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink hover:bg-gold-soft'
              }`}
            >
              {stage}
            </button>
          ))}
          
          <Button
            variant="secondary"
            onClick={() => setShowImportModal(true)}
            className="py-2.5 px-4 font-mono text-[10px]"
            icon={Import}
          >
            Import CSV
          </Button>
        </div>
      </div>

      {/* Leads Cards Grid */}
      <section className="pb-12">
        {leads.length === 0 ? (
          <EmptyState
            title="No leads on this path yet"
            description="Start capturing prospects and planning opportunities."
            action={
              <Button onClick={openCreate} icon={Plus}>
                Capture First Lead
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((l) => {
              const score = calculateScore(l.status);
              const priority = getPriorityTier(score);

              return (
                <Card
                  key={l._id}
                  variant="flat"
                  className="p-6 bg-white hover:border-gold/30 transition-all flex flex-col group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <Link to={`/leads/${l._id}`} className="font-display font-black text-sm uppercase text-ink hover:text-gold transition-colors tracking-tight">
                        {l.company}
                      </Link>
                      <span className="text-xs text-slate-500 font-medium mt-0.5">{l.name}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={statusColorVariant(l.status)}>
                        {l.status}
                      </Badge>
                      <span className="text-[10px] font-bold text-gold font-mono">{score}% Score</span>
                    </div>
                  </div>

                  <div className="h-px bg-line my-4"></div>

                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                      <span>Priority</span>
                      <span className="text-ink">{priority}</span>
                    </div>

                    {/* Progress score bar */}
                    <div className="w-full bg-line h-1 rounded-full overflow-hidden">
                      <div className="bg-gold h-full transition-all duration-500" style={{ width: `${score}%` }}></div>
                    </div>

                    {/* Compact action triggers */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Link
                        to={`/leads/${l._id}`}
                        className="border border-line hover:bg-gold-soft rounded-btn py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-ink transition-all flex items-center justify-center"
                      >
                        Details
                      </Link>
                      <Button
                        variant="primary"
                        onClick={() => openEdit(l)}
                        className="py-2.5 rounded-btn text-[10px]"
                      >
                        Update
                      </Button>
                    </div>

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(l._id)}
                        className="w-full border border-red-100 text-danger hover:bg-red-50 py-1.5 rounded-btn text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 size={10} />
                        Remove Lead
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Leads Dialog Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/20 backdrop-blur-xs">
          <div className="bg-white border border-line rounded-modal shadow-modal w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">
                {editing ? 'Edit Lead Profile' : 'Add New Prospect'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Name"
                  id="formName"
                  placeholder="Jordan Davis"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  label="Company Name"
                  id="formCompany"
                  placeholder="Quantum Systems"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
                <Input
                  label="Email Address"
                  id="formEmail"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  id="formPhone"
                  placeholder="+1 (555) 019-2834"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <Select
                  label="Lead Source"
                  id="formSource"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  options={SOURCES.map(s => ({ value: s, label: s }))}
                />

                <Input
                  label="Expected Revenue (₹)"
                  id="formRevenue"
                  type="number"
                  value={form.expectedRevenue}
                  onChange={(e) => setForm({ ...form, expectedRevenue: Number(e.target.value) })}
                />

                {editing && (
                  <Select
                    label="Status"
                    id="formStatus"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    options={STATUS.map(s => ({ value: s, label: s }))}
                  />
                )}

                {user?.role === 'admin' && (
                  <Select
                    label="Assign Executive"
                    id="formAssigned"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...salespeople.map(s => ({ value: s._id, label: s.name }))
                    ]}
                  />
                )}

                {/* Custom Fields */}
                {customFieldDefinitions.length > 0 && (
                  <div className="col-span-2 border-t border-line pt-4 mt-2">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Custom Lead Parameters</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {customFieldDefinitions.map((field) => (
                        <div key={field._id}>
                          {field.fieldType === 'select' ? (
                            <Select
                              label={field.fieldName}
                              value={form.customFields[field.fieldName] || ''}
                              onChange={(e) => setForm({
                                ...form,
                                customFields: { ...form.customFields, [field.fieldName]: e.target.value }
                              })}
                              options={field.options.map(opt => ({ value: opt, label: opt }))}
                            />
                          ) : (
                            <Input
                              label={field.fieldName}
                              type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                              value={form.customFields[field.fieldName] || ''}
                              onChange={(e) => setForm({
                                ...form,
                                customFields: {
                                  ...form.customFields,
                                  [field.fieldName]: field.fieldType === 'number' ? Number(e.target.value) : e.target.value
                                }
                              })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-line sticky bottom-0 bg-white">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editing ? 'Update Profile' : 'Add Prospect'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportWizardModal 
          onClose={() => setShowImportModal(false)} 
          onImportSuccess={fetchLeads} 
        />
      )}
    </div>
  );
};

export default Leads;
export { Leads };
