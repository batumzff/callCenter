const SearchGroup = require('../models/searchGroup.model');
const Customer = require('../models/customer.model');
const Project = require('../models/Project');
const CallDetail = require('../models/callDetail.model');
const mongoose = require('mongoose');

class SearchGroupController {
  // Tüm arama gruplarını getir
  static async getAllSearchGroups(req, res) {
    try {
      const searchGroups = await SearchGroup.find({ createdBy: req.user.id })
        .populate('customers', 'name phoneNumber status')
        .populate('projects', 'name description status')
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: searchGroups
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Yeni arama grubu oluştur
  static async createSearchGroup(req, res) {
    try {
      const { name, description, settings } = req.body;

      const searchGroup = new SearchGroup({
        name,
        description,
        settings,
        createdBy: req.user.id
      });

      await searchGroup.save();

      res.status(201).json({
        status: 'success',
        data: searchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubu detaylarını getir
  static async getSearchGroup(req, res) {
    try {
      const searchGroup = await SearchGroup.findOne({
        _id: req.params.id,
        createdBy: req.user.id
      })
        .populate('customers', 'name phoneNumber status note record')
        .populate('projects', 'name description status')
        .populate('createdBy', 'name email');

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      res.json({
        status: 'success',
        data: searchGroup
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubunu güncelle
  static async updateSearchGroup(req, res) {
    try {
      const { name, description, status, settings } = req.body;

      const searchGroup = await SearchGroup.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user.id },
        { name, description, status, settings },
        { new: true, runValidators: true }
      );

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      res.json({
        status: 'success',
        data: searchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubunu sil
  static async deleteSearchGroup(req, res) {
    try {
      const searchGroup = await SearchGroup.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Search group deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubuna müşteri ekle
  static async addCustomerToSearchGroup(req, res) {
    try {
      const { customerId } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // Müşteri zaten ekli mi kontrol et
      if (searchGroup.customers.includes(customerId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Customer already exists in this search group'
        });
      }

      // Maksimum müşteri sayısı kontrolü
      if (searchGroup.customers.length >= searchGroup.settings.maxCustomers) {
        return res.status(400).json({
          status: 'error',
          message: `Maximum customer limit (${searchGroup.settings.maxCustomers}) reached`
        });
      }

      // Arama grubuna müşteri ekle
      searchGroup.customers.push(customerId);
      await searchGroup.save();

      // Müşteriye arama grubu ID'sini ekle
      if (!customer.searchGroupIds.includes(searchGroupId)) {
        customer.searchGroupIds.push(searchGroupId);
        await customer.save();
      }

      // Populate ile güncellenmiş veriyi döndür
      const updatedSearchGroup = await SearchGroup.findById(searchGroupId)
        .populate('customers', 'name phoneNumber status');

      res.json({
        status: 'success',
        data: updatedSearchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubundan müşteri çıkar
  static async removeCustomerFromSearchGroup(req, res) {
    try {
      const { customerId } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      // Arama grubundan müşteriyi çıkar
      searchGroup.customers = searchGroup.customers.filter(
        id => id.toString() !== customerId
      );
      await searchGroup.save();

      // Müşteriden arama grubu ID'sini çıkar
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.searchGroupIds = customer.searchGroupIds.filter(
          id => id.toString() !== searchGroupId
        );
        await customer.save();
      }

      // Populate ile güncellenmiş veriyi döndür
      const updatedSearchGroup = await SearchGroup.findById(searchGroupId)
        .populate('customers', 'name phoneNumber status');

      res.json({
        status: 'success',
        data: updatedSearchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubuna proje ekle
  static async addProjectToSearchGroup(req, res) {
    try {
      const { projectId } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const project = await Project.findOne({
        _id: projectId,
        createdBy: req.user.id
      });

      if (!project) {
        return res.status(404).json({
          status: 'error',
          message: 'Project not found'
        });
      }

      // Proje zaten ekli mi kontrol et
      if (searchGroup.projects.includes(projectId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Project already exists in this search group'
        });
      }

      // Arama grubuna proje ekle
      searchGroup.projects.push(projectId);
      await searchGroup.save();

      // Projeye arama grubu ID'sini ekle
      if (!project.searchGroupIds.includes(searchGroupId)) {
        project.searchGroupIds.push(searchGroupId);
        await project.save();
      }

      // Populate ile güncellenmiş veriyi döndür
      const updatedSearchGroup = await SearchGroup.findById(searchGroupId)
        .populate('projects', 'name description status');

      res.json({
        status: 'success',
        data: updatedSearchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubundan proje çıkar
  static async removeProjectFromSearchGroup(req, res) {
    try {
      const { projectId } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      // Arama grubundan projeyi çıkar
      searchGroup.projects = searchGroup.projects.filter(
        id => id.toString() !== projectId
      );
      await searchGroup.save();

      // Projeden arama grubu ID'sini çıkar
      const project = await Project.findById(projectId);
      if (project) {
        project.searchGroupIds = project.searchGroupIds.filter(
          id => id.toString() !== searchGroupId
        );
        await project.save();
      }

      // Populate ile güncellenmiş veriyi döndür
      const updatedSearchGroup = await SearchGroup.findById(searchGroupId)
        .populate('projects', 'name description status');

      res.json({
        status: 'success',
        data: updatedSearchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubuna akış ekle
  static async addFlowToSearchGroup(req, res) {
    try {
      const { name, description } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const newFlow = {
        name,
        description,
        status: 'active',
        createdAt: new Date()
      };

      searchGroup.flows.push(newFlow);
      await searchGroup.save();

      res.json({
        status: 'success',
        data: searchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubundaki akışı güncelle
  static async updateFlowInSearchGroup(req, res) {
    try {
      const { flowId } = req.params;
      const { name, description, status } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const flow = searchGroup.flows.id(flowId);
      if (!flow) {
        return res.status(404).json({
          status: 'error',
          message: 'Flow not found'
        });
      }

      if (name) flow.name = name;
      if (description !== undefined) flow.description = description;
      if (status) flow.status = status;

      await searchGroup.save();

      res.json({
        status: 'success',
        data: searchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubundan akış sil
  static async removeFlowFromSearchGroup(req, res) {
    try {
      const { flowId } = req.params;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      searchGroup.flows = searchGroup.flows.filter(
        flow => flow._id.toString() !== flowId
      );

      await searchGroup.save();

      res.json({
        status: 'success',
        data: searchGroup
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubundaki müşterilerin call detaylarını getir
  static async getSearchGroupCallDetails(req, res) {
    try {
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      }).populate('customers');

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const customerIds = searchGroup.customers.map(customer => customer._id);
      
      const callDetails = await CallDetail.find({
        customerId: { $in: customerIds }
      }).populate('customerId', 'name phoneNumber');

      res.json({
        status: 'success',
        data: {
          searchGroup: searchGroup,
          callDetails: callDetails
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubu istatistiklerini getir
  static async getSearchGroupStats(req, res) {
    try {
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      }).populate('customers');

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const customerIds = searchGroup.customers.map(customer => customer._id);
      
      // Müşteri durumlarına göre sayılar
      const statusStats = await Customer.aggregate([
        { $match: { _id: { $in: customerIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Call detay sayısı
      const callDetailCount = await CallDetail.countDocuments({
        customerId: { $in: customerIds }
      });

      const stats = {
        totalCustomers: searchGroup.customers.length,
        totalProjects: searchGroup.projects.length,
        totalFlows: searchGroup.flows.length,
        statusStats: statusStats,
        callDetailCount: callDetailCount,
        createdAt: searchGroup.createdAt,
        lastUpdated: searchGroup.updatedAt
      };

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubuna dışarıdan müşteri ekle (yeni müşteri oluşturarak)
  static async addExternalCustomerToSearchGroup(req, res) {
    try {
      const { name, phoneNumber, note, record } = req.body;
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      // Maksimum müşteri sayısı kontrolü
      if (searchGroup.customers.length >= searchGroup.settings.maxCustomers) {
        return res.status(400).json({
          status: 'error',
          message: `Maximum customer limit (${searchGroup.settings.maxCustomers}) reached`
        });
      }

      // Telefon numarası kontrolü
      let customer = await Customer.findOne({ phoneNumber });
      
      if (!customer) {
        // Yeni müşteri oluştur
        customer = new Customer({
          name,
          phoneNumber,
          note: note || '',
          record: record || '',
          status: 'pending'
        });
        await customer.save();
      } else {
        // Mevcut müşteri bilgilerini güncelle
        if (name) customer.name = name;
        if (note !== undefined) customer.note = note;
        if (record !== undefined) customer.record = record;
        await customer.save();
      }

      // Müşteri zaten arama grubunda mı kontrol et
      if (searchGroup.customers.includes(customer._id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Customer already exists in this search group'
        });
      }

      // Arama grubuna müşteri ekle
      searchGroup.customers.push(customer._id);
      await searchGroup.save();

      // Müşteriye arama grubu ID'sini ekle
      if (!customer.searchGroupIds.includes(searchGroupId)) {
        customer.searchGroupIds.push(searchGroupId);
        await customer.save();
      }

      // Populate ile güncellenmiş veriyi döndür
      const updatedSearchGroup = await SearchGroup.findById(searchGroupId)
        .populate('customers', 'name phoneNumber status note record');

      res.json({
        status: 'success',
        data: {
          searchGroup: updatedSearchGroup,
          customer: customer
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama grubuna toplu müşteri ekle
  static async addBulkCustomersToSearchGroup(req, res) {
    try {
      const { customers } = req.body; // customers array: [{name, phoneNumber, note, record}]
      const searchGroupId = req.params.id;

      const searchGroup = await SearchGroup.findOne({
        _id: searchGroupId,
        createdBy: req.user.id
      });

      if (!searchGroup) {
        return res.status(404).json({
          status: 'error',
          message: 'Search group not found'
        });
      }

      const addedCustomers = [];
      const existingCustomers = [];
      const errors = [];

      for (const customerData of customers) {
        try {
          const { name, phoneNumber, note, record } = customerData;

          // Maksimum müşteri sayısı kontrolü
          if (searchGroup.customers.length >= searchGroup.settings.maxCustomers) {
            errors.push({
              phoneNumber,
              error: `Maximum customer limit (${searchGroup.settings.maxCustomers}) reached`
            });
            continue;
          }

          // Telefon numarası kontrolü
          let customer = await Customer.findOne({ phoneNumber });
          
          if (!customer) {
            // Yeni müşteri oluştur
            customer = new Customer({
              name,
              phoneNumber,
              note: note || '',
              record: record || '',
              status: 'pending'
            });
            await customer.save();
            addedCustomers.push(customer);
          } else {
            // Mevcut müşteri bilgilerini güncelle
            if (name) customer.name = name;
            if (note !== undefined) customer.note = note;
            if (record !== undefined) customer.record = record;
            await customer.save();
            existingCustomers.push(customer);
          }

          // Müşteri zaten arama grubunda mı kontrol et
          if (!searchGroup.customers.includes(customer._id)) {
            // Arama grubuna müşteri ekle
            searchGroup.customers.push(customer._id);
            
            // Müşteriye arama grubu ID'sini ekle
            if (!customer.searchGroupIds.includes(searchGroupId)) {
              customer.searchGroupIds.push(searchGroupId);
              await customer.save();
            }
          }

        } catch (error) {
          errors.push({
            phoneNumber: customerData.phoneNumber,
            error: error.message
          });
        }
      }

      await searchGroup.save();

      // Populate ile güncellenmiş veriyi döndür
      const updatedSearchGroup = await SearchGroup.findById(searchGroupId)
        .populate('customers', 'name phoneNumber status note record');

      res.json({
        status: 'success',
        data: {
          searchGroup: updatedSearchGroup,
          addedCustomers: addedCustomers.length,
          existingCustomers: existingCustomers.length,
          errors: errors
        }
      });
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = SearchGroupController; 