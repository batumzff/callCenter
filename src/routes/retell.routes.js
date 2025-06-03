const express = require('express');
const router = express.Router();
const RetellController = require('../controllers/retell.controller');
const { auth, adminAuth } = require('../middlewares/auth.middleware');

// Webhook route - authentication gerektirmez
router.post('/webhook', RetellController.handleWebhook);

// Diğer route'lar için authentication gerekli
router.use(auth);

// Call routes
router.post('/call', RetellController.createPhoneCall); // Yeni arama başlat
router.get('/call/:callId', RetellController.getCallStatus); // Arama durumunu getir
router.delete('/call/:callId', RetellController.endCall); // Aramayı sonlandır

// Agent routes - Admin yetkisi gerekli
router.get('/agents', adminAuth, RetellController.listAgents); // Tüm agentları listele
router.get('/agents/:agentId', adminAuth, RetellController.getAgent); // Agent detaylarını getir
router.post('/agents', adminAuth, RetellController.createAgent); // Yeni agent oluştur
router.patch('/agents/:agentId', adminAuth, RetellController.updateAgent); // Agent güncelle
router.delete('/agents/:agentId', adminAuth, RetellController.deleteAgent); // Agent sil

// LLM routes - Admin yetkisi gerekli
router.get('/llms', adminAuth, RetellController.listLLMs); // Tüm LLM'leri listele
router.get('/llms/:llmId', adminAuth, RetellController.getLLM); // LLM detaylarını getir
router.patch('/llms/:llmId', adminAuth, RetellController.updateLLM); // LLM güncelle

module.exports = router; 