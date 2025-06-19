const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const { auth } = require('../middlewares/auth.middleware');

// Test endpoint'i - authentication gerektirmez
router.get('/test-data', CustomerController.testGetAllData);

// Tüm route'lar için authentication gerekli
router.use(auth);

// Özel route'lar önce tanımlanmalı
router.get('/call-details', CustomerController.getCustomersWithCallDetails);
router.get('/pending', CustomerController.getPendingCustomers);
router.get('/:id/with-call-details', CustomerController.getCustomerWithCallDetails);

// Proje yönetimi route'ları
router.post('/:customerId/project/:projectId', CustomerController.addCustomerToProject);
router.delete('/:customerId/project/:projectId', CustomerController.removeCustomerFromProject);

// Genel route'lar sonra tanımlanmalı
router.get('/', CustomerController.getAllCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.patch('/:id/search-results', CustomerController.updateSearchResults);
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router; 