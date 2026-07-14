const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient = null;
let isRedisReady = false;

try {
  redisClient = new IORedis(REDIS_URL, {
    connectTimeout: 1500, // Fail fast if Redis is offline
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop reconnecting after 3 attempts
      }
      return Math.min(times * 200, 1000);
    }
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully for route caching.');
    isRedisReady = true;
  });

  redisClient.on('error', () => {
    isRedisReady = false;
  });
} catch (error) {
  console.warn('Redis route caching initialization failed. Fail-safe active.');
}

/**
 * Tenant-scoped Route Caching middleware
 * @param {number} durationSeconds - Expiration time in seconds
 */
const cacheMiddleware = (durationSeconds = 300) => {
  return async (req, res, next) => {
    // If Redis is offline or not initialized, bypass caching cleanly
    if (!isRedisReady || !redisClient) {
      return next();
    }

    // Scoped cache key for the route
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await redisClient.get(cacheKey);
      if (cachedResponse) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Cache-Status', 'HIT');
        return res.send(JSON.parse(cachedResponse));
      }

      // Intercept the response send method to write to cache before delivering
      res.originalSend = res.send;
      res.send = (body) => {
        res.originalSend(body);
        
        // Save to cache asynchronously, ignoring errors to prevent request blocks
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.set(cacheKey, JSON.stringify(body), 'EX', durationSeconds)
            .catch(err => console.warn('Cache write failed:', err.message));
        }
      };

      next();
    } catch (err) {
      console.warn('Cache lookup failed. Falling back to database:', err.message);
      next();
    }
  };
};

module.exports = cacheMiddleware;
