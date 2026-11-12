const { searchWorkspace } = require('../services/searchService');

/** GET /api/search?q=...&workspace=... */
async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ tasks: [], projects: [], members: [] });

    const results = await searchWorkspace({
      workspaceId: req.workspace._id,
      q,
      userId: req.user._id,
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
