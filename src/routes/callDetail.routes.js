const express = require('express');
const CallDetailController = require('../controllers/callDetail.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tüm route'lar için authentication gerekli
router.use(auth);

// Tüm call detaylarını getir
router.get('/', CallDetailController.getAllCallDetails);

// Yeni call detayı oluştur
router.post('/', CallDetailController.createCallDetail);

// Call detayını getir
router.get('/:id', CallDetailController.getCallDetail);

// Call detayını güncelle
router.put('/:id', CallDetailController.updateCallDetail);

// Call detayını sil
router.delete('/:id', CallDetailController.deleteCallDetail);

// Müşteriye ait call detaylarını getir
router.get('/customer/:customerId', CallDetailController.getCallDetailsByCustomer);

// Projeye ait call detaylarını getir
router.get('/project/:projectId', CallDetailController.getCallDetailsByProject);

// Call ID'ye göre call detayını getir
router.get('/call/:callId', CallDetailController.getCallDetailByCallId);

// Call detayını call ID'ye göre güncelle (Retell webhook için)
router.put('/call/:callId', CallDetailController.updateCallDetailByCallId);

// Müşteri ve proje bazında call detaylarını getir
router.get('/customer/:customerId/project/:projectId', CallDetailController.getCallDetailsByCustomerAndProject);

module.exports = router; 