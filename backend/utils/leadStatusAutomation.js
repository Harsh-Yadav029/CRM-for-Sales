const Lead = require('../models/Lead');
const { emitCompanyEvent } = require('./socket');

const STAGE_ORDER = ['New', 'Contacted', 'Demo Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

/**
 * Safely advances a Lead's status to a higher stage if not already there or closed.
 * @param {string} leadId 
 * @param {string} targetStatus ('Contacted' | 'Demo Scheduled' | 'Proposal Sent')
 */
const autoAdvanceLeadStatus = async (leadId, targetStatus) => {
  if (!leadId) return;
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) return;

    const currentIndex = STAGE_ORDER.indexOf(lead.status);
    const targetIndex = STAGE_ORDER.indexOf(targetStatus);

    if (currentIndex !== -1 && targetIndex !== -1 && currentIndex < targetIndex && lead.status !== 'Won' && lead.status !== 'Lost') {
      const prevStatus = lead.status;
      lead.status = targetStatus;
      await lead.save();
      console.log(`[Auto-Status] Advanced Lead ${lead._id} status from stage '${prevStatus}' to '${targetStatus}'`);
      emitCompanyEvent('lead_updated', lead);
    }
  } catch (err) {
    console.error('autoAdvanceLeadStatus error:', err.message);
  }
};

module.exports = {
  autoAdvanceLeadStatus
};
