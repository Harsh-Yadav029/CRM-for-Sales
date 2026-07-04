const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables from .env
dotenv.config();

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

// Define user model matching schema
const User = require('./models/User');

const runTests = async () => {
  console.log('==========================================');
  console.log('  STARTING CRM API END-TO-END VERIFICATION');
  console.log('==========================================\n');

  let token = null;
  let testLeadId = null;
  let testFieldId = null;
  let testWorkflowId = null;

  try {
    // 1. Connect directly to MongoDB
    console.log('[Setup] Connecting to MongoDB Atlas...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm';
    await mongoose.connect(mongoUri);
    console.log('   ✓ Connected to database.');

    // 2. Obtain Admin User credentials or Bootstrap directly in DB
    console.log('\n[Test 1] Locating or bootstrapping System Administrator...');
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('   ℹ Info: No admin found. Bootstrapping new admin directly in DB...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('   ✓ SUCCESS: Admin bootstrapped.');
    } else {
      console.log(`   ✓ SUCCESS: Found Admin user: ${admin.email}`);
    }

    // 3. Generate token using JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    token = jwt.sign({ id: admin._id }, jwtSecret, { expiresIn: '1h' });
    console.log('   ✓ JWT Token generated successfully.');

    // 4. Lead Endpoint: Create Prospect
    console.log('\n[Test 2] Creating a new test Lead...');
    const leadRes = await request('/leads', 'POST', {
      name: 'API Testing Corp',
      company: 'Test Labs Ltd',
      email: 'test@labs.com',
      phone: '+919999988888',
      source: 'Website',
      expectedRevenue: 150000,
      status: 'New'
    }, token);

    if (leadRes.status === 201 && leadRes.body._id) {
      testLeadId = leadRes.body._id;
      console.log(`   ✓ SUCCESS: Lead created. ID = ${testLeadId}`);
    } else {
      throw new Error(`Lead creation failed (Status ${leadRes.status}): ` + JSON.stringify(leadRes.body));
    }

    // 5. Phase 1 Communication: Outbound Email & VoIP Call Logs
    console.log('\n[Test 3] Logging Communication activities (Email & Call)...');
    const emailRes = await request('/communication/email', 'POST', {
      leadId: testLeadId,
      subject: 'Verification Pitch',
      body: 'Hello, this is an automated endpoint verification email body.'
    }, token);

    if (emailRes.status === 201) {
      console.log('   ✓ SUCCESS: Simulated email activity logged.');
    } else {
      throw new Error(`Email logging failed: ` + JSON.stringify(emailRes.body));
    }

    const callRes = await request('/communication/call', 'POST', {
      leadId: testLeadId,
      duration: 145,
      status: 'completed',
      notes: 'Outbound test call reached customer. Verification success.'
    }, token);

    if (callRes.status === 201) {
      console.log('   ✓ SUCCESS: VoIP Call logs activity logged.');
    } else {
      throw new Error(`Call logging failed: ` + JSON.stringify(callRes.body));
    }

    // 6. Phase 2 Custom Fields: Create layout parameters & fetch
    console.log('\n[Test 4] Adding dynamic Custom Field parameter rule...');
    const fieldRes = await request('/custom-fields', 'POST', {
      fieldName: 'Test Priority Level',
      fieldType: 'select',
      options: ['Tier 1', 'Tier 2', 'Tier 3']
    }, token);

    if (fieldRes.status === 201 && fieldRes.body._id) {
      testFieldId = fieldRes.body._id;
      console.log(`   ✓ SUCCESS: Custom field defined. ID = ${testFieldId}`);
    } else {
      throw new Error(`Field definition failed: ` + JSON.stringify(fieldRes.body));
    }

    // 7. Phase 3 Workflows: Create trigger automation rule
    console.log('\n[Test 5] Defining sales Workflow Automation rule...');
    const workflowRes = await request('/workflows', 'POST', {
      name: 'Verify Trigger Automation',
      triggerStage: 'Proposal Sent',
      actionType: 'task',
      taskTitle: 'Verify Proposal Delivery E2E'
    }, token);

    if (workflowRes.status === 201 && workflowRes.body._id) {
      testWorkflowId = workflowRes.body._id;
      console.log(`   ✓ SUCCESS: Workflow trigger rule defined. ID = ${testWorkflowId}`);
    } else {
      throw new Error(`Workflow definition failed: ` + JSON.stringify(workflowRes.body));
    }

    // 8. Trigger Workflows: Move Lead status to trigger automation
    console.log('\n[Test 6] Moving Lead status to "Proposal Sent" to trigger automation...');
    const statusUpdateRes = await request(`/leads/${testLeadId}/status`, 'PUT', {
      status: 'Proposal Sent'
    }, token);

    if (statusUpdateRes.status === 200) {
      console.log('   ✓ SUCCESS: Lead status transitioned.');
      
      // Let's verify that a task was automatically scheduled for this lead!
      console.log('   ℹ Info: Querying Task logs to confirm automation occurred...');
      const tasksRes = await request('/tasks', 'GET', null, token);
      const automatedTask = tasksRes.body.find(t => t.leadId && (t.leadId._id === testLeadId || t.leadId === testLeadId) && t.title.includes('Verify Proposal Delivery'));
      
      if (automatedTask) {
        console.log('   ✓ SUCCESS: Automated Task was scheduled successfully by engine!');
      } else {
        throw new Error('Verification failed: Workflow did not trigger expected task creation.');
      }
    } else {
      throw new Error(`Status update failed: ` + JSON.stringify(statusUpdateRes.body));
    }

    // 9. Phase 4 Analytics: Aggregated reports
    console.log('\n[Test 7] Fetching Aggregated BI Analytics reports data...');
    const reportRes = await request('/reports/analytics', 'GET', null, token);

    if (reportRes.status === 200 && reportRes.body.sources && reportRes.body.stages) {
      console.log('   ✓ SUCCESS: Analytics report aggregation queried successfully.');
      console.log(`     - Total Stages logged: ${reportRes.body.stages.length}`);
      console.log(`     - Total Salespeople active: ${reportRes.body.executives.length}`);
    } else {
      throw new Error(`Reports aggregation query failed: ` + JSON.stringify(reportRes.body));
    }

    // Clean-up created assets
    console.log('\n[Test 8] Performing test data clean-up...');
    
    // Delete Lead
    const delLead = await request(`/leads/${testLeadId}`, 'DELETE', null, token);
    if (delLead.status === 200) console.log('   ✓ Cleaned: Test Lead removed.');

    // Delete Custom Field
    const delField = await request(`/custom-fields/${testFieldId}`, 'DELETE', null, token);
    if (delField.status === 200) console.log('   ✓ Cleaned: Custom Field removed.');

    // Delete Workflow Rule
    const delWorkflow = await request(`/workflows/${testWorkflowId}`, 'DELETE', null, token);
    if (delWorkflow.status === 200) console.log('   ✓ Cleaned: Workflow Rule removed.');

    console.log('\n==========================================');
    console.log('       ALL API ENDPOINTS ARE WORKING!     ');
    console.log('          E2E VERIFICATION COMPLETED      ');
    console.log('==========================================');

  } catch (err) {
    console.error('\n❌ ERROR DURING API VERIFICATION:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
