import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Layers, Columns, Info } from 'lucide-react';

const DEFAULT_PIPELINES = [
  {
    id: 'software',
    name: 'Software Licensing Pipeline',
    columns: [
      { id: 'discovery', title: 'Discovery / Inquiry', color: 'bg-indigo-500', statuses: ['New', 'Contacted'], defaultDropStatus: 'New' },
      { id: 'proposal', title: 'Proposal & Demo', color: 'bg-gold', statuses: ['Demo Scheduled', 'Proposal Sent'], defaultDropStatus: 'Demo Scheduled' },
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

const PipelineSettings = () => {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('crm_pipelines_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPipelines(parsed);
        if (parsed.length > 0) setSelectedPipelineId(parsed[0].id);
      } catch (_) {
        setPipelines(DEFAULT_PIPELINES);
        setSelectedPipelineId(DEFAULT_PIPELINES[0].id);
      }
    } else {
      setPipelines(DEFAULT_PIPELINES);
      setSelectedPipelineId(DEFAULT_PIPELINES[0].id);
    }
  }, []);

  const handleColumnTitleChange = (pipelineIdx, colIdx, newTitle) => {
    setPipelines(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[pipelineIdx].columns[colIdx].title = newTitle;
      return updated;
    });
  };

  const handleSave = () => {
    localStorage.setItem('crm_pipelines_config', JSON.stringify(pipelines));
    setSuccess('Pipelines configuration saved successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  const activePipelineIdx = pipelines.findIndex(p => p.id === selectedPipelineId);
  const activePipeline = pipelines[activePipelineIdx];

  return (
    <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-6 backdrop-blur-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Pipeline Stages Customizer
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">Configure columns and stages mapping for different pipelines</p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          {success}
        </div>
      )}

      {/* Select Pipeline Switcher */}
      <div className="space-y-2">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Pipeline Config Profile</label>
        <select
          className="w-full max-w-xs rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none"
          value={selectedPipelineId}
          onChange={(e) => setSelectedPipelineId(e.target.value)}
        >
          {pipelines.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Columns Configurations details */}
      {activePipeline && (
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold text-on-surface flex items-center gap-2">
            <Columns className="h-4 w-4 text-on-surface-variant" />
            Columns Configuration
          </h4>

          <div className="space-y-4">
            {activePipeline.columns.map((col, colIdx) => (
              <div key={col.id} className="p-4 bg-black/20 rounded-xl border border-outline-variant/40 space-y-3">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Column Visual Header</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-3 py-1.5 text-xs text-on-surface focus:border-amber-500 focus:outline-none"
                      value={col.title}
                      onChange={(e) => handleColumnTitleChange(activePipelineIdx, colIdx, e.target.value)}
                    />
                  </div>

                  <div className="w-44">
                    <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Visual Marker Color</label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`w-3.5 h-3.5 rounded-full ${col.color}`}></span>
                      <span className="text-[10px] text-on-surface-variant capitalize">{col.id} Column</span>
                    </div>
                  </div>
                </div>

                <div className="rounded bg-white/60 p-2.5 text-[10px] text-on-surface-variant border border-outline-variant/40 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Maps backend status values:{' '}
                    <strong className="text-on-surface font-mono">{col.statuses.join(', ')}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-outline-variant/40">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-[#111111] hover:brightness-105 transition-all shadow-md shadow-amber-500/10"
            >
              <Save size={14} />
              Save Pipeline Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineSettings;
export { DEFAULT_PIPELINES };
