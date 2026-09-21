const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['DOUBT_RAISED', 'DOUBT_REPLIED', 'RESULT_PUBLISHED', 'SYSTEM'],
    default: 'SYSTEM'
  },
  link: { type: String, default: '' },
  referenceId: { type: String, default: '' },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
