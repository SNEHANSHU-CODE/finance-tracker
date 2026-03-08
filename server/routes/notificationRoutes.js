const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticateToken);

// GET /notifications           — fetch all notifications + unread count
router.get('/', notificationController.getNotifications);

// GET /notifications/unread-count  — lightweight count for bell badge polling
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /notifications/read-all    — mark all as read (open panel)
router.patch('/read-all', notificationController.markAllRead);

// PATCH /notifications/:id/read    — mark single as read
router.patch('/:id/read', notificationController.markOneRead);

// DELETE /notifications/:id        — delete single notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;