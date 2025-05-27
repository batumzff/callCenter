const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');
const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

// MongoDB bağlantısı
connectDB();

const app = express();

// CORS yapılandırması
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Frontend URL'leri
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Ana sayfa route'u
app.get('/', (req, res) => {
  res.json({ message: 'Call Center API is running' });
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${config.nodeEnv} mode`);
}); 