const Customer = require('../models/customer.model');
const CallDetail = require('../models/callDetail.model');
const mongoose = require('mongoose');

class CustomerController {
  // Tüm müşterileri getir
  static async getAllCustomers(req, res) {
    try {
      const customers = await Customer.find()
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: customers
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Yeni müşteri oluştur
  static async createCustomer(req, res) {
    try {
      const { name, phoneNumber, projectIds } = req.body;

      // Telefon numarası kontrolü
      const existingCustomer = await Customer.findOne({ phoneNumber });
      if (existingCustomer) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number already exists'
        });
      }

      const customer = new Customer({
        name,
        phoneNumber,
        projectIds: projectIds || [],
        status: 'pending' // Yeni müşteri oluşturulduğunda status pending olarak başlar
      });

      await customer.save();

      res.status(201).json({
        status: 'success',
        data: {
          customer
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteri detaylarını getir
  static async getCustomer(req, res) {
    try {
      const customer = await Customer.findById(req.params.id);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          customer
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteri bilgilerini güncelle
  static async updateCustomer(req, res) {
    try {
      const { name, phoneNumber, note, record, status, projectIds } = req.body;

      // Telefon numarası kontrolü (eğer değiştirilmişse)
      if (phoneNumber) {
        const existingCustomer = await Customer.findOne({ 
          phoneNumber, 
          _id: { $ne: req.params.id } 
        });
        if (existingCustomer) {
          return res.status(400).json({
            status: 'error',
            message: 'Phone number already exists'
          });
        }
      }

      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        { name, phoneNumber, note, record, status, projectIds },
        { new: true, runValidators: true }
      );

      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          customer
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteri sil
  static async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      
      // ObjectId'ye çevir
      let convertedId;
      try {
        convertedId = new mongoose.Types.ObjectId(id);
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid customer ID format'
        });
      }
      
      const customer = await Customer.findByIdAndDelete(convertedId);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // Müşteriye ait call detaylarını da sil
      await CallDetail.deleteMany({ customerId: convertedId });

      res.json({
        status: 'success',
        message: 'Customer and related call details deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Arama sonuçlarını güncelle
  static async updateSearchResults(req, res) {
    try {
      const { id } = req.params;
      const { note, record, status } = req.body;

      const customer = await Customer.findByIdAndUpdate(
        id,
        { note, record, status },
        { new: true, runValidators: true }
      );

      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          customer
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Bekleyen müşterileri getir
  static async getPendingCustomers(req, res) {
    try {
      const customers = await Customer.find({ status: 'pending' });
      res.json({
        status: 'success',
        data: {
          customers
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşterileri call detayları ile birlikte getir
  static async getCustomersWithCallDetails(req, res) {
    try {
      const { projectId } = req.query;
      console.log('Received projectId:', projectId);
      
      // Query oluştur
      const query = {};
      if (projectId) {
        try {
          const convertedProjectId = new mongoose.Types.ObjectId(projectId);
          query.projectIds = convertedProjectId;
          console.log('Converted projectId to ObjectId:', convertedProjectId);
        } catch (error) {
          console.error('Error converting projectId to ObjectId:', error);
          return res.status(400).json({
            status: 'error',
            message: 'Invalid projectId format'
          });
        }
      }
      
      console.log('Executing query:', query);
      const customers = await Customer.find(query)
        .select('name phoneNumber status projectIds createdAt')
        .sort({ createdAt: -1 });
      
      console.log('Found customers:', customers.length);

      // Her müşteri için son call detayını getir
      const customersWithCallDetails = await Promise.all(
        customers.map(async (customer) => {
          const lastCallDetail = await CallDetail.findOne({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .select('callId callStatus callAnalysis createdAt');

          return {
            ...customer.toObject(),
            lastCallDetail
          };
        })
      );

      res.json({
        status: 'success',
        data: customersWithCallDetails
      });
    } catch (error) {
      console.error('Error fetching customers with call details:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Test endpoint - Tüm verileri göster
  static async testGetAllData(req, res) {
    try {
      const customers = await Customer.find()
        .select('name phoneNumber status projectIds createdAt')
        .sort({ createdAt: -1 });

      console.log('Found customers:', customers.length);
      console.log('Sample customer:', customers[0]);

      res.json({
        status: 'success',
        count: customers.length,
        data: customers
      });
    } catch (error) {
      console.error('Error in test endpoint:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteri detaylarını call detayları ile birlikte getir
  static async getCustomerWithCallDetails(req, res) {
    try {
      const { id } = req.params;
      
      // ObjectId'ye çevir
      let convertedId;
      try {
        convertedId = new mongoose.Types.ObjectId(id);
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid customer ID format'
        });
      }
      
      const customer = await Customer.findById(convertedId);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // Müşteriye ait tüm call detaylarını getir
      const callDetails = await CallDetail.find({ customerId: convertedId })
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: {
          customer,
          callDetails
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteriyi projeye ekle
  static async addCustomerToProject(req, res) {
    try {
      const { customerId, projectId } = req.params;
      
      // ObjectId'lere çevir
      let convertedCustomerId, convertedProjectId;
      try {
        convertedCustomerId = new mongoose.Types.ObjectId(customerId);
        convertedProjectId = new mongoose.Types.ObjectId(projectId);
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid customerId or projectId format'
        });
      }

      // Müşteriyi bul
      const customer = await Customer.findById(convertedCustomerId);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // projectIds dizisini oluştur (eğer yoksa)
      if (!customer.projectIds) {
        customer.projectIds = [];
      }

      // projectId'yi projectIds'e ekle (eğer yoksa)
      if (!customer.projectIds.some(id => id.equals(convertedProjectId))) {
        customer.projectIds.push(convertedProjectId);
        await customer.save();
        
        res.json({
          status: 'success',
          message: 'Customer added to project successfully',
          data: {
            customer
          }
        });
      } else {
        res.json({
          status: 'success',
          message: 'Customer is already in this project',
          data: {
            customer
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteriyi projeden çıkar
  static async removeCustomerFromProject(req, res) {
    try {
      const { customerId, projectId } = req.params;
      
      // ObjectId'lere çevir
      let convertedCustomerId, convertedProjectId;
      try {
        convertedCustomerId = new mongoose.Types.ObjectId(customerId);
        convertedProjectId = new mongoose.Types.ObjectId(projectId);
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid customerId or projectId format'
        });
      }

      // Müşteriyi bul
      const customer = await Customer.findById(convertedCustomerId);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // projectIds dizisinden projectId'yi çıkar
      if (customer.projectIds && customer.projectIds.some(id => id.equals(convertedProjectId))) {
        customer.projectIds = customer.projectIds.filter(id => !id.equals(convertedProjectId));
        await customer.save();
        
        res.json({
          status: 'success',
          message: 'Customer removed from project successfully',
          data: {
            customer
          }
        });
      } else {
        res.json({
          status: 'success',
          message: 'Customer is not in this project',
          data: {
            customer
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = CustomerController; 