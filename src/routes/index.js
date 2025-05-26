const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const retellRoutes = require('./retell.routes');
const projectRoutes = require('./project.routes');

// Ana route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to Call Center API' });
});

// Auth routes
router.use('/auth', authRoutes);

// Customer routes
router.use('/customers', customerRoutes);

// Retell routes
router.use('/retell', retellRoutes);

// Project routes
router.use('/projects', projectRoutes);

module.exports = router; 