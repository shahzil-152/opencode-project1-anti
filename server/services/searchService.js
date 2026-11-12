const Task = require('../models/Task');
const Project = require('../models/Project');
const WorkspaceMember = require('../models/WorkspaceMember');
const { escapeRegex } = require('../utils/regex');

/** Cross-entity search scoped to one workspace. */
async function searchWorkspace({ workspaceId, q, userId }) {
  const rx = new RegExp(escapeRegex(q), 'i');
  const projects = await Project.find({ workspace: workspaceId, name: rx }).limit(5).select('name color').lean();

  const tasks = await Task.find({ workspace: workspaceId, $or: [{ title: rx }, { labels: rx }] })
    .sort({ updatedAt: -1 })
    .limit(8)
    .populate('project', 'name color')
    .populate('assignee', 'name avatarUrl')
    .select('title status priority dueDate labels project assignee')
    .lean();

  const memberships = await WorkspaceMember.find({ workspace: workspaceId })
    .populate({
      path: 'user',
      match: { $or: [{ name: rx }, { email: rx }] },
      select: 'name email avatarUrl',
    })
    .limit(20);

  const members = memberships
    .filter((m) => m.user)
    .slice(0, 5)
    .map((m) => ({ id: m.user._id, name: m.user.name, email: m.user.email, avatarUrl: m.user.avatarUrl, role: m.role }));

  return { tasks, projects, members };
}

module.exports = { searchWorkspace };
