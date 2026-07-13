import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Plus, Trash2, Edit2, X, Loader2, CreditCard, Calendar, PlusCircle, Printer } from 'lucide-react';
import RoleGate from '../components/RoleGate';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    invoiceNumber: '',
    companyId: '',
    quoteId: '',
    dueDate: '',
    status: 'unpaid',
    items: []
  });

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/api/invoices');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [compRes, prodRes, quoteRes] = await Promise.all([
        api.get('/api/companies'),
        api.get('/api/products'),
        api.get('/api/quotes')
      ]);
      setCompanies(compRes.data);
      setProducts(prodRes.data.filter(p => p.isActive));
      setQuotes(quoteRes.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchInvoices();
    fetchSupportingData();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      companyId: '',
      quoteId: '',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days default
      status: 'unpaid',
      items: [{ productId: '', quantity: 1, price: 0 }]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (inv) => {
    setEditing(inv._id);
    setForm({
      invoiceNumber: inv.invoiceNumber || '',
      companyId: inv.companyId?._id || inv.companyId || '',
      quoteId: inv.quoteId?._id || inv.quoteId || '',
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      status: inv.status || 'unpaid',
      items: inv.items.map(item => ({
        productId: item.productId?._id || item.productId || '',
        quantity: item.quantity || 1,
        price: item.price || 0
      }))
    });
    setShowModal(true);
  };

  const handleAddItemRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItemRow = (idx) => {
    if (form.items.length === 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, val) => {
    setForm(prev => {
      const updated = [...prev.items];
      updated[idx][field] = val;

      if (field === 'productId') {
        const matchingProduct = products.find(p => p._id === val);
        if (matchingProduct) {
          updated[idx].price = matchingProduct.price;
        }
      }
      return { ...prev, items: updated };
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Invoice?')) return;
    try {
      await api.delete(`/api/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.invoiceNumber.trim() || !form.companyId || form.items.some(item => !item.productId)) {
      alert('Please fill out all mandatory invoice fields and select products.');
      return;
    }

    try {
      if (editing) {
        const { data } = await api.put(`/api/invoices/${editing}`, form);
        setInvoices(prev => prev.map(inv => inv._id === editing ? data : inv));
      } else {
        const { data } = await api.post('/api/invoices', form);
        setInvoices(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save invoice');
    }
  };

  const calculateFormTotal = () => {
    return form.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Invoice Ledger</h2>
          <p className="text-xs text-on-surface-variant">Track paid, unpaid, and overdue client balances</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-105 text-[#111111] px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-amber-500/10"
        >
          <Plus size={16} />
          Create Invoice
        </button>
      </div>

      {/* List Grid View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-outline-variant/50 bg-white/10">
          <CreditCard className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 text-sm font-bold text-on-surface">No Invoices Found</h3>
          <p className="mt-2 text-xs text-on-surface-variant">Bill client accounts by configuring standard invoices</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {invoices.map((inv) => (
            <div
              key={inv._id}
              className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm hover:border-outline/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface leading-snug">{inv.invoiceNumber}</h3>
                    <p className="text-[10px] text-on-surface-variant font-semibold mt-1">
                      Account: {inv.companyId?.name || 'Linked Account'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPreviewInvoice(inv);
                        setShowPreviewModal(true);
                      }}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-slate-850"
                      title="Preview Invoice"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(inv)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-slate-850"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="p-1.5 text-on-surface-variant hover:text-red-600 rounded-lg hover:bg-slate-850"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    inv.status === 'overdue' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                    'bg-gold/10 text-primary border border-amber-500/20'
                  }`}>
                    {inv.status}
                  </span>
                  <span className="text-[10px] text-on-surface-variant flex items-center gap-1 font-medium">
                    <Calendar className="h-3 w-3" />
                    Due by: {new Date(inv.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-outline-variant/40/60 pt-3 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant font-mono">
                  Linked Quote: {inv.quoteId?.title || 'None'}
                </span>
                <span className="text-sm font-extrabold text-primary">
                  {fmt(inv.total || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-2xl rounded-2xl border border-outline-variant/50 bg-white shadow-card my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/40 bg-white/50 px-6 py-4">
              <h3 className="text-sm md:text-base font-bold text-on-surface">
                {editing ? 'Modify Invoice Configurations' : 'Billing: Invoice Creation'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-9001"
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Bill-to Account (Company) *</label>
                  <select
                    required
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none"
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  >
                    <option value="">Choose organization...</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Reference Quote (Optional)</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none"
                    value={form.quoteId}
                    onChange={(e) => setForm({ ...form, quoteId: e.target.value })}
                  >
                    <option value="">Choose proposal quote...</option>
                    {quotes.filter(q => q.companyId?._id === form.companyId || q.companyId === form.companyId).map((q) => (
                      <option key={q._id} value={q._id}>{q.title} ({fmt(q.total)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Invoice Status</label>
                <select
                  className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {/* Line Items Builder Section */}
              <div className="space-y-3 border-t border-outline-variant/40 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Invoice Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary"
                  >
                    <PlusCircle size={14} />
                    Add Product Line
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Product SKU</label>
                        <select
                          required
                          className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-2 py-2 text-xs text-on-surface focus:outline-none focus:border-amber-500"
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        >
                          <option value="">Select product SKU...</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>{p.name} ({fmt(p.price)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Qty</label>
                        <input
                          type="number"
                          required
                          min={1}
                          className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-2 py-2 text-xs text-on-surface placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Unit Price</label>
                        <input
                          type="number"
                          required
                          min={0}
                          className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-2 py-2 text-xs text-on-surface placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={form.items.length === 1}
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2 border border-outline-variant/50 text-on-surface-variant hover:text-red-600 rounded-lg disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Running summary totals */}
              <div className="flex justify-between items-center bg-surface-container p-4 rounded-xl border border-outline-variant/50/80 mt-6">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Gross Invoice Total</span>
                <span className="text-base font-extrabold text-primary">{fmt(calculateFormTotal())}</span>
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
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable / PDF preview Modal Overlay */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container/70 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setShowPreviewModal(false)}>
          <div
            className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-card p-8 overflow-hidden relative print:p-0 my-8 print:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Control buttons */}
            <div className="absolute right-6 top-6 flex items-center gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-200"
              >
                <Printer size={13} />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
              >
                <X size={15} />
              </button>
            </div>

            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mt-6 print:mt-0">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-primary uppercase">COMMERCIAL INVOICE</h1>
                <p className="text-xs text-on-surface-variant mt-1 font-mono">Invoice ID: #{previewInvoice.invoiceNumber}</p>
              </div>
              <div className="text-right text-xs space-y-1">
                <h3 className="font-bold text-slate-800">Walk the Plan CRM</h3>
                <p className="text-on-surface-variant">Finance & Collections Department</p>
                <p className="text-on-surface-variant">Date: {new Date(previewInvoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-8 my-6 text-xs">
              <div>
                <h4 className="font-bold text-on-surface-variant uppercase tracking-wider mb-2">Billed To:</h4>
                <p className="font-bold text-slate-800">{previewInvoice.companyId?.name}</p>
                {previewInvoice.companyId?.phone && <p className="text-on-surface-variant mt-0.5">{previewInvoice.companyId.phone}</p>}
                {previewInvoice.companyId?.address && <p className="text-on-surface-variant mt-0.5">{previewInvoice.companyId.address}</p>}
              </div>

              <div>
                <h4 className="font-bold text-on-surface-variant uppercase tracking-wider mb-2">Payment Terms:</h4>
                <div className="space-y-1 text-on-surface-variant">
                  <p>Due Date: <span className="font-bold text-red-600">{new Date(previewInvoice.dueDate).toLocaleDateString()}</span></p>
                  <p>Current Status: <span className="font-bold uppercase text-amber-600">{previewInvoice.status}</span></p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-xs text-left border-collapse my-6">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-on-surface-variant uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewInvoice.items?.map((item, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-3 px-3">
                      <p className="font-bold">{item.productId?.name || 'Product Item'}</p>
                      {item.productId?.sku && <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">SKU: {item.productId.sku}</p>}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.price)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{fmt(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="flex justify-end border-t border-slate-200 pt-6">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-on-surface-variant font-semibold">
                  <span>Gross Invoice Total:</span>
                  <span>{fmt(previewInvoice.total)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-[#111111] bg-slate-50 p-2 rounded">
                  <span>Amount Due (INR):</span>
                  <span>{fmt(previewInvoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Signoff */}
            <div className="border-t border-slate-200 pt-6 mt-8 text-[10px] text-on-surface-variant leading-relaxed">
              <h4 className="font-bold text-slate-600 uppercase tracking-wider mb-1">Standard Payment Terms</h4>
              <p>1. Please settle invoice dues prior to the payment due date shown above.</p>
              <p>2. Payment can be settled via corporate bank transfer or direct online link payments.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
