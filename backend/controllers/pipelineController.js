const Pipeline = require('../models/Pipeline');

const getPipelines = async (req, res, next) => {
  try {
    const pipelines = await Pipeline.find({});
    res.json(pipelines);
  } catch (error) {
    next(error);
  }
};

const createPipeline = async (req, res, next) => {
  try {
    const { name, stages, description } = req.body;
    const pipeline = await Pipeline.create({
      name,
      stages,
      description
    });
    res.status(201).json(pipeline);
  } catch (error) {
    next(error);
  }
};

const updatePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!pipeline) {
      res.status(404);
      return next(new Error('Pipeline not found'));
    }
    res.json(pipeline);
  } catch (error) {
    next(error);
  }
};

const deletePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findOneAndDelete({ _id: req.params.id });
    if (!pipeline) {
      res.status(404);
      return next(new Error('Pipeline not found'));
    }
    res.json({ message: 'Pipeline removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPipelines,
  createPipeline,
  updatePipeline,
  deletePipeline
};
