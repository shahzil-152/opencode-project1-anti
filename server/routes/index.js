const express = require('express');

const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/workspaces', require('./workspaceRoutes'));
router.use('/invitations', require('./invitationRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/activity', require('./activityRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/search', require('./searchRoutes'));

module.exports = router;
