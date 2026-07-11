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
      return res.status(400).json({
        message: 'Request payload validation failed',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
  };
};

module.exports = { validate };
