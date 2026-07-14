const Lead = require('../models/Lead');
const User = require('../models/User');
const { buildLeadSharingQuery } = require('../utils/sharingRules');
const { enqueueAutomationJob } = require('../utils/automationQueue');
const { emitTenantEvent } = require('../utils/socket');

const getLeads = async (req, res, next) => {
  try {
    const baseQuery = await buildLeadSharingQuery(req);
    const query = { ...baseQuery };

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { company: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      });
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    next(error);
  }
};

const createLead = async (req, res, next) => {
  const { name, company, email, phone, source, status, expectedRevenue, assignedTo, serviceCategory, showroomBookingSlot, designDrawingStatus } = req.body;

  try {
    if (!name || !company || !email || !phone) {
      res.status(400);
      return next(new Error('Please fill in name, company, email, and phone'));
    }

    const finalAssignedTo = assignedTo || req.user._id;

    const leadData = {
      name,
      company,
      email,
      phone,
      source: source || 'Website',
      status: status || 'New',
      expectedRevenue: expectedRevenue || 0,
      assignedTo: finalAssignedTo,
      serviceCategory: serviceCategory || 'Interior VR',
      showroomBookingSlot: showroomBookingSlot || null,
      designDrawingStatus: designDrawingStatus || 'Pending',
      customFields: req.body.customFields || {},
      notes: []
    };

    const lead = await Lead.create(leadData);

    // Broadcast live event to organization
    emitTenantEvent('walktheplan', 'lead_created', lead);

    // Enqueue automation task to run in background
    await enqueueAutomationJob('RUN_AUTOMATION', { leadId: lead._id }, req.user._id);

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id })
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id });

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    const fieldsToUpdate = ['name', 'company', 'email', 'phone', 'source', 'expectedRevenue', 'serviceCategory', 'showroomBookingSlot', 'designDrawingStatus'];
    
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    if (req.body.assignedTo !== undefined) {
      lead.assignedTo = req.body.assignedTo || null;
    }

    if (req.body.status !== undefined) {
      lead.status = req.body.status;
    }

    if (req.body.customFields !== undefined) {
      lead.customFields = req.body.customFields;
    }

    const updatedLead = await lead.save();
    
    // Broadcast live event to organization
    emitTenantEvent('walktheplan', 'lead_updated', updatedLead);

    // Enqueue automation task to run in background
    await enqueueAutomationJob('RUN_AUTOMATION', { leadId: updatedLead._id }, req.user._id);
    
    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id });

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    // Broadcast live delete event to organization
    emitTenantEvent('walktheplan', 'lead_deleted', { id: lead._id });

    res.json({ message: 'Lead removed successfully' });
  } catch (error) {
    next(error);
  }
};

const assignLead = async (req, res, next) => {
  const { assignedTo } = req.body;

  try {
    const lead = await Lead.findOne({ _id: req.params.id });

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (assignedTo) {
      const user = await User.findOne({ _id: assignedTo });
      if (!user) {
        res.status(400);
        return next(new Error('Assigned user not found'));
      }
    }

    lead.assignedTo = assignedTo || null;
    const updatedLead = await lead.save();

    // Broadcast live event to organization
    emitTenantEvent('walktheplan', 'lead_updated', updatedLead);

    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const updateLeadStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const lead = await Lead.findOne({ _id: req.params.id });

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (!status) {
      res.status(400);
      return next(new Error('Status is required'));
    }

    lead.status = status;
    const updatedLead = await lead.save();
    
    // Broadcast live event to organization
    emitTenantEvent('walktheplan', 'lead_updated', updatedLead);

    // Enqueue automation task to run in background
    await enqueueAutomationJob('RUN_AUTOMATION', { leadId: updatedLead._id }, req.user._id);

    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const addLeadNote = async (req, res, next) => {
  const { text } = req.body;

  try {
    const lead = await Lead.findOne({ _id: req.params.id });

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (!text || text.trim() === '') {
      res.status(400);
      return next(new Error('Note text cannot be empty'));
    }

    lead.notes.push({
      text,
      addedBy: req.user._id
    });

    await lead.save();
    
    const updatedLead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    // Broadcast live event to organization
    emitTenantEvent('walktheplan', 'lead_updated', updatedLead);

    res.status(201).json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const importLeads = async (req, res, next) => {
  const { leads } = req.body;

  try {
    if (!leads || !Array.isArray(leads)) {
      res.status(400);
      return next(new Error('Please provide an array of leads to import'));
    }

    const validLeads = [];
    const errors = [];

    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      if (!l.name || !l.company || !l.email || !l.phone) {
        errors.push(`Row ${i + 1}: Name, Company, Email, and Phone are required.`);
        continue;
      }

      const finalAssignedTo = l.assignedTo || req.user._id;
      
      const leadData = {
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        source: l.source || 'Website',
        status: l.status || 'New',
        expectedRevenue: l.expectedRevenue || 0,
        assignedTo: finalAssignedTo,
        serviceCategory: l.serviceCategory || 'Interior VR',
        showroomBookingSlot: l.showroomBookingSlot || null,
        designDrawingStatus: l.designDrawingStatus || 'Pending',
        customFields: l.customFields || {},
        notes: []
      };

      validLeads.push(leadData);
    }

    if (validLeads.length === 0) {
      res.status(400).json({
        message: 'No valid leads found in import body',
        errors
      });
      return;
    }

    const createdLeads = await Lead.insertMany(validLeads);

    // Enqueue automations & Emit socket events
    for (const createdLead of createdLeads) {
      emitTenantEvent('walktheplan', 'lead_created', createdLead);
      await enqueueAutomationJob('RUN_AUTOMATION', { leadId: createdLead._id }, req.user._id);
    }

    res.status(201).json({
      message: `Successfully imported ${createdLeads.length} leads.`,
      importedCount: createdLeads.length,
      failedCount: errors.length,
      errors
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  updateLeadStatus,
  addLeadNote,
  importLeads
};
