const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const { auth } = require('../middlewares/auth.middleware');

// Tüm route'lar için authentication gerekli
router.use(auth);

// Customer routes
router.get('/', CustomerController.getAllCustomers);
router.get('/pending', CustomerController.getPendingCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.patch('/:id/search-results', CustomerController.updateSearchResults);
router.delete('/:id', CustomerController.deleteCustomer);

module.exports = router; 