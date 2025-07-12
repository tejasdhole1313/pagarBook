const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact administrator.',
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The provided token has expired',
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required',
    });
  }
  next();
};

// Middleware to check if user is employee
const requireEmployee = (req, res, next) => {
  if (req.user.role !== 'employee' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Employee privileges required',
    });
  }
  next();
};

// Middleware to check if user can access specific user data
const canAccessUser = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  // Admins can access any user data
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Users can only access their own data
  if (req.user.userId.toString() === targetUserId) {
    return next();
  }
  
  return res.status(403).json({
    error: 'Access denied',
    message: 'You can only access your own data',
  });
};

// Middleware to rate limit login attempts
const rateLimitLogin = (req, res, next) => {
  // This would typically use Redis or a similar store
  // For now, we'll implement a simple in-memory rate limiting
  const clientIP = req.ip;
  const now = Date.now();
  
  // Simple rate limiting: max 5 attempts per 15 minutes
  if (!req.app.locals.loginAttempts) {
    req.app.locals.loginAttempts = new Map();
  }
  
  const attempts = req.app.locals.loginAttempts.get(clientIP) || [];
  const recentAttempts = attempts.filter(timestamp => now - timestamp < 15 * 60 * 1000);
  
  if (recentAttempts.length >= 5) {
    return res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again in 15 minutes',
    });
  }
  
  // Add current attempt
  recentAttempts.push(now);
  req.app.locals.loginAttempts.set(clientIP, recentAttempts);
  
  next();
};

// Middleware to log API requests
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Middleware to validate request body
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message,
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmployee,
  canAccessUser,
  rateLimitLogin,
  logRequest,
  validateRequest,
}; 