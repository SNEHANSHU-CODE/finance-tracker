const notificationService = require('../services/notificationService');

const notificationController = {
  /**
   * GET /notifications
   * Returns all notifications for the authenticated user.
   * Also returns unread count for the bell badge.
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // cap at 100

      const [notifications, unreadCount] = await Promise.all([
        notificationService.getAll(userId, limit),
        notificationService.getUnreadCount(userId),
      ]);

      return res.status(200).json({
        success: true,
        data: { notifications, unreadCount },
      });
    } catch (error) {
      console.error('[notificationController] getNotifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
      });
    }
  },

  /**
   * GET /notifications/unread-count
   * Lightweight endpoint — just the count for polling the bell badge.
   */
  async getUnreadCount(req, res) {
    try {
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      return res.status(200).json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      console.error('[notificationController] getUnreadCount error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count',
      });
    }
  },

  /**
   * PATCH /notifications/read-all
   * Marks all unread notifications as read.
   * Called when user opens the notification panel.
   */
  async markAllRead(req, res) {
    try {
      const updated = await notificationService.markAllRead(req.user.id);
      return res.status(200).json({
        success: true,
        data: { updated },
        message: `${updated} notification(s) marked as read`,
      });
    } catch (error) {
      console.error('[notificationController] markAllRead error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
      });
    }
  },

  /**
   * PATCH /notifications/:id/read
   * Marks a single notification as read.
   */
  async markOneRead(req, res) {
    try {
      const notification = await notificationService.markOneRead(
        req.params.id,
        req.user.id
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: { notification },
      });
    } catch (error) {
      console.error('[notificationController] markOneRead error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
      });
    }
  },

  /**
   * DELETE /notifications/:id
   * Deletes a single notification. User can only delete their own.
   */
  async deleteNotification(req, res) {
    try {
      const deleted = await notificationService.deleteOne(
        req.params.id,
        req.user.id
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      console.error('[notificationController] deleteNotification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
      });
    }
  },
};

module.exports = notificationController;