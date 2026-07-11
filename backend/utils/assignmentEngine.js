const AssignmentRule = require('../models/AssignmentRule');

/**
 * Evaluates active criteria and routes the lead using round-robin distribution to configured assignees.
 * @param {Object} lead - The Mongoose Lead document
 * @returns {Promise<string|null>} The assigned User ID, or null if no rule matches
 */
const assignLeadToRepresentative = async (lead) => {
  try {
    // Load active rules sorted by priority (lowest number = highest execution order)
    const rules = await AssignmentRule.find({ 
      tenantId: lead.tenantId, 
      isActive: true 
    }).sort({ priority: 1 });

    for (const rule of rules) {
      if (!rule.assignees || rule.assignees.length === 0) continue;

      let isMatch = true;
      for (const crit of rule.criteria) {
        const leadVal = String(lead[crit.field] || '');
        const critVal = String(crit.value);

        if (crit.operator === 'equals' && leadVal.toLowerCase() !== critVal.toLowerCase()) {
          isMatch = false;
        } else if (crit.operator === 'not_equals' && leadVal.toLowerCase() === critVal.toLowerCase()) {
          isMatch = false;
        } else if (crit.operator === 'contains' && !leadVal.toLowerCase().includes(critVal.toLowerCase())) {
          isMatch = false;
        } else if (crit.operator === 'greater_than' && Number(leadVal) <= Number(critVal)) {
          isMatch = false;
        } else if (crit.operator === 'less_than' && Number(leadVal) >= Number(critVal)) {
          isMatch = false;
        }

        if (!isMatch) break;
      }

      // If all criteria match, assign using round-robin distribution
      if (isMatch) {
        const index = rule.currentIndex % rule.assignees.length;
        const assigneeId = rule.assignees[index];

        // Increment rule cursor for next lead distribution
        rule.currentIndex = (rule.currentIndex + 1) % rule.assignees.length;
        await rule.save();

        return assigneeId;
      }
    }

    return null;
  } catch (error) {
    console.error('Lead auto-assignment engine execution failed:', error);
    return null;
  }
};

module.exports = {
  assignLeadToRepresentative
};
