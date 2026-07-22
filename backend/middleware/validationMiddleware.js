const { z } = require('zod');

/**
 * Zod validation middleware: Validates request payload properties against schema rules.
 * @param {z.ZodObject} schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError || error.errors) {
        const errorMessages = (error.errors || []).map(err => err.message).join(', ');
        return res.status(400).json({
          message: errorMessages || 'Request payload validation failed',
          errors: (error.errors || []).map(err => ({
            path: Array.isArray(err.path) ? err.path.join('.') : '',
            message: err.message
          }))
        });
      }
      return res.status(400).json({
        message: error.message || 'Request payload validation failed'
      });
    }
  };
};

module.exports = { validate };
