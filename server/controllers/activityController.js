const Task = require('../models/Task');
const { activityQuery } = require('../services/activityService');

/** GET /api/activity?workspace=...&project=...&limit= */
async function list(req, res, next) {
  try {
    const filter = { workspace: req.workspace._id };

    // Scope the feed to one project (project page activity tab).
    if (req.query.project && req.query.project !== 'all') {
      const taskIds = await Task.find({ project: req.query.project }).select('_id');
      filter.$or = [
        { entityType: 'project', entityId: req.query.project },
        { entityId: { $in: taskIds } },
      ];
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const activities = await activityQuery(filter, { limit, before: req.query.before });
    res.json({ data: activities });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
