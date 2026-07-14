import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Send, X, Bot, Sparkles, MessageSquare } from 'lucide-react';

const AIChatDrawer = ({ isOpen, onClose, leadId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I am Compass, your AI Sales Assistant. Ask me to 'summarize' lead timeline feedback, 'draft an email' pitch, or suggest recommendations." }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = { sender: 'user', text: message };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const payload = { message: userMsg.text };
      if (leadId) payload.leadId = leadId;

      const { data } = await api.post('/api/ai/chat', payload);
      setMessages(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error communicating with the generative sales assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-outline-variant/50 bg-white shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 bg-white/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/10 text-primary border border-amber-500/20">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1">
              Compass Assistant
              <Sparkles size={11} className="text-primary fill-amber-500" />
            </h3>
            <p className="text-[9px] text-on-surface-variant">Compass Sales Intelligence</p>
          </div>
        </div>

        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Chat messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="h-6 w-6 rounded-full bg-gold/10 text-primary border border-amber-500/20 flex items-center justify-center shrink-0">
                <Bot size={12} />
              </div>
            )}
            <div
              className={`rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gold text-[#111111] font-medium'
                  : 'bg-surface-container text-on-surface border border-outline-variant/40'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="h-6 w-6 rounded-full bg-gold/10 text-primary border border-amber-500/20 flex items-center justify-center shrink-0">
              <Bot size={12} />
            </div>
            <div className="rounded-2xl p-3 bg-surface-container text-on-surface-variant border border-outline-variant/40 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Footer input form */}
      <form onSubmit={handleSubmit} className="border-t border-outline-variant/40 p-4 bg-surface-container-low">
        <div className="relative flex items-center bg-surface-container rounded-xl border border-outline-variant/40 px-3 py-2">
          <input
            type="text"
            placeholder="Ask Compass..."
            className="w-full bg-transparent text-xs text-on-surface placeholder-slate-600 focus:outline-none pr-8"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="absolute right-2 text-primary hover:text-primary disabled:opacity-30 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatDrawer;
export { AIChatDrawer };
