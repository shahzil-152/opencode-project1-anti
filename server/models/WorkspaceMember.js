const mongoose = require('mongoose');

const ROLES = ['owner', 'admin', 'member'];

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One membership per (workspace, user) pair.
workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });
// Fast "all workspaces for a user" lookups.
workspaceMemberSchema.index({ user: 1 });

workspaceMemberSchema.statics.ROLES = ROLES;

const ROLE_RANK = { member: 0, admin: 1, owner: 2 };
workspaceMemberSchema.statics.roleAtLeast = function roleAtLeast(role, minRole) {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
};

module.exports = mongoose.model('WorkspaceMember', workspaceMemberSchema);
