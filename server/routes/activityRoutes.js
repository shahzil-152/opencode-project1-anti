const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceAccess } = require('../middleware/workspace');
const activityController = require('../controllers/activityController');

const router = express.Router();

router.get('/', requireAuth, requireWorkspaceAccess('member'), activityController.list);

module.exports = router;
