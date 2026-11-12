const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceAccess } = require('../middleware/workspace');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', requireAuth, requireWorkspaceAccess('member'), dashboardController.overview);

module.exports = router;
