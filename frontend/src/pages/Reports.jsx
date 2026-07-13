import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2, Plus, Trash2, Layout, Sliders, RefreshCw, BarChart4, PieChart as PieIcon, LineChart, Table as TableIcon, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as ReLineChart, Line, AreaChart, Area } from 'recharts';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

// Restrict charts to brand tokens only (gold, ink, line, goldSoft)
const COLORS = ['#E3A62F', '#121212', '#E7E2D8', '#FBEFD8', '#705d00', '#6B7280'];

const DEFAULT_WIDGETS = [
  { id: 'widget-source', type: 'source', title: 'Lead Source Breakdown', chartType: 'pie' },
  { id: 'widget-revenue', type: 'revenue', title: 'Stage Revenue Projections', chartType: 'bar' },
  { id: 'widget-counts', type: 'counts', title: 'Lead Stage Counts', chartType: 'line' },
  { id: 'widget-leaderboard', type: 'leaderboard', title: 'Executive Performance', chartType: 'table' }
];

const AVAILABLE_BLOCKS = [
  { type: 'source', name: 'Lead Source Share', description: 'Displays leads count divided by marketing acquisition channel' },
  { type: 'revenue', name: 'Stage Revenue Projections', description: 'Compares expected vs actual won revenue across all stages' },
  { type: 'counts', name: 'Lead Stage Counts', description: 'Traces the distribution of lead counts in each pipeline status' },
  { type: 'leaderboard', name: 'Executive Leaderboard', description: 'Table of executive conversion rates and revenue contribution' }
];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [draggedType, setDraggedType] = useState(null);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/api/reports/analytics');
      setData(data);
    } catch (e) {
      console.error('Error fetching reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const saved = localStorage.getItem('crm_reports_widgets');
    if (saved) {
      try {
        setActiveWidgets(JSON.parse(saved));
      } catch (_) {
        setActiveWidgets(DEFAULT_WIDGETS);
      }
    } else {
      setActiveWidgets(DEFAULT_WIDGETS);
    }
  }, []);

  const saveLayout = (widgetsList) => {
    setActiveWidgets(widgetsList);
    localStorage.setItem('crm_reports_widgets', JSON.stringify(widgetsList));
  };

  const handleAddWidget = (type) => {
    const matchingBlock = AVAILABLE_BLOCKS.find(b => b.type === type);
    if (!matchingBlock) return;

    const newWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: matchingBlock.name,
      chartType: type === 'source' ? 'pie' : type === 'leaderboard' ? 'table' : 'bar'
    };

    saveLayout([...activeWidgets, newWidget]);
  };

  const handleRemoveWidget = (id) => {
    saveLayout(activeWidgets.filter(w => w.id !== id));
  };

  const handleChangeChartType = (id, newChartType) => {
    saveLayout(activeWidgets.map(w => w.id === id ? { ...w, chartType: newChartType } : w));
  };

  const handleDragStartBlock = (type) => {
    setDraggedType(type);
  };

  const handleDragOverCanvas = (e) => {
    e.preventDefault();
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    if (draggedType) {
      handleAddWidget(draggedType);
      setDraggedType(null);
    }
  };

  const handleResetLayout = () => {
    saveLayout(DEFAULT_WIDGETS);
  };

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  if (loading) {
    return (
      <div className="flex justify-center py-16 min-h-[60vh] items-center">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 md:p-8 text-center py-24 bg-paper min-h-[60vh] flex flex-col items-center justify-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4 animate-bounce" />
        <h3 className="text-base font-bold text-ink uppercase tracking-wider font-display">Analytics Sync Failed</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          We encountered an issue retrieving real-time data reports from the server. Please verify your connection or try again.
        </p>
        <Button onClick={fetchReports} className="mt-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
          <RefreshCw size={12} />
          Retry Sync
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8 font-sans bg-paper">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono">Performance Builder</span>
          <h2 className="text-2xl font-display font-black text-ink uppercase tracking-tight mt-1">Analytics Builder</h2>
          <p className="text-xs text-slate-500 mt-1">Drag metric blocks onto the canvas to design custom business dashboards</p>
        </div>

        <Button
          variant="secondary"
          onClick={handleResetLayout}
          icon={RefreshCw}
        >
          Reset Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Sidebar of Blocks */}
        <div className="lg:col-span-3">
          <Card variant="raised" className="p-5 bg-white space-y-4">
            <h3 className="text-xs font-display font-black text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-line pb-3">
              <Sliders size={14} className="text-gold" />
              Chart Blocks
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">Drag or click to mount widgets</p>

            <div className="space-y-3 pt-2">
              {AVAILABLE_BLOCKS.map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={() => handleDragStartBlock(block.type)}
                  onClick={() => handleAddWidget(block.type)}
                  className="p-4 bg-[#FAF9F6] border border-line hover:border-gold/30 rounded-card cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group select-none"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink group-hover:text-gold transition-colors">{block.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5 max-w-[170px] uppercase font-mono">{block.description}</p>
                  </div>
                  <Plus size={14} className="text-slate-400 group-hover:text-gold shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Side: Active Interactive Canvas */}
        <div
          className="lg:col-span-9 rounded-card border-2 border-dashed border-line bg-white/50 p-6 min-h-[60vh] space-y-6"
          onDragOver={handleDragOverCanvas}
          onDrop={handleDropOnCanvas}
        >
          {activeWidgets.length === 0 ? (
            <EmptyState
              title="Your Canvas is Empty"
              description="Drag widgets from the left column or click their plus buttons to start building your dashboard reports."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeWidgets.map(widget => (
                <Card
                  key={widget.id}
                  variant="raised"
                  className="p-5 bg-white flex flex-col justify-between"
                >
                  {/* Header / Controls */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-display font-black text-ink uppercase tracking-wider">{widget.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      {widget.type !== 'leaderboard' && (
                        <div className="flex border border-line bg-[#FAF9F6] p-0.5 rounded-lg">
                          <button
                            onClick={() => handleChangeChartType(widget.id, 'bar')}
                            className={`p-1 rounded text-slate-400 hover:text-ink ${widget.chartType === 'bar' ? 'bg-gold-soft text-gold font-bold' : ''}`}
                            title="Bar Chart"
                          >
                            <BarChart4 size={12} />
                          </button>
                          <button
                            onClick={() => handleChangeChartType(widget.id, 'line')}
                            className={`p-1 rounded text-slate-400 hover:text-ink ${widget.chartType === 'line' ? 'bg-gold-soft text-gold font-bold' : ''}`}
                            title="Line Chart"
                          >
                            <LineChart size={12} />
                          </button>
                          {widget.type === 'source' && (
                            <button
                              onClick={() => handleChangeChartType(widget.id, 'pie')}
                              className={`p-1 rounded text-slate-400 hover:text-ink ${widget.chartType === 'pie' ? 'bg-gold-soft text-gold font-bold' : ''}`}
                              title="Pie Chart"
                            >
                              <PieIcon size={12} />
                            </button>
                          )}
                          {widget.type === 'revenue' && (
                            <button
                              onClick={() => handleChangeChartType(widget.id, 'area')}
                              className={`p-1 rounded text-slate-400 hover:text-ink ${widget.chartType === 'area' ? 'bg-gold-soft text-gold font-bold' : ''}`}
                              title="Area Chart"
                            >
                              <LineChart size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="p-1 border border-line text-slate-400 hover:text-danger hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Render dynamic charts with brand tokens (gold, ink, line) */}
                  <div className="h-64 flex items-center justify-center pt-2 font-mono">
                    {/* Widget TYPE: SOURCE */}
                    {widget.type === 'source' && (
                      !data.sources || data.sources.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px] text-center font-sans px-4">No lead source data available. Add leads with sources to populate.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {widget.chartType === 'pie' ? (
                            <PieChart>
                              <Pie
                                data={data.sources}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {data.sources.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Legend iconType="circle" />
                            </PieChart>
                          ) : widget.chartType === 'line' ? (
                            <ReLineChart data={data.sources}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Line type="monotone" dataKey="value" stroke="#E3A62F" strokeWidth={2} />
                            </ReLineChart>
                          ) : (
                            <BarChart data={data.sources}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Bar dataKey="value" fill="#E3A62F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      )
                    )}

                    {/* Widget TYPE: REVENUE */}
                    {widget.type === 'revenue' && (
                      !data.stages || data.stages.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px] text-center font-sans px-4">No revenue projections available. Add expected revenue to leads to populate.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {widget.chartType === 'line' ? (
                            <ReLineChart data={data.stages}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                              <Tooltip formatter={(value) => [fmt(value), 'Revenue']} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Legend />
                              <Line type="monotone" dataKey="revenue" name="Expected" stroke="#E3A62F" strokeWidth={2} />
                              <Line type="monotone" dataKey="won" name="Won" stroke="#121212" strokeWidth={2} />
                            </ReLineChart>
                          ) : widget.chartType === 'area' ? (
                            <AreaChart data={data.stages}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                              <Tooltip formatter={(value) => [fmt(value), 'Revenue']} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Legend />
                              <Area type="monotone" dataKey="revenue" name="Expected" fillOpacity={0.15} fill="#E3A62F" stroke="#E3A62F" />
                              <Area type="monotone" dataKey="won" name="Won" fillOpacity={0.15} fill="#121212" stroke="#121212" />
                            </AreaChart>
                          ) : (
                            <BarChart data={data.stages}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                              <Tooltip formatter={(value) => [fmt(value), 'Revenue']} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Legend />
                              <Bar dataKey="revenue" name="Expected" fill="#E3A62F" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="won" name="Won" fill="#121212" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      )
                    )}

                    {/* Widget TYPE: COUNTS */}
                    {widget.type === 'counts' && (
                      !data.stages || data.stages.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px] text-center font-sans px-4">No lead count data available. Add leads to populate.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {widget.chartType === 'line' ? (
                            <ReLineChart data={data.stages}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Line type="monotone" dataKey="count" name="Leads" stroke="#E3A62F" strokeWidth={2} />
                            </ReLineChart>
                          ) : (
                            <BarChart data={data.stages}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
                              <XAxis dataKey="name" stroke="#6B7280" fontSize={9} />
                              <YAxis stroke="#6B7280" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E7E2D8', borderRadius: '10px' }} />
                              <Bar dataKey="count" name="Leads" fill="#E3A62F" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      )
                    )}

                    {/* Widget TYPE: LEADERBOARD Table */}
                    {widget.type === 'leaderboard' && (
                      !data.executives || data.executives.length === 0 ? (
                        <div className="text-slate-400 italic text-[11px] text-center font-sans px-4">No performance data available. Assign leads to salespeople to populate.</div>
                      ) : (
                        <div className="w-full h-full overflow-y-auto pr-1">
                          <table className="w-full text-left text-[11px] font-sans">
                            <thead>
                              <tr className="border-b border-line bg-[#FAF9F6] text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-2.5 px-3">Sales Exec</th>
                                <th className="py-2.5 px-3">Win Pct</th>
                                <th className="py-2.5 px-3 text-right">Won (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line text-ink">
                              {data.executives.map((exec, idx) => {
                                const pct = exec.leads ? Math.round((exec.won / exec.leads) * 100) : 0;
                                return (
                                  <tr key={idx} className="hover:bg-gold-soft/20">
                                    <td className="py-2.5 px-3 font-semibold truncate max-w-[100px]">{exec.name}</td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-gold">{pct}%</td>
                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-ink">{fmt(exec.revenue)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
export { Reports };
