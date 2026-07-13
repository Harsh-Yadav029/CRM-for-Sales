import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import api from '../utils/api';

const EmailComposer = ({ lead, onClose, onSuccess }) => {
  const [form, setForm] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/communication/email', {
        leadId: lead._id,
        subject: form.subject,
        body: form.body
      });
      onSuccess(data.lead);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email. Please check your config.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-2xl border border-outline-variant/50 bg-white shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/40 bg-white/50 px-6 py-4">
          <div>
            <h3 className="text-sm md:text-base font-bold text-on-surface">Email Composer</h3>
            <p className="text-xs text-on-surface-variant">Send message to {lead.name} ({lead.email})</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Follow-up proposal details"
              className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Message Body</label>
            <textarea
              required
              rows={8}
              placeholder="Write your email body here..."
              className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-outline-variant/50 px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-[#111111] hover:brightness-105 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailComposer;
