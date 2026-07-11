const Contact = require('../models/Contact');

const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ tenantId: req.tenantId })
      .populate('companyId', 'name')
      .populate('assignedTo', 'name email');
    res.json(contacts);
  } catch (error) {
    next(error);
  }
};

const createContact = async (req, res, next) => {
  try {
    const { companyId, firstName, lastName, email, phone, title, assignedTo } = req.body;
    const contact = await Contact.create({
      tenantId: req.tenantId,
      companyId,
      firstName,
      lastName,
      email,
      phone,
      title,
      assignedTo: assignedTo || req.user._id
    });
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!contact) {
      res.status(404);
      return next(new Error('Contact not found'));
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!contact) {
      res.status(404);
      return next(new Error('Contact not found'));
    }
    res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact
};
