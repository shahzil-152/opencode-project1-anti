const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceAccess } = require('../middleware/workspace');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.get('/', requireAuth, requireWorkspaceAccess('member'), searchController.search);

module.exports = router;
