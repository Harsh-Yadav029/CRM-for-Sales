import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#004ac6', '#009e4a', '#e97600', '#008ba3', '#9c27b0', '#795548'];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const fmt = (v) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(v);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      <div>
        <h2 className="text-base md:text-lg font-bold text-on-surface">Reports & Analytics</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Real-time business intelligence metrics and pipeline visualizations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead source Pie chart card */}
        <div className="lg:col-span-5 bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Lead Source Share</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Breakdown of prospects by marketing source</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {data.sources.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
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
                  <Tooltip formatter={(value) => [`${value} Leads`, 'Total']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expected/Won revenue by stage Bar chart */}
        <div className="lg:col-span-7 bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Revenue Projection by Stage</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Projected revenue vs Won revenue by status</p>
          </div>
          <div className="h-64">
            {data.stages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant italic">No stage data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stages}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff4ff" />
                  <XAxis dataKey="name" stroke="#8c9099" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8c9099" fontSize={10} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value) => [fmt(value), 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Expected Revenue" fill="#004ac6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="won" name="Won Revenue" fill="#009e4a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Executive Leaderboard Performance table & chart */}
        <div className="lg:col-span-12 bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-primary uppercase tracking-wider">Executive Performance Leaderboard</h3>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Leads assigned, converted and total won revenue per owner</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant font-bold text-[10px] text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-3">Sales Executive</th>
                  <th className="px-6 py-3">Total Assigned Leads</th>
                  <th className="px-6 py-3">Leads Won</th>
                  <th className="px-6 py-3">Conversion Rate</th>
                  <th className="px-6 py-3 text-right">Revenue Won (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {data.executives.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-xs text-on-surface-variant italic">No executive performance records found.</td>
                  </tr>
                ) : (
                  data.executives.map((exec, idx) => {
                    const conversion = exec.leads ? Math.round((exec.won / exec.leads) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors text-xs font-medium text-on-surface">
                        <td className="px-6 py-3.5 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                            {exec.name.slice(0, 2)}
                          </div>
                          <span className="font-bold">{exec.name}</span>
                        </td>
                        <td className="px-6 py-3.5">{exec.leads} Leads</td>
                        <td className="px-6 py-3.5">{exec.won} Won</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-secondary" style={{ width: `${conversion}%` }}></div>
                            </div>
                            <span className="font-extrabold">{conversion}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-secondary">{fmt(exec.revenue)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
