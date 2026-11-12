const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // e.g. task.created, task.completed, project.created, member.joined
    type: { type: String, required: true },
    entityType: { type: String, enum: ['task', 'project', 'workspace', 'member', 'comment'] },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Free-form context (task title, member name, ...) rendered by the client.
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Activity feeds are queried newest-first per workspace (optionally per project).
activitySchema.index({ workspace: 1, createdAt: -1 });
activitySchema.index({ workspace: 1, entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
