const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

invitationSchema.index({ workspace: 1, status: 1 });
// Pending invitations for one email across workspaces.
invitationSchema.index({ email: 1, status: 1 });

invitationSchema.methods.isExpired = function isExpired() {
  return this.expiresAt.getTime() < Date.now();
};

module.exports = mongoose.model('Invitation', invitationSchema);
