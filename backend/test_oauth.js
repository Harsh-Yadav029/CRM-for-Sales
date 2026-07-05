const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const request = (path, method = 'POST', body = null) => {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

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

const runOAuthTests = async () => {
  console.log('==========================================');
  console.log('  STARTING CRM OAUTH ENDPOINT VERIFICATION');
  console.log('==========================================\n');

  try {
    // Connect to DB to perform clean-up before and after tests
    console.log('[Setup] Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/crm';
    await mongoose.connect(mongoUri);
    const User = require('./models/User');
    
    // Clean up any old test users
    await User.deleteMany({ email: { $in: ['google-test@company.com', 'linkedin-test@company.com'] } });
    console.log('   ✓ Test database cleaned.');

    // 1. Test Google Login Endpoint
    console.log('\n[Test 1] Testing Google Login OAuth Handler...');
    const googleRes = await request('/auth/google-login', 'POST', {
      idToken: 'mock_google_id_token',
      email: 'google-test@company.com',
      name: 'Google Test User'
    });

    if (googleRes.status === 200 && googleRes.body.token) {
      console.log('   ✓ SUCCESS: Google OAuth completed successfully!');
      console.log(`     - Logged in User: ${googleRes.body.name} (${googleRes.body.role})`);
    } else {
      throw new Error(`Google Login failed (Status ${googleRes.status}): ` + JSON.stringify(googleRes.body));
    }

    // 2. Test LinkedIn Login Endpoint
    console.log('\n[Test 2] Testing LinkedIn Login OAuth Handler...');
    const linkedinRes = await request('/auth/linkedin-login', 'POST', {
      code: 'mock_linkedin_auth_code'
    });

    if (linkedinRes.status === 200 && linkedinRes.body.token) {
      console.log('   ✓ SUCCESS: LinkedIn OAuth completed successfully!');
      console.log(`     - Logged in User: ${linkedinRes.body.name} (${linkedinRes.body.role})`);
    } else {
      throw new Error(`LinkedIn Login failed (Status ${linkedinRes.status}): ` + JSON.stringify(linkedinRes.body));
    }

    // 3. Clean up created test accounts
    console.log('\n[Cleanup] Removing OAuth test accounts...');
    await User.deleteMany({ email: { $in: ['google-test@company.com', 'linkedin-test@company.com'] } });
    console.log('   ✓ OAuth test accounts cleaned successfully.');

    console.log('\n==========================================');
    console.log('        ALL OAUTH ENDPOINTS VERIFIED!     ');
    console.log('==========================================');

  } catch (err) {
    console.error('\n❌ OAUTH VERIFICATION ERROR:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

runOAuthTests();
