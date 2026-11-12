const { getOverview } = require('../services/dashboardService');

/** GET /api/dashboard?workspace=... */
async function overview(req, res, next) {
  try {
    const data = await getOverview({ workspaceId: req.workspace._id });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { overview };
