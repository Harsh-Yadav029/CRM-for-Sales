import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Shield, Search, Eye, EyeOff, Loader2, RefreshCw, Filter } from 'lucide-react';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/audits');
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction ? log.action?.toLowerCase() === filterAction.toLowerCase() : true;
    const matchesResource = filterResource ? log.resourceType?.toLowerCase() === filterResource.toLowerCase() : true;
    return matchesAction && matchesResource;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            Security & Audit Activity Logs
          </h3>
          <p className="text-xs text-slate-400 mt-1">Audit log records documenting write modifications across all database collections</p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Dues
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Filter size={13} />
          <span>Filters:</span>
        </div>

        <select
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-white focus:outline-none"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">All Action Types</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>

        <select
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-white focus:outline-none"
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
        >
          <option value="">All Module Collections</option>
          <option value="lead">Lead</option>
          <option value="company">Company</option>
          <option value="quote">Quote</option>
          <option value="invoice">Invoice</option>
        </select>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-8 text-center border border-dashed border-slate-800 rounded-xl">
          No security audit logs found matching selected criteria.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const isExpanded = expandedLogId === log._id;
            
            return (
              <div
                key={log._id}
                className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3 transition-all hover:border-slate-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action badge */}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      log.action?.toLowerCase() === 'delete' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      log.action?.toLowerCase() === 'create' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {log.action}
                    </span>

                    {/* Resource tag */}
                    <span className="text-[11px] font-bold text-slate-200">
                      {log.resourceType} Record
                    </span>

                    {/* Changed By user */}
                    <span className="text-slate-500 text-[10px]">
                      by {log.changedBy?.email || log.changedBy?.name || 'System User'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>

                    <button
                      onClick={() => toggleExpand(log._id)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] font-semibold"
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff size={11} />
                          Hide Diff
                        </>
                      ) : (
                        <>
                          <Eye size={11} />
                          View Diff
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-900/60 text-[10px] font-mono">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-850">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Previous State (Old Value)</p>
                      <pre className="text-red-400 overflow-x-auto whitespace-pre-wrap max-h-40">
                        {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : 'null (None)'}
                      </pre>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-850">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">New State (New Value)</p>
                      <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-40">
                        {log.newValue ? JSON.stringify(log.newValue, null, 2) : 'null (Deleted)'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;
