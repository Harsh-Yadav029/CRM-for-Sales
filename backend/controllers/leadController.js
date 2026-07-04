const Lead = require('../models/Lead');
const User = require('../models/User');

const getLeads = async (req, res, next) => {
  try {
    const query = {};

    if (req.user.role === 'sales') {
      query.assignedTo = req.user._id;
    } else if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
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
  const { name, company, email, phone, source, status, expectedRevenue, assignedTo } = req.body;

  try {
    if (!name || !company || !email || !phone) {
      res.status(400);
      return next(new Error('Please fill in name, company, email, and phone'));
    }

    let finalAssignedTo = null;
    if (req.user.role === 'sales') {
      finalAssignedTo = req.user._id;
    } else if (assignedTo) {
      finalAssignedTo = assignedTo;
    }

    const lead = await Lead.create({
      name,
      company,
      email,
      phone,
      source: source || 'Website',
      status: status || 'New',
      expectedRevenue: expectedRevenue || 0,
      assignedTo: finalAssignedTo,
      customFields: req.body.customFields || {},
      notes: []
    });

    const { runAutomation } = require('../utils/automationEngine');
    await runAutomation(lead, req.user._id);

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('notes.addedBy', 'name');

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (req.user.role === 'sales' && (!lead.assignedTo || lead.assignedTo._id.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied to this lead'));
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (req.user.role === 'sales' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied to update this lead'));
    }

    const fieldsToUpdate = ['name', 'company', 'email', 'phone', 'source', 'expectedRevenue'];
    
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    if (req.user.role === 'admin' && req.body.assignedTo !== undefined) {
      lead.assignedTo = req.body.assignedTo || null;
    }

    if (req.body.status !== undefined) {
      lead.status = req.body.status;
    }

    if (req.body.customFields !== undefined) {
      lead.customFields = req.body.customFields;
    }

    const updatedLead = await lead.save();
    const { runAutomation } = require('../utils/automationEngine');
    await runAutomation(updatedLead, req.user._id);
    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    await Lead.deleteOne({ _id: lead._id });
    res.json({ message: 'Lead removed successfully' });
  } catch (error) {
    next(error);
  }
};

const assignLead = async (req, res, next) => {
  const { assignedTo } = req.body;

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user) {
        res.status(400);
        return next(new Error('Assigned user not found'));
      }
    }

    lead.assignedTo = assignedTo || null;
    const updatedLead = await lead.save();
    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const updateLeadStatus = async (req, res, next) => {
  const { status } = req.body;

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (req.user.role === 'sales' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied to update lead status'));
    }

    if (!status) {
      res.status(400);
      return next(new Error('Status is required'));
    }

    lead.status = status;
    const updatedLead = await lead.save();
    const { runAutomation } = require('../utils/automationEngine');
    await runAutomation(updatedLead, req.user._id);
    res.json(updatedLead);
  } catch (error) {
    next(error);
  }
};

const addLeadNote = async (req, res, next) => {
  const { text } = req.body;

  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404);
      return next(new Error('Lead not found'));
    }

    if (req.user.role === 'sales' && (!lead.assignedTo || lead.assignedTo.toString() !== req.user._id.toString())) {
      res.status(403);
      return next(new Error('Access denied to add notes'));
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

      let finalAssignedTo = null;
      if (req.user.role === 'sales') {
        finalAssignedTo = req.user._id;
      } else if (l.assignedTo) {
        finalAssignedTo = l.assignedTo;
      }

      validLeads.push({
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        source: l.source || 'Website',
        status: l.status || 'New',
        expectedRevenue: l.expectedRevenue || 0,
        assignedTo: finalAssignedTo,
        customFields: l.customFields || {},
        notes: []
      });
    }

    if (validLeads.length === 0) {
      res.status(400).json({
        message: 'No valid leads found in import body',
        errors
      });
      return;
    }

    const createdLeads = await Lead.insertMany(validLeads);

    const { runAutomation } = require('../utils/automationEngine');
    for (const createdLead of createdLeads) {
      await runAutomation(createdLead, req.user._id);
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
