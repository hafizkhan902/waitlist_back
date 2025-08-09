const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Waitlist = require('../models/Waitlist');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Waitlist.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRETE || !process.env.GOOGLE_CALLBACK) {
  console.warn('Google OAuth credentials not configured. Google sign-in will be disabled.');
} else {
              // Strategy for regular OAuth flow
            passport.use('google', new GoogleStrategy({
              clientID: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRETE,
              callbackURL: process.env.GOOGLE_CALLBACK,
              scope: ['profile', 'email']
            }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists in waitlist
    let waitlistUser = await Waitlist.findOne({ googleId: profile.id });
    
    if (waitlistUser) {
      // User exists, update profile info
      waitlistUser.googleProfile = {
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        email: profile.emails[0]?.value
      };
      await waitlistUser.save();
      return done(null, waitlistUser);
    }
    
    // Check if email already exists (manual signup)
    const existingEmail = await Waitlist.findOne({ email: profile.emails[0]?.value });
    if (existingEmail) {
      // Update existing user with Google info
      existingEmail.googleId = profile.id;
      existingEmail.googleProfile = {
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        email: profile.emails[0]?.value
      };
      existingEmail.source = 'google';
      await existingEmail.save();
      return done(null, existingEmail);
    }
    
    // Create new waitlist user
    const newWaitlistUser = new Waitlist({
      email: profile.emails[0]?.value,
      phone: null, // Phone is optional for Google OAuth users
      googleId: profile.id,
      googleProfile: {
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        email: profile.emails[0]?.value
      },
      source: 'google'
    });
    
    await newWaitlistUser.save();
    return done(null, newWaitlistUser);
    
  } catch (error) {
                      return done(error, null);
                }
              }));

              // Strategy for popup OAuth flow
              passport.use('google-popup', new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRETE,
                callbackURL: process.env.GOOGLE_CALLBACK_POPUP || `${process.env.GOOGLE_CALLBACK}/popup`,
                scope: ['profile', 'email']
              }, async (accessToken, refreshToken, profile, done) => {
                try {
                  // Check if user already exists in waitlist
                  let waitlistUser = await Waitlist.findOne({ googleId: profile.id });

                  if (waitlistUser) {
                    // User exists, update profile info
                    waitlistUser.googleProfile = {
                      name: profile.displayName,
                      picture: profile.photos[0]?.value,
                      email: profile.emails[0]?.value
                    };
                    await waitlistUser.save();
                    return done(null, waitlistUser);
                  }

                  // Check if email already exists (manual signup)
                  const existingEmail = await Waitlist.findOne({ email: profile.emails[0]?.value });
                  if (existingEmail) {
                    // Update existing user with Google info
                    existingEmail.googleId = profile.id;
                    existingEmail.googleProfile = {
                      name: profile.displayName,
                      picture: profile.photos[0]?.value,
                      email: profile.emails[0]?.value
                    };
                    existingEmail.source = 'google';
                    await existingEmail.save();
                    return done(null, existingEmail);
                  }

                  // Create new waitlist user
                  const newWaitlistUser = new Waitlist({
                    email: profile.emails[0]?.value,
                    phone: null, // Set to null for Google OAuth users
                    googleId: profile.id,
                    googleProfile: {
                      name: profile.displayName,
                      picture: profile.photos[0]?.value,
                      email: profile.emails[0]?.value
                    },
                    source: 'google'
                  });

                  await newWaitlistUser.save();
                  return done(null, newWaitlistUser);

                } catch (error) {
                  return done(error, null);
                }
              }));
            }

module.exports = passport; 