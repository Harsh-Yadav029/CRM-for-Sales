import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Plus, Trash2, Edit2, X, Loader2, Package, Tag, Layers } from 'lucide-react';
import RoleGate from '../components/RoleGate';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: 0,
    description: '',
    isActive: true
  });

  const fetchProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      const { data } = await api.get('/api/products', { params });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      sku: '',
      price: 0,
      description: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditing(prod._id);
    setForm({
      name: prod.name || '',
      sku: prod.sku || '',
      price: prod.price || 0,
      description: prod.description || '',
      isActive: prod.isActive !== undefined ? prod.isActive : true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Product SKU?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || form.price < 0) return;

    try {
      if (editing) {
        const { data } = await api.put(`/api/products/${editing}`, form);
        setProducts(prev => prev.map(p => p._id === editing ? data : p));
      } else {
        const { data } = await api.post('/api/products', form);
        setProducts(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Product Catalog</h2>
          <p className="text-xs text-on-surface-variant">Manage items, software licenses, SKUs, and service prices</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-105 text-[#111111] px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-amber-500/10"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-3.5 text-on-surface-variant">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Filter products by name or SKU..."
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
      ) : products.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-outline-variant/50 bg-white/10">
          <Package className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 text-sm font-bold text-on-surface">No Products Found</h3>
          <p className="mt-2 text-xs text-on-surface-variant">Get started by adding items to your product catalogue list</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod._id}
              className={`rounded-2xl border bg-surface-container-low p-5 backdrop-blur-sm transition-all flex flex-col justify-between ${
                prod.isActive ? 'border-outline-variant/50 hover:border-outline/80' : 'border-red-200 opacity-70'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-primary border border-amber-500/20">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-slate-850"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(prod._id)}
                        className="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-slate-850"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-bold text-on-surface leading-snug">{prod.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-surface-container-high text-on-surface border border-outline-variant px-2 py-0.5 rounded font-mono font-medium">
                    SKU: {prod.sku}
                  </span>
                  {!prod.isActive && (
                    <span className="text-[9px] bg-red-500/10 text-red-600 border border-red-500/25 px-1.5 py-0.5 rounded font-bold uppercase">
                      Inactive
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                  {prod.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 border-t border-outline-variant/40/60 pt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold text-primary">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  {fmt(prod.price)}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  Updated: {new Date(prod.updatedAt).toLocaleDateString()}
                </span>
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
                {editing ? 'Modify Catalog Item' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NexaCore Business License"
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NX-BIZ-100"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Unit Price (INR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="e.g. 75000"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Document product specifications, package licenses, SLA guidelines..."
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="rounded border-outline-variant/50 bg-surface-container text-primary focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-xs font-bold text-on-surface select-none">
                  Available for Quotation & Billing (Active)
                </label>
              </div>

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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
