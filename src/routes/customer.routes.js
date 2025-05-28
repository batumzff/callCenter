const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const { auth } = require('../middlewares/auth.middleware');

// Test endpoint'i - authentication gerektirmez
router.get('/test-data', CustomerController.testGetAllData);

// Tüm route'lar için authentication gerekli
router.use(auth);

// Özel route'lar önce tanımlanmalı
router.get('/retell-data', CustomerController.getCustomersWithRetellData);
router.get('/pending', CustomerController.getPendingCustomers);

// Genel route'lar sonra tanımlanmalı
router.get('/', CustomerController.getAllCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.patch('/:id/search-results', CustomerController.updateSearchResults);
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router; 