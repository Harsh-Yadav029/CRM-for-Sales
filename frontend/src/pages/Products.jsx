import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Plus, Trash2, Edit2, X, Loader2, Package, Tag } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Product Inventory</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Product SKU Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">Manage items, software licenses, SKUs, and service prices</p>
        </div>

        <Button onClick={handleOpenCreate} icon={Plus}>
          Add Product
        </Button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Input
          id="productSearch"
          placeholder="Filter products by name or SKU..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table-First Layout */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products in catalog yet"
          description="Get started by adding items to your product catalogue list."
          action={
            <Button onClick={handleOpenCreate} icon={Plus}>
              Create First Product
            </Button>
          }
        />
      ) : (
        <Table headers={['SKU Code', 'Product Title', 'Price (INR)', 'Status', 'Last Updated', 'Actions']}>
          {products.map((prod) => (
            <tr key={prod._id} className={prod.isActive ? 'hover:bg-gold-soft/30' : 'opacity-60 bg-red-50/10'}>
              {/* SKU - Monospaced */}
              <td className="py-3 px-5 font-mono font-bold text-slate-600 text-xs">
                {prod.sku}
              </td>

              {/* Title / Description */}
              <td className="py-3 px-5">
                <div className="flex flex-col max-w-md">
                  <span className="font-bold text-ink">{prod.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 truncate">{prod.description || '—'}</span>
                </div>
              </td>

              {/* Price - Monospaced */}
              <td className="py-3 px-5 font-mono font-bold text-ink">
                {fmt(prod.price)}
              </td>

              {/* Status */}
              <td className="py-3 px-5 select-none">
                <Badge variant={prod.isActive ? 'gold' : 'danger'}>
                  {prod.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>

              {/* Date - Monospaced */}
              <td className="py-3 px-5 font-mono text-slate-500 text-[11px]">
                {new Date(prod.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>

              {/* Actions */}
              <td className="py-3 px-5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-1 text-slate-400 hover:text-ink rounded hover:bg-gold-soft transition-all"
                  >
                    <Edit2 size={13} />
                  </button>
                  <RoleGate allow={['admin', 'manager']}>
                    <button
                      onClick={() => handleDelete(prod._id)}
                      className="p-1 text-slate-400 hover:text-danger rounded hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </RoleGate>
                </div>
              </td>
            </tr>
          ))}
        </Table>
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
                {editing ? 'Modify Catalog Item' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans">
              <Input
                label="Product Title"
                id="formName"
                placeholder="e.g. NexaCore Business License"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="SKU Code"
                  id="formSku"
                  placeholder="e.g. NX-BIZ-100"
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
                <Input
                  label="Unit Price (INR)"
                  id="formPrice"
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 75000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>

              <Textarea
                label="Description"
                id="formDescription"
                placeholder="Document specifications, licenses..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <div className="flex items-center gap-2 pt-2 select-none">
                <input
                  type="checkbox"
                  id="isActive"
                  className="rounded border-line bg-[#FAF9F6] text-gold focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-xs font-bold text-ink">
                  Available for Quotation & Billing (Active)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
export { Products };
