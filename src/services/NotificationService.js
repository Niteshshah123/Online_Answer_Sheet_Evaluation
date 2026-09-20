const Notification = require('../models/entities/notificationModel');
const AppError = require('../exceptions/AppError');

class NotificationService {
  async createNotification({ userId, title, message, type = 'SYSTEM', link = '', referenceId = '' }) {
    if (!userId || !title || !message) {
      return null;
    }
    try {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        referenceId: String(referenceId || ''),
        isRead: false,
        createdAt: new Date()
      });
      return notification;
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err);
      return null;
    }
  }

  async getUserNotifications(userId) {
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return {
      notifications,
      unreadCount
    };
  }

  async markAsRead(userId, notificationId) {
    const notif = await Notification.findOne({ _id: notificationId, userId });
    if (!notif) {
      throw new AppError('Notification not found', 404);
    }
    notif.isRead = true;
    await notif.save();
    return notif;
  }

  async markAsUnread(userId, notificationId) {
    const notif = await Notification.findOne({ _id: notificationId, userId });
    if (!notif) {
      throw new AppError('Notification not found', 404);
    }
    notif.isRead = false;
    await notif.save();
    return notif;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    return { success: true };
  }

  async deleteNotification(userId, notificationId) {
    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!result) {
      throw new AppError('Notification not found', 404);
    }
    return { success: true };
  }

  async clearAllRead(userId) {
    await Notification.deleteMany({ userId, isRead: true });
    return { success: true };
  }
}

module.exports = new NotificationService();
