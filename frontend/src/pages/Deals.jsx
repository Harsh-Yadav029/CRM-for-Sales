import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Calendar, DollarSign, ArrowRightLeft, ShieldAlert } from 'lucide-react';

const STAGE_WEIGHTS = {
  'New': 0.1,
  'Contacted': 0.2,
  'Demo Scheduled': 0.4,
  'Proposal Sent': 0.6,
  'Negotiation': 0.8,
  'Won': 1.0,
  'Lost': 0.0
};

const Deals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  const [pipelines, setPipelines] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState('');

  const fetchLeads = async () => {
    try {
      const { data } = await api.get('/api/leads');
      setLeads(data);
    } catch (e) {
      console.error('Error fetching leads for pipeline:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPipelines = () => {
    const saved = localStorage.getItem('crm_pipelines_config');
    const defaults = [
      {
        id: 'software',
        name: 'Software Licensing Pipeline',
        columns: [
          { id: 'discovery', title: 'Discovery / Inquiry', color: 'bg-indigo-500', statuses: ['New', 'Contacted'], defaultDropStatus: 'New' },
          { id: 'proposal', title: 'Proposal & Demo', color: 'bg-amber-500', statuses: ['Demo Scheduled', 'Proposal Sent'], defaultDropStatus: 'Demo Scheduled' },
          { id: 'closing', title: 'Negotiations & Close', color: 'bg-emerald-500', statuses: ['Negotiation', 'Won', 'Lost'], defaultDropStatus: 'Negotiation' }
        ]
      },
      {
        id: 'consulting',
        name: 'Enterprise Consulting Pipeline',
        columns: [
          { id: 'discovery', title: 'Client Analysis', color: 'bg-blue-500', statuses: ['New', 'Contacted'], defaultDropStatus: 'Contacted' },
          { id: 'proposal', title: 'Solution SLA Proposal', color: 'bg-purple-500', statuses: ['Demo Scheduled', 'Proposal Sent', 'Negotiation'], defaultDropStatus: 'Proposal Sent' },
          { id: 'closing', title: 'Final Contract Close', color: 'bg-emerald-500', statuses: ['Won', 'Lost'], defaultDropStatus: 'Won' }
        ]
      }
    ];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPipelines(parsed);
        if (parsed.length > 0) setActivePipelineId(parsed[0].id);
      } catch (_) {
        setPipelines(defaults);
        setActivePipelineId(defaults[0].id);
      }
    } else {
      setPipelines(defaults);
      setActivePipelineId(defaults[0].id);
    }
  };

  useEffect(() => {
    fetchLeads();
    loadPipelines();
  }, []);

  const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
  const stageColumns = activePipeline ? activePipeline.columns : [];

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    const column = stageColumns.find(c => c.id === columnId);
    if (!column) return;

    // Check if lead is already in this column
    const lead = leads.find(l => l._id === leadId);
    if (lead && column.statuses.includes(lead.status)) {
      return;
    }

    await moveLead(leadId, column.defaultDropStatus);
  };

  const moveLead = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      await api.put(`/api/leads/${leadId}/status`, { status: newStatus });
      // Update local state
      setLeads(prevLeads =>
        prevLeads.map(l => (l._id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating deal stage');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // Calculate pipeline stats
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.expectedRevenue || 0), 0);
  const weightedValue = leads.reduce((acc, l) => acc + (l.expectedRevenue || 0) * (STAGE_WEIGHTS[l.status] || 0), 0);
  const activeDeals = leads.filter(l => l.status !== 'Lost' && l.status !== 'Won').length;

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      {/* Dashboard Header / Metrics */}
      <section className="bg-slate-900/60 backdrop-blur-md px-6 py-6 border-b border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 max-w-7xl mx-auto">
          <div>
            <span className="text-[10px] font-bold uppercase text-primary tracking-widest block mb-1">Deal Pipeline</span>
            <h2 className="text-xl md:text-2xl uppercase font-black text-on-surface leading-tight">Current Portfolio</h2>
            
            {/* Pipeline Selector Switcher */}
            {pipelines.length > 0 && (
              <div className="flex items-center gap-2 mt-4 bg-slate-950/40 p-1 rounded-xl border border-slate-800 max-w-xs">
                {pipelines.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePipelineId(p.id)}
                    className={`flex-1 text-center py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all tracking-wider ${
                      activePipelineId === p.id 
                        ? 'bg-primary text-white shadow' 
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4 flex flex-col items-end min-w-[240px] shadow-lg">
            <span className="text-[10px] font-bold uppercase text-on-surface-variant mb-0.5">Total Pipeline Value</span>
            <span className="text-xl text-primary font-black tracking-tight">{fmt(totalPipelineValue)}</span>
          </div>
        </div>
      </section>

      {/* Kanban Board Area */}
      <main className="flex-1 overflow-x-auto p-4 md:p-6 bg-slate-950/20 custom-scroll">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {stageColumns.map(column => {
            const columnLeads = leads.filter(l => column.statuses.includes(l.status));
            const columnValue = columnLeads.reduce((acc, l) => acc + (l.expectedRevenue || 0), 0);

            return (
              <div
                key={column.id}
                className="flex flex-col w-[300px] md:w-[320px] shrink-0 p-1"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2 shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${column.color}`}></span>
                    {column.title}
                  </h3>
                  <span className="text-[10px] font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-on-surface-variant uppercase">
                    {columnLeads.length} {columnLeads.length === 1 ? 'Deal' : 'Deals'} ({fmt(columnValue)})
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scroll">
                  {columnLeads.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-on-surface-variant/65 italic bg-slate-900/20">
                      Drag deals here
                    </div>
                  ) : (
                    columnLeads.map(lead => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        className={`bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-5 rounded-2xl transition-all hover:border-slate-700 hover:shadow-xl group relative overflow-hidden cursor-grab active:cursor-grabbing ${updatingId === lead._id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-bold bg-primary/20 text-primary border border-primary/25 px-2 py-0.5 rounded-lg uppercase tracking-tighter">
                              {lead.status}
                            </span>
                            <div className="flex items-center gap-1">
                              {column.id !== 'discovery' && (
                                <button
                                  onClick={() => {
                                    const prevColIdx = stageColumns.findIndex(c => c.id === column.id) - 1;
                                    if (prevColIdx >= 0) moveLead(lead._id, stageColumns[prevColIdx].defaultDropStatus);
                                  }}
                                  title="Move Left"
                                  className="p-0.5 hover:bg-slate-800 rounded text-on-surface-variant hover:text-primary transition-all"
                                >
                                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                                </button>
                              )}
                              {column.id !== 'closing' && (
                                <button
                                  onClick={() => {
                                    const nextColIdx = stageColumns.findIndex(c => c.id === column.id) + 1;
                                    if (nextColIdx < stageColumns.length) moveLead(lead._id, stageColumns[nextColIdx].defaultDropStatus);
                                  }}
                                  title="Move Right"
                                  className="p-0.5 hover:bg-slate-800 rounded text-on-surface-variant hover:text-primary transition-all"
                                >
                                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className="font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors truncate">
                            <Link to={`/leads/${lead._id}`}>{lead.company}</Link>
                          </h4>
                          <p className="text-xs text-on-surface-variant truncate font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person</span> {lead.name}
                          </p>

                          <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-850">
                            <div>
                              <p className="text-[9px] font-bold uppercase text-slate-500 mb-0.5">Expected Value</p>
                              <p className="text-sm text-primary font-black">{fmt(lead.expectedRevenue)}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center font-bold text-[9px] text-primary">
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Deals;
