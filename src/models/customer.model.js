const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    unique: true
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  record: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  retellData: {
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
    lastUpdated: Date
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 