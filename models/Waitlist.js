const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: false, // Make phone optional for Google OAuth users
    trim: true
  },
  // Google OAuth fields
  googleId: {
    type: String,
    sparse: true
  },
  googleProfile: {
    name: String,
    picture: String,
    email: String
  },
  // Additional fields
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  // For tracking purposes
  source: {
    type: String,
    enum: ['manual', 'google'],
    default: 'manual'
  },
  // Referral tracking
  referralCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waitlist'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referralRewards: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
waitlistSchema.index({ email: 1 }, { unique: true });
waitlistSchema.index({ googleId: 1 }, { sparse: true, unique: true });
waitlistSchema.index({ joinedAt: -1 });

// Generate referral code before saving
waitlistSchema.pre('save', async function(next) {
  // Prevent duplicate emails
  if (this.isModified('email')) {
    const existingUser = await this.constructor.findOne({ 
      email: this.email, 
      _id: { $ne: this._id } 
    });
    if (existingUser) {
      throw new Error('Email already exists in waitlist');
    }
  }
  
  // Generate referral code if not exists
  if (!this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  
  next();
});

// Generate unique referral code
waitlistSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = mongoose.model('Waitlist', waitlistSchema); 