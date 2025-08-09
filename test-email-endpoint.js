const express = require('express');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3001;

app.use(express.json());

// Welcome email template
const welcomeTemplate = handlebars.compile(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Waitlist!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to Our Waitlist!</h1>
            <p>You're now part of something special</p>
        </div>
        <div class="content">
            <h2>Hi {{name}}!</h2>
            <p>Thank you for joining our exclusive waitlist! We're thrilled to have you on board.</p>
            <p>Your email: <strong>{{email}}</strong></p>
            <p>We'll keep you updated on our progress and let you know as soon as we launch!</p>
        </div>
        <div class="footer">
            <p>You received this email because you joined our waitlist.</p>
        </div>
    </div>
</body>
</html>
`);

// Email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { email, name = 'Test User' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.' 
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
      port: process.env.EMAIL_PORT || 465,
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify connection
    await transporter.verify();

    // Prepare email data
    const emailData = {
      name: name,
      email: email
    };

    const htmlContent = welcomeTemplate(emailData);

    // Email options
    const mailOptions = {
      from: `"Waitlist Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to Our Waitlist!',
      html: htmlContent,
      text: 'Welcome to our waitlist! We\'re excited to have you on board.'
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email sent successfully!',
      messageId: result.messageId,
      to: result.accepted
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    if (error.code === 'EAUTH') {
      res.status(500).json({
        success: false,
        error: 'Email authentication failed. Please check your SMTP credentials.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email: ' + error.message
      });
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email test server is running',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Email test server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  console.log(`📧 EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`📧 EMAIL_HOST: ${process.env.EMAIL_HOST || 'NOT SET'}`);
  console.log(`📧 EMAIL_PORT: ${process.env.EMAIL_PORT || 'NOT SET'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Send email: POST http://localhost:${PORT}/send-email`);
}); 