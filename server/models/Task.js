const mongoose = require('mongoose');

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'completed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const subtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: STATUSES, default: 'todo', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    labels: {
      type: [String],
      validate: {
        validator: (labels) => labels.length <= 10,
        message: 'A task can have at most 10 labels',
      },
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, default: null, index: true },
    subtasks: { type: [subtaskSchema], default: [] },
    // Ordering inside a Kanban column (per status).
    position: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Kanban columns fetch tasks by (workspace, status) ordered by position.
taskSchema.index({ workspace: 1, status: 1, position: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });

taskSchema.statics.STATUSES = STATUSES;
taskSchema.statics.PRIORITIES = PRIORITIES;

module.exports = mongoose.model('Task', taskSchema);
