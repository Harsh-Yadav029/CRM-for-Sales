import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2, Key, Code, Copy, Check, Eye, EyeOff, BookOpen, Terminal, Trash2 } from 'lucide-react';
import RoleGate from '../components/RoleGate';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';

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
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Developer Operations</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">API Access Keys</h2>
          <p className="text-xs text-slate-500 mt-1">Manage tenant-scoped API keys and test programmatic webhook calls</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Key Management Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Generate Key */}
            <Card variant="raised" className="p-6 bg-white space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-line">
                <Key size={14} className="text-gold" />
                API Credentials
              </h3>

              <form onSubmit={handleGenerate} className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="newKeyName"
                    placeholder="e.g. Sales webhook connector"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                  />
                </div>
                <div className="pt-[18px]">
                  <Button type="submit" loading={genLoading} disabled={!keyName.trim()}>
                    Generate Key
                  </Button>
                </div>
              </form>
            </Card>

            {/* Keys Table list */}
            <Card variant="flat" className="p-6 bg-white">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-gold" size={24} />
                </div>
              ) : keys.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8 font-medium">No active API keys found.</p>
              ) : (
                <Table headers={['Key Identifier', 'Token String', 'Actions']}>
                  {keys.map(k => {
                    const isRevealed = revealId === k._id;
                    const isCopied = copiedId === k._id;

                    return (
                      <tr key={k._id} className="hover:bg-gold-soft/20">
                        <td className="py-3 px-3">
                          <span className="font-bold text-ink block">{k.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-0.5">
                            Created: {new Date(k.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-[#FAF9F6] border border-line px-2 py-1 rounded text-[10px] select-all font-bold text-slate-700">
                              {isRevealed ? k.key : 'wtp_••••••••••••••••••••••••••••••••'}
                            </span>
                            <button
                              onClick={() => setRevealId(isRevealed ? null : k._id)}
                              className="p-1 text-slate-400 hover:text-ink transition-all"
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              onClick={() => handleCopy(k.key, k._id)}
                              className="p-1 text-slate-400 hover:text-ink transition-all"
                            >
                              {isCopied ? <Check size={13} className="text-emerald-500 font-bold" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleRevoke(k._id)}
                              className="p-1.5 text-slate-400 hover:text-danger rounded hover:bg-red-50 transition-all"
                              title="Revoke API Key"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </Table>
              )}
            </Card>
          </div>

          {/* Quickstart Docs Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card variant="raised" className="p-6 bg-white space-y-4">
              <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-line">
                <BookOpen size={14} className="text-gold" />
                Integration Guide
              </h3>

              {/* Snippet cURL */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 font-mono tracking-wider">
                  <Terminal size={11} />
                  Shell / cURL
                </p>
                <div className="relative group select-all">
                  <pre className="bg-[#121212] p-4 rounded-card border border-line text-[10px] font-mono text-gold overflow-x-auto max-h-40 font-bold leading-relaxed">
                    {curlSnippet(keys[0]?.key)}
                  </pre>
                  <button
                    onClick={() => handleCopy(curlSnippet(keys[0]?.key), 'curl')}
                    className="absolute top-3 right-3 text-slate-500 hover:text-gold p-1 bg-white/5 hover:bg-white/10 rounded transition-all"
                  >
                    {copiedId === 'curl' ? <Check size={13} className="text-emerald-400 font-bold" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Snippet JavaScript */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 font-mono tracking-wider">
                  <Code size={11} />
                  Node.js / Fetch
                </p>
                <div className="relative group select-all">
                  <pre className="bg-[#121212] p-4 rounded-card border border-line text-[10px] font-mono text-gold overflow-x-auto max-h-40 font-bold leading-relaxed">
                    {nodeSnippet(keys[0]?.key)}
                  </pre>
                  <button
                    onClick={() => handleCopy(nodeSnippet(keys[0]?.key), 'node')}
                    className="absolute top-3 right-3 text-slate-500 hover:text-gold p-1 bg-white/5 hover:bg-white/10 rounded transition-all"
                  >
                    {copiedId === 'node' ? <Check size={13} className="text-emerald-400 font-bold" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleGate>
  );
};

export default DeveloperPortal;
export { DeveloperPortal };
