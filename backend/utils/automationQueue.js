const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let automationQueue = null;
let useRedisFallback = true;
let redisConnection = null;

let warnedRedisFailed = false;

try {
  // Test connection to Redis
  redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 2000, // fail fast if Redis is offline
    retryStrategy(times) {
      if (times > 3) {
        // Stop attempting to reconnect after 3 attempts
        return null; 
      }
      return Math.min(times * 200, 1000);
    }
  });

  redisConnection.on('connect', () => {
    console.log('Successfully connected to Redis. Initializing BullMQ queues...');
    useRedisFallback = false;
    initializeBullMQ();
  });

  redisConnection.on('error', (err) => {
    if (useRedisFallback && !warnedRedisFailed) {
      console.warn('Redis connection failed. Falling back to in-memory asynchronous worker (bullmq bypassed)...');
      warnedRedisFailed = true;
    }
  });
} catch (e) {
  if (!warnedRedisFailed) {
    console.warn('Redis connection could not be instantiated. Using local fallback.');
    warnedRedisFailed = true;
  }
}

function initializeBullMQ() {
  automationQueue = new Queue('automationQueue', { connection: redisConnection });

  automationQueue.on('error', (err) => {
    console.warn('[BullMQ Queue] Connection error:', err.message);
  });

  // Initialize Worker
  const worker = new Worker('automationQueue', async (job) => {
    const { type, data, actorId } = job.data;
    console.log(`[BullMQ Worker] Processing job ${job.id} of type ${type}`);
    await processJobLogic(type, data, actorId);
  }, { connection: redisConnection });

  worker.on('error', (err) => {
    console.warn('[BullMQ Worker] Connection error:', err.message);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job.id} failed:`, err);
  });
}

// Actual background task logic
async function processJobLogic(type, data, actorId) {
  if (type === 'RUN_AUTOMATION') {
    const Lead = require('../models/Lead');
    const { runAutomation } = require('./automationEngine');
    const lead = await Lead.findById(data.leadId);
    if (lead) {
      await runAutomation(lead, actorId);
    }
  }
  // Future background jobs (e.g. Nylas syncs, bulk imports, delayed emails) can be added here
}

/**
 * Enqueues a job to the background worker. Falls back to in-memory processing if Redis is unavailable.
 * @param {string} type - Job category (e.g. 'RUN_AUTOMATION')
 * @param {Object} data - Parameters needed by the job
 * @param {string} actorId - User ID triggering the transaction
 */
const enqueueAutomationJob = async (type, data, actorId) => {
  if (!useRedisFallback && automationQueue) {
    try {
      await automationQueue.add(type, { type, data, actorId }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });
      console.log(`[Queue Manager] Enqueued job of type ${type} in BullMQ`);
      return;
    } catch (err) {
      console.warn('BullMQ enqueue failed. Falling back to in-memory execution:', err.message);
    }
  }

  // Resilient In-Memory Asynchronous Fallback
  setImmediate(async () => {
    try {
      console.log(`[Local Fallback] Processing job of type ${type} asynchronously`);
      await processJobLogic(type, data, actorId);
    } catch (err) {
      console.error('[Local Fallback] Job execution failed:', err);
    }
  });
};

module.exports = {
  enqueueAutomationJob
};
