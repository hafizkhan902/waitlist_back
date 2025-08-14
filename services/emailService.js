const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = {};
    this.init();
  }

  async init() {
    // Create transporter with better timeout and connection settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || process.env.EMAIL_PORT || 587,
      secure: (process.env.SMTP_PORT == 465 || process.env.EMAIL_PORT == 465), // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      },
      // Connection timeout settings
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      // TLS settings
      tls: {
        rejectUnauthorized: false
      }
    });

    // Load email templates
    await this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // Load welcome email template
      const welcomeTemplate = await fs.readFile(
        path.join(templatesDir, 'welcome.hbs'), 
        'utf8'
      );
      this.templates.welcome = handlebars.compile(welcomeTemplate);

      // Load confirmation email template
      const confirmationTemplate = await fs.readFile(
        path.join(templatesDir, 'confirmation.hbs'), 
        'utf8'
      );
      this.templates.confirmation = handlebars.compile(confirmationTemplate);

    } catch (error) {
      console.warn('Email templates not found, using default templates');
      this.createDefaultTemplates();
    }
  }

  createDefaultTemplates() {
    // Default welcome email template
    this.templates.welcome = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Our Waitlist!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Our Waitlist!</h1>
          </div>
          <div class="content">
            <h2>Hi {{name}}!</h2>
            <p>Thank you for joining our waitlist! We're excited to have you on board.</p>
            <p>Here are your details:</p>
            <p>We'll keep you updated on our progress and let you know as soon as we launch!</p>
            <p>Best regards,<br>The Team</p>
          </div>
          <div class="footer">
            <p>If you didn't sign up, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `);

    // Default confirmation email template
    this.templates.confirmation = handlebars.compile(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Waitlist Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Waitlist Confirmation</h1>
          </div>
          <div class="content">
            <h2>Hello {{name}}!</h2>
            <p>Your waitlist registration has been confirmed successfully.</p>
            <p><strong>Registration Details:</strong></p>
            <ul>
              <li><strong>Email:</strong> {{email}}</li>
              <li><strong>Signup Method:</strong> {{signupMethod}}</li>
              <li><strong>Registration Date:</strong> {{registrationDate}}</li>
            </ul>
            <p>We'll notify you as soon as we have updates!</p>
            <p>Thanks for your patience!</p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation email.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  async sendWelcomeEmail(user) {
    try {
      if (!this.transporter) {
        console.warn('Email service not configured');
        return false;
      }

      // Check if email credentials are available
      const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
      if (!emailUser) {
        console.warn('Email user not configured');
        return false;
      }

      const emailData = {
        name: user.googleProfile?.name || user.email.split('@')[0],
        email: user.email,
        phone: user.phone || 'Not provided',
        joinedDate: new Date(user.joinedAt).toLocaleDateString(),
        signupMethod: user.source === 'google' ? 'Google OAuth' : 'Manual Registration',
        logoSrc: process.env.LOGO_URL || 'cid:app-logo'
      };

      const htmlContent = this.templates.welcome(emailData);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Waitlist Team'}" <${emailUser}>`,
        to: user.email,
        subject: '🎉 Welcome to Our Waitlist!',
        html: htmlContent,
        text: this.htmlToText(htmlContent),
        attachments: [
          ...(process.env.LOGO_URL ? [] : [{
            filename: 'logo.png',
            path: path.join(__dirname, '../assets/logo.png'),
            cid: 'app-logo'
          }])
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      return !!result?.messageId;

    } catch (error) {
      console.error('Error sending welcome email:', error);
      
      // Log specific error details
      if (error.code === 'ETIMEDOUT') {
        console.error('SMTP connection timed out. Check your SMTP settings and network connection.');
      } else if (error.code === 'EAUTH') {
        console.error('SMTP authentication failed. Check your email credentials.');
      } else if (error.code === 'ECONNECTION') {
        console.error('SMTP connection failed. Check your SMTP host and port settings.');
      }
      
      return false;
    }
  }

  async sendConfirmationEmail(user) {
    try {
      if (!this.transporter) {
        console.warn('Email service not configured');
        return false;
      }

      const emailData = {
        name: user.googleProfile?.name || user.email.split('@')[0],
        email: user.email,
        signupMethod: user.source === 'google' ? 'Google OAuth' : 'Manual Registration',
        registrationDate: new Date(user.joinedAt).toLocaleDateString()
      };

      const htmlContent = this.templates.confirmation(emailData);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Waitlist Team'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: '✅ Waitlist Registration Confirmed',
        html: htmlContent,
        text: this.htmlToText(htmlContent)
      };

      const result = await this.transporter.sendMail(mailOptions);
      return !!result?.messageId;

    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email service not configured' };
      }
      
      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService(); 