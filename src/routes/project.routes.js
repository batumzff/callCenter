const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/project.controller');
const { auth } = require('../middlewares/auth.middleware');

// Tüm route'lar için authentication gerekli
router.use(auth);

// Proje route'ları
router.get('/', ProjectController.getAllProjects);
router.post('/', ProjectController.createProject);
router.get('/:id', ProjectController.getProject);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

// Proje müşteri yönetimi
router.post('/:id/customers', ProjectController.addCustomerToProject);
router.delete('/:id/customers', ProjectController.removeCustomerFromProject);

module.exports = router; 