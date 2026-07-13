import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, Eye, X, Loader2 } from 'lucide-react';
import ImportWizardModal from '../components/ImportWizardModal';
import { CardSkeleton } from '../components/Skeletons';

const STATUS = ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const SOURCES = ['Website', 'Referral', 'Social Media', 'Cold Call', 'Email Campaign', 'Other'];

const statusColor = (s) =>
  ({
    New: 'bg-gold/10 text-primary border border-gold/30',
    Contacted: 'bg-surface-container text-on-surface border border-outline-variant/50',
    'Demo Scheduled': 'bg-gold/10 text-primary font-bold border border-gold/30',
    'Proposal Sent': 'bg-tertiary-container/30 text-tertiary border border-tertiary-container',
    Negotiation: 'bg-secondary-container/30 text-secondary border border-secondary-container',
    Won: 'bg-green-50 text-green-700 border border-green-200 font-semibold',
    Lost: 'bg-red-50 text-red-700 border border-red-200 font-semibold'
  }[s] || 'bg-surface-container text-on-surface-variant border border-outline-variant/50');

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
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const totalLeadsCount = leads.length;
  const qualifiedLeadsCount = leads.filter((l) => l.status === 'Won' || l.status === 'Negotiation' || l.status === 'Proposal Sent').length;
  const conversionRate = totalLeadsCount ? Math.round((leads.filter((l) => l.status === 'Won').length / totalLeadsCount) * 100) : 0;

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  const getIndustryIcon = (company = '') => {
    const c = company.toLowerCase();
    if (c.includes('tech') || c.includes('api') || c.includes('software') || c.includes('saas') || c.includes('data')) {
      return 'precision_manufacturing';
    }
    if (c.includes('heights') || c.includes('landscape') || c.includes('loft') || c.includes('plaza') || c.includes('tower') || c.includes('hill') || c.includes('park')) {
      return 'landscape';
    }
    return 'apartment';
  };

  const getPriorityTier = (score) => {
    if (score >= 85) return 'Tier 1 Priority';
    if (score >= 60) return 'Tier 2 Priority';
    return 'Standard Priority';
  };

  // Common input class for the modal
  const inputClass = "w-full border border-outline-variant rounded-lg py-2 px-3 text-xs bg-white focus:border-primary transition-colors text-on-surface";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary font-label">Pipeline Management</span>
          <h2 className="text-xl md:text-2xl font-black text-on-surface mt-1 uppercase tracking-tight">Leads Inventory</h2>
          <p className="text-xs text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
            Track and manage high-potential architectural partnerships and construction site projects.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary bg-gold text-[#111111] font-bold text-xs uppercase px-6 py-3 rounded-lg flex items-center gap-2 hover:brightness-105 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Capture New Lead
        </button>
      </div>

      {/* Search and Filters Section */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH PROJECTS, CLIENTS, OR LEAD SCORES..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant focus:border-primary rounded-lg font-bold text-xs uppercase placeholder:text-outline transition-all text-on-surface shadow-sm"
          />
        </div>
        
        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap rounded-lg border ${statusFilter === '' ? 'bg-gold text-[#111111] border-gold shadow-sm' : 'bg-white border-outline-variant/60 text-on-surface hover:bg-surface-container-low'}`}
          >
            All Leads
          </button>
          {['New', 'Contacted', 'Proposal Sent', 'Won'].map((stage) => (
            <button
              key={stage}
              onClick={() => setStatusFilter(stage)}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all whitespace-nowrap rounded-lg border ${statusFilter === stage ? 'bg-gold text-[#111111] border-gold shadow-sm' : 'bg-white border-outline-variant/60 text-on-surface hover:bg-surface-container-low'}`}
            >
              {stage}
            </button>
          ))}
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 border border-dashed border-outline hover:bg-surface-container-low text-primary text-xs font-bold rounded-lg px-4 py-2 transition-all uppercase whitespace-nowrap ml-2"
          >
            Import CSV
          </button>
        </div>
      </section>

      {/* Leads Grid Card Layout */}
      <section className="pb-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-outline-variant rounded-2xl text-xs text-on-surface-variant italic bg-white uppercase font-bold tracking-wide shadow-card">
            No leads found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {leads.map((l) => {
              const score = calculateScore(l.status);
              const priority = getPriorityTier(score);
              const industryIcon = getIndustryIcon(l.company);
              
              return (
                <div 
                  key={l._id} 
                  className="bg-white border border-outline-variant/40 rounded-2xl p-6 hover:shadow-card-hover transition-all flex flex-col group relative overflow-hidden shadow-card"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gold transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-14 w-14 bg-surface-container-low rounded-xl flex items-center justify-center border border-outline-variant/40">
                      <span className="material-symbols-outlined text-on-surface text-2xl">{industryIcon}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-lg ${
                        l.status === 'Won' ? 'bg-green-50 text-green-700 border border-green-200' : 
                        l.status === 'Lost' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-surface-container border border-outline-variant/50 text-on-surface-variant'
                      }`}>
                        {l.status}
                      </span>
                      <div className="flex items-center gap-0.5 text-primary">
                        <span className="font-extrabold text-xs">{score}%</span>
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-base text-on-surface leading-tight mb-1 group-hover:text-primary transition-colors">
                      <Link to={`/leads/${l._id}`}>{l.company}</Link>
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">person</span>
                      {l.name}
                    </p>
                  </div>

                  <div className="mt-auto space-y-4">
                    <div className="w-full bg-outline-variant/30 h-1 rounded-full overflow-hidden">
                      <div className="bg-gold h-full transition-all duration-1000 rounded-full" style={{ width: `${score}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-on-surface-variant text-[10px] uppercase font-bold font-label">
                      <span>Lead Score</span>
                      <span className="font-black text-on-surface">{priority}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Link 
                        to={`/leads/${l._id}`}
                        className="border border-outline-variant/60 bg-surface-container-lowest rounded-lg py-2.5 text-center text-[10px] font-bold uppercase hover:bg-surface-container-low hover:shadow-sm transition-all flex items-center justify-center text-on-surface"
                      >
                        Details
                      </Link>
                      <button 
                        onClick={() => openEdit(l)}
                        className="btn-primary bg-gold text-[#111111] rounded-lg py-2.5 text-[10px] font-bold uppercase hover:brightness-105 transition-all flex items-center justify-center"
                      >
                        Update
                      </button>
                    </div>

                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(l._id)}
                        className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                        Remove Lead
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Dialog Form */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white border border-outline-variant/50 rounded-2xl shadow-modal w-full max-w-lg overflow-y-auto max-h-[90vh]" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-lowest sticky top-0 z-10">
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
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Contact Name</label>
                  <input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    required 
                    placeholder="E.g., Jordan Davis"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Company Name</label>
                  <input 
                    value={form.company} 
                    onChange={(e) => setForm({ ...form, company: e.target.value })} 
                    required 
                    placeholder="E.g., Quantum Systems"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Email Address</label>
                  <input 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    required 
                    placeholder="name@company.com"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Phone Number</label>
                  <input 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    required 
                    placeholder="+1 (555) 019-2834"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Lead Source</label>
                  <select 
                    value={form.source} 
                    onChange={(e) => setForm({ ...form, source: e.target.value })} 
                    className={inputClass}
                  >
                    {SOURCES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Expected Revenue (₹)</label>
                  <input 
                    type="number" 
                    value={form.expectedRevenue} 
                    onChange={(e) => setForm({ ...form, expectedRevenue: Number(e.target.value) })} 
                    className={inputClass}
                  />
                </div>
                {editing && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Status</label>
                    <select 
                      value={form.status} 
                      onChange={(e) => setForm({ ...form, status: e.target.value })} 
                      className={inputClass}
                    >
                      {STATUS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">Assign Executive</label>
                    <select 
                      value={form.assignedTo} 
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} 
                      className={inputClass}
                    >
                      <option value="">Unassigned</option>
                      {salespeople.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Dynamic Custom Fields */}
                {customFieldDefinitions.length > 0 && (
                  <div className="col-span-2 border-t border-outline-variant/40 pt-4 mt-2">
                    <h4 className="text-xs font-bold text-on-surface mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">dashboard_customize</span>
                      Custom Lead Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {customFieldDefinitions.map((field) => (
                        <div key={field._id} className="col-span-2 md:col-span-1">
                          <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1 font-label">
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
                              className={inputClass}
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
                              className={inputClass}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40 sticky bottom-0 bg-white">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary px-4 py-2 bg-gold hover:brightness-105 text-[#111111] rounded-lg text-xs font-bold shadow-sm transition-all"
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
