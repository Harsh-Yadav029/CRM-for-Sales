require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');
const crypto = require('crypto');

// Import models
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Event = require('./models/Event');

// Import controllers / helpers to test
const { getSubordinateIds, buildLeadSharingQuery } = require('./utils/sharingRules');
const { verifyNylasSignature } = require('./middleware/webhookVerify');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sales-crm-test';

const runTests = async () => {
  console.log('--- Starting Integration Tests for Calendar & Scheduling Module ---');
  
  await mongoose.connect(MONGODB_URI);
  console.log('[Test] Connected to Database');

  // Clean test databases
  await Tenant.deleteMany({});
  await User.deleteMany({});
  await Event.deleteMany({});

  // Setup Organizations (Tenants)
  const tenantA = await Tenant.create({ name: 'Org A' });
  const tenantB = await Tenant.create({ name: 'Org B' });

  // Setup Users for Org A
  const adminA = await User.create({
    name: 'Admin A',
    email: 'adminA@orga.com',
    password: 'password123',
    role: 'admin',
    tenantId: tenantA._id
  });

  const repA1 = await User.create({
    name: 'Rep A1',
    email: 'repA1@orga.com',
    password: 'password123',
    role: 'rep',
    tenantId: tenantA._id
  });

  const repA2 = await User.create({
    name: 'Rep A2',
    email: 'repA2@orga.com',
    password: 'password123',
    role: 'rep',
    tenantId: tenantA._id
  });

  // Setup User for Org B
  const adminB = await User.create({
    name: 'Admin B',
    email: 'adminB@orgb.com',
    password: 'password123',
    role: 'admin',
    tenantId: tenantB._id
  });

  // Test 1: Tenant Isolation
  console.log('[Test 1] Testing Tenant Isolation...');
  const eventA = await Event.create({
    title: 'Org A Private Meeting',
    type: 'meeting',
    startTime: new Date('2026-07-13T10:00:00Z'),
    endTime: new Date('2026-07-13T11:00:00Z'),
    timezone: 'UTC',
    assignedTo: adminA._id,
    tenantId: tenantA._id
  });

  const eventB = await Event.create({
    title: 'Org B Private Meeting',
    type: 'meeting',
    startTime: new Date('2026-07-13T10:00:00Z'),
    endTime: new Date('2026-07-13T11:00:00Z'),
    timezone: 'UTC',
    assignedTo: adminB._id,
    tenantId: tenantB._id
  });

  // Mock Request for Org B Admin
  const reqB = {
    tenantId: tenantB._id,
    user: adminB
  };
  const queryB = await buildLeadSharingQuery(reqB);
  const eventsForB = await Event.find(queryB);
  
  assert.strictEqual(eventsForB.length, 1);
  assert.strictEqual(eventsForB[0].title, 'Org B Private Meeting');
  console.log('✔ Tenant Isolation Passed: Org B cannot access Org A events.');

  // Test 2: Ownership Scoping
  console.log('[Test 2] Testing Ownership Scoping (Rep vs Teammate)...');
  const repEvent = await Event.create({
    title: 'Rep A1 Private Deal Call',
    type: 'call',
    startTime: new Date('2026-07-13T11:00:00Z'),
    endTime: new Date('2026-07-13T12:00:00Z'),
    timezone: 'UTC',
    assignedTo: repA1._id,
    tenantId: tenantA._id
  });

  const reqRepA2 = {
    tenantId: tenantA._id,
    user: repA2
  };
  const queryRepA2 = await buildLeadSharingQuery(reqRepA2);
  const eventsForRepA2 = await Event.find(queryRepA2);
  
  // Rep A2 should not see Rep A1's event
  const containsRepA1Event = eventsForRepA2.some(e => e._id.toString() === repEvent._id.toString());
  assert.strictEqual(containsRepA1Event, false);
  console.log('✔ Ownership Scoping Passed: Rep A2 cannot access Rep A1 events.');

  // Test 3: Availability / Free-Busy Booking Conflict Checking
  console.log('[Test 3] Testing Availability Double-Booking Conflicts...');
  // Check availability for Rep A1 in a window that overlaps the Rep A1 Private Deal Call (11:00 to 12:00)
  const startTimeToCheck = new Date('2026-07-13T11:30:00Z');
  const endTimeToCheck = new Date('2026-07-13T12:30:00Z');

  // Query busy blocks
  const conflictingEvents = await Event.find({
    tenantId: tenantA._id,
    assignedTo: repA1._id,
    status: { $ne: 'cancelled' },
    startTime: { $lt: endTimeToCheck },
    endTime: { $gt: startTimeToCheck }
  });

  assert.strictEqual(conflictingEvents.length, 1);
  assert.strictEqual(conflictingEvents[0].title, 'Rep A1 Private Deal Call');
  console.log('✔ Availability Check Passed: Correctly flagged a double-booking conflict.');

  // Test 4: Webhook Signature Rejection
  console.log('[Test 4] Testing Webhook Signature Rejection...');
  const secret = 'nylas_secret';
  process.env.NYLAS_CLIENT_SECRET = secret;
  process.env.NODE_ENV = 'production';

  const body = { test: 'data' };
  const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
  const forgedSignature = 'forged_signature_hash';

  const mockRes = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (obj) {
      this.body = obj;
      return this;
    }
  };

  // Valid signature execution
  let nextCalled = false;
  verifyNylasSignature(
    { headers: { 'x-nylas-signature': signature }, body },
    mockRes,
    () => { nextCalled = true; }
  );
  assert.strictEqual(nextCalled, true);

  // Invalid signature execution
  let invalidNextCalled = false;
  const mockResForf = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (obj) {
      this.body = obj;
      return this;
    }
  };
  verifyNylasSignature(
    { headers: { 'x-nylas-signature': forgedSignature }, body },
    mockResForf,
    () => { invalidNextCalled = true; }
  );

  assert.strictEqual(invalidNextCalled, false);
  assert.strictEqual(mockResForf.statusCode, 401);
  console.log('✔ Webhook Rejection Passed: Forged Nylas signatures are rejected.');

  console.log('\n--- All integration tests passed successfully! ---');
  await mongoose.disconnect();
  process.exit(0);
};

runTests().catch(err => {
  console.error('[Error] Test suite execution failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
