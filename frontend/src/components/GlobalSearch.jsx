import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Loader2, FileText, Building, User, CornerDownLeft, X } from 'lucide-react';

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ leads: [], companies: [], contacts: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Flatten results for keyboard navigation index mappings
  const flatResults = [
    ...results.leads.map(l => ({ ...l, type: 'lead', path: `/leads/${l._id}`, label: `${l.name} (${l.company})` })),
    ...results.companies.map(c => ({ ...c, type: 'company', path: '/accounts', label: c.name })),
    ...results.contacts.map(co => ({ ...co, type: 'contact', path: '/contacts', label: `${co.firstName} ${co.lastName} (${co.title || 'Rep'})` }))
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ leads: [], companies: [], contacts: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ leads: [], companies: [], contacts: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const [leadRes, compRes, contRes] = await Promise.all([
          api.get('/api/leads', { params: { search: query } }),
          api.get('/api/companies', { params: { search: query } }),
          api.get('/api/contacts', { params: { search: query } })
        ]);

        setResults({
          leads: leadRes.data.slice(0, 4),
          companies: compRes.data.slice(0, 4),
          contacts: contRes.data.slice(0, 4)
        });
        setSelectedIndex(0);
      } catch (err) {
        console.error('Error querying global search data:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, flatResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          navigate(flatResults[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-16 md:pt-28 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl border border-outline-variant/50 bg-white shadow-card overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input field bar */}
        <div className="relative border-b border-outline-variant/40 bg-white/50 p-4 flex items-center gap-3">
          <Search size={18} className="text-on-surface-variant shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search leads, accounts, contacts..."
            className="w-full bg-transparent text-sm text-on-surface placeholder-slate-500 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <Loader2 className="animate-spin text-primary shrink-0" size={16} />
          ) : (
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
          {query.trim() === '' ? (
            <div className="text-center py-8 text-on-surface-variant text-xs">
              Type to start searching...
            </div>
          ) : flatResults.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-xs">
              No matching records found.
            </div>
          ) : (
            <div className="space-y-1">
              {flatResults.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                
                return (
                  <div
                    key={`${item.type}-${item._id}`}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-gold/10 border-amber-500/35 text-on-surface'
                        : 'border-transparent text-on-surface hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.type === 'lead' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <FileText size={14} />
                        </div>
                      )}
                      {item.type === 'company' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Building size={14} />
                        </div>
                      )}
                      {item.type === 'contact' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-primary border border-amber-500/20">
                          <User size={14} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{item.label}</p>
                        <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">{item.type}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[9px] text-primary font-bold flex items-center gap-1">
                        <CornerDownLeft size={10} />
                        Enter
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="border-t border-outline-variant/40 bg-surface-container/80 px-4 py-2 flex justify-between text-[9px] text-on-surface-variant font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
export { GlobalSearch };
