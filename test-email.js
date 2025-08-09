const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

// Test email configuration
const testConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your_email@gmail.com',
    pass: process.env.SMTP_PASS || 'your_app_password'
  }
};

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

async function sendTestEmail() {
  console.log('🚀 Starting email test...');
  
  // Check if email credentials are configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Email credentials not configured!');
    console.log('Please set SMTP_USER and SMTP_PASS environment variables');
    console.log('Example: SMTP_USER=your_email@gmail.com SMTP_PASS=your_app_password node test-email.js');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(testConfig);
    
    // Verify connection
    console.log('🔍 Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified!');

    // Prepare email data
    const emailData = {
      name: 'Test User',
      email: 'hkkhan074@gmail.com'
    };

    const htmlContent = welcomeTemplate(emailData);

    // Email options
    const mailOptions = {
      from: `"Waitlist Team" <${process.env.SMTP_USER}>`,
      to: 'hkkhan074@gmail.com',
      subject: '🎉 Welcome to Our Waitlist! (Test Email)',
      html: htmlContent,
      text: 'Welcome to our waitlist! This is a test email.'
    };

    // Send email
    console.log('📧 Sending email to hkkhan074@gmail.com...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('To:', result.accepted);
    
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Your email and password are correct');
      console.log('2. You have enabled "Less secure app access" or use an App Password');
      console.log('3. For Gmail, you might need to generate an App Password');
    }
  }
}

// Run the test
sendTestEmail(); 