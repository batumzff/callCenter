require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: '24h',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/call-center',
  // Diğer konfigürasyon değerleri buraya eklenebilir
}; 