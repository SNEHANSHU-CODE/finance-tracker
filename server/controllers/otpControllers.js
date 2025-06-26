const otpService = require('../services/otpService');

class OTPController {
  async sendOTP(req, res) {
    try {
      const { email } = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required',
        });
      }

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

      // Validate required fields
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required',
        });
      }

      const result = await otpService.verifyOTP(email.toLowerCase(), otp);

      // Set the reset token as an HTTP-only cookie for security
      if (result.success && result.resetToken) {
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' ? true : false,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000, // 15 minutes
          path: '/'
        };

        res.cookie('resetToken', result.resetToken, cookieOptions);

        // Don't send the token in the response body for security
        const responseData = { ...result };
        delete responseData.resetToken;

        return res.status(200).json({
          ...responseData,
          message: 'OTP verified successfully. You can now reset your password.'
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
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }

      // Extract reset token from header/body/cookie
      const authHeader = req.headers.authorization;
      const tokenFromHeader = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
      const resetToken =
        tokenFromHeader || req.body.resetToken || req.cookies.resetToken;

      if (!resetToken) {
        return res.status(401).json({
          success: false,
          message: 'Reset token is required. Please verify OTP first.',
          code: 'RESET_TOKEN_MISSING',
        });
      }

      const result = await otpService.resetPassword(resetToken, newPassword);

      //   Clear the reset token cookie after success
      if (result.success) {
        res.clearCookie('resetToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' ? true : false,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Reset password error:', error);

      if (error.message.includes('expired') || error.message.includes('invalid')) {
        res.clearCookie('resetToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' ? true : false,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/',
        });
        return res.status(401).json({
          success: false,
          message: 'Reset token has expired or is invalid. Please request a new OTP.',
          code: 'RESET_TOKEN_EXPIRED',
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }

}

module.exports = new OTPController();