const Lead = require('../models/Lead');

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

// @desc    Calculate sales projections against closed won + weighted pipelines
// @route   GET /api/forecast
// @access  Private
const getSalesForecast = async (req, res, next) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const quarter = parseInt(req.query.quarter) || Math.floor((new Date().getMonth() + 3) / 3);

  try {
    // Fetch all leads/deals in the pipeline
    const leads = await Lead.find({});
    
    let totalWeightedPipeline = 0;
    let totalUnweightedPipeline = 0;
    let closedWonQuotaAttained = 0;

    leads.forEach(lead => {
      const expectedRevenue = lead.expectedRevenue || 0;
      
      if (lead.status === 'Won') {
        closedWonQuotaAttained += expectedRevenue;
      } else if (lead.status !== 'Lost') {
        const probability = stageProbabilityMap[lead.status] || 0.10; // Default to 10%
        totalUnweightedPipeline += expectedRevenue;
        totalWeightedPipeline += expectedRevenue * probability;
      }
    });

    const totalProjectedForecast = closedWonQuotaAttained + totalWeightedPipeline;

    res.json({
      period: {
        year,
        quarter
      },
      metrics: {
        totalQuotaTarget: 0,
        closedWonQuotaAttained,
        totalUnweightedPipeline,
        totalWeightedPipeline,
        totalProjectedForecast,
        gapToTarget: 0,
        attainmentPercentage: 100
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesForecast
};
