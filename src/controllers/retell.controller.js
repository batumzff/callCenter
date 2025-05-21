const axios = require('axios');
const Customer = require('../models/customer.model');

class RetellController {
  // Arama başlat
  static async createPhoneCall(req, res) {
    try {
      console.log('Request body:', req.body);
      const { name, phoneNumber, projectId } = req.body;

      if (!name || !phoneNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and phoneNumber are required'
        });
      }

      // Önce müşteriyi oluştur veya güncelle
      let customer = await Customer.findOne({ phoneNumber });
      if (!customer) {
        customer = new Customer({
          name,
          phoneNumber,
          status: 'processing',
          projectId
        });
      } else {
        customer.status = 'processing';
        customer.projectId = projectId;
      }
      await customer.save();

      const agentId = 'agent_35e1c268e97c94df1302f54d3c';
      const fromNumber = process.env.RETELL_PHONE_NUMBER;
      const toNumber = phoneNumber.startsWith('+') ? phoneNumber : `+90${phoneNumber}`;

      console.log('Making call with:', {
        from_number: fromNumber,
        to_number: toNumber,
        agent_id: agentId,
        retell_llm_dynamic_variables: {
          customer_name: name
        }
      });

      const response = await axios.post(
        'https://api.retellai.com/v2/create-phone-call',
        {
          from_number: fromNumber,
          to_number: toNumber,
          agent_id: agentId,
          retell_llm_dynamic_variables: {
            customer_name: name
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Arama bilgilerini müşteri kaydına ekle
      customer.retellData = {
        callId: response.data.call_id,
        callStatus: 'started',
        callStartTime: new Date()
      };
      await customer.save();

      console.log('Phone call response:', response.data);

      res.status(201).json({
        status: 'success',
        data: {
          call: response.data,
          customer
        }
      });
    } catch (error) {
      console.error('Call error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message,
        details: error.response?.data
      });
    }
  }

  // Arama durumunu getir
  static async getCallStatus(req, res) {
    try {
      const { callId } = req.params;

      const response = await axios.get(
        `https://api.retellai.com/v2/call/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Müşteri kaydını güncelle
      const customer = await Customer.findOne({ 'retellData.callId': callId });
      if (customer) {
        customer.retellData = {
          ...customer.retellData,
          callStatus: response.data.status,
          callDuration: response.data.duration,
          callEndTime: response.data.end_time ? new Date(response.data.end_time) : undefined,
          transcript: response.data.transcript,
          summary: response.data.summary,
          sentiment: response.data.sentiment,
          keyPoints: response.data.key_points,
          nextSteps: response.data.next_steps
        };
        customer.status = response.data.status === 'completed' ? 'completed' : 'processing';
        await customer.save();
      }

      res.json({
        status: 'success',
        data: {
          call: response.data,
          customer
        }
      });
    } catch (error) {
      console.error('Get call status error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // Aramayı sonlandır
  static async endCall(req, res) {
    try {
      const { callId } = req.params;

      const response = await axios.delete(
        `https://api.retellai.com/v2/call/${callId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Müşteri kaydını güncelle
      const customer = await Customer.findOne({ 'retellData.callId': callId });
      if (customer) {
        customer.retellData.callStatus = 'ended';
        customer.retellData.callEndTime = new Date();
        customer.status = 'completed';
        await customer.save();
      }

      res.json({
        status: 'success',
        data: {
          call: response.data,
          customer
        }
      });
    } catch (error) {
      console.error('End call error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }
}

module.exports = RetellController; 