import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, X, Loader2, User, Mail, Phone, Briefcase, Building } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Contacts Directory</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Client Representatives</h2>
          <p className="text-xs text-slate-500 mt-1">Keep track of key executives and account representatives</p>
        </div>

        <Button onClick={handleOpenCreate} icon={Plus}>
          Create Contact
        </Button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Input
          id="contactSearch"
          placeholder="Filter contacts by name or email..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid List View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No contacts on this path yet"
          description="Add client representatives to link them to business deals."
          action={
            <Button onClick={handleOpenCreate} icon={Plus}>
              Create First Contact
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((cont) => (
            <Card
              key={cont._id}
              variant="flat"
              className="p-6 bg-white hover:border-gold/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  {/* Keep avatar circle */}
                  <div className="w-10 h-10 rounded-full border border-line bg-gold-soft text-gold flex items-center justify-center font-bold text-xs shrink-0 select-none">
                    {cont.firstName.charAt(0).toUpperCase()}{cont.lastName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(cont)}
                      className="p-1.5 text-slate-400 hover:text-ink rounded-lg hover:bg-gold-soft transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(cont._id)}
                        className="p-1.5 text-slate-400 hover:text-danger rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-display font-black text-ink uppercase tracking-tight leading-snug">
                  {cont.firstName} {cont.lastName}
                </h3>

                {/* Sub details stack - NO icons row, clean stacked texts */}
                <div className="mt-4 space-y-2.5 border-t border-line pt-3.5 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</span>
                    <span className="font-medium text-slate-600 mt-0.5 truncate">{cont.email}</span>
                  </div>
                  {cont.phone && (
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone</span>
                      <span className="font-medium text-slate-600 mt-0.5">{cont.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                <span className="flex items-center gap-1.5">
                  <Briefcase size={12} className="text-slate-400" />
                  <span>Rep: {cont.assignedTo?.name || 'Unassigned'}</span>
                </span>
                <span>{new Date(cont.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-md rounded-modal border border-line bg-white shadow-modal overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">
                {editing ? 'Modify Contact Profile' : 'Add New Contact'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  id="formFirstName"
                  placeholder="Jane"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <Input
                  label="Last Name *"
                  id="formLastName"
                  placeholder="Doe"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>

              <Input
                label="Email Address *"
                id="formEmail"
                type="email"
                placeholder="jane.doe@company.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <Input
                label="Phone Number"
                id="formPhone"
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Select
                  label="Assign Teammate"
                  id="formAssigned"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...salespeople.map(sp => ({ value: sp._id, label: sp.name }))
                  ]}
                />
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Contact
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
export { Contacts };
