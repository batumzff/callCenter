const mongoose = require('mongoose');

const llmSchema = new mongoose.Schema({
  llmId: {
    type: String,
    required: true,
    unique: true
  },
  version: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  model: {
    type: String,
    required: true
  },
  s2sModel: String,
  modelTemperature: Number,
  modelHighPriority: Boolean,
  toolCallStrictMode: Boolean,
  generalPrompt: String,
  generalTools: [{
    type: {
      type: String,
      required: true
    },
    name: String,
    description: String
  }],
  states: [{
    name: String,
    statePrompt: String,
    edges: [{
      destinationStateName: String,
      description: String
    }],
    tools: [{
      type: String,
      name: String,
      description: String,
      // Diğer tool özellikleri
    }]
  }],
  startingState: String,
  beginMessage: String,
  defaultDynamicVariables: {
    type: Map,
    of: String
  },
  knowledgeBaseIds: [String],
  lastModificationTimestamp: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Güncelleme zamanını otomatik güncelle
llmSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const LLM = mongoose.model('LLM', llmSchema);

module.exports = LLM; 