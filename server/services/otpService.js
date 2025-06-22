const { redisService } = require('../config/redis');
const emailService = require('./emailService');
const { config } = require('../config/redis');
const JWTUtils = require('../utils/jwt');
const User = require('../models/userModel');

class OtpService {
  generateOTP() {
    const min = Math.pow(10, config.otp.length - 1);
    const max = Math.pow(10, config.otp.length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getOTPKey(email) {
    return `otp:${email}`;
  }

  getAttemptsKey(email) {
    return `otp_attempts:${email}`;
  }

  getResetTokenKey(email) {
    return `reset_token:${email}`;
  }

  async sendOTP(email) {
    try {
      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('User with this email does not exist');
      }

      // Check if OTP already exists and is still valid
      const existingOTP = await redisService.get(this.getOTPKey(email));
      if (existingOTP) {
        throw new Error('OTP already sent. Please wait before requesting a new one.');
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const expiryInSeconds = config.otp.expiryMinutes * 60;

      // Store OTP in Redis with expiry
      await redisService.set(this.getOTPKey(email), otp.toString(), expiryInSeconds);

      // Reset attempts counter
      await redisService.del(this.getAttemptsKey(email));

      // Send OTP via email
      await emailService.sendOTPEmail(email, otp);

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: config.otp.expiryMinutes,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOTP(email, inputOTP) {
    try {
      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('User with this email does not exist');
      }

      // Check if OTP exists
      const storedOTP = await redisService.get(this.getOTPKey(email));
      if (!storedOTP) {
        throw new Error('OTP not found or has expired');
      }

      // Check attempts
      const attemptsKey = this.getAttemptsKey(email);
      const attempts = await redisService.get(attemptsKey) || '0';
      const currentAttempts = parseInt(attempts);

      if (currentAttempts >= config.otp.maxAttempts) {
        // Delete OTP after max attempts
        await redisService.del(this.getOTPKey(email));
        await redisService.del(attemptsKey);
        throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      }

      // Verify OTP
      if (storedOTP === inputOTP.toString()) {
        // OTP is correct - clean up OTP data
        await redisService.del(this.getOTPKey(email));
        await redisService.del(attemptsKey);
        
        // Generate password reset token (15 minutes expiry)
        const resetToken = JWTUtils.generatePasswordResetToken(email);
        const resetTokenExpiry = 15 * 60; // 15 minutes in seconds
        
        // Store reset token in Redis
        await redisService.set(
          this.getResetTokenKey(email), 
          resetToken, 
          resetTokenExpiry
        );
        
        return {
          success: true,
          message: 'OTP verified successfully',
          resetToken: resetToken,
          expiresIn: 15, // 15 minutes
        };
      } else {
        // Increment attempts
        await redisService.incr(attemptsKey);
        await redisService.expire(attemptsKey, config.otp.expiryMinutes * 60);
        
        const remainingAttempts = config.otp.maxAttempts - (currentAttempts + 1);
        throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      // Validate input
      if (!token || !newPassword) {
        throw new Error('Reset token and new password are required');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Verify the reset token
      let decoded;
      try {
        decoded = JWTUtils.verifyPasswordResetToken(token);
      } catch (error) {
        throw new Error('Invalid or expired reset token');
      }

      const email = decoded.email;

      // Check if token exists in Redis
      const storedToken = await redisService.get(this.getResetTokenKey(email));
      if (!storedToken || storedToken !== token) {
        throw new Error('Invalid or expired reset token');
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Check if new password is different from current password
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        throw new Error('New password must be different from current password');
      }

      // Update password and clear all refresh tokens (logout from all devices)
      user.password = newPassword;
      user.refreshTokens = []; // Clear all refresh tokens
      await user.save();

      // Clean up reset token from Redis
      await redisService.del(this.getResetTokenKey(email));

      // Log password reset for security
      console.log(`Password reset for user: ${email} at ${new Date()} - Logged out from all devices`);

      return {
        success: true,
        message: 'Password reset successfully. Please login with your new password.',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}

module.exports = new OtpService();