import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Plus, Trash2, Edit2, X, Loader2, CreditCard, Calendar, PlusCircle, Printer } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 bg-paper font-sans">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Invoice Ledger</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Billing Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">Track paid, unpaid, and overdue client balances</p>
        </div>

        <Button onClick={handleOpenCreate} icon={Plus}>
          Create Invoice
        </Button>
      </div>

      {/* List Grid View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Bill client accounts by configuring standard invoices."
          action={
            <Button onClick={handleOpenCreate} icon={Plus}>
              Create First Invoice
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {invoices.map((inv) => (
            <Card
              key={inv._id}
              variant="flat"
              className="p-6 bg-white hover:border-gold/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight leading-snug">{inv.invoiceNumber}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                      Account: {inv.companyId?.name || 'Linked Account'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setPreviewInvoice(inv);
                        setShowPreviewModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-ink rounded hover:bg-gold-soft transition-all"
                      title="Preview Invoice"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(inv)}
                      className="p-1.5 text-slate-400 hover:text-ink rounded hover:bg-gold-soft transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="p-1.5 text-slate-400 hover:text-danger rounded hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 select-none">
                  <Badge variant={
                    inv.status === 'paid' ? 'success' :
                    inv.status === 'overdue' ? 'danger' : 'gold'
                  }>
                    {inv.status}
                  </Badge>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold font-mono uppercase tracking-wider">
                    <Calendar size={11} />
                    Due by: {new Date(inv.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-3 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                <span>
                  Quote Ref: {inv.quoteId?.invoiceNumber || inv.quoteId?.title || 'None'}
                </span>
                <span className="text-sm text-ink">
                  {fmt(inv.total || 0)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs overflow-y-auto" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-2xl rounded-modal border border-line bg-white shadow-modal my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-[#FAF9F6] px-6 py-4">
              <h3 className="text-base font-display font-black text-ink uppercase tracking-tight">
                {editing ? 'Modify Invoice Configurations' : 'Billing: Invoice Creation'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Invoice Number *"
                  id="invNumber"
                  placeholder="e.g. INV-9001"
                  required
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                />
                <Input
                  label="Due Date *"
                  id="invDue"
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Bill-to Account (Company) *"
                  id="invCompany"
                  required
                  placeholder="Choose organization..."
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  options={companies.map(c => ({ value: c._id, label: c.name }))}
                />
                <Select
                  label="Reference Quote (Optional)"
                  id="invQuote"
                  placeholder="Choose quote..."
                  value={form.quoteId}
                  onChange={(e) => setForm({ ...form, quoteId: e.target.value })}
                  options={quotes.filter(q => q.companyId?._id === form.companyId || q.companyId === form.companyId).map(q => ({ value: q._id, label: `${q.title} (${fmt(q.total)})` }))}
                />
              </div>

              <Select
                label="Invoice Status"
                id="invStatus"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'overdue', label: 'Overdue' }
                ]}
              />

              {/* Line Items Builder Section */}
              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider">Invoice Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-[10px] font-bold text-gold hover:underline uppercase tracking-wider font-mono"
                  >
                    <PlusCircle size={13} />
                    Add Product Line
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-end">
                      <div className="flex-grow">
                        <Select
                          label="Product SKU"
                          id={`inv_prod_${idx}`}
                          required
                          placeholder="Select product..."
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          options={products.map(p => ({ value: p._id, label: `${p.name} (${fmt(p.price)})` }))}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          label="Qty"
                          id={`inv_qty_${idx}`}
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          label="Unit Price"
                          id={`inv_price_${idx}`}
                          type="number"
                          required
                          min={0}
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={form.items.length === 1}
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-3 border border-line text-slate-400 hover:text-danger rounded-input disabled:opacity-30 h-[38px] flex items-center justify-center shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#FAF9F6] p-4 rounded-card border border-line mt-6 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Gross Invoice Total</span>
                <span className="text-sm text-ink">{fmt(calculateFormTotal())}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable document view Overlay */}
      {showPreviewModal && previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4 backdrop-blur-xs overflow-y-auto" onClick={() => setShowPreviewModal(false)}>
          <div
            className="w-full max-w-2xl bg-white border border-line text-ink rounded-modal shadow-modal p-8 overflow-hidden relative print:p-0 my-8 print:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Controls */}
            <div className="absolute right-6 top-6 flex items-center gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF9F6] hover:bg-gold-soft text-ink rounded-btn text-xs font-bold transition-all border border-line"
              >
                <Printer size={13} />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 bg-[#FAF9F6] hover:bg-gold-soft border border-line text-ink rounded-btn"
              >
                <X size={14} />
              </button>
            </div>

            {/* Document Treatment Header */}
            <div className="flex justify-between items-start border-b border-line pb-6 mt-6 print:mt-0 font-sans">
              <div>
                <h1 className="text-xl font-display font-black tracking-tight text-ink uppercase">COMMERCIAL INVOICE</h1>
                <p className="text-[10px] text-slate-500 mt-1 font-mono font-bold">INVOICE ID: #{previewInvoice.invoiceNumber}</p>
              </div>
              <div className="text-right text-[11px] space-y-1 font-mono font-bold text-slate-500 uppercase tracking-wide">
                <h3 className="text-ink font-display font-black text-xs">Walk the Plan CRM</h3>
                <p>Finance & Collections Department</p>
                <p>Date: {new Date(previewInvoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-8 my-6 text-xs font-sans">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono text-[9px]">Billed To:</h4>
                <p className="font-bold text-ink">{previewInvoice.companyId?.name}</p>
                {previewInvoice.companyId?.phone && <p className="text-slate-500 mt-0.5">{previewInvoice.companyId.phone}</p>}
                {previewInvoice.companyId?.address && <p className="text-slate-500 mt-0.5">{previewInvoice.companyId.address}</p>}
              </div>

              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono text-[9px]">Payment Details:</h4>
                <div className="space-y-1 text-slate-500 font-medium">
                  <p>Due Date: <span className="font-mono font-bold text-ink">{new Date(previewInvoice.dueDate).toLocaleDateString()}</span></p>
                  <p>Status: <span className="font-bold uppercase text-gold">{previewInvoice.status}</span></p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-xs text-left border-collapse my-6 font-sans">
              <thead>
                <tr className="border-b border-line bg-[#FAF9F6] text-slate-500 uppercase font-mono font-bold text-[9px]">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {previewInvoice.items?.map((item, idx) => (
                  <tr key={idx} className="text-ink">
                    <td className="py-3 px-3">
                      <p className="font-bold">{item.productId?.name || 'Product Item'}</p>
                      {item.productId?.sku && <p className="text-[10px] text-slate-550 font-mono mt-0.5">SKU: {item.productId.sku}</p>}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{fmt(item.price)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-ink">{fmt(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary with Thin Gold Rule */}
            <div className="flex justify-end pt-6">
              <div className="w-64 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">
                  <span>Gross Invoice Total:</span>
                  <span>{fmt(previewInvoice.total)}</span>
                </div>
                
                {/* Thin gold rule above total */}
                <div className="w-full h-px bg-gold my-2"></div>
                
                <div className="flex justify-between pt-2 text-xs font-bold uppercase tracking-wider font-mono text-ink bg-[#FAF9F6] p-2.5 rounded-btn border border-line">
                  <span>Amount Due (INR):</span>
                  <span className="font-extrabold">{fmt(previewInvoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="border-t border-line pt-6 mt-8 text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider leading-relaxed">
              <h4 className="text-slate-600 font-display font-black text-[10px] mb-1">Standard Payment Terms</h4>
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
export { Invoices };
