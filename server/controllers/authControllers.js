const User = require('../models/userModel');
const JWTUtils = require('../utils/jwt');
const ResponseUtils = require('../utils/response');
const ValidationUtils = require('../utils/validation');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validate input
      const validation = ValidationUtils.validateRegisterInput(req.body);
      if (!validation.isValid) {
        return ResponseUtils.validationError(res, validation.errors);
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username }]
      });

      if (existingUser) {
        const message = existingUser.email === email.toLowerCase() 
          ? 'Email already exists' 
          : 'Username already exists';
        return ResponseUtils.error(res, message, 400);
      }

      // Create new user
      const user = new User({
        username,
        email: email.toLowerCase(),
        password
      });

      await user.save();

      // Generate token pair
      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(user._id);

      // Save refresh token to user
      user.refreshTokens.push({ token: refreshToken });
      await user.save();

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return response
      return ResponseUtils.success(res, {
        user: user.toJSON(),
        accessToken
      }, 'User registered successfully', 201);

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return ResponseUtils.error(res, `${field} already exists`, 400);
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return ResponseUtils.validationError(res, errors);
      }

      return ResponseUtils.error(res, 'Server error during registration');
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      const validation = ValidationUtils.validateLoginInput(req.body);
      if (!validation.isValid) {
        return ResponseUtils.validationError(res, validation.errors);
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return ResponseUtils.unauthorized(res, 'Invalid credentials');
      }

      // Check if account is active
      if (!user.isActive) {
        return ResponseUtils.forbidden(res, 'Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseUtils.unauthorized(res, 'Invalid credentials');
      }

      // Generate token pair
      const { accessToken, refreshToken } = JWTUtils.generateTokenPair(user._id);

      // Save refresh token to user
      user.refreshTokens.push({ token: refreshToken });
      await user.save();

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return response
      return ResponseUtils.success(res, {
        user: user.toJSON(),
        accessToken
      }, 'Login successful');

    } catch (error) {
      console.error('Login error:', error);
      return ResponseUtils.error(res, 'Server error during login');
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return ResponseUtils.unauthorized(res, 'Refresh token not found');
      }

      // Verify refresh token
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return ResponseUtils.unauthorized(res, 'Invalid token type');
      }

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return ResponseUtils.unauthorized(res, 'User not found');
      }

      // Check if account is active
      if (!user.isActive) {
        return ResponseUtils.forbidden(res, 'Account is deactivated');
      }

      // Check if refresh token exists in user's tokens
      const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
      if (!tokenExists) {
        return ResponseUtils.unauthorized(res, 'Invalid refresh token');
      }

      // Generate new access token
      const newAccessToken = JWTUtils.generateAccessToken(user._id);

      return ResponseUtils.success(res, {
        user: user.toJSON(),
        accessToken: newAccessToken
      }, 'Token refreshed successfully');

    } catch (error) {
      console.error('Token refresh error:', error);
      return ResponseUtils.forbidden(res, 'Invalid refresh token');
    }
  }

  // Verify token 
  static async verifyToken(req, res) {
    try {
      // If we reach here, the token is valid (middleware already verified it)
      return ResponseUtils.success(res, {
        user: req.user,
        accessToken: req.headers.authorization?.split(' ')[1] // Return current token
      }, 'Token is valid');
    } catch (error) {
      console.error('Token verification error:', error);
      return ResponseUtils.forbidden(res, 'Token verification failed');
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        // Remove refresh token from user's tokens
        await User.findByIdAndUpdate(req.user._id, {
          $pull: { refreshTokens: { token: refreshToken } }
        });
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return ResponseUtils.success(res, null, 'Logout successful');

    } catch (error) {
      console.error('Logout error:', error);
      return ResponseUtils.error(res, 'Server error during logout');
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      return ResponseUtils.success(res, {
        user: req.user
      }, 'Profile retrieved successfully');
    } catch (error) {
      console.error('Profile error:', error);
      return ResponseUtils.error(res, 'Server error retrieving profile');
    }
  }

  // Logout from all devices
  static async logoutAll(req, res) {
    try {
      // Remove all refresh tokens
      await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshTokens: [] }
      });

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return ResponseUtils.success(res, null, 'Logged out from all devices');

    } catch (error) {
      console.error('Logout all error:', error);
      return ResponseUtils.error(res, 'Server error during logout');
    }
  }
}

module.exports = AuthController;