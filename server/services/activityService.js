const Activity = require('../models/Activity');

/** Records an entry in the workspace activity feed. Best-effort, never throws. */
async function logActivity({ workspaceId, actorId, type, entityType, entityId = null, meta = {} }) {
  try {
    await Activity.create({
      workspace: workspaceId,
      actor: actorId,
      type,
      entityType,
      entityId,
      meta,
    });
  } catch (err) {
    console.error('[activity] failed:', err.message);
  }
}

/** Populated query for an activity feed. */
function activityQuery(baseFilter, { limit = 20, before = null } = {}) {
  const filter = { ...baseFilter };
  if (before) filter.createdAt = { $lt: new Date(before) };
  return Activity.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name avatarUrl');
}

module.exports = { logActivity, activityQuery };
