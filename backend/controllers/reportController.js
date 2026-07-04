const Lead = require('../models/Lead');

// @desc    Get aggregated CRM analytics data for reports
// @route   GET /api/reports/analytics
// @access  Private
const getReportAnalytics = async (req, res, next) => {
  try {
    const leads = await Lead.find({}).populate('assignedTo', 'name');

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

module.exports = {
  getReportAnalytics
};
