const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account disabled' });
    }

    req.user = user;

    if (decoded.impersonatorId) {
      req.impersonator = await User.findById(decoded.impersonatorId).select('-password');
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.impersonator?.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
};

// Supports both default import and named destructuring
authMiddleware.authMiddleware = authMiddleware;
authMiddleware.requireAdmin = requireAdmin;
authMiddleware.protect = authMiddleware;
authMiddleware.admin = requireAdmin;

module.exports = authMiddleware;
