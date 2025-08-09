const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waitlist',
    required: false
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    default: 'Anonymous'
  },
  story: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['manual', 'google'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  metadata: {
    type: Object,
    required: false
  }
}, { timestamps: true });

storySchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('Story', storySchema); 