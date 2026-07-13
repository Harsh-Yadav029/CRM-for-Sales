const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');
const { getEvents, checkAvailability } = require('./controllers/eventController');
const { verifyNylasSignature } = require('./middleware/webhookVerify');

dotenv.config();

const runTests = async () => {
  console.log('--- Starting Calendar & Scheduling Integration Tests ---');
  
  // 1. Database Connection
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sales-crm-test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // Clean test database tables
  await Event.deleteMany({ title: /Test Event/ });
  await User.deleteMany({ email: /test-user/ });

  const orgAId = new mongoose.Types.ObjectId();
  const orgBId = new mongoose.Types.ObjectId();

  // Create mock users
  const adminA = await User.create({
    name: 'Admin A',
    email: 'admin-a@test-user.com',
    password: 'mockpassword',
    role: 'admin',
    tenantId: orgAId
  });

  const repA = await User.create({
    name: 'Rep A',
    email: 'rep-a@test-user.com',
    password: 'mockpassword',
    role: 'rep',
    tenantId: orgAId
  });

  const repB = await User.create({
    name: 'Rep B',
    email: 'rep-b@test-user.com',
    password: 'mockpassword',
    role: 'rep',
    tenantId: orgAId
  });

  const userB = await User.create({
    name: 'User B',
    email: 'user-b@test-user.com',
    password: 'mockpassword',
    role: 'rep',
    tenantId: orgBId
  });

  console.log('Mock users created.');

  // 2. Tenant Isolation Test
  console.log('\nTesting Tenant Isolation...');
  const eventOrgA = await Event.create({
    tenantId: orgAId,
    type: 'meeting',
    title: 'Test Event Org A',
    startTime: new Date('2026-07-20T10:00:00Z'),
    endTime: new Date('2026-07-20T11:00:00Z'),
    assignedTo: adminA._id,
    status: 'scheduled'
  });

  // Query events under Org B context
  const mockReqB = {
    tenantId: orgBId,
    user: userB,
    query: {}
  };

  let responseData;
  const mockResB = {
    json: (data) => { responseData = data; }
  };

  await getEvents(mockReqB, mockResB, (err) => { if (err) console.error(err); });

  const orgAFound = responseData.some(e => e._id.toString() === eventOrgA._id.toString());
  if (!orgAFound) {
    console.log('✅ Success: Org A events are hidden from Org B users.');
  } else {
    console.error('❌ Fail: Tenant isolation breach. Org A event found in Org B query.');
  }

  // 3. Ownership Scoping Test
  console.log('\nTesting Rep Scoping...');
  const eventTeammate = await Event.create({
    tenantId: orgAId,
    type: 'meeting',
    title: 'Test Event Teammate',
    startTime: new Date('2026-07-20T12:00:00Z'),
    endTime: new Date('2026-07-20T13:00:00Z'),
    assignedTo: repB._id,
    status: 'scheduled'
  });

  const mockReqRepA = {
    tenantId: orgAId,
    user: repA,
    query: {}
  };

  await getEvents(mockReqRepA, mockResB, (err) => { if (err) console.error(err); });

  const teammateFound = responseData.some(e => e._id.toString() === eventTeammate._id.toString());
  if (!teammateFound) {
    console.log('✅ Success: Reps cannot query teammate events.');
  } else {
    console.error('❌ Fail: Rep scoping breach. Rep queried teammate event.');
  }

  // 4. Double Booking Check
  console.log('\nTesting Double-Booking Availability check...');
  let availabilityResult;
  const mockReqAvail = {
    tenantId: orgAId,
    body: {
      userIds: [adminA._id.toString()],
      startTime: '2026-07-20T10:30:00Z', // Overlaps with Test Event Org A (10:00-11:00)
      endTime: '2026-07-20T11:30:00Z'
    }
  };

  const mockResAvail = {
    json: (data) => { availabilityResult = data; }
  };

  await checkAvailability(mockReqAvail, mockResAvail, (err) => { if (err) console.error(err); });

  if (availabilityResult && availabilityResult.length > 0) {
    console.log('✅ Success: Availability check correctly identified conflict booking.');
  } else {
    console.error('❌ Fail: Double booking was not flagged.');
  }

  // 5. Signature Rejection
  console.log('\nTesting Webhook Signature Verification...');
  const secret = 'nylas_secret_key';
  const body = { id: 'evt_123', title: 'New Hook Meeting' };
  const validSignature = require('crypto').createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
  const invalidSignature = 'forged_signature_hex';

  // Force NODE_ENV to production to enforce signature check
  process.env.NODE_ENV = 'production';

  const isInvalidRejected = !verifyNylasSignature(invalidSignature, body, secret);
  const isValidAccepted = verifyNylasSignature(validSignature, body, secret);

  if (isInvalidRejected && isValidAccepted) {
    console.log('✅ Success: Forged webhook signature rejected and valid signature accepted.');
  } else {
    console.error('❌ Fail: Webhook signature verification mismatch.');
  }

  // Reset mock tables
  await Event.deleteMany({ title: /Test Event/ });
  await User.deleteMany({ email: /test-user/ });

  await mongoose.connection.close();
  console.log('\nDisconnected from MongoDB. Testing complete.');
};

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
