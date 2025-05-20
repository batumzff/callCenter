const Customer = require('../models/customer.model');

class CustomerController {
  // Tüm müşterileri getir
  static async getAllCustomers(req, res) {
    try {
      const customers = await Customer.find();
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
      const { name, phoneNumber, note, record, status } = req.body;

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
        { name, phoneNumber, note, record, status },
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

      res.json({
        status: 'success',
        message: 'Customer deleted successfully'
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
}

module.exports = CustomerController; 