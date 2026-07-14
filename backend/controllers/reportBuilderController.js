const mongoose = require('mongoose');

// Map module names to Mongoose models
const modelMap = {
  Lead: require('../models/Lead'),
  Company: require('../models/Company'),
  Contact: require('../models/Contact'),
  Quote: require('../models/Quote'),
  Invoice: require('../models/Invoice')
};

// @desc    Dynamically run aggregated pivot reports based on user filters
// @route   POST /api/report-builder/query
// @access  Private
const runPivotReport = async (req, res, next) => {
  const { moduleName, groupBy, aggregateField, aggregateOperator, filters } = req.body;

  try {
    const Model = modelMap[moduleName];
    if (!Model) {
      res.status(400);
      return next(new Error(`Invalid module name: ${moduleName}. Supported modules: Lead, Company, Contact, Quote, Invoice`));
    }

    if (!groupBy) {
      res.status(400);
      return next(new Error('groupBy field is required for pivot analytics'));
    }

    // 1. Build initial Match Query
    const matchStage = {};

    // Parse additional filters
    if (filters && Array.isArray(filters)) {
      filters.forEach(f => {
        const field = f.field;
        const val = f.value;
        const op = f.operator;

        if (op === 'equals') {
          matchStage[field] = val;
        } else if (op === 'not_equals') {
          matchStage[field] = { $ne: val };
        } else if (op === 'contains') {
          matchStage[field] = new RegExp(val, 'i');
        } else if (op === 'greater_than') {
          matchStage[field] = { $gt: Number(val) };
        } else if (op === 'less_than') {
          matchStage[field] = { $lt: Number(val) };
        }
      });
    }

    // 2. Build Aggregation Grouping
    const groupStage = {
      _id: `$${groupBy}`
    };

    const targetField = aggregateField ? `$${aggregateField}` : 1;

    if (aggregateOperator === 'sum') {
      groupStage.value = { $sum: targetField };
    } else if (aggregateOperator === 'avg') {
      groupStage.value = { $avg: targetField };
    } else {
      // Default to count
      groupStage.value = { $sum: 1 };
    }

    // Run aggregation
    const pipeline = [
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { value: -1 } }
    ];

    const results = await Model.aggregate(pipeline);

    res.json({
      moduleName,
      groupBy,
      aggregateField: aggregateField || 'count',
      aggregateOperator: aggregateOperator || 'count',
      results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runPivotReport
};
