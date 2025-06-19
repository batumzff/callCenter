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
      const { name, phoneNumber } = req.body;

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
      const { name, phoneNumber, note, record, status, projectId } = req.body;

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
        { name, phoneNumber, note, record, status, projectId },
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
      const customer = await Customer.findByIdAndDelete(req.params.id);
      
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // Müşteriye ait call detaylarını da sil
      await CallDetail.deleteMany({ customerId: req.params.id });

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
          query.projectId = new mongoose.Types.ObjectId(projectId);
          console.log('Converted projectId to ObjectId:', query.projectId);
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
        .select('name phoneNumber status projectId createdAt')
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
        .select('name phoneNumber status projectId createdAt')
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
      
      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // Müşteriye ait tüm call detaylarını getir
      const callDetails = await CallDetail.find({ customerId: id })
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
}

module.exports = CustomerController; 