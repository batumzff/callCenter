const axios = require('axios');
const Customer = require('../models/customer.model');
const CallDetail = require('../models/callDetail.model');
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

      // Yeni görüşme detayı oluştur
      const callDetail = new CallDetail({
        customerId: customer._id,
        projectId,
        callId: response.data.call_id,
        callStatus: 'started',
        startTimestamp: Date.now(),
        fromNumber,
        toNumber,
        lastUpdated: new Date()
      });

      await callDetail.save();

      // Müşteriye görüşme detayını ekle
      customer.callDetails.push(callDetail._id);
      await customer.save();

      console.log('Customer saved with initial call data:', {
        id: customer._id,
        callId: callDetail.callId,
        status: customer.status
      });

      res.status(201).json({
        status: 'success',
        data: {
          call: response.data,
          customer,
          callDetail
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

      // Görüşme detayını bul ve güncelle
      const callDetail = await CallDetail.findOne({ callId });
      if (callDetail) {
        callDetail.callStatus = response.data.status;
        callDetail.transcript = response.data.transcript;
        callDetail.callAnalysis = {
          call_summary: response.data.summary,
          user_sentiment: response.data.sentiment,
          call_successful: response.data.call_successful,
          in_voicemail: response.data.in_voicemail,
          custom_analysis_data: {
            note: response.data.note,
            result: response.data.result
          }
        };
        callDetail.lastUpdated = new Date();
        await callDetail.save();

        // Müşteri durumunu güncelle
        const customer = await Customer.findById(callDetail.customerId);
        if (customer) {
          customer.status = response.data.status === 'completed' ? 'completed' : 'processing';
          await customer.save();
        }
      }

      res.json({
        status: 'success',
        data: {
          call: response.data,
          callDetail
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

      // Görüşme detayını güncelle
      const callDetail = await CallDetail.findOne({ callId });
      if (callDetail) {
        callDetail.callStatus = 'ended';
        callDetail.lastUpdated = new Date();
        await callDetail.save();

        // Müşteri durumunu güncelle
        const customer = await Customer.findById(callDetail.customerId);
        if (customer) {
          customer.status = 'completed';
          await customer.save();
        }
      }

      res.json({
        status: 'success',
        data: {
          call: response.data,
          callDetail
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

      // Görüşme detayını bul
      const callDetail = await CallDetail.findOne({ callId: call.call_id });
      if (!callDetail) {
        console.log('Call detail not found for call_id:', call.call_id);
        return res.status(404).json({
          status: 'error',
          message: 'Call detail not found for this call'
        });
      }

      // Müşteriyi bul
      const customer = await Customer.findById(callDetail.customerId);
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
        currentCallStatus: callDetail.callStatus
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

      // Görüşme detayını güncelle
      callDetail.callStatus = call.call_status;
      callDetail.transcript = call.transcript;
      callDetail.recordingUrl = call.recording_url;
      callDetail.callAnalysis = callAnalysis;
      callDetail.lastUpdated = new Date();
      await callDetail.save();

      // Müşteri durumunu güncelle
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
          callStatus: callDetail.callStatus,
          savedAt: new Date().toISOString()
        });
      } catch (saveError) {
        console.error('Error saving customer:', saveError);
        throw saveError;
      }

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
      const updateData = req.body;

      // 1. Eğer language ve agent_id varsa, agent'ın mevcut verisini çekip required alanlarla birlikte güncelle
      if (updateData.language && updateData.agent_id) {
        try {
          // Agent'ın mevcut verisini çek
          const agentRes = await axios.get(
            `https://api.retellai.com/get-agent/${updateData.agent_id}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          const agentData = agentRes.data;

          // Güncellenecek body'yi oluştur (mevcut required alanlar + yeni language)
          const agentUpdateBody = {
            ...agentData,
            language: updateData.language
          };

          console.log('PATCH /update-agent body:', agentUpdateBody);

          await axios.patch(
            `https://api.retellai.com/update-agent/${updateData.agent_id}`,
            agentUpdateBody,
            {
              headers: {
                'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (agentError) {
          return res.status(agentError.response?.status || 500).json({
            status: 'error',
            message: agentError.response?.data?.message || agentError.message
          });
        }
      }

      // 2. LLM ile ilgili alanları Retell LLM endpointine gönder
      const llmUpdateData = { ...updateData };
      delete llmUpdateData.language;
      delete llmUpdateData.agent_id;

      // Eğer LLM ile ilgili güncellenecek başka alan yoksa, LLM güncellemesi yapma
      const hasLLMUpdate = Object.keys(llmUpdateData).length > 0;
      let updated = null;
      if (hasLLMUpdate) {
        const response = await axios.patch(
          `https://api.retellai.com/update-retell-llm/${llmId}`,
          llmUpdateData,
          {
            headers: {
              'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        updated = response.data;

        // Kendi veritabanında da güncelle
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
      }

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