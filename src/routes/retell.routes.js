const express = require('express');
const router = express.Router();
const RetellController = require('../controllers/retell.controller');
const { auth } = require('../middlewares/auth.middleware');

// Tüm route'lar için authentication gerekli
router.use(auth);

// Retell routes
router.post('/call', RetellController.createPhoneCall); // Yeni arama başlat
router.get('/call/:callId', RetellController.getCallStatus); // Arama durumunu getir
router.delete('/call/:callId', RetellController.endCall); // Aramayı sonlandır

module.exports = router; 