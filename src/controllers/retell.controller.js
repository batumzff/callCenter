const axios = require('axios');
const Customer = require('../models/customer.model');
const LLM = require('../models/llm.model');

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

      // Arama bilgilerini müşteri kaydına ekle
      customer.retellData = {
        callId: response.data.call_id,
        callStatus: 'started',
        startTimestamp: Date.now(),
        fromNumber: fromNumber,
        toNumber: toNumber,
        lastUpdated: new Date()
      };

      try {
        await customer.save();
        console.log('Customer saved with initial call data:', {
          id: customer._id,
          callId: customer.retellData.callId,
          status: customer.status
        });
      } catch (saveError) {
        console.error('Error saving customer:', saveError);
        throw saveError;
      }

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

  // Create a new agent
  static async createAgent(req, res) {
    try {
      const response = await axios.post(
        'https://api.retellai.com/create-agent',
        req.body,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      res.status(201).json({
        status: 'success',
        data: response.data
      });
    } catch (error) {
      console.error('Create agent error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // Update an existing agent
  static async updateAgent(req, res) {
    try {
      const { agentId } = req.params;

      const response = await axios.patch(
        `https://api.retellai.com/update-agent/${agentId}`,
        req.body,
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
      console.error('Update agent error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // Delete an agent
  static async deleteAgent(req, res) {
    try {
      const { agentId } = req.params;

      const response = await axios.delete(
        `https://api.retellai.com/delete-agent/${agentId}`,
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
      console.error('Delete agent error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // List all agents
  static async listAgents(req, res) {
    try {
      const response = await axios.get(
        'https://api.retellai.com/list-agents',
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Agents response:', response.data);

      res.json({
        status: 'success',
        data: response.data
      });
    } catch (error) {
      console.error('List agents error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // Retell webhook handler
  static async handleWebhook(req, res) {
    try {
      console.log('=== WEBHOOK RECEIVED ===');
      console.log('Headers:', req.headers);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Timestamp:', new Date().toISOString());
      console.log('=======================');

      // Webhook verisini kontrol et
      if (!req.body || !req.body.call) {
        console.error('Invalid webhook data:', req.body);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid webhook data'
        });
      }

      const { call } = req.body;

      // Müşteri kaydını bul
      const customer = await Customer.findOne({ 'retellData.callId': call.call_id });
      if (!customer) {
        console.log('Customer not found for call_id:', call.call_id);
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found for this call'
        });
      }

      console.log('Found customer before update:', {
        id: customer._id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        currentStatus: customer.status,
        currentCallStatus: customer.retellData?.callStatus
      });

      // Call analysis verilerini çıkar
      const callAnalysis = call.call_analysis ? {
        call_summary: call.call_analysis.call_summary,
        user_sentiment: call.call_analysis.user_sentiment,
        call_successful: call.call_analysis.call_successful,
        in_voicemail: call.call_analysis.in_voicemail,
        custom_analysis_data: {
          note: call.call_analysis.custom_analysis_data?.note,
          result: call.call_analysis.custom_analysis_data?.result
        }
      } : null;

      // Sadece ihtiyaç duyulan verileri kaydet
      const retellData = {
        ...customer.retellData,
        callId: call.call_id,
        callStatus: call.call_status,
        transcript: call.transcript,
        recordingUrl: call.recording_url,
        callAnalysis: callAnalysis,
        lastUpdated: new Date()
      };

      console.log('Webhook call status:', call.call_status);
      console.log('Prepared retellData:', {
        callId: retellData.callId,
        callStatus: retellData.callStatus,
        hasTranscript: !!retellData.transcript,
        hasCallAnalysis: !!retellData.callAnalysis,
        sentiment: retellData.callAnalysis?.user_sentiment,
        callSuccessful: retellData.callAnalysis?.call_successful,
        recordingUrl: retellData.recordingUrl
      });

      // Müşteri kaydını güncelle
      customer.retellData = retellData;
      
      // Call status'a göre customer status'u güncelle
      const oldStatus = customer.status;
      switch (call.call_status) {
        case 'started':
          customer.status = 'processing';
          break;
        case 'ended':
          customer.status = 'completed';
          break;
        case 'failed':
          customer.status = 'failed';
          break;
        default:
          customer.status = 'processing';
      }
      
      console.log('Status update:', {
        oldStatus,
        newStatus: customer.status,
        callStatus: call.call_status
      });
      
      try {
        await customer.save();
        console.log('Customer saved successfully:', {
          id: customer._id,
          status: customer.status,
          callStatus: customer.retellData.callStatus,
          savedAt: new Date().toISOString()
        });
      } catch (saveError) {
        console.error('Error saving customer:', saveError);
        throw saveError;
      }

      // Kaydedilen veriyi tekrar kontrol et
      const savedCustomer = await Customer.findById(customer._id);
      console.log('Verified saved customer:', {
        id: savedCustomer._id,
        status: savedCustomer.status,
        callStatus: savedCustomer.retellData.callStatus,
        verifiedAt: new Date().toISOString()
      });

      res.json({
        status: 'success',
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Webhook error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  // Get agent details
  static async getAgent(req, res) {
    try {
      const { agentId } = req.params;

      const response = await axios.get(
        `https://api.retellai.com/get-agent/${agentId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Agent details:', response.data);

      res.json({
        status: 'success',
        data: response.data
      });
    } catch (error) {
      console.error('Get agent error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // List all LLMs
  static async listLLMs(req, res) {
    try {
      const response = await axios.get(
        'https://api.retellai.com/list-retell-llms',
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('LLMs response:', response.data);

      res.json({
        status: 'success',
        data: response.data
      });
    } catch (error) {
      console.error('List LLMs error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // Get LLM details (prompt)
  static async getLLM(req, res) {
    try {
      const { llmId } = req.params;

      // Retell API'den LLM bilgilerini al
      const response = await axios.get(
        `https://api.retellai.com/get-retell-llm/${llmId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('LLM details:', response.data);

      // Sadece general_prompt'u kaydet
      const prompt = response.data.general_prompt;
      await LLM.findOneAndUpdate(
        { llmId: llmId },
        { llmId: llmId, generalPrompt: prompt },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({
        status: 'success',
        prompt: prompt
      });
    } catch (error) {
      console.error('Get LLM error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }

  // Update LLM
  static async updateLLM(req, res) {
    try {
      const { llmId } = req.params;
      const updateData = req.body; // model dahil tüm alanlar

      // Retell API'de güncelle (model alanı dahil)
      const response = await axios.patch(
        `https://api.retellai.com/update-retell-llm/${llmId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const updated = response.data;

      // Kendi veritabanında da güncelle (model dahil)
      await LLM.findOneAndUpdate(
        { llmId: updated.llm_id },
        {
          llmId: updated.llm_id,
          version: updated.version,
          isPublished: updated.is_published,
          model: updated.model,
          s2sModel: updated.s2s_model,
          modelTemperature: updated.model_temperature,
          modelHighPriority: updated.model_high_priority,
          toolCallStrictMode: updated.tool_call_strict_mode,
          generalPrompt: updated.general_prompt,
          generalTools: updated.general_tools,
          states: updated.states,
          startingState: updated.starting_state,
          beginMessage: updated.begin_message,
          defaultDynamicVariables: updated.default_dynamic_variables,
          knowledgeBaseIds: updated.knowledge_base_ids,
          lastModificationTimestamp: updated.last_modification_timestamp
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({
        status: 'success',
        data: updated
      });
    } catch (error) {
      console.error('Update LLM error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        status: 'error',
        message: error.response?.data?.message || error.message
      });
    }
  }
}

module.exports = RetellController; 