const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Authentication middleware for GraphQL context
 * @param {Object} req - Express request object
 * @returns {Object} Context object with user info
 */
const authMiddleware = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return { user: null };
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret'
    );

    return { user: decoded };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return { user: null };
  }
};

/**
 * Express middleware to require authentication
 */
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret'
    );

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  authMiddleware,
  requireAuth
};
