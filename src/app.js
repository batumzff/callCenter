require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// CORS ayarları
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 saat
}));

// Preflight isteklerini ele al
app.options('*', cors());

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
const callDetailRoutes = require('./routes/callDetail.routes');

// Route middleware
app.use('/api/customers', customerRoutes);
app.use('/api/retell', retellRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/call-details', callDetailRoutes);

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 