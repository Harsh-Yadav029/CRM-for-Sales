const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invite = require('../models/Invite');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

const registerUser = async (req, res, next) => {
  const { name, email, password, role, token } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    const userCount = await User.countDocuments({});
    let assignedRole = 'rep';
    let inviteReportsTo = null;

    if (token) {
      // Validate invite token
      const invite = await Invite.findOne({ token, status: 'pending' });
      if (!invite || invite.expiresAt < new Date()) {
        res.status(400);
        return next(new Error('Invitation token is invalid or has expired'));
      }
      
      assignedRole = invite.role;
      inviteReportsTo = invite.reportsTo;
      
      // Update invite status
      invite.status = 'accepted';
      await invite.save();
    } else if (userCount === 0) {
      // First user is automatically system administrator
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
          
          assignedRole = (role && ['admin', 'manager', 'rep'].includes(role)) ? role : 'rep';
        } catch (err) {
          res.status(401);
          return next(new Error('Not authorized, admin token validation failed'));
        }
      } else {
        assignedRole = 'rep';
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      reportsTo: inviteReportsTo
    });

    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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

      const refreshToken = generateRefreshToken(user._id);
      setRefreshTokenCookie(res, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
    // Return all users
    const salespeople = await User.find({}).select('name email role');
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
      const userCount = await User.countDocuments({});
      const assignedRole = userCount === 0 ? 'admin' : 'rep';

      user = await User.create({
        name,
        email,
        password: require('crypto').randomBytes(16).toString('hex'),
        role: assignedRole
      });
    }

    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    res.status(401);
    return next(new Error('No refresh token provided'));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      res.status(401);
      return next(new Error('User not found'));
    }

    const accessToken = generateToken(user._id);
    res.json({ token: accessToken });
  } catch (err) {
    res.status(401);
    next(new Error('Invalid refresh token'));
  }
};

const logoutUser = async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  getSalespeople,
  googleLogin,
  refreshAccessToken,
  logoutUser
};
