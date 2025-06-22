const express = require('express');
const otpController = require('../controllers/otpControllers');
const { 
  validateSendOTPRequest, 
  validateVerifyOTPRequest,
  validateSetNewPasswordRequest 
} = require('../utils/otpValidation');

const resetPasswordRouter = express.Router();

// Public routes for password reset
resetPasswordRouter.post('/sendotp', validateSendOTPRequest, otpController.sendOTP);
resetPasswordRouter.post('/verifyotp', validateVerifyOTPRequest, otpController.verifyOTP);
resetPasswordRouter.post('/setnewpassword', validateSetNewPasswordRequest, otpController.resetPassword);

module.exports = resetPasswordRouter;