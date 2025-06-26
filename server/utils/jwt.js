const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'your-reset-secret-key';

class JWTUtils {
  static generateAccessToken(userId) {
    return jwt.sign(
      { userId, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  static generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static verifyResetToken(token){
    try{
      return jwt.verify(token,JWT_RESET_SECRET);
    } catch (error) {
      throw new Error('Invalic reset token');
    }
  }

  static generateTokenPair(userId) {
    return {
      accessToken: this.generateAccessToken(userId),
      refreshToken: this.generateRefreshToken(userId)
    };
  }



  static generatePasswordResetToken(email) {
    return jwt.sign(
      {
        email: email,
        type: 'password_reset'
      },
      JWT_RESET_SECRET,
      {
        expiresIn: '15m' // 15 minutes for password reset
      }
    );
  }

}

module.exports = JWTUtils;