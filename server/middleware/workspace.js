const ApiError = require('../utils/apiError');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');

/** Extract the workspace id referenced by a request (params, body or query). */
function getWorkspaceId(req) {
  return (
    req.params.workspaceId || req.body?.workspace || req.query?.workspace || null
  );
}

/**
 * Loads the workspace + membership for the current user and enforces a minimum
 * role. Attaches req.workspace and req.membership on success.
 *
 * @param {'member' | 'admin' | 'owner'} minRole
 */
function requireWorkspaceAccess(minRole = 'member') {
  return async (req, res, next) => {
    try {
      const workspaceId = getWorkspaceId(req);
      if (!workspaceId) throw ApiError.badRequest('A workspace reference is required');

      const membership = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: req.user._id,
      });
      if (!membership) {
        throw ApiError.forbidden('You do not have access to this workspace');
      }
      if (!WorkspaceMember.roleAtLeast(membership.role, minRole)) {
        throw ApiError.forbidden('You do not have permission to do that');
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) throw ApiError.notFound('Workspace not found');

      req.workspace = workspace;
      req.membership = membership;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * For resources that belong to a workspace indirectly (task, project), load
 * the resource first and then verify the requesting user is a member.
 */
async function loadTaskWithAccess(taskId, user) {
  const Task = require('../models/Task');
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  const membership = await WorkspaceMember.findOne({
    workspace: task.workspace,
    user: user._id,
  });
  if (!membership) throw ApiError.forbidden('You do not have access to this workspace');

  return { task, membership };
}

async function loadProjectWithAccess(projectId, user) {
  const Project = require('../models/Project');
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  const membership = await WorkspaceMember.findOne({
    workspace: project.workspace,
    user: user._id,
  });
  if (!membership) throw ApiError.forbidden('You do not have access to this workspace');

  return { project, membership };
}

module.exports = { requireWorkspaceAccess, loadTaskWithAccess, loadProjectWithAccess, getWorkspaceId };
