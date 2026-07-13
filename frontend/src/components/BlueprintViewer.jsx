import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Layers, Plus, Trash2, Save, Play, GitCommit, CheckSquare, Settings, HelpCircle, Loader2 } from 'lucide-react';

const BlueprintViewer = () => {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [blueprints, setBlueprints] = useState([]);
  const [activeBlueprint, setActiveBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New transition form state
  const [newTrans, setNewTrans] = useState({
    name: '',
    fromStage: '',
    toStage: '',
    requiredFields: []
  });

  const availableFieldOptions = [
    { value: 'phone', label: 'Phone Number' },
    { value: 'email', label: 'Email Address' },
    { value: 'expectedRevenue', label: 'Expected Revenue' },
    { value: 'customFields.budget', label: 'Custom Budget Field' },
    { value: 'customFields.notes', label: 'Custom Notes Field' }
  ];

  const fetchBlueprintData = async () => {
    try {
      const [pipeRes, blueRes] = await Promise.all([
        api.get('/api/pipelines'),
        api.get('/api/blueprints')
      ]);

      let loadedPipes = pipeRes.data;
      
      // Seed a default pipeline if none exist
      if (loadedPipes.length === 0) {
        const seedRes = await api.post('/api/pipelines', {
          name: 'Core Enterprise Sales Pipeline',
          stages: ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
          description: 'Default multi-stage sales and consultancy blueprint pipeline'
        });
        loadedPipes = [seedRes.data];
      }

      setPipelines(loadedPipes);
      const activePipe = loadedPipes[0];
      setSelectedPipelineId(activePipe._id);
      setBlueprints(blueRes.data);

      const matchingBlueprint = blueRes.data.find(b => b.pipelineId?._id === activePipe._id || b.pipelineId === activePipe._id);
      if (matchingBlueprint) {
        setActiveBlueprint(matchingBlueprint);
      } else {
        // Prepare local empty blueprint template
        setActiveBlueprint({
          name: `${activePipe.name} Blueprint Guide`,
          pipelineId: activePipe._id,
          transitions: [
            { name: 'Qualify Inquiry', fromStage: 'New', toStage: 'Contacted', requiredFields: ['phone'] },
            { name: 'Deliver Pitch Demo', fromStage: 'Contacted', toStage: 'Demo Scheduled', requiredFields: ['email'] },
            { name: 'Propose Quotation', fromStage: 'Demo Scheduled', toStage: 'Proposal Sent', requiredFields: ['expectedRevenue'] }
          ],
          isActive: true
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprintData();
  }, []);

  const handlePipelineChange = (pipelineId) => {
    setSelectedPipelineId(pipelineId);
    const pipe = pipelines.find(p => p._id === pipelineId);
    if (!pipe) return;

    const matchingBlueprint = blueprints.find(b => b.pipelineId?._id === pipelineId || b.pipelineId === pipelineId);
    if (matchingBlueprint) {
      setActiveBlueprint(matchingBlueprint);
    } else {
      setActiveBlueprint({
        name: `${pipe.name} Blueprint Guide`,
        pipelineId: pipe._id,
        transitions: [],
        isActive: true
      });
    }

    setNewTrans({
      name: '',
      fromStage: pipe.stages[0] || '',
      toStage: pipe.stages[1] || '',
      requiredFields: []
    });
  };

  const handleFieldCheckbox = (val) => {
    setNewTrans(prev => {
      const alreadySelected = prev.requiredFields.includes(val);
      const updated = alreadySelected
        ? prev.requiredFields.filter(f => f !== val)
        : [...prev.requiredFields, val];
      return { ...prev, requiredFields: updated };
    });
  };

  const handleAddTransition = (e) => {
    e.preventDefault();
    if (!newTrans.name.trim() || !newTrans.fromStage || !newTrans.toStage) return;

    setActiveBlueprint(prev => ({
      ...prev,
      transitions: [...prev.transitions, { ...newTrans }]
    }));

    setNewTrans({
      name: '',
      fromStage: newTrans.fromStage,
      toStage: newTrans.toStage,
      requiredFields: []
    });
  };

  const handleRemoveTransition = (idx) => {
    setActiveBlueprint(prev => ({
      ...prev,
      transitions: prev.transitions.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveBlueprint = async () => {
    setSaving(true);
    try {
      if (activeBlueprint._id) {
        const { data } = await api.put(`/api/blueprints/${activeBlueprint._id}`, activeBlueprint);
        setBlueprints(prev => prev.map(b => b._id === activeBlueprint._id ? data : b));
        alert('Blueprint saved successfully');
      } else {
        const { data } = await api.post('/api/blueprints', activeBlueprint);
        setActiveBlueprint(data);
        setBlueprints(prev => [...prev, data]);
        alert('Blueprint created successfully');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save blueprint configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const selectedPipe = pipelines.find(p => p._id === selectedPipelineId);
  const stagesList = selectedPipe ? selectedPipe.stages : [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-on-surface tracking-tight">Stage Blueprints & Playbooks</h2>
        <p className="text-xs text-on-surface-variant">Configure mandatory validation guidelines for pipeline progression</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Flow Viewer & Graph */}
        <div className="lg:col-span-8 space-y-6">
          {/* Select Pipeline Switcher */}
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-1">Target Sales Pipeline</label>
                <select
                  className="rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-amber-500 focus:outline-none w-64"
                  value={selectedPipelineId}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                >
                  {pipelines.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveBlueprint}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-gold hover:brightness-105 text-[#111111] px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-amber-500/10 disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? 'Saving...' : 'Save Playbook'}
              </button>
            </div>

            {/* Visual Connections Pipeline Nodes */}
            <div className="pt-6 border-t border-outline-variant/40">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant mb-6">Workflow Blueprint Graph Map</h4>
              <div className="flex flex-wrap items-center gap-y-8 gap-x-3 bg-surface-container p-6 rounded-xl border border-outline-variant/40 overflow-x-auto">
                {stagesList.map((stage, idx) => (
                  <React.Fragment key={stage}>
                    {/* Stage Circle Node */}
                    <div className="flex flex-col items-center shrink-0 min-w-[100px]">
                      <div className="h-10 w-10 rounded-full border border-amber-500/40 bg-gold/10 text-primary flex items-center justify-center font-bold text-xs shadow-md shadow-amber-500/5">
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-bold text-slate-200 mt-2 truncate text-center max-w-[120px]">
                        {stage}
                      </span>
                    </div>

                    {/* Node connector line */}
                    {idx < stagesList.length - 1 && (
                      <div className="h-0.5 w-8 bg-surface-container-high shrink-0 relative flex items-center justify-center">
                        <span className="absolute text-[8px] text-primary material-symbols-outlined">chevron_right</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Active Transitions Grid list */}
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider">Configured Phase Transitions</h3>
            {activeBlueprint?.transitions?.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-6 text-center">No lead transition guards configured for this pipeline yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBlueprint?.transitions?.map((trans, idx) => (
                  <div key={idx} className="p-4 bg-surface-container/70 border border-outline-variant/40 rounded-xl flex justify-between items-start">
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                          <Play size={10} className="text-primary fill-amber-500" />
                          {trans.name}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {trans.fromStage} ➔ {trans.toStage}
                        </p>
                      </div>

                      {trans.requiredFields?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {trans.requiredFields.map(f => (
                            <span key={f} className="px-1.5 py-0.5 bg-white border border-outline-variant/50 text-[8px] font-mono text-primary rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveTransition(idx)}
                      className="p-1 text-on-surface-variant hover:text-red-600 rounded hover:bg-white"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rule builder form */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 backdrop-blur-sm space-y-4 sticky top-6">
            <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-primary" />
              Configure Transition Rule
            </h3>

            <form onSubmit={handleAddTransition} className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">Transition Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Perform Solution Audit"
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                  value={newTrans.name}
                  onChange={(e) => setNewTrans({ ...newTrans, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">From Stage *</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-2 text-xs text-on-surface focus:outline-none"
                    value={newTrans.fromStage}
                    onChange={(e) => setNewTrans({ ...newTrans, fromStage: e.target.value })}
                  >
                    <option value="">Choose...</option>
                    {stagesList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider mb-1">To Stage *</label>
                  <select
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-2 text-xs text-on-surface focus:outline-none"
                    value={newTrans.toStage}
                    onChange={(e) => setNewTrans({ ...newTrans, toStage: e.target.value })}
                  >
                    <option value="">Choose...</option>
                    {stagesList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox fields validation rules builder */}
              <div className="space-y-2 border-t border-outline-variant/40 pt-3">
                <label className="block text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">Mandatory Lead Fields</label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {availableFieldOptions.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`chk-${opt.value}`}
                        className="rounded border-outline-variant/40 bg-surface-container text-primary h-3.5 w-3.5"
                        checked={newTrans.requiredFields.includes(opt.value)}
                        onChange={() => handleFieldCheckbox(opt.value)}
                      />
                      <label htmlFor={`chk-${opt.value}`} className="text-[10px] text-on-surface select-none">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-high hover:bg-slate-750 text-on-surface py-2.5 text-xs font-bold transition-all border border-outline-variant"
              >
                <Plus size={14} />
                Register Transition Rule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintViewer;
// Force HMR reload update
