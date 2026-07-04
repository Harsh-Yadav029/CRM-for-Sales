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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getSalespeople
};
