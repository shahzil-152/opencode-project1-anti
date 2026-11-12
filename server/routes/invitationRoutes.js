const express = require('express');
const { requireAuth } = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');

const router = express.Router();

// Token lookup is public (tokens are unguessable); accepting requires sign-in.
router.get('/:token', invitationController.getByToken);
router.post('/:token/accept', requireAuth, invitationController.accept);

module.exports = router;
