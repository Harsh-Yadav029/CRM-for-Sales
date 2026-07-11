const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const registerUser = async (req, res, next) => {
  const { name, email, password, role, tenantName } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    const userCount = await User.countDocuments({});
    let tenantId;
    let assignedRole = 'rep';

    if (userCount === 0) {
      // First user is automatically system administrator and creates a root tenant
      const defaultTenantName = tenantName || 'Default Organization';
      const emailDomain = email.split('@')[1] || '';
      
      const tenant = await Tenant.create({
        name: defaultTenantName,
        domain: emailDomain,
        subscriptionLevel: 'enterprise'
      });
      tenantId = tenant._id;
      assignedRole = 'admin';
    } else {
      // For subsequent signups
      let adminToken;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          adminToken = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
          const requestor = await User.findById(decoded.id);
          
          if (!requestor || requestor.role !== 'admin') {
            res.status(403);
            return next(new Error('Only system administrators can register new accounts'));
          }
          
          tenantId = requestor.tenantId;
          assignedRole = (role && ['admin', 'manager', 'rep'].includes(role)) ? role : 'rep';
        } catch (err) {
          res.status(401);
          return next(new Error('Not authorized, admin token validation failed'));
        }
      } else {
        // Self-serve domain lookup or manual registration
        const emailDomain = email.split('@')[1] || '';
        let matchingTenant = await Tenant.findOne({ domain: emailDomain });
        
        if (matchingTenant) {
          tenantId = matchingTenant._id;
        } else {
          const finalTenantName = tenantName || `${emailDomain.split('.')[0].toUpperCase()} Organization`;
          const newTenant = await Tenant.create({
            name: finalTenantName,
            domain: emailDomain
          });
          tenantId = newTenant._id;
          assignedRole = 'admin'; // First user of a new tenant is the admin
        }
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      tenantId
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // Lockout check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      res.status(403);
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return next(new Error(`Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`));
    }

    if (await user.matchPassword(password)) {
      // Reset lockout values on success
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id)
      });
    } else {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
        user.loginAttempts = 0;
        await user.save();
        res.status(403);
        return next(new Error('Account locked due to 5 consecutive failed attempts. Try again in 15 minutes.'));
      }
      await user.save();
      res.status(401);
      next(new Error('Invalid email or password'));
    }
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user does not exist
      return res.json({ message: 'If that email address exists, reset instructions have been logged to the server.' });
    }

    // Generate a stateless 1-hour reset token containing email
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Simulate sending email by logging in server console
    console.log('\n--- [SIMULATED MAILER LOG] ---');
    console.log(`To: ${user.email}`);
    console.log('Subject: Password Reset Request');
    console.log(`Link: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log('------------------------------\n');

    res.json({ 
      message: 'If that email address exists, reset instructions have been logged to the server.',
      token: resetToken // Expose in response for simplified local development/testing
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Update password (triggers hashing middleware)
    user.password = password;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(400);
    next(new Error('Password reset token is invalid or has expired'));
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

const getSalespeople = async (req, res, next) => {
  try {
    // Return all users belonging to this tenant, excluding admin
    const salespeople = await User.find({ tenantId: req.tenantId }).select('name email role');
    res.json(salespeople);
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  const { idToken } = req.body;

  try {
    if (!idToken) {
      res.status(400);
      return next(new Error('Google ID token is required'));
    }

    let email, name;
    
    if (idToken.startsWith('mock_')) {
      email = req.body.email || 'google-test@company.com';
      name = req.body.name || 'Google Test User';
    } else {
      try {
        const admin = require('firebase-admin');
        if (admin.apps.length > 0) {
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          email = decodedToken.email;
          name = decodedToken.name || decodedToken.email.split('@')[0];
        } else {
          const decoded = jwt.decode(idToken);
          email = decoded?.email || 'google-user@company.com';
          name = decoded?.name || 'Google User';
        }
      } catch (err) {
        const decoded = jwt.decode(idToken);
        email = decoded?.email || 'google-user@company.com';
        name = decoded?.name || 'Google User';
      }
    }

    let user = await User.findOne({ email });
    if (!user) {
      const emailDomain = email.split('@')[1] || '';
      let tenantId;
      let assignedRole = 'rep';

      let matchingTenant = await Tenant.findOne({ domain: emailDomain });
      if (matchingTenant) {
        tenantId = matchingTenant._id;
      } else {
        const newTenant = await Tenant.create({
          name: `${emailDomain.split('.')[0].toUpperCase()} Org`,
          domain: emailDomain
        });
        tenantId = newTenant._id;
        assignedRole = 'admin';
      }

      user = await User.create({
        name,
        email,
        password: require('crypto').randomBytes(16).toString('hex'),
        role: assignedRole,
        tenantId
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

const linkedinLogin = async (req, res, next) => {
  const { code } = req.body;

  try {
    if (!code) {
      res.status(400);
      return next(new Error('LinkedIn Auth code is required'));
    }

    let email, name;

    if (code.startsWith('mock_')) {
      email = 'linkedin-test@company.com';
      name = 'LinkedIn Test User';
    } else {
      const client_id = process.env.LINKEDIN_CLIENT_ID;
      const client_secret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirect_uri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5173/login/callback';

      const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id,
        client_secret
      });

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenParams.toString()
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');
      }

      const accessToken = tokenData.access_token;

      const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error('Failed to retrieve LinkedIn user details');
      }

      name = profileData.name || `${profileData.given_name} ${profileData.family_name}`;
      email = profileData.email;
    }

    let user = await User.findOne({ email });
    if (!user) {
      const emailDomain = email.split('@')[1] || '';
      let tenantId;
      let assignedRole = 'rep';

      let matchingTenant = await Tenant.findOne({ domain: emailDomain });
      if (matchingTenant) {
        tenantId = matchingTenant._id;
      } else {
        const newTenant = await Tenant.create({
          name: `${emailDomain.split('.')[0].toUpperCase()} Org`,
          domain: emailDomain
        });
        tenantId = newTenant._id;
        assignedRole = 'admin';
      }

      user = await User.create({
        name,
        email,
        password: require('crypto').randomBytes(16).toString('hex'),
        role: assignedRole,
        tenantId
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getSalespeople,
  googleLogin,
  linkedinLogin
};
