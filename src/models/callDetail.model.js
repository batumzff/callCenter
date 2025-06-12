const mongoose = require('mongoose');

const callDetailSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  callId: String,
  callStatus: String,
  transcript: String,
  recordingUrl: String,
  callAnalysis: {
    call_summary: String,
    user_sentiment: String,
    call_successful: Boolean,
    in_voicemail: Boolean,
    custom_analysis_data: {
      note: String,
      result: String
    }
  },
  startTimestamp: Date,
  fromNumber: String,
  toNumber: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const CallDetail = mongoose.model('CallDetail', callDetailSchema);

module.exports = CallDetail; 