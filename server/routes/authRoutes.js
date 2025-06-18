const express = require('express');
const AuthController = require('../controllers/authControllers');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/logout-all', authenticateToken, AuthController.logoutAll);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put('/updatepassword', authenticateToken, AuthController.updatePassword);
router.put('/deleteaccount', authenticateToken, AuthController.deleteProfile)
router.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = router;