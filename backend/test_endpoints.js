const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');
const { getEvents, checkAvailability } = require('./controllers/eventController');
const { verifyNylasSignature } = require('./middleware/webhookVerify');

dotenv.config();

const runTests = async () => {
  console.log('--- Starting Walk the Plan CRM Integration Tests ---');
  
  // 1. Database Connection
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sales-crm-test';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // Clean test database tables
  await Event.deleteMany({ title: /Test Event/ });
  await User.deleteMany({ email: /test-user/ });

  // Create mock users (No tenantId)
  const adminA = await User.create({
    name: 'Admin A',
    email: 'admin-a@test-user.com',
    password: 'mockpassword',
    role: 'admin'
  });

  const repA = await User.create({
    name: 'Rep A',
    email: 'rep-a@test-user.com',
    password: 'mockpassword',
    role: 'rep',
    reportsTo: adminA._id
  });

  const repB = await User.create({
    name: 'Rep B',
    email: 'rep-b@test-user.com',
    password: 'mockpassword',
    role: 'rep',
    reportsTo: adminA._id
  });

  console.log('Mock users created.');

  // 2. Data Visibility & Ownership Scoping Test
  console.log('\nTesting Ownership Scoping & Visibility...');
  
  const eventRepA = await Event.create({
    type: 'meeting',
    title: 'Test Event Rep A',
    startTime: new Date('2026-07-20T10:00:00Z'),
    endTime: new Date('2026-07-20T11:00:00Z'),
    assignedTo: repA._id,
    status: 'scheduled'
  });

  const eventRepB = await Event.create({
    type: 'meeting',
    title: 'Test Event Rep B',
    startTime: new Date('2026-07-20T12:00:00Z'),
    endTime: new Date('2026-07-20T13:00:00Z'),
    assignedTo: repB._id,
    status: 'scheduled'
  });

  // Query events under Rep A context (should only see Rep A's events)
  const mockReqRepA = {
    user: repA,
    query: {}
  };

  let responseData;
  const mockRes = {
    json: (data) => { responseData = data; }
  };

  await getEvents(mockReqRepA, mockRes, (err) => { if (err) console.error(err); });

  const foundOwnEvent = responseData.some(e => e._id.toString() === eventRepA._id.toString());
  const foundTeammateEvent = responseData.some(e => e._id.toString() === eventRepB._id.toString());

  if (foundOwnEvent && !foundTeammateEvent) {
    console.log('✅ Success: Rep A can only see their own assigned events.');
  } else {
    console.error('❌ Fail: Rep scoping breach. Own event found:', foundOwnEvent, 'Teammate event found:', foundTeammateEvent);
  }

  // Query events under Admin A context (should see both events)
  const mockReqAdmin = {
    user: adminA,
    query: {}
  };

  await getEvents(mockReqAdmin, mockRes, (err) => { if (err) console.error(err); });

  const adminFoundA = responseData.some(e => e._id.toString() === eventRepA._id.toString());
  const adminFoundB = responseData.some(e => e._id.toString() === eventRepB._id.toString());

  if (adminFoundA && adminFoundB) {
    console.log('✅ Success: Admin can see all team member events.');
  } else {
    console.error('❌ Fail: Admin visibility constraint error.');
  }

  // 3. Double Booking Check
  console.log('\nTesting Double-Booking Availability check...');
  let availabilityResult;
  const mockReqAvail = {
    body: {
      userIds: [repA._id.toString()],
      startTime: '2026-07-20T10:30:00Z', // Overlaps with Test Event Rep A (10:00-11:00)
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

  // 4. Webhook Signature Verification
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

  // 5. Public Website Lead Intake Tests
  console.log('\nTesting Public Lead Intake integration...');
  process.env.WEBSITE_INTAKE_SECRET = 'test_intake_secret_123';

  // Helper mock request and response factories
  const createMockRes = () => {
    let statusCode = 200;
    let responseData = null;
    return {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
      sendStatus(code) {
        statusCode = code;
        return this;
      },
      getStatusCode() { return statusCode; },
      getResponseData() { return responseData; }
    };
  };

  const { handleLeadIntake } = require('./controllers/leadIntakeController');
  const Lead = require('./models/Lead');
  const Notification = require('./models/Notification');

  // Clean mock leads/notifications before run
  await Lead.deleteMany({ email: /intake/ });
  await Notification.deleteMany({ title: 'New website inquiry' });

  // Test Case A: Missing or invalid secret key
  const mockReqA = {
    headers: { 'x-intake-secret': 'invalid_secret' },
    body: { name: 'Test Intake User', email: 'testA@intake.walktheplan.in' }
  };
  const mockResA = createMockRes();
  let errorObjA = null;
  await handleLeadIntake(mockReqA, mockResA, (err) => { errorObjA = err; });

  if (mockResA.getStatusCode() === 401 || errorObjA) {
    console.log('✅ Success: Reject unauthorized requests with 401.');
  } else {
    console.error('❌ Fail: Failed to reject request with invalid secret key.', mockResA.getStatusCode());
  }

  // Test Case B: Honeypot trigger
  const mockReqB = {
    headers: { 'x-intake-secret': 'test_intake_secret_123' },
    body: { name: 'Bot User', email: 'bot@intake.walktheplan.in', website_hp: 'honey_value' }
  };
  const mockResB = createMockRes();
  await handleLeadIntake(mockReqB, mockResB, (err) => { if (err) console.error(err); });

  const leadB = await Lead.findOne({ email: 'bot@intake.walktheplan.in' });
  if (mockResB.getStatusCode() === 200 && !leadB) {
    console.log('✅ Success: Silent discard of honeypot requests (returned 200 without creating lead).');
  } else {
    console.error('❌ Fail: Honeypot check failed. Lead created:', !!leadB);
  }

  // Test Case C: Valid new lead creation
  const mockReqC = {
    headers: { 'x-intake-secret': 'test_intake_secret_123' },
    body: {
      name: 'Priya Sharma',
      email: 'priya@intake.walktheplan.in',
      phone: '9876543210',
      message: 'Looking for Elevation VR services.',
      serviceInterest: 'Elevation VR'
    }
  };
  const mockResC = createMockRes();
  await handleLeadIntake(mockReqC, mockResC, (err) => { if (err) console.error(err); });

  const leadC = await Lead.findOne({ email: 'priya@intake.walktheplan.in' });
  if (leadC && leadC.serviceCategory === 'Elevation VR' && leadC.notes[0].addedBySystem === true) {
    console.log('✅ Success: New lead correctly mapped and logged with system note.');
  } else {
    console.error('❌ Fail: Valid lead creation failed.');
  }

  // Test Case D: Duplicate query within 30 days
  const mockReqD = {
    headers: { 'x-intake-secret': 'test_intake_secret_123' },
    body: {
      name: 'Priya Sharma',
      email: 'priya@intake.walktheplan.in',
      phone: '9876543210',
      message: 'Also interested in Interior VR options.',
      serviceInterest: 'Interior VR'
    }
  };
  const mockResD = createMockRes();
  await handleLeadIntake(mockReqD, mockResD, (err) => { if (err) console.error(err); });

  const leadDList = await Lead.find({ email: 'priya@intake.walktheplan.in' });
  if (leadDList.length === 1 && leadDList[0].notes.length === 2) {
    console.log('✅ Success: Duplicate request appended to existing lead timeline instead of creating a second lead.');
  } else {
    console.error('❌ Fail: Duplicate check failed. Leads count:', leadDList.length, 'Notes count:', leadDList[0]?.notes.length);
  }

  // Test Case E: Idempotency double submit block
  const mockReqE = {
    headers: { 'x-intake-secret': 'test_intake_secret_123' },
    body: {
      name: 'Priya Sharma',
      email: 'priya@intake.walktheplan.in',
      phone: '9876543210',
      message: 'Also interested in Interior VR options.',
      serviceInterest: 'Interior VR'
    }
  };
  const mockResE = createMockRes();
  await handleLeadIntake(mockReqE, mockResE, (err) => { if (err) console.error(err); });

  const leadEList = await Lead.find({ email: 'priya@intake.walktheplan.in' });
  if (leadEList[0].notes.length === 2) {
    console.log('✅ Success: Blocked immediate double-submit (idempotency check passed).');
  } else {
    console.error('❌ Fail: Idempotency check failed. Notes count should be 2, but got:', leadEList[0]?.notes.length);
  }

  // Test Case F: Notification loops verify
  const notificationsCount = await Notification.countDocuments({ title: 'New website inquiry' });
  if (notificationsCount > 0) {
    console.log(`✅ Success: Notifications fanned out individually (${notificationsCount} created).`);
  } else {
    console.error('❌ Fail: Notification loop failed to create any notifications.');
  }

  // Reset mock tables
  await Lead.deleteMany({ email: /intake/ });
  await Notification.deleteMany({ title: 'New website inquiry' });
  await Event.deleteMany({ title: /Test Event/ });
  await User.deleteMany({ email: /test-user/ });

  await mongoose.connection.close();
  console.log('\nDisconnected from MongoDB. Testing complete.');
};

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
