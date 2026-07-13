import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Plus, Trash2, Edit2, X, Loader2, FileText, Calendar, PlusCircle, Printer } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const Quotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: '',
    companyId: '',
    contactId: '',
    validUntil: '',
    status: 'draft',
    items: []
  });

  const fetchQuotes = async () => {
    try {
      const { data } = await api.get('/api/quotes');
      setQuotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [compRes, contRes, prodRes] = await Promise.all([
        api.get('/api/companies'),
        api.get('/api/contacts'),
        api.get('/api/products')
      ]);
      setCompanies(compRes.data);
      setContacts(contRes.data);
      setProducts(prodRes.data.filter(p => p.isActive));
    } catch (_) {}
  };

  useEffect(() => {
    fetchQuotes();
    fetchSupportingData();
  }, []);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      companyId: '',
      contactId: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days default
      status: 'draft',
      items: [{ productId: '', quantity: 1, price: 0 }]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (quote) => {
    setEditing(quote._id);
    setForm({
      title: quote.title || '',
      companyId: quote.companyId?._id || quote.companyId || '',
      contactId: quote.contactId?._id || quote.contactId || '',
      validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
      status: quote.status || 'draft',
      items: quote.items.map(item => ({
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
    if (!window.confirm('Are you sure you want to delete this Quote?')) return;
    try {
      await api.delete(`/api/quotes/${id}`);
      setQuotes(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete quote');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.companyId || form.items.some(item => !item.productId)) {
      alert('Please fill out all mandatory quote fields and select products.');
      return;
    }

    try {
      if (editing) {
        const { data } = await api.put(`/api/quotes/${editing}`, form);
        setQuotes(prev => prev.map(q => q._id === editing ? data : q));
      } else {
        const { data } = await api.post('/api/quotes', form);
        setQuotes(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save quote');
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Estimates & Bids</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Quotes & Proposals</h2>
          <p className="text-xs text-slate-500 mt-1">Generate pricing estimates and business proposals</p>
        </div>

        <Button onClick={handleOpenCreate} icon={Plus}>
          New Quotation
        </Button>
      </div>

      {/* List Grid View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          title="No quotes generated yet"
          description="Create client quotes by adding service line items."
          action={
            <Button onClick={handleOpenCreate} icon={Plus}>
              Create First Quote
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quotes.map((q) => (
            <Card
              key={q._id}
              variant="flat"
              className="p-6 bg-white hover:border-gold/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-display font-black text-ink uppercase tracking-tight leading-snug">{q.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                      Account: {q.companyId?.name || 'Linked Account'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setPreviewQuote(q);
                        setShowPreviewModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-ink rounded hover:bg-gold-soft transition-all"
                      title="Preview Quote"
                    >
                      <Printer size={13} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-ink rounded hover:bg-gold-soft transition-all"
                    >
                      <Edit2 size={13} />
                    </button>
                    <RoleGate allow={['admin', 'manager']}>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="p-1.5 text-slate-400 hover:text-danger rounded hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </RoleGate>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 select-none">
                  <Badge variant={
                    q.status === 'accepted' ? 'success' :
                    q.status === 'declined' ? 'danger' :
                    q.status === 'sent' ? 'gold' : 'neutral'
                  }>
                    {q.status}
                  </Badge>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold font-mono uppercase tracking-wider">
                    <Calendar size={11} />
                    Valid till: {new Date(q.validUntil).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-line pt-3 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                <span>
                  {q.items?.length || 0} line items
                </span>
                <span className="text-sm text-ink">
                  {fmt(q.total || 0)}
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
                {editing ? 'Modify Quotation Details' : 'Configure New Quotation'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scroll font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Proposal / Quote Title *"
                  id="quoteTitle"
                  placeholder="e.g. Enterprise License Deal"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <Input
                  label="Proposal Validity Date *"
                  id="quoteValid"
                  type="date"
                  required
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Select Account (Company) *"
                  id="quoteCompany"
                  required
                  placeholder="Choose organization..."
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  options={companies.map(c => ({ value: c._id, label: c.name }))}
                />
                <Select
                  label="Primary Contact (Optional)"
                  id="quoteContact"
                  placeholder="Choose contact..."
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  options={contacts.filter(c => c.companyId?._id === form.companyId || c.companyId === form.companyId).map(c => ({ value: c._id, label: `${c.firstName} ${c.lastName}` }))}
                />
              </div>

              <Select
                label="Quote Status"
                id="quoteStatus"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'declined', label: 'Declined' }
                ]}
              />

              {/* Line Items Builder Section */}
              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider">Line Items Configuration</h4>
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
                          id={`prod_${idx}`}
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
                          id={`qty_${idx}`}
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
                          id={`price_${idx}`}
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
                <span>Estimated Total</span>
                <span className="text-sm text-ink">{fmt(calculateFormTotal())}</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Proposal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quote Printable document view Overlay */}
      {showPreviewModal && previewQuote && (
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
                <h1 className="text-xl font-display font-black tracking-tight text-ink uppercase">QUOTATION PROPOSAL</h1>
                <p className="text-[10px] text-slate-500 mt-1 font-mono font-bold">REFERENCE ID: #{previewQuote._id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right text-[11px] space-y-1 font-mono font-bold text-slate-500 uppercase tracking-wide">
                <h3 className="text-ink font-display font-black text-xs">Walk the Plan CRM</h3>
                <p>Corporate Sales Division</p>
                <p>Date: {new Date(previewQuote.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-8 my-6 text-xs font-sans">
              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono text-[9px]">Prepared For:</h4>
                <p className="font-bold text-ink">{previewQuote.companyId?.name}</p>
                {previewQuote.companyId?.phone && <p className="text-slate-500 mt-0.5">{previewQuote.companyId.phone}</p>}
                {previewQuote.companyId?.address && <p className="text-slate-500 mt-0.5">{previewQuote.companyId.address}</p>}
              </div>

              <div>
                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono text-[9px]">Quotation Details:</h4>
                <div className="space-y-1 text-slate-500 font-medium">
                  <p>Title: <span className="font-bold text-ink">{previewQuote.title}</span></p>
                  <p>Validity: <span className="font-mono font-bold text-ink">{new Date(previewQuote.validUntil).toLocaleDateString()}</span></p>
                  <p>Status: <span className="font-bold uppercase text-gold">{previewQuote.status}</span></p>
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
                {previewQuote.items?.map((item, idx) => (
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
                  <span>Gross Estimation:</span>
                  <span>{fmt(previewQuote.total)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold uppercase tracking-wider font-mono text-[10px]">
                  <span>Tax (0% GST):</span>
                  <span>{fmt(0)}</span>
                </div>
                
                {/* Thin gold rule above total */}
                <div className="w-full h-px bg-gold my-2"></div>
                
                <div className="flex justify-between pt-2 text-xs font-bold uppercase tracking-wider font-mono text-ink bg-[#FAF9F6] p-2.5 rounded-btn border border-line">
                  <span>Quote Total:</span>
                  <span className="font-extrabold">{fmt(previewQuote.total)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="border-t border-line pt-6 mt-8 text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider leading-relaxed">
              <h4 className="text-slate-600 font-display font-black text-[10px] mb-1">Terms & Conditions</h4>
              <p>1. This pricing quotation proposal is valid strictly until the date shown above.</p>
              <p>2. Subject to active client license activation agreements and services scope sheets.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
export { Quotes };
