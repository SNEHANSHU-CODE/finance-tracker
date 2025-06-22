const otpService = require('../services/otpService');

class OTPController {
  async sendOTP(req, res) {
    try {
      const { email } = req.body;
      const result = await otpService.sendOTP(email.toLowerCase());
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send OTP',
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await otpService.verifyOTP(email.toLowerCase(), otp);
      
      // Set the reset token as an HTTP-only cookie for security
      if (result.success && result.resetToken) {
        res.cookie('resetToken', result.resetToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify OTP',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { newPassword, resetToken: bodyToken } = req.body;

      const token = req.headers.authorization?.split(' ')[1];
      
      // Use token from body first, fallback to cookie
      const resetToken = bodyToken|| token || req.cookies.resetToken;
      
      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Reset token is required. Please verify OTP first.',
        });
      }
      
      const result = await otpService.resetPassword(resetToken, newPassword);
      
      // Clear the reset token cookie after successful password reset
      if (result.success) {
        res.clearCookie('resetToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }
}

module.exports = new OTPController();