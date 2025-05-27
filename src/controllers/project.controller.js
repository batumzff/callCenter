const Project = require('../models/Project');
const Customer = require('../models/customer.model');

class ProjectController {
    // Tüm projeleri getir
    static async getAllProjects(req, res) {
        try {
            console.log('User ID:', req.user.id);
            const projects = await Project.find({ createdBy: req.user.id })
                .populate('customers')
                .sort({ createdAt: -1 });
            
            console.log('Found projects:', projects);

            res.json({
                status: 'success',
                data: projects
            });
        } catch (error) {
            console.error('Error in getAllProjects:', error);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Yeni proje oluştur
    static async createProject(req, res) {
        try {
            console.log('Request body:', req.body);
            console.log('User:', req.user);
            
            const { name, description } = req.body;

            const project = new Project({
                name,
                description,
                createdBy: req.user.id
            });

            console.log('New project:', project);

            await project.save();

            res.status(201).json({
                status: 'success',
                data: project
            });
        } catch (error) {
            console.error('Error in createProject:', error);
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Proje detaylarını getir
    static async getProject(req, res) {
        try {
            const project = await Project.findOne({
                _id: req.params.id,
                createdBy: req.user.id
            }).populate('customers');

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.json({
                status: 'success',
                data: project
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Projeyi güncelle
    static async updateProject(req, res) {
        try {
            const { name, description, status } = req.body;

            const project = await Project.findOneAndUpdate(
                { _id: req.params.id, createdBy: req.user._id },
                { name, description, status },
                { new: true }
            );

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.json({
                status: 'success',
                data: project
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Projeye müşteri ekle
    static async addCustomerToProject(req, res) {
        try {
            const { customerId } = req.body;
            const projectId = req.params.id;

            const project = await Project.findOne({
                _id: projectId,
                createdBy: req.user._id
            });

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            const customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Customer not found'
                });
            }

            if (!project.customers.includes(customerId)) {
                project.customers.push(customerId);
                await project.save();
            }

            res.json({
                status: 'success',
                data: project
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Projeden müşteri çıkar
    static async removeCustomerFromProject(req, res) {
        try {
            const { customerId } = req.body;
            const projectId = req.params.id;

            const project = await Project.findOne({
                _id: projectId,
                createdBy: req.user._id
            });

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            project.customers = project.customers.filter(
                id => id.toString() !== customerId
            );

            await project.save();

            res.json({
                status: 'success',
                data: project
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Projeyi sil
    static async deleteProject(req, res) {
        try {
            const project = await Project.findOneAndDelete({
                _id: req.params.id,
                createdBy: req.user._id
            });

            if (!project) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Project not found'
                });
            }

            res.json({
                status: 'success',
                message: 'Project deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = ProjectController; 