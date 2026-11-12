const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireWorkspaceAccess } = require('../middleware/workspace');
const { validate } = require('../middleware/validate');
const workspaceValidator = require('../validators/workspaceValidator');
const workspaceController = require('../controllers/workspaceController');

const router = express.Router();

router.use(requireAuth);

router.get('/', workspaceController.list);
router.post('/', validate(workspaceValidator.create), workspaceController.create);

router.get('/:workspaceId', requireWorkspaceAccess('member'), workspaceController.get);
router.patch(
  '/:workspaceId',
  requireWorkspaceAccess('admin'),
  validate(workspaceValidator.update),
  workspaceController.update
);
router.delete('/:workspaceId', requireWorkspaceAccess('owner'), workspaceController.remove);

router.get('/:workspaceId/members', requireWorkspaceAccess('member'), workspaceController.listMembers);
router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceAccess('admin'),
  validate(workspaceValidator.updateMember),
  workspaceController.updateMember
);
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceAccess('member'),
  workspaceController.removeMember
);

router.post(
  '/:workspaceId/invitations',
  requireWorkspaceAccess('admin'),
  validate(workspaceValidator.invite),
  workspaceController.createInvitationHandler
);
router.get(
  '/:workspaceId/invitations',
  requireWorkspaceAccess('admin'),
  workspaceController.listInvitations
);
router.delete(
  '/:workspaceId/invitations/:invitationId',
  requireWorkspaceAccess('admin'),
  workspaceController.revokeInvitationHandler
);

module.exports = router;
