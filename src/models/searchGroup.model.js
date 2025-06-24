const mongoose = require('mongoose');

const searchGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Search group name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'paused'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Arama grubuna ait müşteriler
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  // Arama grubuna ait projeler
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  // Arama grubuna ait akışlar (flows)
  flows: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Arama grubu ayarları
  settings: {
    maxCustomers: {
      type: Number,
      default: 1000
    },
    autoAssignProjects: {
      type: Boolean,
      default: false
    },
    notificationEnabled: {
      type: Boolean,
      default: true
    }
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
searchGroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual field for customer count
searchGroupSchema.virtual('customerCount').get(function() {
  return this.customers.length;
});

// Virtual field for project count
searchGroupSchema.virtual('projectCount').get(function() {
  return this.projects.length;
});

// Virtual field for flow count
searchGroupSchema.virtual('flowCount').get(function() {
  return this.flows.length;
});

// Ensure virtual fields are serialized
searchGroupSchema.set('toJSON', { virtuals: true });
searchGroupSchema.set('toObject', { virtuals: true });

const SearchGroup = mongoose.model('SearchGroup', searchGroupSchema);

module.exports = SearchGroup; 