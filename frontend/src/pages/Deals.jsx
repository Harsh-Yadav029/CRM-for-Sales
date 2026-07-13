import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, Calendar, MoreVertical, Clock } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  
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
        name: 'Enterprise Opportunities',
        columns: [
          { id: 'qualified', title: 'QUALIFIED LEADS', topBorder: 'border-t-[3px] border-indigo-400', statuses: ['New'], defaultDropStatus: 'New' },
          { id: 'contacted', title: 'CONTACTED', topBorder: 'border-t-[3px] border-slate-400', statuses: ['Contacted', 'Demo Scheduled'], defaultDropStatus: 'Contacted' },
          { id: 'proposal', title: 'PROPOSAL MADE', topBorder: 'border-t-[3px] border-[#705d00]', statuses: ['Proposal Sent', 'Negotiation', 'Won'], defaultDropStatus: 'Proposal Sent' }
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
      setLeads(prevLeads =>
        prevLeads.map(l => (l._id === leadId ? { ...l, status: newStatus } : l))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating deal stage');
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityTag = (revenue) => {
    if (revenue >= 80000) return { label: 'HIGH', class: 'bg-red-50 text-red-500 font-bold text-[9px] px-2 py-0.5 rounded-full' };
    if (revenue >= 35000) return { label: 'MEDIUM', class: 'bg-slate-100 text-slate-500 font-bold text-[9px] px-2 py-0.5 rounded-full' };
    return { label: 'LOW', class: 'bg-blue-50 text-blue-500 font-bold text-[9px] px-2 py-0.5 rounded-full' };
  };

  const getDaysInStage = (updatedAt) => {
    const diff = Math.floor((new Date() - new Date(updatedAt)) / (1000 * 60 * 60 * 24));
    return `${diff || 1} days in stage`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const fmt = (v) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(v);

  // Filter leads based on simple search
  const filteredLeads = leads.filter(l => 
    l.company.toLowerCase().includes(search.toLowerCase()) ||
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fafafa] font-sans">
      {/* Top Header Search Bar */}
      <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
        <div className="relative w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="w-full bg-[#f4f4f5] pl-10 pr-4 py-2 rounded-full text-xs font-medium placeholder:text-slate-400 border-none focus:ring-1 focus:ring-gold/30 focus:outline-none"
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 py-6">
        {/* Breadcrumbs & Title */}
        <div className="mb-6 shrink-0">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span>Sales</span>
            <span className="text-slate-350">/</span>
            <span className="text-slate-500 font-semibold">Opportunities</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight font-sans">Deal Pipeline</h2>
        </div>

        {/* Board Columns Canvas */}
        <main className="flex-1 overflow-x-auto custom-scroll">
          <div className="flex gap-6 h-full min-w-max pb-4">
            {stageColumns.map(column => {
              const columnLeads = filteredLeads.filter(l => column.statuses.includes(l.status));
              const columnValue = columnLeads.reduce((acc, l) => acc + (l.expectedRevenue || 0), 0);

              return (
                <div
                  key={column.id}
                  className="flex flex-col w-[340px] shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header Card */}
                  <div className={`bg-white rounded-xl border border-slate-100 ${column.topBorder} p-4 shadow-sm mb-4 shrink-0`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-900 tracking-wider font-sans uppercase">
                        {column.title}
                      </span>
                      <span className="text-[10px] font-bold bg-[#f1f1f2] text-slate-700 w-5 h-5 rounded flex items-center justify-center font-label">
                        {columnLeads.length}
                      </span>
                    </div>
                    <div className="text-lg font-extrabold text-slate-900 mt-2 tracking-tight">
                      {fmt(columnValue)}
                    </div>
                    
                    {/* Add Deal Button */}
                    <button
                      onClick={() => navigate('/leads')}
                      className="w-full mt-3 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>+ Add Deal</span>
                    </button>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scroll pb-6">
                    {columnLeads.map(lead => {
                      const priority = getPriorityTag(lead.expectedRevenue);
                      return (
                        <div
                          key={lead._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id)}
                          className={`bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group relative ${updatingId === lead._id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className={priority.class}>{priority.label}</span>
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreVertical size={14} />
                            </button>
                          </div>

                          <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug group-hover:text-primary transition-colors">
                            <Link to={`/leads/${lead._id}`}>{lead.company}</Link>
                          </h4>
                          <p className="text-[11px] text-slate-400 font-semibold mt-1">
                            {lead.name}
                          </p>

                          <div className="h-px bg-slate-100 my-4"></div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight">{fmt(lead.expectedRevenue)}</p>
                              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Clock size={10} className="text-slate-400" />
                                <span>{getDaysInStage(lead.updatedAt)}</span>
                              </p>
                            </div>
                            
                            <div className="w-7 h-7 rounded-full border border-slate-100 bg-[#f4f4f5] flex items-center justify-center font-bold text-[10px] text-slate-600 shadow-sm overflow-hidden">
                              {lead.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Deals;
