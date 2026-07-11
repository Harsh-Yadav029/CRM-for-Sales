const Lead = require('../models/Lead');

// @desc    Get aggregated CRM analytics data for reports
// @route   GET /api/reports/analytics
// @access  Private
const getReportAnalytics = async (req, res, next) => {
  try {
    // Crucial: Tenant scoping applied
    const leads = await Lead.find({ tenantId: req.tenantId }).populate('assignedTo', 'name');

    // 1. Lead count by Source
    const sourceMap = {};
    leads.forEach(l => {
      const src = l.source || 'Website';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sourceData = Object.keys(sourceMap).map(name => ({
      name,
      value: sourceMap[name]
    }));

    // 2. Expected Revenue & Won Revenue by Stage
    const stageMap = {};
    leads.forEach(l => {
      const stage = l.status || 'New';
      if (!stageMap[stage]) {
        stageMap[stage] = { expected: 0, actual: 0, count: 0 };
      }
      stageMap[stage].expected += l.expectedRevenue || 0;
      if (l.status === 'Won') {
        stageMap[stage].actual += l.expectedRevenue || 0;
      }
      stageMap[stage].count += 1;
    });
    const stageData = Object.keys(stageMap).map(name => ({
      name,
      revenue: stageMap[name].expected,
      won: stageMap[name].actual,
      count: stageMap[name].count
    }));

    // 3. Salesperson Executive Performance
    const execMap = {};
    leads.forEach(l => {
      const execName = l.assignedTo?.name || 'Unassigned';
      if (!execMap[execName]) {
        execMap[execName] = { leadsCount: 0, wonCount: 0, revenue: 0 };
      }
      execMap[execName].leadsCount += 1;
      if (l.status === 'Won') {
        execMap[execName].wonCount += 1;
        execMap[execName].revenue += l.expectedRevenue || 0;
      }
    });
    const execData = Object.keys(execMap).map(name => ({
      name,
      leads: execMap[name].leadsCount,
      won: execMap[name].wonCount,
      revenue: execMap[name].revenue
    }));

    res.json({
      sources: sourceData,
      stages: stageData,
      executives: execData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export executive performance to CSV format
// @route   GET /api/reports/export/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const leads = await Lead.find({ tenantId: req.tenantId }).populate('assignedTo', 'name');
    
    // Compile executive performance metrics
    const execMap = {};
    leads.forEach(l => {
      const execName = l.assignedTo?.name || 'Unassigned';
      if (!execMap[execName]) {
        execMap[execName] = { leads: 0, won: 0, revenue: 0 };
      }
      execMap[execName].leads += 1;
      if (l.status === 'Won') {
        execMap[execName].won += 1;
        execMap[execName].revenue += l.expectedRevenue || 0;
      }
    });

    let csvContent = 'Representative,Leads Managed,Closed Won,Won Revenue ($)\n';
    Object.keys(execMap).forEach(name => {
      const data = execMap[name];
      csvContent += `"${name}",${data.leads},${data.won},${data.revenue}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=executive_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export performance summary to PDF/HTML print-ready format
// @route   GET /api/reports/export/pdf
// @access  Private
const exportPDF = async (req, res, next) => {
  try {
    const leads = await Lead.find({ tenantId: req.tenantId }).populate('assignedTo', 'name');

    const totalLeads = leads.length;
    const totalWon = leads.filter(l => l.status === 'Won').length;
    const totalRevenue = leads.filter(l => l.status === 'Won').reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);

    const htmlContent = `
      <html>
      <head>
        <title>Sales Command Performance Summary</title>
        <style>
          body { font-family: sans-serif; padding: 30px; color: #333; }
          h1 { color: #d4af37; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .summary-card { background: #fafafa; border-left: 5px solid #d4af37; padding: 15px; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Walk The Plan CRM - Performance Report</h1>
        <div class="summary-card">
          <p><strong>Tenant ID:</strong> ${req.tenantId}</p>
          <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Leads:</strong> ${totalLeads}</p>
          <p><strong>Closed Won:</strong> ${totalWon}</p>
          <p><strong>Won Revenue:</strong> $${totalRevenue.toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=performance_report.html');
    res.status(200).send(htmlContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportAnalytics,
  exportCSV,
  exportPDF
};
