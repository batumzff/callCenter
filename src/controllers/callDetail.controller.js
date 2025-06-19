const CallDetail = require('../models/callDetail.model');
const Customer = require('../models/customer.model');
const mongoose = require('mongoose');

class CallDetailController {
  // Tüm call detaylarını getir
  static async getAllCallDetails(req, res) {
    try {
      const callDetails = await CallDetail.find()
        .populate('customerId', 'name phoneNumber')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: callDetails
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Yeni call detayı oluştur
  static async createCallDetail(req, res) {
    try {
      const { customerId, projectId, callId, callStatus, transcript, recordingUrl, callAnalysis } = req.body;

      // Customer ve Project kontrolü
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      const callDetail = new CallDetail({
        customerId,
        projectId,
        callId,
        callStatus,
        transcript,
        recordingUrl,
        callAnalysis
      });

      await callDetail.save();

      res.status(201).json({
        status: 'success',
        data: {
          callDetail
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Call detayını getir
  static async getCallDetail(req, res) {
    try {
      const callDetail = await CallDetail.findById(req.params.id)
        .populate('customerId', 'name phoneNumber')
        .populate('projectId', 'name');

      if (!callDetail) {
        return res.status(404).json({
          status: 'error',
          message: 'Call detail not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          callDetail
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Call detayını güncelle
  static async updateCallDetail(req, res) {
    try {
      const { callStatus, transcript, recordingUrl, callAnalysis, duration, startTime, endTime } = req.body;

      const callDetail = await CallDetail.findByIdAndUpdate(
        req.params.id,
        { callStatus, transcript, recordingUrl, callAnalysis, duration, startTime, endTime },
        { new: true, runValidators: true }
      ).populate('customerId', 'name phoneNumber')
       .populate('projectId', 'name');

      if (!callDetail) {
        return res.status(404).json({
          status: 'error',
          message: 'Call detail not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          callDetail
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Call detayını sil
  static async deleteCallDetail(req, res) {
    try {
      const callDetail = await CallDetail.findByIdAndDelete(req.params.id);
      
      if (!callDetail) {
        return res.status(404).json({
          status: 'error',
          message: 'Call detail not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Call detail deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteriye ait call detaylarını getir
  static async getCallDetailsByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      
      const callDetails = await CallDetail.find({ customerId })
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: callDetails
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Projeye ait call detaylarını getir
  static async getCallDetailsByProject(req, res) {
    try {
      const { projectId } = req.params;
      
      const callDetails = await CallDetail.find({ projectId })
        .populate('customerId', 'name phoneNumber')
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: callDetails
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Call ID'ye göre call detayını getir
  static async getCallDetailByCallId(req, res) {
    try {
      const { callId } = req.params;
      
      const callDetail = await CallDetail.findOne({ callId })
        .populate('customerId', 'name phoneNumber')
        .populate('projectId', 'name');

      if (!callDetail) {
        return res.status(404).json({
          status: 'error',
          message: 'Call detail not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          callDetail
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Call detayını call ID'ye göre güncelle (Retell webhook için)
  static async updateCallDetailByCallId(req, res) {
    try {
      const { callId } = req.params;
      const { callStatus, transcript, recordingUrl, callAnalysis, duration, startTime, endTime } = req.body;

      const callDetail = await CallDetail.findOneAndUpdate(
        { callId },
        { callStatus, transcript, recordingUrl, callAnalysis, duration, startTime, endTime },
        { new: true, runValidators: true }
      ).populate('customerId', 'name phoneNumber')
       .populate('projectId', 'name');

      if (!callDetail) {
        return res.status(404).json({
          status: 'error',
          message: 'Call detail not found'
        });
      }

      res.json({
        status: 'success',
        data: {
          callDetail
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Müşteri ve proje bazında call detaylarını getir
  static async getCallDetailsByCustomerAndProject(req, res) {
    try {
      const { customerId, projectId } = req.params;
      
      const callDetails = await CallDetail.find({ customerId, projectId })
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        data: callDetails
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = CallDetailController; 