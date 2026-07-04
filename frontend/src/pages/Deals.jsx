import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Calendar, DollarSign, ArrowRightLeft, ShieldAlert } from 'lucide-react';

const STAGE_COLUMNS = [
  { id: 'discovery', title: 'Discovery', color: 'bg-primary', statuses: ['New', 'Contacted', 'Demo Scheduled'], defaultDropStatus: 'Contacted' },
  { id: 'proposal', title: 'Proposal', color: 'bg-tertiary', statuses: ['Proposal Sent'], defaultDropStatus: 'Proposal Sent' },
  { id: 'negotiation', title: 'Negotiation', color: 'bg-secondary', statuses: ['Negotiation'], defaultDropStatus: 'Negotiation' },
  { id: 'closed', title: 'Closed', color: 'bg-on-surface-variant', statuses: ['Won', 'Lost'], defaultDropStatus: 'Won' }
];

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

  useEffect(() => {
    fetchLeads();
  }, []);

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

    const column = STAGE_COLUMNS.find(c => c.id === columnId);
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
      {/* Pipeline Summary Bar */}
      <section className="bg-surface-container-lowest px-6 py-4 border-b border-outline-variant shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-md max-w-7xl mx-auto">
          <div className="flex flex-col">
            <span className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Pipeline Value</span>
            <span className="font-headline-lg text-2xl md:text-3xl font-extrabold text-primary">{fmt(totalPipelineValue)}</span>
          </div>
          <div className="flex gap-lg">
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-xs text-on-surface-variant">Weighted Value</span>
              <span className="font-title-lg text-base md:text-lg font-bold text-on-surface">{fmt(weightedValue)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-xs text-on-surface-variant">Active Deals</span>
              <span className="font-title-lg text-base md:text-lg font-bold text-on-surface">{activeDeals}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Kanban Board Area */}
      <main className="flex-1 overflow-x-auto p-4 md:p-6 bg-surface-container-low custom-scroll">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {STAGE_COLUMNS.map(column => {
            const columnLeads = leads.filter(l => column.statuses.includes(l.status));
            const columnValue = columnLeads.reduce((acc, l) => acc + (l.expectedRevenue || 0), 0);

            return (
              <div
                key={column.id}
                className="flex flex-col w-[300px] md:w-[320px] shrink-0 bg-surface-container-lowest/50 rounded-xl border border-outline-variant p-3"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 pb-3 border-b border-outline-variant mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.color}`}></span>
                    <h2 className="font-bold text-on-surface text-sm md:text-base">{column.title}</h2>
                    <span className="text-xs bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant font-bold">
                      {columnLeads.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant">{fmt(columnValue)}</span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scroll">
                  {columnLeads.length === 0 ? (
                    <div className="h-28 border border-dashed border-outline-variant rounded-xl flex items-center justify-center text-xs text-on-surface-variant/60 italic">
                      Drag deals here
                    </div>
                  ) : (
                    columnLeads.map(lead => (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        className={`bg-white p-4 border border-outline-variant rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-grab active:cursor-grabbing relative group ${updatingId === lead._id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-on-surface text-sm leading-snug group-hover:text-primary transition-colors pr-4 truncate">
                              <Link to={`/leads/${lead._id}`}>{lead.company}</Link>
                            </h3>
                            {column.id === 'closed' && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.status === 'Won' ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                                {lead.status}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-on-surface-variant truncate">{lead.name}</p>
                          <span className="font-bold text-primary text-base mt-1">{fmt(lead.expectedRevenue)}</span>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/60">
                            <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              <span>{lead.source}</span>
                            </div>
                            
                            {/* Fast stage actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {column.id !== 'discovery' && (
                                <button
                                  onClick={() => moveLead(lead._id, column.id === 'proposal' ? 'Contacted' : column.id === 'negotiation' ? 'Proposal Sent' : 'Negotiation')}
                                  title="Move Left"
                                  className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-all"
                                >
                                  <span className="material-symbols-outlined text-xs">arrow_back</span>
                                </button>
                              )}
                              {column.id !== 'closed' && (
                                <button
                                  onClick={() => moveLead(lead._id, column.id === 'discovery' ? 'Proposal Sent' : column.id === 'proposal' ? 'Negotiation' : 'Won')}
                                  title="Move Right"
                                  className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-all"
                                >
                                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </button>
                              )}
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
