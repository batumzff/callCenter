const express = require('express');
const router = express.Router();
const SearchGroupController = require('../controllers/searchGroup.controller');
const { auth } = require('../middlewares/auth.middleware');

// Tüm route'lar için authentication gerekli
router.use(auth);

// Ana arama grubu route'ları
router.get('/', SearchGroupController.getAllSearchGroups);
router.post('/', SearchGroupController.createSearchGroup);
router.get('/:id', SearchGroupController.getSearchGroup);
router.put('/:id', SearchGroupController.updateSearchGroup);
router.delete('/:id', SearchGroupController.deleteSearchGroup);

// Arama grubu istatistikleri
router.get('/:id/stats', SearchGroupController.getSearchGroupStats);

// Arama grubu call detayları
router.get('/:id/call-details', SearchGroupController.getSearchGroupCallDetails);

// Müşteri yönetimi route'ları
router.post('/:id/customers', SearchGroupController.addCustomerToSearchGroup);
router.delete('/:id/customers', SearchGroupController.removeCustomerFromSearchGroup);

// Dışarıdan müşteri ekleme route'ları
router.post('/:id/external-customers', SearchGroupController.addExternalCustomerToSearchGroup);
router.post('/:id/bulk-customers', SearchGroupController.addBulkCustomersToSearchGroup);

// Proje yönetimi route'ları
router.post('/:id/projects', SearchGroupController.addProjectToSearchGroup);
router.delete('/:id/projects', SearchGroupController.removeProjectFromSearchGroup);

// Akış yönetimi route'ları
router.post('/:id/flows', SearchGroupController.addFlowToSearchGroup);
router.put('/:id/flows/:flowId', SearchGroupController.updateFlowInSearchGroup);
router.delete('/:id/flows/:flowId', SearchGroupController.removeFlowFromSearchGroup);

module.exports = router; 