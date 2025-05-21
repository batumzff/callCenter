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
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
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
    callDuration: Number,
    callStartTime: Date,
    callEndTime: Date,
    transcript: String,
    summary: String,
    sentiment: String,
    keyPoints: [String],
    nextSteps: [String],
    customFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 