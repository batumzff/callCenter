const jwt = require('jsonwebtoken');
const config = require('../config/config');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      status: 'error',
      message: 'Please authenticate'
    });
  }
};

// Admin yetkisi kontrolü
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. Admin privileges required.'
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Please authenticate'
    });
  }
};

module.exports = {
  auth,
  adminAuth
}; 