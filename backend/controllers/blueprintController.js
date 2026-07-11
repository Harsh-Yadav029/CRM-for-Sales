const Blueprint = require('../models/Blueprint');

const getBlueprints = async (req, res, next) => {
  try {
    const blueprints = await Blueprint.find({ tenantId: req.tenantId }).populate('pipelineId', 'name');
    res.json(blueprints);
  } catch (error) {
    next(error);
  }
};

const createBlueprint = async (req, res, next) => {
  try {
    const { name, pipelineId, transitions, isActive } = req.body;
    
    // If setting active, deactivate other blueprints to avoid conflicts
    if (isActive) {
      await Blueprint.updateMany({ tenantId: req.tenantId }, { isActive: false });
    }

    const blueprint = await Blueprint.create({
      tenantId: req.tenantId,
      name,
      pipelineId,
      transitions,
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json(blueprint);
  } catch (error) {
    next(error);
  }
};

const updateBlueprint = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (isActive) {
      await Blueprint.updateMany({ tenantId: req.tenantId }, { isActive: false });
    }

    const blueprint = await Blueprint.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!blueprint) {
      res.status(404);
      return next(new Error('Blueprint not found'));
    }
    res.json(blueprint);
  } catch (error) {
    next(error);
  }
};

const deleteBlueprint = async (req, res, next) => {
  try {
    const blueprint = await Blueprint.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!blueprint) {
      res.status(404);
      return next(new Error('Blueprint not found'));
    }
    res.json({ message: 'Blueprint removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBlueprints,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint
};
