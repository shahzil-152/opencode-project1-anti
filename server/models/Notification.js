const mongoose = require('mongoose');

const TYPES = ['assignment', 'comment', 'completion', 'deadline', 'invitation', 'system'];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', index: true },
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: '', maxlength: 280 },
    // Where clicking the notification should take the user.
    link: {
      kind: { type: String, enum: ['task', 'project', 'workspace'], default: null },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Unread-first inbox queries.
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
