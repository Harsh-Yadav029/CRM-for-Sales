const Workflow = require('../models/Workflow');
const Task = require('../models/Task');

/**
 * Automation Engine: Process workflow triggers when a Lead changes status
 * @param {Object} lead - Mongoose Lead document instance
 * @param {string} currentUserId - User ID performing the change
 */
const runAutomation = async (lead, currentUserId) => {
  try {
    // Find all workflow rules triggered by this lead's current stage
    const matchedWorkflows = await Workflow.find({ triggerStage: lead.status });

    let leadUpdated = false;

    for (const rule of matchedWorkflows) {
      if (rule.actionType === 'task') {
        // Create automated task assigned to lead owner or system operator
        await Task.create({
          title: `[Automated] ${rule.taskTitle}`,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day deadline
          assignedTo: lead.assignedTo || currentUserId,
          leadId: lead._id
        });
      } else if (rule.actionType === 'email') {
        // Simple placeholder replacements
        const parsedBody = rule.emailBody
          .replace(/{name}/g, lead.name)
          .replace(/{company}/g, lead.company);

        // Log the automated outbound email directly in the lead notes/timeline
        lead.notes.push({
          type: 'email',
          subject: rule.emailSubject,
          text: parsedBody,
          status: 'sent',
          addedBy: currentUserId
        });
        leadUpdated = true;
      }
    }

    if (leadUpdated) {
      await lead.save();
    }
  } catch (error) {
    console.error('Automation Engine Error:', error);
  }
};

module.exports = { runAutomation };
