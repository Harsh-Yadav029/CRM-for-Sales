import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, Eye, X, Loader2 } from 'lucide-react';
import ImportWizardModal from '../components/ImportWizardModal';

const STATUS = ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Other'];

const statusColor = (s) =>
  ({
    New: 'bg-primary-container/10 text-primary border border-primary-container/20',
    Contacted: 'bg-surface-container-high text-on-surface border border-outline-variant',
    'Demo Scheduled': 'bg-surface-container-highest text-primary font-bold border border-primary/20',
    'Proposal Sent': 'bg-tertiary-container/30 text-tertiary border border-tertiary-fixed-dim',
    Negotiation: 'bg-secondary-container/20 text-secondary border border-secondary-fixed-dim',
    Won: 'bg-secondary-container text-on-secondary-container font-semibold',
    Lost: 'bg-error-container text-on-error-container font-semibold'
  }[s] || 'bg-surface-container-low text-on-surface-variant border border-outline-variant');

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
    
    // Map existing custom fields
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
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // Stats calculation
  const totalLeadsCount = leads.length;
  const qualifiedLeadsCount = leads.filter((l) => l.status === 'Won' || l.status === 'Negotiation' || l.status === 'Proposal Sent').length;
  const conversionRate = totalLeadsCount ? Math.round((leads.filter((l) => l.status === 'Won').length / totalLeadsCount) * 100) : 0;

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Search and Filters Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email or company..."
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md text-xs md:text-sm text-on-surface"
          />
        </div>
        
        {/* Filter chips trail */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${statusFilter === '' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high'}`}
          >
            All Leads
          </button>
          {['New', 'Contacted', 'Proposal Sent', 'Won'].map((stage) => (
            <button
              key={stage}
              onClick={() => setStatusFilter(stage)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${statusFilter === stage ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high'}`}
            >
              {stage}
            </button>
          ))}
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 border border-outline-variant hover:bg-surface-container-low text-primary text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm whitespace-nowrap ml-2"
          >
            <span className="material-symbols-outlined text-sm">publish</span> Import CSV
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-1 bg-primary text-white hover:brightness-110 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md whitespace-nowrap ml-1"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </section>

      {/* Leads Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Total Leads</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-headline-lg text-2xl font-extrabold text-primary">{totalLeadsCount}</span>
            <span className="text-secondary font-bold text-xs flex items-center gap-1">+12%</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold">Pipeline Deals</span>
          <div className="flex items-end justify-between mt-2">
            <span className="font-headline-lg text-2xl font-extrabold text-on-surface">{qualifiedLeadsCount}</span>
            <span className="text-secondary font-bold text-xs flex items-center gap-1">+5%</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-primary p-4 rounded-xl border border-primary-container shadow-md flex items-center justify-between text-white">
          <div>
            <h3 className="font-bold text-sm md:text-base">Conversion Goal</h3>
            <p className="text-xs opacity-90 mt-1">Goal is to reach 20% won-lead ratio this quarter.</p>
          </div>
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            {/* SVG progress ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle className="opacity-20" cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4"></circle>
              <circle 
                cx="28" 
                cy="28" 
                r="24" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="4"
                strokeDasharray="150.7"
                strokeDashoffset={150.7 - (150.7 * Math.min(conversionRate, 100)) / 100}
              ></circle>
            </svg>
            <span className="absolute text-[10px] font-bold">{conversionRate}%</span>
          </div>
        </div>
      </section>

      {/* Leads Table Card */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="hidden md:grid md:grid-cols-12 px-6 py-3 border-b border-outline-variant bg-surface-container-low font-bold text-[11px] text-on-surface-variant uppercase tracking-wider">
                <th className="col-span-4 flex items-center">LEAD NAME & COMPANY</th>
                <th className="col-span-2 flex items-center">STATUS</th>
                <th className="col-span-2 flex items-center">SCORE</th>
                <th className="col-span-2 flex items-center">SOURCE</th>
                <th className="col-span-2 flex items-center justify-end text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 block md:table-row-group">
              {leads.length === 0 ? (
                <div className="text-center py-12 text-xs text-on-surface-variant italic">No leads found matching criteria.</div>
              ) : (
                leads.map((l) => {
                  const score = calculateScore(l.status);
                  return (
                    <tr 
                      key={l._id} 
                      className="grid grid-cols-1 md:grid-cols-12 px-4 md:px-6 py-3.5 hover:bg-surface-container-low/40 transition-colors items-center gap-y-3 group cursor-pointer border-b md:border-b-0 border-outline-variant/40 md:table-row"
                    >
                      <td className="col-span-1 md:col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {l.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs md:text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                            <Link to={`/leads/${l._id}`}>{l.name}</Link>
                          </h4>
                          <p className="text-[10px] md:text-xs text-on-surface-variant truncate">{l.company} • {fmt(l.expectedRevenue)}</p>
                        </div>
                      </td>
                      <td className="col-span-1 md:col-span-2 flex items-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor(l.status)}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="col-span-1 md:col-span-2 flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden shrink-0">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-extrabold text-on-surface">{score}</span>
                      </td>
                      <td className="col-span-1 md:col-span-2 flex items-center text-xs text-on-surface-variant font-medium">
                        {l.source}
                      </td>
                      <td className="col-span-1 md:col-span-2 flex items-center justify-end gap-1 text-right">
                        <Link 
                          to={`/leads/${l._id}`} 
                          className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <Eye size={15} />
                        </Link>
                        <button 
                          onClick={() => openEdit(l)} 
                          className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDelete(l._id)} 
                            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Dialog Form */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-on-background/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] border border-outline-variant" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
              <h3 className="font-bold text-sm md:text-base text-on-surface">{editing ? 'Edit Lead Profile' : 'Add New Prospect'}</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Contact Name</label>
                  <input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    required 
                    placeholder="E.g., Jordan Davis"
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Company Name</label>
                  <input 
                    value={form.company} 
                    onChange={(e) => setForm({ ...form, company: e.target.value })} 
                    required 
                    placeholder="E.g., Quantum Systems"
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    required 
                    placeholder="name@company.com"
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    required 
                    placeholder="+1 (555) 019-2834"
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Lead Source</label>
                  <select 
                    value={form.source} 
                    onChange={(e) => setForm({ ...form, source: e.target.value })} 
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  >
                    {SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Expected Revenue (₹)</label>
                  <input 
                    type="number" 
                    value={form.expectedRevenue} 
                    onChange={(e) => setForm({ ...form, expectedRevenue: Number(e.target.value) })} 
                    className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                  />
                </div>
                {editing && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Status</label>
                    <select 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value })} 
                      className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                    >
                      {STATUS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Assign Executive</label>
                    <select 
                      value={form.assignedTo} 
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} 
                      className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                    >
                      <option value="">Unassigned</option>
                      {salespeople.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Phase 2: Dynamic Custom Fields inputs inside lead modal */}
                {customFieldDefinitions.length > 0 && (
                  <div className="col-span-2 border-t border-outline-variant/60 pt-4 mt-2">
                    <h4 className="text-xs font-bold text-on-surface mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">dashboard_customize</span>
                      Custom Lead Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {customFieldDefinitions.map((field) => (
                        <div key={field._id} className="col-span-2 md:col-span-1">
                          <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">
                            {field.fieldName}
                          </label>
                          {field.fieldType === 'select' ? (
                            <select
                              value={form.customFields[field.fieldName] || ''}
                              onChange={(e) => setForm({
                                ...form,
                                customFields: {
                                  ...form.customFields,
                                  [field.fieldName]: e.target.value
                                }
                              })}
                              className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                            >
                              <option value="">Select option</option>
                              {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input
                              type={field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                              value={form.customFields[field.fieldName] || ''}
                              onChange={(e) => setForm({
                                ...form,
                                customFields: {
                                  ...form.customFields,
                                  [field.fieldName]: field.fieldType === 'number' ? Number(e.target.value) : e.target.value
                                }
                              })}
                              className="w-full border border-outline-variant rounded-xl py-2 px-3 text-xs bg-surface-container-lowest focus:border-primary transition-colors text-on-surface"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/60 sticky bottom-0 bg-white">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  {editing ? 'Update Profile' : 'Add Prospect'}
                </button>
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
