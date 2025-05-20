const axios = require('axios');

class RetellController {
  // Arama başlat
  static async createPhoneCall(req, res) {
    try {
      console.log('Request body:', req.body);
      const { name, phoneNumber } = req.body;

      if (!name || !phoneNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and phoneNumber are required'
        });
      }

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

      console.log('Phone call response:', response.data);

      res.status(201).json({
        status: 'success',
        data: response.data
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

      res.json({
        status: 'success',
        data: response.data
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

      res.json({
        status: 'success',
        data: response.data
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