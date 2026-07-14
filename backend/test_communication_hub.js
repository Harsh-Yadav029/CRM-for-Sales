const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Lead = require('./models/Lead');
const Project = require('./models/Project');
const Email = require('./models/Email');
const CallLog = require('./models/CallLog');
const Meeting = require('./models/Meeting');
const Note = require('./models/Note');
const ActivityTimeline = require('./models/ActivityTimeline');
const Feedback = require('./models/Feedback');
const AISummary = require('./models/AISummary');
const Task = require('./models/Task');
const User = require('./models/User');

const {
  sendEmail,
  logCall,
  scheduleMeeting,
  createNote,
  createFeedback,
  getAiSummary
} = require('./controllers/communicationHubController');

// Mock request and response helpers
const createMockResponse = () => {
  let statusCode = 200;
  let data = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      data = body;
      return this;
    },
    getStatusCode() { return statusCode; },
    getData() { return data; }
  };
};

const runHubTests = async () => {
  console.log('--- Starting Walk the Plan CRM Communication Hub Tests ---');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clean mock collections
  await Lead.deleteMany({ email: /test-hub/ });
  await Project.deleteMany({ name: /Test Hub Project/ });
  await Email.deleteMany({ receiver: /test-hub/ });
  await CallLog.deleteMany({ notes: /Test Hub Call/ });
  await Meeting.deleteMany({ notes: /Test Hub Meeting/ });
  await Note.deleteMany({ text: /Test Hub Note/ });
  await ActivityTimeline.deleteMany({ description: /Test Hub/ });
  await Feedback.deleteMany({ comments: /Test Hub/ });
  await AISummary.deleteMany({ budget: 15000000 });
  await Task.deleteMany({ title: /Test Hub/ });
  await User.deleteMany({ email: /test-hub/ });

  // Create Mock User
  const mockUser = await User.create({
    name: 'Test Hub Executive',
    email: 'test-hub-exec@walktheplan.in',
    password: 'password123',
    role: 'admin'
  });

  // Create Mock Lead
  const mockLead = await Lead.create({
    name: 'Rahul Sharma',
    company: 'WTP Test Co',
    email: 'rahul-test-hub@client.in',
    phone: '9998887776',
    status: 'New'
  });

  // 1. Email Send & Timeline Log Test
  console.log('\nTesting Outbound Email Lifecycle...');
  const emailReq = {
    user: mockUser,
    body: {
      subject: 'VR Session Invitation',
      body: 'Hi Rahul, let us connect for the walkthrough.',
      receiver: 'rahul-test-hub@client.in',
      clientType: 'Lead',
      clientId: mockLead._id
    }
  };
  const emailRes = createMockResponse();
  await sendEmail(emailReq, emailRes, (err) => { if (err) console.error(err); });

  const emailTimeline = await ActivityTimeline.findOne({
    clientId: mockLead._id,
    activityType: 'Email Sent'
  });

  if (emailTimeline && emailTimeline.description.includes('VR Session Invitation')) {
    console.log('✅ Success: Email sent, logged, and synced to ActivityTimeline.');
  } else {
    console.error('❌ Fail: Email timeline synchronization failed.');
  }

  // 2. Call Log Missed & Follow-up Task Automation Test
  console.log('\nTesting Call Logging & Automated Redial Task...');
  const callReq = {
    user: mockUser,
    body: {
      duration: 0,
      notes: 'Test Hub Call missed by prospect',
      status: 'missed',
      clientType: 'Lead',
      clientId: mockLead._id
    }
  };
  const callRes = createMockResponse();
  await logCall(callReq, callRes, (err) => { if (err) console.error(err); });

  const followUpTask = await Task.findOne({
    title: 'Redial missed contact',
    assignedTo: mockUser._id
  });

  if (followUpTask && followUpTask.status === 'open') {
    console.log('✅ Success: Missed call logged and open follow-up task triggered.');
  } else {
    console.error('❌ Fail: Failed to auto-trigger redial task.');
  }

  // 3. Meeting Schedule & Prep Task Automation Test
  console.log('\nTesting Meeting Scheduling & Automated Prep Task...');
  const meetReq = {
    user: mockUser,
    body: {
      meetingType: 'VR Session',
      date: new Date(),
      time: '4:00 PM',
      location: 'Showroom Cabin A',
      conferenceLink: 'https://meet.google.com/test-meet',
      notes: 'Test Hub Meeting',
      clientType: 'Lead',
      clientId: mockLead._id
    }
  };
  const meetRes = createMockResponse();
  await scheduleMeeting(meetReq, meetRes, (err) => { if (err) console.error(err); });

  const prepTask = await Task.findOne({
    title: 'Prepare VR files for VR Session',
    assignedTo: mockUser._id
  });

  if (prepTask) {
    console.log('✅ Success: VR session scheduled and automated prep task generated.');
  } else {
    console.error('❌ Fail: Failed to generate meeting preparation task.');
  }

  // 4. Feedback Submission & Satisfaction Score Update Test
  console.log('\nTesting Client Feedback & Satisfaction Score...');
  const feedbackReq = {
    user: mockUser,
    body: {
      rating: 5,
      feedbackType: 'VR Experience',
      comments: 'Test Hub Feedback comments',
      clientType: 'Lead',
      clientId: mockLead._id
    }
  };
  const feedbackRes = createMockResponse();
  await createFeedback(feedbackReq, feedbackRes, (err) => { if (err) console.error(err); });

  const summaryObj = await AISummary.findOne({
    clientId: mockLead._id
  });

  if (summaryObj && summaryObj.clientSatisfactionScore === 100) {
    console.log('✅ Success: Client feedback submitted and satisfaction score updated to 100%.');
  } else {
    console.error('❌ Fail: Feedback log failed to compute correct satisfaction scores.');
  }

  // Clean mock collections after run
  await Lead.deleteMany({ email: /test-hub/ });
  await Project.deleteMany({ name: /Test Hub Project/ });
  await Email.deleteMany({ receiver: /test-hub/ });
  await CallLog.deleteMany({ notes: /Test Hub Call/ });
  await Meeting.deleteMany({ notes: /Test Hub Meeting/ });
  await Note.deleteMany({ text: /Test Hub Note/ });
  await ActivityTimeline.deleteMany({ description: /Test Hub/ });
  await Feedback.deleteMany({ comments: /Test Hub/ });
  await AISummary.deleteMany({ budget: 15000000 });
  await Task.deleteMany({ title: /Test Hub/ });
  await User.deleteMany({ email: /test-hub/ });

  await mongoose.connection.close();
  console.log('\nDisconnected from MongoDB. Communication Hub Testing complete.');
};

runHubTests().catch(err => {
  console.error(err);
  process.exit(1);
});
