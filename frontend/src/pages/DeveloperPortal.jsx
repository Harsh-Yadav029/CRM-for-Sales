import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2, Plus, Trash2, Key, Code, Copy, Check, Eye, EyeOff, BookOpen, Terminal } from 'lucide-react';
import RoleGate from '../components/RoleGate';

const DeveloperPortal = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [revealId, setRevealId] = useState(null);

  const fetchKeys = async () => {
    try {
      const { data } = await api.get('/api/apikeys');
      setKeys(data);
    } catch (e) {
      console.error('Error fetching API keys:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!keyName.trim() || genLoading) return;

    setGenLoading(true);
    try {
      const { data } = await api.post('/api/apikeys', { name: keyName });
      setKeys(prev => [data, ...prev]);
      setKeyName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate API Key');
    } finally {
      setGenLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;

    try {
      await api.delete(`/api/apikeys/${id}`);
      setKeys(prev => prev.filter(k => k._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke API key');
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const curlSnippet = (keyStr = 'YOUR_API_KEY') => `curl -X GET \\
  -H "Authorization: Bearer ${keyStr}" \\
  "https://api.walktheplan.crm/api/v1/leads"`;

  const nodeSnippet = (keyStr = 'YOUR_API_KEY') => `fetch('https://api.walktheplan.crm/api/v1/leads', {
  headers: {
    'Authorization': 'Bearer ${keyStr}'
  }
})
.then(res => res.json())
.then(data => console.log(data));`;

  return (
    <RoleGate allow={['admin']}>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
        <div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">Developer Center</h2>
          <p className="text-xs text-on-surface-variant">Manage tenant-scoped API keys and test programmatic webhook calls</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Key Management Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Generate Key */}
            <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-4 w-4 text-primary" />
                API Credentials
              </h3>

              <form onSubmit={handleGenerate} className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Sales webhook connector"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={genLoading || !keyName.trim()}
                  className="px-4 py-2 bg-gold hover:brightness-105 text-[#111111] text-xs font-bold rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 shrink-0"
                >
                  {genLoading && <Loader2 className="animate-spin" size={13} />}
                  Generate Key
                </button>
              </form>
            </div>

            {/* Keys Table list */}
            <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : keys.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic text-center py-8">No active API keys found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/50 bg-surface-container-low text-on-surface-variant font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Secret Key</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {keys.map(k => {
                        const isRevealed = revealId === k._id;
                        const isCopied = copiedId === k._id;

                        return (
                          <tr key={k._id} className="text-on-surface">
                            <td className="py-3 px-3">
                              <p className="font-bold text-on-surface">{k.name}</p>
                              <p className="text-[9px] text-on-surface-variant mt-0.5">Created: {new Date(k.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-surface-container px-2 py-1 rounded text-[10px] select-all border border-outline-variant/40">
                                  {isRevealed ? k.key : 'wtp_••••••••••••••••••••••••••••••••'}
                                </span>
                                <button
                                  onClick={() => setRevealId(isRevealed ? null : k._id)}
                                  className="text-on-surface-variant hover:text-on-surface"
                                >
                                  {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                                <button
                                  onClick={() => handleCopy(k.key, k._id)}
                                  className="text-on-surface-variant hover:text-on-surface"
                                >
                                  {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleRevoke(k._id)}
                                className="text-on-surface-variant hover:text-red-600 p-1 rounded"
                                title="Revoke API Key"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quickstart Docs Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Integration Guide
              </h3>

              {/* Snippet cURL */}
              <div className="space-y-2">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase flex items-center gap-1">
                  <Terminal size={11} />
                  Shell / cURL
                </p>
                <div className="relative group">
                  <pre className="bg-surface-container p-3 rounded-xl border border-outline-variant/40 text-[10px] font-mono text-primary overflow-x-auto max-h-36">
                    {curlSnippet(keys[0]?.key)}
                  </pre>
                  <button
                    onClick={() => handleCopy(curlSnippet(keys[0]?.key), 'curl')}
                    className="absolute top-2 right-2 text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedId === 'curl' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Snippet JavaScript */}
              <div className="space-y-2">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase flex items-center gap-1">
                  <Code size={11} />
                  Node.js / Fetch
                </p>
                <div className="relative group">
                  <pre className="bg-surface-container p-3 rounded-xl border border-outline-variant/40 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-36">
                    {nodeSnippet(keys[0]?.key)}
                  </pre>
                  <button
                    onClick={() => handleCopy(nodeSnippet(keys[0]?.key), 'node')}
                    className="absolute top-2 right-2 text-on-surface-variant hover:text-on-surface"
                  >
                    {copiedId === 'node' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};

export default DeveloperPortal;
export { DeveloperPortal };
