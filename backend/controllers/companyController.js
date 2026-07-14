const Company = require('../models/Company');

const getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({}).populate('assignedTo', 'name email');
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const { name, industry, website, phone, address, assignedTo } = req.body;
    const company = await Company.create({
      name,
      industry,
      website,
      phone,
      address,
      assignedTo: assignedTo || req.user._id
    });
    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      res.status(404);
      return next(new Error('Company not found'));
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findOneAndDelete({ _id: req.params.id });
    if (!company) {
      res.status(404);
      return next(new Error('Company not found'));
    }
    res.json({ message: 'Company removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany
};
