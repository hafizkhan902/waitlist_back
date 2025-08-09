const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  
  try {
    // Use the original email configuration from .env
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // Use SSL for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified!');

    const mailOptions = {
      from: `"Waitlist Team" <${process.env.EMAIL_USER}>`,
      to: 'hkkhan074@gmail.com',
      subject: '🎉 Welcome to Our Waitlist!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🎉 Welcome to Our Waitlist!</h1>
            <p>You're now part of something special</p>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2>Hi Test User!</h2>
            <p>Thank you for joining our exclusive waitlist! We're thrilled to have you on board.</p>
            <p>Your email: <strong>hkkhan074@gmail.com</strong></p>
            <p>We'll keep you updated on our progress and let you know as soon as we launch!</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>You received this email because you joined our waitlist.</p>
          </div>
        </div>
      `,
      text: 'Welcome to our waitlist! We\'re excited to have you on board.'
    };

    console.log('Sending email...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('To:', result.accepted);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
  }
}

testEmail(); 