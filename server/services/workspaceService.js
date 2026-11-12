const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const { logActivity } = require('./activityService');

/** Creates a workspace and makes the creator its owner. */
async function createWorkspaceForUser({ user, name, description = '' }) {
  const workspace = await Workspace.create({
    name,
    description,
    owner: user._id,
  });
  await WorkspaceMember.create({
    workspace: workspace._id,
    user: user._id,
    role: 'owner',
  });
  return workspace;
}

/** Workspaces the user belongs to, newest first. */
async function listWorkspacesForUser(userId) {
  return WorkspaceMember.find({ user: userId })
    .populate('workspace', 'name description owner')
    .sort({ createdAt: 1 })
    .then((memberships) => memberships.map((m) => ({ ...m.workspace.toObject(), role: m.role })));
}

/**
 * Deletes a workspace and everything inside it (projects, tasks, comments,
 * notifications, activity, invitations, memberships).
 */
async function cascadeDeleteWorkspace(workspaceId) {
  const Task = require('../models/Task');
  const Comment = require('../models/Comment');
  const Project = require('../models/Project');
  const Notification = require('../models/Notification');
  const Activity = require('../models/Activity');
  const Invitation = require('../models/Invitation');

  const taskIds = await Task.find({ workspace: workspaceId }).select('_id');
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ workspace: workspaceId });
  await Project.deleteMany({ workspace: workspaceId });
  await Notification.deleteMany({ workspace: workspaceId });
  await Activity.deleteMany({ workspace: workspaceId });
  await Invitation.deleteMany({ workspace: workspaceId });
  await WorkspaceMember.deleteMany({ workspace: workspaceId });
  await Workspace.deleteOne({ _id: workspaceId });
}

/** Deletes a project and its tasks/comments. */
async function cascadeDeleteProject(projectId) {
  const Task = require('../models/Task');
  const Comment = require('../models/Comment');
  const taskIds = await Task.find({ project: projectId }).select('_id');
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: projectId });
  const Project = require('../models/Project');
  await Project.deleteOne({ _id: projectId });
}

module.exports = { createWorkspaceForUser, listWorkspacesForUser, cascadeDeleteWorkspace, cascadeDeleteProject };
