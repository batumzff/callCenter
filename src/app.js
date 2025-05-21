require('dotenv').config();
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
const customerRoutes = require('./routes/customer.routes');
const retellRoutes = require('./routes/retell.routes');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');

// Route middleware
app.use('/api/customers', customerRoutes);
app.use('/api/retell', retellRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message
  });
});

module.exports = app; 