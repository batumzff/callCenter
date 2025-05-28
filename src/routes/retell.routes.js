const express = require('express');
const router = express.Router();
const RetellController = require('../controllers/retell.controller');
const { auth, adminAuth } = require('../middlewares/auth.middleware');

// Webhook route - authentication gerektirmez
router.post('/webhook', RetellController.handleWebhook);

// Diğer route'lar için authentication gerekli
router.use(auth);

// Retell routes
router.post('/call', RetellController.createPhoneCall); // Yeni arama başlat
router.get('/call/:callId', RetellController.getCallStatus); // Arama durumunu getir
router.delete('/call/:callId', RetellController.endCall); // Aramayı sonlandır

// Agent management routes - Admin yetkisi gerekli
router.post('/agent', adminAuth, RetellController.createAgent); // Yeni agent oluştur
router.patch('/agent/:agentId', adminAuth, RetellController.updateAgent); // Agent güncelle
router.delete('/agent/:agentId', adminAuth, RetellController.deleteAgent); // Agent sil
router.get('/agents', adminAuth, RetellController.listAgents); // Tüm agentları listele

module.exports = router; 