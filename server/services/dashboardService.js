const Task = require('../models/Task');
const Project = require('../models/Project');
const { activityQuery } = require('./activityService');

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * All dashboard aggregates in one round trip. Everything is computed from
 * live database documents - no cached or fake numbers.
 */
async function getOverview({ workspaceId }) {
  const todayStart = startOfDay();
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);

  const base = { workspace: workspaceId };

  const [byStatus, overdue, dueToday, dueSoonTasks, recentActivity, completionsByDay, projectStats] =
    await Promise.all([
      Task.aggregate()
        .match(base)
        .group({ _id: '$status', count: { $sum: 1 } }),
      Task.countDocuments({ ...base, dueDate: { $lt: todayStart }, status: { $ne: 'completed' } }),
      Task.countDocuments({ ...base, dueDate: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'completed' } }),
      Task.find({ ...base, dueDate: { $gte: todayStart, $lte: weekEnd }, status: { $ne: 'completed' } })
        .sort({ dueDate: 1 })
        .limit(6)
        .populate('assignee', 'name avatarUrl')
        .populate('project', 'name color'),
      activityQuery({ workspace: workspaceId }, { limit: 10 }),
      Task.aggregate()
        .match({ ...base, status: 'completed', completedAt: { $gte: fourteenDaysAgo } })
        .group({
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        }),
      // Per-project task counts + completion progress.
      Task.aggregate()
        .match(base)
        .group({
          _id: '$project',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', todayStart] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        }),
    ]);

  const statusCounts = { backlog: 0, todo: 0, in_progress: 0, review: 0, completed: 0 };
  for (const row of byStatus) statusCounts[row._id] = row.count;

  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const completed = statusCounts.completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Attach project metadata to the task aggregates.
  const projects = await Project.find({ workspace: workspaceId, archived: false })
    .populate('members', 'name avatarUrl')
    .sort({ createdAt: 1 })
    .lean();
  const statsById = new Map(projectStats.map((s) => [String(s._id), s]));
  const projectsOverview = projects.map((project) => {
    const stats = statsById.get(String(project._id)) || { total: 0, completed: 0, overdue: 0 };
    return {
      id: project._id,
      name: project.name,
      description: project.description,
      color: project.color,
      deadline: project.deadline,
      members: project.members,
      total: stats.total,
      completed: stats.completed,
      overdue: stats.overdue,
      progress: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
    };
  });

  // Fill every day in the window so the chart has no gaps.
  const chartDays = [];
  for (let i = 0; i < 14; i += 1) {
    const day = new Date(fourteenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate()
    ).padStart(2, '0')}`;
    chartDays.push(key);
  }
  const countByDay = new Map(completionsByDay.map((d) => [d._id, d.count]));
  const completions = chartDays.map((key) => ({ date: key, count: countByDay.get(key) || 0 }));

  return {
    stats: {
      total,
      completed,
      pending: total - completed,
      overdue,
      dueToday,
      completionRate,
      byStatus: statusCounts,
    },
    dueSoonTasks,
    recentActivity,
    projects: projectsOverview,
    completions,
  };
}

module.exports = { getOverview };
