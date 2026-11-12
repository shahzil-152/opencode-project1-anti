const Notification = require('../models/Notification');

/** Maps notification types to the user's preference flag. */
const TYPE_TO_PREF = {
  assignment: 'assignments',
  comment: 'comments',
  completion: 'assignments',
  deadline: 'deadlines',
};

/**
 * Creates a notification for a user, honoring their preferences.
 * Silently skips when the recipient is the actor or opted out.
 */
async function notify({
  userId,
  workspaceId = null,
  type,
  title,
  body = '',
  link = null,
  actorId = null,
}) {
  if (!userId) return;
  if (actorId && String(userId) === String(actorId)) return; // don't self-notify

  try {
    const User = require('../models/User');
    const recipient = await User.findById(userId).select('preferences isDeleted');
    if (!recipient || recipient.isDeleted) return;

    const prefKey = TYPE_TO_PREF[type];
    if (prefKey && recipient.preferences?.notifications?.[prefKey] === false) return;

    await Notification.create({
      user: userId,
      workspace: workspaceId,
      type,
      title,
      body,
      link,
    });
  } catch (err) {
    // Notifications are best-effort: never fail the main operation.
    console.error('[notify] failed:', err.message);
  }
}

/** Creates the same notification for several users at once. */
async function notifyMany(userIds, payload) {
  await Promise.all(userIds.map((userId) => notify({ ...payload, userId })));
}

module.exports = { notify, notifyMany };
