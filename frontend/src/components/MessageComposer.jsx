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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-850 bg-slate-900/50 px-6 py-4">
          <div>
            <h3 className="text-sm font-bold text-white">SMS/WhatsApp Composer</h3>
            <p className="text-xs text-slate-400">Message to {lead.name} ({lead.phone})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Message Content</label>
            <textarea
              required
              rows={4}
              maxLength={160}
              placeholder="Type message contents (max 160 chars)..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="text-right text-[10px] text-slate-500 mt-1">
              {message.length}/160 characters
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
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
