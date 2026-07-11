const Lead = require('../models/Lead');
const Quota = require('../models/Quota');

// Define stage conversion weights (probabilities)
const stageProbabilityMap = {
  'New': 0.10,
  'Contacted': 0.15,
  'Demo Scheduled': 0.35,
  'Proposal Sent': 0.65,
  'Negotiation': 0.80,
  'Won': 1.00,
  'Lost': 0.00
};

// @desc    Calculate quarterly sales targets against closed won + weighted pipelines
// @route   GET /api/forecast
// @access  Private
const getSalesForecast = async (req, res, next) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const quarter = parseInt(req.query.quarter) || Math.floor((new Date().getMonth() + 3) / 3);

  try {
    const scope = { tenantId: req.tenantId };

    // 1. Calculate Quota Target & Closed Attainment
    const quotas = await Quota.find({ ...scope, year, quarter });
    const totalQuotaTarget = quotas.reduce((sum, q) => sum + q.targetAmount, 0);
    const closedWonQuotaAttained = quotas.reduce((sum, q) => sum + q.attainedAmount, 0);

    // 2. Fetch all leads/deals in the pipeline
    const leads = await Lead.find(scope);
    
    let totalWeightedPipeline = 0;
    let totalUnweightedPipeline = 0;

    leads.forEach(lead => {
      // Skip already closed won/lost leads if they are counted in quota direct metrics
      if (lead.status === 'Won' || lead.status === 'Lost') return;

      const probability = stageProbabilityMap[lead.status] || 0.10; // Default to 10%
      const expectedRevenue = lead.expectedRevenue || 0;

      totalUnweightedPipeline += expectedRevenue;
      totalWeightedPipeline += expectedRevenue * probability;
    });

    const totalProjectedForecast = closedWonQuotaAttained + totalWeightedPipeline;
    const gapToTarget = Math.max(0, totalQuotaTarget - totalProjectedForecast);

    res.json({
      period: {
        year,
        quarter
      },
      metrics: {
        totalQuotaTarget,
        closedWonQuotaAttained,
        totalUnweightedPipeline,
        totalWeightedPipeline,
        totalProjectedForecast,
        gapToTarget,
        attainmentPercentage: totalQuotaTarget > 0 ? Number(((totalProjectedForecast / totalQuotaTarget) * 100).toFixed(2)) : 100
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesForecast
};
