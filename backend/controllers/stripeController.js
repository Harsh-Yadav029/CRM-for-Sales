const stripe = require('stripe');
const Tenant = require('../models/Tenant');

// Helper to check if Stripe is configured
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return stripe(secretKey);
};

// @desc    Create a Stripe Checkout Session
// @route   POST /api/stripe/create-checkout-session
// @access  Private (Admin only)
const createCheckoutSession = async (req, res, next) => {
  const { plan } = req.body; // 'growth' or 'enterprise'

  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      res.status(404);
      return next(new Error('Tenant organization not found'));
    }

    const stripeInstance = getStripeInstance();
    if (!stripeInstance) {
      // Resilient local simulation mode when Stripe key is missing
      const simulatedUrl = `http://localhost:5173/billing/callback?session_id=mock_session_${Date.now()}&tenantId=${req.tenantId}&plan=${plan || 'growth'}`;
      return res.json({
        url: simulatedUrl,
        mode: 'stripe_simulation'
      });
    }

    // Map plans to Stripe product prices (configured in developer's Stripe console)
    const priceMap = {
      growth: process.env.STRIPE_PRICE_GROWTH || 'price_growth_placeholder',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder'
    };

    const priceId = priceMap[plan.toLowerCase()] || priceMap.growth;

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `http://localhost:5173/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/billing/cancel`,
      client_reference_id: req.tenantId.toString(),
      customer_email: req.user.email,
      metadata: {
        tenantId: req.tenantId.toString(),
        plan: plan.toLowerCase()
      }
    });

    res.json({ url: session.url, mode: 'live_stripe' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Stripe Customer Portal Session for billing settings
// @route   POST /api/stripe/create-portal-session
// @access  Private (Admin only)
const createPortalSession = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      res.status(404);
      return next(new Error('Tenant organization not found'));
    }

    const stripeInstance = getStripeInstance();
    
    // Simulate portal link if Stripe is not configured or no customer ID exists yet
    if (!stripeInstance || !tenant.stripeCustomerId) {
      return res.json({
        url: 'http://localhost:5173/billing/portal-mock',
        mode: 'stripe_simulation'
      });
    }

    const portalSession = await stripeInstance.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: 'http://localhost:5173/billing'
    });

    res.json({ url: portalSession.url, mode: 'live_stripe' });
  } catch (error) {
    next(error);
  }
};

// @desc    Webhook handler processing billing events from Stripe
// @route   POST /api/stripe/webhook
// @access  Public
const handleWebhook = async (req, res, next) => {
  const stripeInstance = getStripeInstance();
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (stripeInstance && sig && endpointSecret) {
      // Safe cryptographic signature verification for live deployments
      event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Local development simulation payload parsing
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('--- [SIMULATED STRIPE WEBHOOK EVENT RECEIVED] ---');
      console.log('Type:', event.type);
    }

    // Process event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const tenantId = session.client_reference_id || session.metadata?.tenantId;
      const plan = session.metadata?.plan || 'growth';
      const customerId = session.customer;

      if (tenantId) {
        await Tenant.findByIdAndUpdate(tenantId, {
          subscriptionLevel: plan,
          stripeCustomerId: customerId
        });
        console.log(`[Stripe Webhook] Updated Tenant ${tenantId} to plan: ${plan}`);
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      // Look up tenant by customer ID
      const tenant = await Tenant.findOne({ stripeCustomerId: subscription.customer });
      if (tenant) {
        let newPlan = 'free'; // Downgrade to free on deletion/failures
        
        if (event.type === 'customer.subscription.updated' && subscription.status === 'active') {
          // Resolve plan from metadata or product maps
          newPlan = subscription.metadata?.plan || tenant.subscriptionLevel;
        }

        tenant.subscriptionLevel = newPlan;
        await tenant.save();
        console.log(`[Stripe Webhook] Updated Tenant ${tenant._id} subscription level to: ${newPlan}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook Error]', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhook
};
