import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Send, X, Bot, Sparkles, MessageSquare } from 'lucide-react';

const AIChatDrawer = ({ isOpen, onClose, leadId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I am Zia, your AI Sales Assistant. Ask me to 'summarize' lead timeline feedback, 'draft an email' pitch, or suggest recommendations." }
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-slate-800 bg-slate-900 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-850 bg-slate-900/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
              Zia Assistant
              <Sparkles size={11} className="text-amber-500 fill-amber-500" />
            </h3>
            <p className="text-[9px] text-slate-500">Gemini Sales Intelligence</p>
          </div>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
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
              <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Bot size={12} />
              </div>
            )}
            <div
              className={`rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium'
                  : 'bg-slate-950 text-slate-200 border border-slate-850'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Bot size={12} />
            </div>
            <div className="rounded-2xl p-3 bg-slate-950 text-slate-400 border border-slate-850 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Footer input form */}
      <form onSubmit={handleSubmit} className="border-t border-slate-850 p-4 bg-slate-950/40">
        <div className="relative flex items-center bg-slate-950 rounded-xl border border-slate-850 px-3 py-2">
          <input
            type="text"
            placeholder="Ask Zia..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none pr-8"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!message.trim() || loading}
            className="absolute right-2 text-amber-500 hover:text-amber-400 disabled:opacity-30 transition-colors"
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
