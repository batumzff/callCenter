require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// CORS ayarları
const corsOptions = {
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// CORS middleware'ini uygula
app.use(cors(corsOptions));

// Preflight isteklerini ele al
app.options('*', cors(corsOptions));

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