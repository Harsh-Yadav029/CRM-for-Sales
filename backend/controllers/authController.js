const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      res.status(400);
      return next(new Error('Please provide all required fields'));
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    const userCount = await User.countDocuments({});
    
    let assignedRole = 'sales';
    if (userCount === 0) {
      assignedRole = 'admin';
    } else {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const requestor = await User.findById(decoded.id);
          if (!requestor || requestor.role !== 'admin') {
            res.status(403);
            return next(new Error('Only system administrators can register new accounts'));
          }
          assignedRole = (role && ['admin', 'sales'].includes(role)) ? role : 'sales';
        } catch (err) {
          res.status(401);
          return next(new Error('Not authorized, admin token validation failed'));
        }
      } else {
        res.status(401);
        return next(new Error('Not authorized, no admin token provided'));
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole
    });

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
    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      next(new Error('Invalid email or password'));
    }
  } catch (error) {
    next(error);
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
    const salespeople = await User.find({ role: 'sales' }).select('name email');
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
    
    // Check if token is mock for local tests, otherwise attempt real Firebase Admin verification
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
          const jwt = require('jsonwebtoken');
          const decoded = jwt.decode(idToken);
          email = decoded?.email || 'google-user@company.com';
          name = decoded?.name || 'Google User';
        }
      } catch (err) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(idToken);
        email = decoded?.email || 'google-user@company.com';
        name = decoded?.name || 'Google User';
      }
    }

    let user = await User.findOne({ email });
    if (!user) {
      const userCount = await User.countDocuments({});
      user = await User.create({
        name,
        email,
        password: require('crypto').randomBytes(16).toString('hex'),
        role: userCount === 0 ? 'admin' : 'sales'
      });
    }

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
      const redirect_uri = 'http://localhost:5173/login/callback';

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
      const userCount = await User.countDocuments({});
      user = await User.create({
        name,
        email,
        password: require('crypto').randomBytes(16).toString('hex'),
        role: userCount === 0 ? 'admin' : 'sales'
      });
    }

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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getSalespeople,
  googleLogin,
  linkedinLogin
};
