import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, X, Loader2, User, Mail, Phone, Briefcase, Building } from 'lucide-react';
import RoleGate from '../components/RoleGate';

const Contacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    companyId: '',
    assignedTo: ''
  });

  const fetchContacts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/api/contacts', { params });
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const companyRes = await api.get('/api/companies');
      setCompanies(companyRes.data);

      if (user?.role === 'admin' || user?.role === 'manager') {
        const teamRes = await api.get('/api/auth/salespeople');
        setSalespeople(teamRes.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchContacts();
  }, [search]);

  useEffect(() => {
    fetchSupportingData();
  }, [user]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      companyId: '',
      assignedTo: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cont) => {
    setEditing(cont._id);
    setForm({
      firstName: cont.firstName || '',
      lastName: cont.lastName || '',
      email: cont.email || '',
      phone: cont.phone || '',
      title: cont.title || '',
      companyId: cont.companyId?._id || cont.companyId || '',
      assignedTo: cont.assignedTo?._id || cont.assignedTo || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Contact?')) return;
    try {
      await api.delete(`/api/contacts/${id}`);
      setContacts(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;

    try {
      const payload = { ...form };
      if (!payload.companyId) delete payload.companyId;
      if (!payload.assignedTo) delete payload.assignedTo;

      if (editing) {
        const { data } = await api.put(`/api/contacts/${editing}`, payload);
        setContacts(prev => prev.map(c => c._id === editing ? data : c));
      } else {
        const { data } = await api.post('/api/contacts', payload);
        setContacts(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save contact');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Contacts Directory</h2>
          <p className="text-xs text-on-surface-variant">Keep track of key executives and account representatives</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-105 text-[#111111] px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-amber-500/10"
        >
          <Plus size={16} />
          Create Contact
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-3.5 text-on-surface-variant">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Filter contacts by name or email..."
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
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-outline-variant/50 bg-white/10">
          <User className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 text-sm font-bold text-on-surface">No Contacts Found</h3>
          <p className="mt-2 text-xs text-on-surface-variant">Add client representatives to link them to business deals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((cont) => (
            <div
              key={cont._id}
              className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm hover:border-outline/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-primary border border-amber-500/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cont)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-slate-850"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(cont._id)}
                        className="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-slate-850"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-bold text-on-surface leading-snug">{cont.firstName} {cont.lastName}</h3>
                <p className="text-[10px] text-primary font-semibold mt-1 uppercase tracking-wider">{cont.title || 'Representative'}</p>

                {/* Sub details stack */}
                <div className="mt-4 space-y-2 border-t border-outline-variant/40/60 pt-3 text-[11px] text-on-surface">
                  {cont.companyId && (
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                      <span className="font-semibold text-on-surface-variant truncate">
                        {cont.companyId?.name || 'Linked Account'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                    <span className="truncate">{cont.email}</span>
                  </div>
                  {cont.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />
                      <span>{cont.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-outline-variant/40/60 pt-3 flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-on-surface-variant" />
                  Rep: {cont.assignedTo?.name || 'Unassigned'}
                </span>
                <span>{new Date(cont.createdAt).toLocaleDateString()}</span>
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
                {editing ? 'Modify Contact Profile' : 'Add New Contact'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Purchasing Officer"
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jane.doe@company.com"
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Associated Company</label>
                <select
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                >
                  <option value="">None (Individual Contact)</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Assign Teammate</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
