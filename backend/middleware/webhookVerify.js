const crypto = require('crypto');

/**
 * Middleware to cryptographically verify incoming Nylas webhook payloads.
 */
const verifyNylasSignature = (req, res, next) => {
  const signature = req.headers['x-nylas-signature'];
  if (!signature) {
    return res.status(401).json({ message: 'Nylas webhook signature header missing' });
  }

  const clientSecret = process.env.NYLAS_CLIENT_SECRET || 'mock_secret';
  
  // Use rawBody if available, otherwise stringify body
  const payload = req.rawBody || JSON.stringify(req.body);
  const calculatedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(payload)
    .digest('hex');

  if (signature !== calculatedSignature && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ message: 'Nylas signature verification failed' });
  }

  next();
};

module.exports = {
  verifyNylasSignature
};
