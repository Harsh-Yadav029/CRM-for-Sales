import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import api from '../utils/api';

const MessageComposer = ({ lead, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/communication/sms', {
        leadId: lead._id,
        message: message.trim()
      });
      onSuccess(data.lead);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch SMS message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl border border-outline-variant/50 bg-white shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/40 bg-white/50 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface">SMS/WhatsApp Composer</h3>
            <p className="text-xs text-on-surface-variant">Message to {lead.name} ({lead.phone})</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Message Content</label>
            <textarea
              required
              rows={4}
              maxLength={160}
              placeholder="Type message contents (max 160 chars)..."
              className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-right text-[10px] text-on-surface-variant mt-1">
              {message.length}/160 characters
            </div>
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
              disabled={loading || !message.trim()}
              className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-[#111111] hover:brightness-105 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Send SMS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageComposer;
