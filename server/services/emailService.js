const nodemailer = require('nodemailer');
const { config } = require('../config/redis');

class emailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  async sendOTPEmail(email, otp) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Your OTP Verification Code',
        html: this.generateOTPEmailTemplate(otp),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  generateOTPEmailTemplate(otp) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">OTP Verification</h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
            Your verification code is:
          </p>
          <h1 style="color: #2196F3; font-size: 32px; margin: 20px 0; letter-spacing: 5px;">
            ${otp}
          </h1>
          <p style="font-size: 14px; color: #999; margin-top: 20px;">
            This code will expire in ${config.otp.expiryMinutes} minutes.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 10px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      </div>
    `;
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

module.exports = new emailService();