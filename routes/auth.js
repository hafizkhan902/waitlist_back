const express = require('express');
const passport = require('passport');
const router = express.Router();
const emailService = require('../services/emailService');
const Waitlist = require('../models/Waitlist');

// Import passport config
require('../config/passport');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Google OAuth routes (support referral via state)
router.get('/google', (req, res, next) => {
  const referralCode = (req.query.ref || req.query.referral || req.query.referralCode || '').toString().toUpperCase();
  const options = { scope: ['profile', 'email'] };
  if (referralCode) options.state = referralCode;
  return passport.authenticate('google', options)(req, res, next);
});

// Popup OAuth route (for popup window) with referral support
router.get('/google/popup', (req, res, next) => {
  const referralCode = (req.query.ref || req.query.referral || req.query.referralCode || '').toString().toUpperCase();
  const options = { scope: ['profile', 'email'] };
  if (referralCode) options.state = referralCode;
  return passport.authenticate('google-popup', options)(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    failureFlash: true 
  }),
  async (req, res) => {
    // Link referrer if referral state was provided
    try {
      const referralState = (req.query.state || '').toString().toUpperCase();
      if (referralState && req.user && !req.user.referredBy) {
        const referrer = await Waitlist.findOne({ referralCode: referralState });
        if (referrer && String(referrer._id) !== String(req.user._id)) {
          req.user.referredBy = referrer._id;
          await req.user.save();
          referrer.referralCount += 1;
          referrer.referralRewards += 1;
          await referrer.save();
        }
      }
    } catch (linkErr) {
      console.error('Failed to link referrer on Google callback:', linkErr);
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(req.user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Redirect to frontend with user data
    const userData = encodeURIComponent(JSON.stringify({
      success: true,
      message: 'Successfully added to waitlist via Google!',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.googleProfile?.name,
        picture: req.user.googleProfile?.picture,
        source: req.user.source,
        referralCode: req.user.referralCode
      }
    }));

    // Redirect to frontend with success data
    res.redirect(`${process.env.FRONTEND_URL || 'https://newronx.com'}/auth/success?data=${userData}`);
  }
);

// Auth failure route
router.get('/failure', (req, res) => {
  const errorData = encodeURIComponent(JSON.stringify({
    success: false,
    error: 'Google authentication failed'
  }));
  
  // Redirect to frontend with error data
  res.redirect(`${process.env.FRONTEND_URL || 'https://newronx.com'}/auth/error?data=${errorData}`);
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.json({ success: true, message: 'Successfully logged out' });
  });
});

// Get current user status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.googleProfile?.name,
        picture: req.user.googleProfile?.picture,
        source: req.user.source,
        referralCode: req.user.referralCode,
        joinedAt: req.user.joinedAt
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Popup OAuth callback (for popup window)
router.get('/google/callback/popup', 
  passport.authenticate('google-popup', { 
    failureRedirect: '/auth/failure/popup',
    failureFlash: true 
  }),
  async (req, res) => {
    // Link referrer if referral state was provided
    try {
      const referralState = (req.query.state || '').toString().toUpperCase();
      if (referralState && req.user && !req.user.referredBy) {
        const referrer = await Waitlist.findOne({ referralCode: referralState });
        if (referrer && String(referrer._id) !== String(req.user._id)) {
          req.user.referredBy = referrer._id;
          await req.user.save();
          referrer.referralCount += 1;
          referrer.referralRewards += 1;
          await referrer.save();
        }
      }
    } catch (linkErr) {
      console.error('Failed to link referrer on Google popup callback:', linkErr);
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(req.user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Create HTML page that sends message to parent window and closes popup
    const userData = {
      success: true,
      message: 'Successfully added to waitlist via Google!',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.googleProfile?.name,
        picture: req.user.googleProfile?.picture,
        source: req.user.source,
        referralCode: req.user.referralCode
      }
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Complete</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h2>Authentication Successful!</h2>
          <p>You have been successfully added to the waitlist.</p>
          <p>This window will close automatically...</p>
        </div>
        <script>
          // Send message to parent window
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(userData)}, '*');
          }
          
          // Close popup after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  }
);

// Popup failure callback
router.get('/auth/failure/popup', (req, res) => {
  const errorData = {
    success: false,
    error: 'Google authentication failed'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Failed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        .error-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h2>Authentication Failed</h2>
        <p>There was an error during Google authentication.</p>
        <p>This window will close automatically...</p>
      </div>
      <script>
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage(${JSON.stringify(errorData)}, '*');
        }
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 3000);
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// API endpoint for OAuth callback (returns JSON instead of redirect)
router.get('/google/callback/api', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    failureFlash: true 
  }),
  async (req, res) => {
    // Link referrer if referral state was provided
    try {
      const referralState = (req.query.state || '').toString().toUpperCase();
      if (referralState && req.user && !req.user.referredBy) {
        const referrer = await Waitlist.findOne({ referralCode: referralState });
        if (referrer && String(referrer._id) !== String(req.user._id)) {
          req.user.referredBy = referrer._id;
          await req.user.save();
          referrer.referralCount += 1;
          referrer.referralRewards += 1;
          await referrer.save();
        }
      }
    } catch (linkErr) {
      console.error('Failed to link referrer on Google API callback:', linkErr);
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(req.user);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Return JSON response for API clients
    res.json({
      success: true,
      message: 'Successfully added to waitlist via Google!',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.googleProfile?.name,
        picture: req.user.googleProfile?.picture,
        source: req.user.source,
        referralCode: req.user.referralCode
      }
    });
  }
);

// Check if email exists in waitlist
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await require('../models/Waitlist').findOne({ email: email.toLowerCase() });
    
    if (user) {
      res.json({
        exists: true,
        source: user.source,
        joinedAt: user.joinedAt
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error checking email' });
  }
});

module.exports = router; 