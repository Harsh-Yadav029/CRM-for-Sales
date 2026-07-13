import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, Edit2, X, Loader2, Building, Globe, Phone, MapPin, User } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Company Accounts</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Client Accounts</h2>
          <p className="text-xs text-slate-500 mt-1">Manage client organizations and business entities</p>
        </div>

        <Button onClick={handleOpenCreate} icon={Plus}>
          Create Account
        </Button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Input
          id="accountSearch"
          placeholder="Filter accounts by name or industry..."
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
      ) : companies.length === 0 ? (
        <EmptyState
          title="No accounts on this path yet"
          description="Get started by creating your first client organization profile."
          action={
            <Button onClick={handleOpenCreate} icon={Plus}>
              Create First Account
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((comp) => (
            <Card
              key={comp._id}
              variant="flat"
              className="p-6 bg-white hover:border-gold/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold border border-gold/10">
                    <Building size={18} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="p-1.5 text-slate-400 hover:text-ink rounded-lg hover:bg-gold-soft transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(comp._id)}
                        className="p-1.5 text-slate-400 hover:text-danger rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-display font-black text-ink uppercase tracking-tight leading-snug">{comp.name}</h3>
                <p className="text-[10px] text-gold font-bold font-mono uppercase tracking-wider mt-1">{comp.industry || 'General Industry'}</p>

                {/* Sub details stack */}
                <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs text-ink">
                  {comp.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-slate-400 shrink-0" />
                      <a href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noreferrer" className="hover:underline text-gold truncate">
                        {comp.website}
                      </a>
                    </div>
                  )}
                  {comp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-600">{comp.phone}</span>
                    </div>
                  )}
                  {comp.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate text-slate-650 font-medium">{comp.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  <span>Owner: {comp.assignedTo?.name || 'Unassigned'}</span>
                </span>
                <span>{new Date(comp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
                {editing ? 'Modify Account Details' : 'Create Client Account'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
              <Input
                label="Account Name"
                id="accName"
                placeholder="e.g. NexaCore Solutions"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <Input
                label="Industry"
                id="accIndustry"
                placeholder="e.g. Technology, Retail, Finance"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Website URL"
                  id="accWebsite"
                  placeholder="e.g. www.nexacore.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  id="accPhone"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <Input
                label="Office Address"
                id="accAddress"
                placeholder="e.g. Cyber City, Bangalore"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Select
                  label="Assign Teammate"
                  id="accAssigned"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  options={[
                    { value: '', label: 'Unassigned (Round Robin)' },
                    ...salespeople.map(sp => ({ value: sp._id, label: `${sp.name} (${sp.role})` }))
                  ]}
                />
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
export { Accounts };
