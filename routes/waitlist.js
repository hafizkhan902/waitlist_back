const express = require('express');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const router = express.Router();
const Waitlist = require('../models/Waitlist');
const Story = require('../models/Story');
const emailService = require('../services/emailService');

// Validation middleware for manual signup
const validateWaitlistEntry = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('referralCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Referral code must be 6 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Referral code must contain only uppercase letters and numbers')
];

// Add to waitlist (manual submission)
router.post('/add', validateWaitlistEntry, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, phone, referralCode } = req.body;

    // Check if email already exists
    const existingUser = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists in waitlist',
        existingUser: {
          id: existingUser._id,
          email: existingUser.email,
          source: existingUser.source,
          joinedAt: existingUser.joinedAt
        }
      });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await Waitlist.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({
          success: false,
          error: 'Invalid referral code'
        });
      }
    }

    // Create new waitlist entry
    const newEntry = new Waitlist({
      email: email.toLowerCase(),
      phone,
      source: 'manual',
      referredBy: referrer ? referrer._id : null
    });

    await newEntry.save();

    // Update referrer's referral count if applicable
    if (referrer) {
      referrer.referralCount += 1;
      referrer.referralRewards += 1; // You can adjust reward logic
      await referrer.save();
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(newEntry);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Successfully added to waitlist!',
      user: {
        id: newEntry._id,
        email: newEntry.email,
        phone: newEntry.phone,
        source: newEntry.source,
        referralCode: newEntry.referralCode,
        referredBy: referrer ? {
          id: referrer._id,
          email: referrer.email,
          name: referrer.googleProfile?.name || referrer.email.split('@')[0]
        } : null,
        joinedAt: newEntry.joinedAt
      }
    });

  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to waitlist'
    });
  }
});

// Get waitlist statistics (admin endpoint)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await Waitlist.countDocuments({ isActive: true });
    const googleUsers = await Waitlist.countDocuments({ 
      isActive: true, 
      source: 'google' 
    });
    const manualUsers = await Waitlist.countDocuments({ 
      isActive: true, 
      source: 'manual' 
    });

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentSignups = await Waitlist.countDocuments({
      isActive: true,
      joinedAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        google: googleUsers,
        manual: manualUsers,
        recentSignups
      }
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get waitlist statistics'
    });
  }
});

// Get all waitlist entries (admin endpoint)
router.get('/all', async (req, res) => {
  try {
    const { page = 1, limit = 50, source } = req.query;
    
    const query = { isActive: true };
    if (source) {
      query.source = source;
    }

    const users = await Waitlist.find(query)
      .sort({ joinedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Waitlist.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error getting waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get waitlist data'
    });
  }
});

// Share a story (public)
router.post('/share-story', cors({ origin: true, credentials: false }), async (req, res) => {
  try {
    const { email, name, story } = req.body || {};

    if (!story || !String(story).trim()) {
      return res.status(400).json({ success: false, error: 'story is required' });
    }

    const normalizedEmail = email && String(email).trim() ? String(email).toLowerCase() : undefined;

    // Try to link to existing waitlist user
    const existingUser = normalizedEmail ? await Waitlist.findOne({ email: normalizedEmail }) : null;

    const newStory = new Story({
      user: existingUser ? existingUser._id : undefined,
      email: normalizedEmail,
      name: (name && String(name).trim()) || (existingUser?.googleProfile?.name || undefined) || 'Anonymous',
      story: String(story).trim(),
      source: existingUser ? existingUser.source : 'manual'
    });

    await newStory.save();

    res.status(201).json({
      success: true,
      message: 'Story submitted successfully',
      story: {
        id: newStory._id,
        email: newStory.email || null,
        name: newStory.name || 'Anonymous',
        status: newStory.status,
        createdAt: newStory.createdAt
      }
    });
  } catch (error) {
    console.error('Error sharing story:', error);
    res.status(500).json({ success: false, error: 'Failed to submit story' });
  }
});

// Get single user by ID (admin or internal)
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Waitlist.findById(id).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user by id:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Get single user by email (admin or internal)
router.get('/user-by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await Waitlist.findOne({ email: email.toLowerCase() }).select('-__v');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error getting user by email:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Update user phone number by email (for Google OAuth users)
router.put('/update-phone-by-email', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, phone } = req.body;

    const user = await Waitlist.findOneAndUpdate(
      { email: email.toLowerCase() },
      { phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Phone number updated successfully',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        source: user.source
      }
    });

  } catch (error) {
    console.error('Error updating phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update phone number'
    });
  }
});

// Update user phone number (for Google OAuth users)
router.put('/update-phone/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    const user = await Waitlist.findByIdAndUpdate(
      id,
      { phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Phone number updated successfully',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        source: user.source
      }
    });

  } catch (error) {
    console.error('Error updating phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update phone number'
    });
  }
});

// Test email service
router.get('/test-email', async (req, res) => {
  try {
    const testUser = {
      email: 'test@example.com',
      phone: '+1234567890',
      googleProfile: { name: 'Test User' },
      source: 'manual',
      joinedAt: new Date()
    };

    const result = await emailService.sendWelcomeEmail(testUser);
    
    if (result) {
      res.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Error sending test email'
    });
  }
});

// Get user's referral code
router.get('/referral-code/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await Waitlist.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralRewards: user.referralRewards
    });

  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral code'
    });
  }
});

// Get referral statistics
router.get('/referral-stats', async (req, res) => {
  try {
    const totalReferrals = await Waitlist.countDocuments({ referredBy: { $exists: true, $ne: null } });
    const totalReferrers = await Waitlist.countDocuments({ referralCount: { $gt: 0 } });
    const topReferrers = await Waitlist.find({ referralCount: { $gt: 0 } })
      .sort({ referralCount: -1 })
      .limit(10)
      .select('email referralCode referralCount referralRewards');

    res.json({
      success: true,
      stats: {
        totalReferrals,
        totalReferrers,
        topReferrers
      }
    });

  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referral statistics'
    });
  }
});

// Get users referred by specific user
router.get('/referred-by/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const referredUsers = await Waitlist.find({ referredBy: userId })
      .select('email joinedAt source')
      .sort({ joinedAt: -1 });

    res.json({
      success: true,
      referredUsers
    });

  } catch (error) {
    console.error('Error getting referred users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get referred users'
    });
  }
});

// Update referral count manually (Admin endpoint)
router.put('/update-referral-count/:email', [
  body('referralCount')
    .isInt({ min: 0 })
    .withMessage('Referral count must be a non-negative integer'),
  body('referralRewards')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Referral rewards must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email } = req.params;
    const { referralCount, referralRewards } = req.body;

    const updateData = { referralCount };
    if (referralRewards !== undefined) {
      updateData.referralRewards = referralRewards;
    }

    const user = await Waitlist.findOneAndUpdate(
      { email: email.toLowerCase() },
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Referral count updated successfully',
      user: {
        id: user._id,
        email: user.email,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralRewards: user.referralRewards
      }
    });

  } catch (error) {
    console.error('Error updating referral count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update referral count'
    });
  }
});

// Validate referral code
router.get('/validate-referral/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const user = await Waitlist.findOne({ referralCode: code.toUpperCase() });
    
    if (!user) {
      return res.json({
        success: false,
        valid: false,
        error: 'Invalid referral code'
      });
    }

    res.json({
      success: true,
      valid: true,
      referrer: {
        id: user._id,
        email: user.email,
        name: user.googleProfile?.name || user.email.split('@')[0]
      }
    });

  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate referral code'
    });
  }
});

// Remove from waitlist
router.delete('/remove/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await Waitlist.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User removed from waitlist successfully'
    });

  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user from waitlist'
    });
  }
});

module.exports = router; 