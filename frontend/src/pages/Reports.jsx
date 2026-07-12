import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2, Plus, Trash2, Layout, Sliders, RefreshCw, BarChart4, PieChart as PieIcon, LineChart, Table } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as ReLineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#6366f1'];

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
    // Load saved layout or default
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

  // Drag and drop handlers
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
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Analytics Builder</h2>
          <p className="text-xs text-slate-400">Drag metric blocks onto the canvas to design custom business dashboards</p>
        </div>

        <button
          onClick={handleResetLayout}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white px-4 py-2.5 text-xs font-semibold transition-all"
        >
          <RefreshCw size={14} />
          Reset Layout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Drag-and-drop Sidebar of Available Widgets */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-3">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-amber-500" />
              Chart Blocks
            </h3>
            <p className="text-[10px] text-slate-400">Drag or click to mount widgets on your board</p>

            <div className="space-y-3 pt-2">
              {AVAILABLE_BLOCKS.map(block => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={() => handleDragStartBlock(block.type)}
                  onClick={() => handleAddWidget(block.type)}
                  className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-amber-500 transition-colors">{block.name}</p>
                    <p className="text-[9px] text-slate-500 truncate mt-0.5 max-w-[170px]">{block.description}</p>
                  </div>
                  <Plus size={14} className="text-slate-500 group-hover:text-white shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active Interactive Canvas */}
        <div
          className="lg:col-span-9 rounded-2xl border-2 border-dashed border-slate-850 bg-slate-950/10 p-6 min-h-[60vh] space-y-6"
          onDragOver={handleDragOverCanvas}
          onDrop={handleDropOnCanvas}
        >
          {activeWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Layout className="h-10 w-10 text-slate-700" />
              <h3 className="text-sm font-bold text-white">Your Canvas is Empty</h3>
              <p className="text-xs text-slate-400 max-w-sm">Drag widgets from the left column or click their plus buttons to start building your dashboard reports</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeWidgets.map(widget => (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm flex flex-col justify-between"
                >
                  {/* Header / Controls */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{widget.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Chart visual switcher button cogs */}
                      {widget.type !== 'leaderboard' && (
                        <div className="flex border border-slate-800 bg-slate-950 p-0.5 rounded-lg">
                          <button
                            onClick={() => handleChangeChartType(widget.id, 'bar')}
                            className={`p-1 rounded text-slate-400 hover:text-white ${widget.chartType === 'bar' ? 'bg-amber-500/10 text-amber-500' : ''}`}
                            title="Bar Chart"
                          >
                            <BarChart4 size={12} />
                          </button>
                          <button
                            onClick={() => handleChangeChartType(widget.id, 'line')}
                            className={`p-1 rounded text-slate-400 hover:text-white ${widget.chartType === 'line' ? 'bg-amber-500/10 text-amber-500' : ''}`}
                            title="Line Chart"
                          >
                            <LineChart size={12} />
                          </button>
                          {widget.type === 'source' && (
                            <button
                              onClick={() => handleChangeChartType(widget.id, 'pie')}
                              className={`p-1 rounded text-slate-400 hover:text-white ${widget.chartType === 'pie' ? 'bg-amber-500/10 text-amber-500' : ''}`}
                              title="Pie Chart"
                            >
                              <PieIcon size={12} />
                            </button>
                          )}
                          {widget.type === 'revenue' && (
                            <button
                              onClick={() => handleChangeChartType(widget.id, 'area')}
                              className={`p-1 rounded text-slate-400 hover:text-white ${widget.chartType === 'area' ? 'bg-amber-500/10 text-amber-500' : ''}`}
                              title="Area Chart"
                            >
                              <LineChart size={12} />
                            </button>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="p-1 border border-slate-800 text-slate-500 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Render dynamic charts */}
                  <div className="h-64 flex items-center justify-center pt-2">
                    {/* Widget TYPE: SOURCE (Pie / Bar / Line) */}
                    {widget.type === 'source' && (
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
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Legend iconType="circle" />
                          </PieChart>
                        ) : widget.chartType === 'line' ? (
                          <ReLineChart data={data.sources}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                          </ReLineChart>
                        ) : (
                          <BarChart data={data.sources}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    )}

                    {/* Widget TYPE: REVENUE (Bar / Line / Area) */}
                    {widget.type === 'revenue' && (
                      <ResponsiveContainer width="100%" height="100%">
                        {widget.chartType === 'line' ? (
                          <ReLineChart data={data.stages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                            <Tooltip formatter={(value) => [fmt(value), 'Revenue']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" name="Expected" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="won" name="Won" stroke="#10b981" strokeWidth={2} />
                          </ReLineChart>
                        ) : widget.chartType === 'area' ? (
                          <AreaChart data={data.stages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                            <Tooltip formatter={(value) => [fmt(value), 'Revenue']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Legend />
                            <Area type="monotone" dataKey="revenue" name="Expected" fillOpacity={0.15} fill="#3b82f6" stroke="#3b82f6" />
                            <Area type="monotone" dataKey="won" name="Won" fillOpacity={0.15} fill="#10b981" stroke="#10b981" />
                          </AreaChart>
                        ) : (
                          <BarChart data={data.stages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                            <Tooltip formatter={(value) => [fmt(value), 'Revenue']} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Legend />
                            <Bar dataKey="revenue" name="Expected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="won" name="Won" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    )}

                    {/* Widget TYPE: COUNTS (Line / Bar) */}
                    {widget.type === 'counts' && (
                      <ResponsiveContainer width="100%" height="100%">
                        {widget.chartType === 'line' ? (
                          <ReLineChart data={data.stages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Line type="monotone" dataKey="count" name="Leads" stroke="#a855f7" strokeWidth={2} />
                          </ReLineChart>
                        ) : (
                          <BarChart data={data.stages}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Bar dataKey="count" name="Leads" fill="#a855f7" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    )}

                    {/* Widget TYPE: LEADERBOARD Table */}
                    {widget.type === 'leaderboard' && (
                      <div className="w-full h-full overflow-y-auto pr-1">
                        <table className="w-full text-left text-[10px]">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950 text-slate-500 font-bold uppercase">
                              <th className="py-2 px-3">Sales Exec</th>
                              <th className="py-2 px-3">Win Pct</th>
                              <th className="py-2 px-3 text-right">Won (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {data.executives.map((exec, idx) => {
                              const pct = exec.leads ? Math.round((exec.won / exec.leads) * 100) : 0;
                              return (
                                <tr key={idx} className="text-slate-300">
                                  <td className="py-2 px-3 font-semibold truncate max-w-[100px]">{exec.name}</td>
                                  <td className="py-2 px-3 font-mono font-bold text-amber-500">{pct}%</td>
                                  <td className="py-2 px-3 text-right font-bold text-white">{fmt(exec.revenue)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
