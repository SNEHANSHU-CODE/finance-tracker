// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple email normalization (lowercase and trim)
const normalizeEmail = (email) => {
  return email.toLowerCase().trim();
};

const validateSendOTPRequest = (req, res, next) => {
  const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Normalize email
  req.body.email = normalizeEmail(email);

  next();
};

const validateVerifyOTPRequest = (req, res, next) => {
  const { email, otp } = req.body;

  // Check if email is provided
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  // Check if OTP is provided
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'OTP is required',
    });
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Validate OTP format (should be numeric and of correct length)
  if (!/^\d+$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must contain only numbers',
    });
  }

  // Normalize email
  req.body.email = normalizeEmail(email);

  next();
};

const validateSetNewPasswordRequest = (req, res, next) => {
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password is required',
    });
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    });
  }

  next();
};


module.exports = {
  validateSendOTPRequest,
  validateVerifyOTPRequest,
  validateSetNewPasswordRequest,
};