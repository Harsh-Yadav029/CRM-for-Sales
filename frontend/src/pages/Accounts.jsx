import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, X, Loader2, Building, Globe, Phone, MapPin, User } from 'lucide-react';
import RoleGate from '../components/RoleGate';

const Accounts = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
    address: '',
    assignedTo: ''
  });

  const fetchCompanies = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/api/companies', { params });
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalespeople = async () => {
    try {
      if (user?.role === 'admin' || user?.role === 'manager') {
        const { data } = await api.get('/api/auth/salespeople');
        setSalespeople(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  useEffect(() => {
    fetchSalespeople();
  }, [user]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      industry: '',
      website: '',
      phone: '',
      address: '',
      assignedTo: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (comp) => {
    setEditing(comp._id);
    setForm({
      name: comp.name || '',
      industry: comp.industry || '',
      website: comp.website || '',
      phone: comp.phone || '',
      address: comp.address || '',
      assignedTo: comp.assignedTo?._id || comp.assignedTo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Account?')) return;
    try {
      await api.delete(`/api/companies/${id}`);
      setCompanies(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;

      if (editing) {
        const { data } = await api.put(`/api/companies/${editing}`, payload);
        setCompanies(prev => prev.map(c => c._id === editing ? data : c));
      } else {
        const { data } = await api.post('/api/companies', payload);
        setCompanies(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save account');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Accounts & Companies</h2>
          <p className="text-xs text-on-surface-variant">Manage client organizations and business entities</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-105 text-[#111111] px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-amber-500/10"
        >
          <Plus size={16} />
          Create Account
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-3.5 text-on-surface-variant">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Filter accounts by name or industry..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-xs text-on-surface placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid List View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-outline-variant/50 bg-white/10">
          <Building className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 text-sm font-bold text-on-surface">No Accounts Found</h3>
          <p className="mt-2 text-xs text-on-surface-variant">Get started by creating your first client organization profile</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <div
              key={comp._id}
              className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm hover:border-outline/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-primary border border-amber-500/20">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-slate-850"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(comp._id)}
                        className="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-slate-850"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-bold text-on-surface leading-snug">{comp.name}</h3>
                <p className="text-[10px] text-primary font-semibold mt-1 uppercase tracking-wider">{comp.industry || 'General Industry'}</p>

                {/* Sub details stack */}
                <div className="mt-4 space-y-2 border-t border-outline-variant/40/60 pt-3 text-[11px] text-on-surface">
                  {comp.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                      <a href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noreferrer" className="hover:underline text-primary truncate">
                        {comp.website}
                      </a>
                    </div>
                  )}
                  {comp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                      <span>{comp.phone}</span>
                    </div>
                  )}
                  {comp.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                      <span className="truncate">{comp.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-outline-variant/40/60 pt-3 flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3 text-on-surface-variant" />
                  Assigned: {comp.assignedTo?.name || 'Unassigned'}
                </span>
                <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant/50 bg-white shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/40 bg-white/50 px-6 py-4">
              <h3 className="text-sm md:text-base font-bold text-on-surface">
                {editing ? 'Modify Account Details' : 'Create Client Account'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NexaCore Solutions"
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Industry</label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Retail, Finance"
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="e.g. www.nexacore.com"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. 5th Floor, Block C, Cyber City, Bangalore"
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Assign Teammate</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned (Round Robin eligible)</option>
                    {salespeople.map((sp) => (
                      <option key={sp._id} value={sp._id}>{sp.name} ({sp.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-outline-variant/40 px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold px-4 py-2 text-xs font-bold text-[#111111] hover:brightness-105"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
