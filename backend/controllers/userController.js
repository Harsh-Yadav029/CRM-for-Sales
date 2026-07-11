const crypto = require('crypto');
const User = require('../models/User');
const Invite = require('../models/Invite');
const Tenant = require('../models/Tenant');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Contact = require('../models/Contact');
const Task = require('../models/Task');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');

// @desc    Get all users in active organization
// @route   GET /api/users
// @access  Private (Admin/Manager)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenantId })
      .populate('reportsTo', 'name email')
      .select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate or reactivate teammate access
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res, next) => {
  const { isActive } = req.body;

  try {
    if (req.params.id === req.user._id.toString()) {
      res.status(400);
      return next(new Error('Cannot alter your own activation status'));
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate organization invitation token
// @route   POST /api/users/invites
// @access  Private (Admin only)
const createInvite = async (req, res, next) => {
  const { email, role, reportsTo } = req.body;

  try {
    if (!email) {
      res.status(400);
      return next(new Error('Invite email is required'));
    }

    // Verify email is not already registered in this tenant
    const existingUser = await User.findOne({ email, tenantId: req.tenantId });
    if (existingUser) {
      res.status(400);
      return next(new Error('User with this email is already registered in your organization'));
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    const invite = await Invite.create({
      tenantId: req.tenantId,
      email,
      role: role || 'rep',
      reportsTo: reportsTo || null,
      token,
      expiresAt
    });

    // Simulate sending email notification by printing to logs
    console.log('\n--- [SIMULATED INVITATION MAIL] ---');
    console.log(`To: ${email}`);
    console.log(`Subject: Invitation to join Walk The Plan CRM`);
    console.log(`Accept Link: http://localhost:5173/register?token=${token}`);
    console.log('-----------------------------------\n');

    res.status(201).json({
      message: 'Invitation generated successfully',
      invite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invitations
// @route   GET /api/users/invites
// @access  Private (Admin/Manager)
const getInvites = async (req, res, next) => {
  try {
    const invites = await Invite.find({ tenantId: req.tenantId })
      .populate('reportsTo', 'name email');
    res.json(invites);
  } catch (error) {
    next(error);
  }
};

// @desc    Export whole tenant database records as JSON
// @route   GET /api/users/export-data
// @access  Private (Admin only)
const exportTenantData = async (req, res, next) => {
  try {
    const scope = { tenantId: req.tenantId };

    const [leads, companies, contacts, tasks, products, quotes, invoices] = await Promise.all([
      Lead.find(scope),
      Company.find(scope),
      Contact.find(scope),
      Task.find(scope),
      Product.find(scope),
      Quote.find(scope),
      Invoice.find(scope)
    ]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=tenant_export_${req.tenantId}.json`);

    res.json({
      exportedAt: new Date(),
      tenantId: req.tenantId,
      summary: {
        leads: leads.length,
        companies: companies.length,
        contacts: contacts.length,
        tasks: tasks.length,
        products: products.length,
        quotes: quotes.length,
        invoices: invoices.length
      },
      data: {
        leads,
        companies,
        contacts,
        tasks,
        products,
        quotes,
        invoices
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate organization tenant access
// @route   POST /api/users/deactivate-tenant
// @access  Private (Admin only)
const deactivateTenant = async (req, res, next) => {
  try {
    // Find tenant settings or update tenant status
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      res.status(404);
      return next(new Error('Tenant organization not found'));
    }

    // Set setting flag for inactive
    tenant.settings = tenant.settings || new Map();
    tenant.settings.set('isActive', false);
    await tenant.save();

    // Deactivate all users belonging to this tenant
    await User.updateMany({ tenantId: req.tenantId }, { isActive: false });

    res.json({ message: 'Organization tenant and all member accounts deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUserStatus,
  createInvite,
  getInvites,
  exportTenantData,
  deactivateTenant
};
