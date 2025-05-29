require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// CORS ayarları
const corsOptions = {
  origin: [
    'https://callcenterfe-g76t8xwkx-batuhans-projects-09c34fd8.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
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