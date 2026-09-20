const express = require('express');
const { verifyToken } = require('../security/jwt');
const User = require('../models/entities/userModel');
const notificationService = require('../services/NotificationService');
const AppError = require('../exceptions/AppError');

const router = express.Router();

// General User Auth Middleware for notifications (Supports STUDENT, FACULTY, ADMIN)
async function anyUserAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid token', 401);
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new AppError(err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

router.get('/', anyUserAuth, async (req, res, next) => {
  try {
    const result = await notificationService.getUserNotifications(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', anyUserAuth, async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user._id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/unread', anyUserAuth, async (req, res, next) => {
  try {
    const result = await notificationService.markAsUnread(req.user._id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/read-all', anyUserAuth, async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.delete('/clear-read', anyUserAuth, async (req, res, next) => {
  try {
    const result = await notificationService.clearAllRead(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', anyUserAuth, async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.user._id, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
