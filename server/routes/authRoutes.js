const express = require('express');
const AuthController = require('../controllers/authControllers');
const { authenticateToken } = require('../middleware/auth');

const authRouter = express.Router();

// Public routes
authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);
authRouter.post('/refresh', AuthController.refreshToken);

// Protected routes
authRouter.post('/logout', authenticateToken, AuthController.logout);
authRouter.post('/logout-all', authenticateToken, AuthController.logoutAll);
authRouter.put('/profile', authenticateToken, AuthController.updateProfile);
authRouter.put('/updatepassword', authenticateToken, AuthController.updatePassword);
authRouter.put('/deleteaccount', authenticateToken, AuthController.deleteProfile);
authRouter.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = authRouter;