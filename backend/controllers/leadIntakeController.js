const crypto = require('crypto');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { emitUserEvent } = require('../utils/socket');
const cacheMiddleware = require('../middleware/cacheMiddleware');

// In-memory fallback cache for 5-minute idempotency deduplication
const memoryDedupeCache = new Map();

/**
 * Clean old items from memory cache to prevent leakage
 */
const cleanMemoryCache = () => {
  const now = Date.now();
  for (const [key, timestamp] of memoryDedupeCache.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      memoryDedupeCache.delete(key);
    }
  }
};

/**
 * @desc    Public webhook endpoint to receive leads from walktheplan.in website forms
 * @route   POST /api/v1/intake/lead
 * @access  Public (Authorised via secret token header)
 */
const handleLeadIntake = async (req, res, next) => {
  const { name, company, email, phone, message, serviceInterest, source, website_hp } = req.body;

  try {
    // 1. Honeypot check: silently discard bot requests without tipping them off
    if (website_hp && website_hp.trim().length > 0) {
      console.warn('Intake honeypot triggered by spam submission');
      return res.status(200).json({ status: 'success', message: 'Inquiry processed successfully' });
    }

    // 2. Secret validation header verification
    const intakeSecret = req.headers['x-intake-secret'];
    const expectedSecret = process.env.WEBSITE_INTAKE_SECRET || 'wtp_intake_secret_placeholder';
    if (!intakeSecret || intakeSecret !== expectedSecret) {
      res.status(401);
      return next(new Error('Unauthorized intake secret key mismatch'));
    }

    // 3. Client double-fire idempotency check (5 minutes)
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedMessage = (message || '').trim();
    const hash = crypto.createHash('md5').update(`${normalizedEmail}:${normalizedMessage}`).digest('hex');
    const cacheKey = `intake:dedupe:${hash}`;

    let isDuplicateRequest = false;

    // Try Redis caching first
    if (cacheMiddleware.redisClient && cacheMiddleware.isRedisReady) {
      try {
        const isExists = await cacheMiddleware.redisClient.get(cacheKey);
        if (isExists) {
          isDuplicateRequest = true;
        } else {
          await cacheMiddleware.redisClient.set(cacheKey, '1', 'EX', 300);
        }
      } catch (err) {
        console.warn('Redis intake dedupe check failed, falling back to memory:', err.message);
      }
    }

    // Fallback to in-memory cache
    if (!isDuplicateRequest) {
      cleanMemoryCache();
      if (memoryDedupeCache.has(hash)) {
        isDuplicateRequest = true;
      } else {
        memoryDedupeCache.set(hash, Date.now());
      }
    }

    if (isDuplicateRequest) {
      console.info(`Duplicate intake request blocked for email: ${normalizedEmail}`);
      return res.status(200).json({ status: 'success', message: 'Inquiry processed successfully' });
    }

    // 4. Duplicate lead detection (30-day window)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let existingLead = null;

    if (normalizedEmail) {
      existingLead = await Lead.findOne({ email: normalizedEmail, createdAt: { $gte: thirtyDaysAgo } });
    } else if (phone) {
      existingLead = await Lead.findOne({ phone: phone.trim(), createdAt: { $gte: thirtyDaysAgo } });
    }

    if (existingLead) {
      // Append inquiry text to existing lead's notes timeline
      existingLead.notes.push({
        text: normalizedMessage || `Repeated inquiry submitted via website for interest: ${serviceInterest || 'unspecified'}`,
        addedBySystem: true,
        type: 'note'
      });
      await existingLead.save();

      console.info(`Inquiry appended to existing lead ID: ${existingLead._id}`);
      return res.status(200).json({
        status: 'success',
        message: 'Inquiry appended successfully',
        leadId: existingLead._id
      });
    }

    // 5. Create a new Lead
    // Set fallback placeholders to satisfy schema required: true constraints
    const finalEmail = normalizedEmail || 'not-provided@intake.walktheplan.in';
    const finalPhone = (phone || '').trim() || 'Not provided';
    const finalCompany = (company || '').trim() || 'Individual';

    // Map service interest free-text to recognized VR categories enum
    let serviceCategory = 'Other';
    const interestLower = (serviceInterest || '').toLowerCase();
    if (interestLower.includes('interior')) {
      serviceCategory = 'Interior VR';
    } else if (interestLower.includes('elevation')) {
      serviceCategory = 'Elevation VR';
    } else if (interestLower.includes('full') || interestLower.includes('3d')) {
      serviceCategory = 'Full-Scale 3D';
    } else if (interestLower.includes('plan') || interestLower.includes('conversion')) {
      serviceCategory = 'Plan Conversion';
    }

    const lead = await Lead.create({
      name: name.trim(),
      company: finalCompany,
      email: finalEmail,
      phone: finalPhone,
      source: source || 'Website',
      status: 'New',
      serviceCategory,
      notes: [{
        text: normalizedMessage || `Initial website inquiry received for interest: ${serviceInterest || 'unspecified'}`,
        addedBySystem: true,
        type: 'note'
      }]
    });

    // 6. Fan out in-app notifications to active Admins & Managers
    const recipients = await User.find({
      role: { $in: ['admin', 'manager'] },
      isActive: true
    });

    await Promise.all(
      recipients.map(async (user) => {
        try {
          const notification = await Notification.create({
            userId: user._id,
            title: 'New website inquiry',
            message: `${name} submitted an inquiry via walktheplan.in`,
            link: `/leads/${lead._id}`
          });
          emitUserEvent(user._id.toString(), 'notification_received', notification);
        } catch (err) {
          console.error(`Failed to dispatch notification to user ${user._id}:`, err.message);
        }
      })
    );

    console.info(`Successfully created new lead ${lead._id} from public intake`);
    return res.status(201).json({
      status: 'success',
      message: 'Lead created successfully',
      leadId: lead._id
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { handleLeadIntake };
