const express = require('express');
const router = express.Router();
const { getPipelines, createPipeline, updatePipeline, deletePipeline } = require('../controllers/pipelineController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getPipelines)
  .post(createPipeline);

router.route('/:id')
  .put(updatePipeline)
  .delete(deletePipeline);

module.exports = router;
